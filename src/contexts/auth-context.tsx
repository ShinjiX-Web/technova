import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  RecaptchaVerifier,
  getMultiFactorResolver,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  type FirebaseUser,
  type MultiFactorResolver,
  type MultiFactorError
} from "@/lib/firebase"

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  provider?: string
}

interface PendingAuth {
  type: "login" | "signup" | "reset-password"
  email: string
  name?: string
  password?: string
  otpCode: string  // Our custom OTP code
}

// MFA state for handling multi-factor authentication
interface MfaState {
  resolver: MultiFactorResolver
  verificationId: string
  phoneHint: string  // Last 4 digits of phone number
}

// Auth result type
interface AuthResult {
  success: boolean
  needsOtp?: boolean
  needsMfa?: boolean  // Firebase MFA required
  mfaPhoneHint?: string  // Last digits of phone for MFA
  error?: string
  devOtp?: string  // For development: show OTP when email fails
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  pendingAuth: PendingAuth | null
  pendingMfa: MfaState | null  // MFA pending verification
  login: (email: string, password: string) => Promise<AuthResult>
  signup: (name: string, email: string, password: string) => Promise<AuthResult>
  verifyOtp: (code: string) => Promise<boolean>
  verifyMfa: (code: string) => Promise<{ success: boolean; error?: string }>  // Verify MFA SMS code
  resendMfa: () => Promise<{ success: boolean; error?: string }>  // Resend MFA SMS code
  cancelMfa: () => void  // Cancel MFA flow
  resendOtp: () => Promise<{ devOtp?: string }>
  cancelOtp: () => void
  logout: () => void
  loginWithGoogle: () => Promise<{ success: boolean; error?: string; needsMfa?: boolean; mfaPhoneHint?: string }>
  loginWithGitHub: () => Promise<{ success: boolean; error?: string }>
  handleOAuthCallback: (userData: User) => Promise<void>
  requestPasswordReset: (email: string) => Promise<AuthResult>
  verifyResetOtp: (code: string) => Promise<boolean>
  resetPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>
  updateUserProfile: (updates: Partial<Pick<User, 'name' | 'avatar'>>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Generate a random 6-digit OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Send OTP email via Resend API - returns { success, fallback } where fallback=true means show OTP in UI
async function sendOtpEmail(email: string, otp: string, type: "login" | "signup" | "reset-password"): Promise<{ success: boolean; fallback: boolean }> {
  try {
    // Add timeout to prevent hanging on cold starts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp, type }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    await response.json().catch(() => ({}));

    if (!response.ok) {
      // Return fallback mode - email failed but we can still show OTP for dev/testing
      return { success: false, fallback: true };
    }

    return { success: true, fallback: false };
  } catch {
    // Return fallback mode on network errors too
    return { success: false, fallback: true };
  }
}

// Local storage key for GitHub OAuth users (not using Firebase session)
const GITHUB_USER_KEY = 'github_oauth_user'

// Helper to persist GitHub OAuth user to localStorage
function persistGitHubUser(user: User | null) {
  if (user && user.provider === 'github') {
    localStorage.setItem(GITHUB_USER_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(GITHUB_USER_KEY)
  }
}

// Helper to get GitHub OAuth user from localStorage
function getPersistedGitHubUser(): User | null {
  try {
    const stored = localStorage.getItem(GITHUB_USER_KEY)
    if (stored) {
      return JSON.parse(stored) as User
    }
  } catch {
    // Invalid JSON, clear it
    localStorage.removeItem(GITHUB_USER_KEY)
  }
  return null
}

// Helper to convert Firebase user to our User type with profile lookup
async function getProfile(firebaseUser: FirebaseUser): Promise<User> {
  let profile = null

  try {
    // Try to get profile from profiles table with 5 second timeout
    // Use .limit(1) instead of .single()/.maybeSingle() to avoid 400 errors
    const profilePromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', firebaseUser.uid)
      .limit(1)

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
    )

    const { data, error } = await Promise.race([profilePromise, timeoutPromise])

    if (!error && data && data.length > 0) {
      profile = data[0]
    }
  } catch (err) {
    // Profile fetch failed silently - user may not have a profile yet
  }

  // Determine provider from Firebase user
  const providerData = firebaseUser.providerData[0]
  const provider = providerData?.providerId?.replace('.com', '') || 'email'

  return {
    id: firebaseUser.uid,
    name: profile?.name || firebaseUser.displayName || '',
    email: firebaseUser.email || '',
    avatar: profile?.avatar_url || firebaseUser.photoURL || undefined,
    provider,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingAuth, setPendingAuth] = useState<PendingAuth | null>(null)
  const [pendingMfa, setPendingMfa] = useState<MfaState | null>(null)
  // Ref to track if auth operation is in progress (prevents race conditions with auth state listener)
  const authInProgressRef = useRef(false)
  // Ref to store recaptcha verifier for MFA
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null)
  // Ref to store the MFA resolver for resending codes
  const mfaResolverRef = useRef<MultiFactorResolver | null>(null)

  // Helper to initialize recaptcha and send MFA SMS
  const initiateMfaVerification = async (resolver: MultiFactorResolver): Promise<{ success: boolean; verificationId?: string; phoneHint?: string; error?: string }> => {
    try {
      // Get the phone hint from the first enrolled factor
      const phoneHint = resolver.hints[0]?.displayName ||
        (resolver.hints[0] as { phoneNumber?: string })?.phoneNumber?.slice(-4) || '****'

      // Clear existing recaptcha verifier if it exists
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear()
        } catch {
          // Ignore clear errors
        }
        recaptchaVerifierRef.current = null
      }

      // Remove and recreate the recaptcha container to ensure a fresh state
      const existingContainer = document.getElementById('recaptcha-container')
      if (existingContainer) {
        existingContainer.remove()
      }
      const recaptchaContainer = document.createElement('div')
      recaptchaContainer.id = 'recaptcha-container'
      recaptchaContainer.style.display = 'none'
      document.body.appendChild(recaptchaContainer)

      // Create new recaptcha verifier
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      })

      // Get the phone info and send verification code
      const phoneInfoOptions = {
        multiFactorHint: resolver.hints[0],
        session: resolver.session
      }
      const phoneAuthProvider = new PhoneAuthProvider(auth)
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions,
        recaptchaVerifierRef.current
      )

      // Store resolver for resending
      mfaResolverRef.current = resolver

      return { success: true, verificationId, phoneHint }
    } catch (error) {
      console.error('MFA initiation error:', error)
      return { success: false, error: "Failed to send verification code. Please try again." }
    }
  }

  // Check for existing session on mount and subscribe to Firebase auth changes
  useEffect(() => {
    let isMounted = true

    // Helper to link user to any pending team invites
    const linkPendingTeamInvites = async (userId: string, email: string) => {
      try {
        // Find any pending invites for this email and link them to the user
        const { data, error } = await supabase
          .from('team_members')
          .update({ user_id: userId, status: 'Active' })
          .eq('email', email.toLowerCase())
          .eq('status', 'Pending')
          .is('user_id', null)
          .select()

        if (error) {
          console.error('Error linking team invites:', error)
        } else if (data && data.length > 0) {
          console.log('Linked user to team invites:', data)
        }
      } catch (err) {
        console.error('Error in linkPendingTeamInvites:', err)
      }
    }

    // Helper to set user from Firebase user
    const setUserFromFirebase = async (firebaseUser: FirebaseUser) => {
      if (!isMounted) return

      try {
        // Link any pending team invites for this user
        if (firebaseUser.email) {
          await linkPendingTeamInvites(firebaseUser.uid, firebaseUser.email)
        }

        const profile = await getProfile(firebaseUser)
        if (isMounted) {
          setUser(profile)
          // Only clear pendingAuth if OTP verification is complete
          // Don't clear if we're in the middle of signup/login OTP flow
          setPendingAuth(prev => {
            // If there's pending auth with OTP code, keep it (user hasn't verified yet)
            if (prev?.otpCode) return prev
            return null
          })
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error getting profile:', error)
        // Still set the user with basic info even if profile fetch fails
        if (isMounted) {
          const providerData = firebaseUser.providerData[0]
          const provider = providerData?.providerId?.replace('.com', '') || 'email'
          setUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || '',
            email: firebaseUser.email || '',
            avatar: firebaseUser.photoURL || undefined,
            provider,
          })
          setIsLoading(false)
        }
      }
    }

    // Subscribe to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Skip auth state updates during signup/login flow to prevent race conditions
      if (authInProgressRef.current) {
        return
      }

      if (firebaseUser) {
        await setUserFromFirebase(firebaseUser)
      } else {
        // No Firebase user - check for persisted GitHub OAuth user
        const githubUser = getPersistedGitHubUser()
        if (isMounted) {
          if (githubUser) {
            setUser(githubUser)
          } else {
            setUser(null)
          }
          setIsLoading(false)
        }
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string): Promise<AuthResult> => {
    const normalizedEmail = email.toLowerCase().trim()

    // Set flag to prevent auth state listener from triggering during login
    authInProgressRef.current = true

    try {
      // Verify credentials with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password)

      if (userCredential.user) {
        // Credentials valid - sign out temporarily and require OTP
        await signOut(auth)

        // Generate and send OTP via Resend
        const otpCode = generateOtp()
        const emailResult = await sendOtpEmail(normalizedEmail, otpCode, "login")

        setPendingAuth({
          type: "login",
          email: normalizedEmail,
          password,
          otpCode,
        })

        // Clear the flag - auth flow is complete, OTP form should show
        authInProgressRef.current = false

        // If email failed but fallback is enabled, return with devOtp for testing
        if (!emailResult.success && emailResult.fallback) {
          return { success: true, needsOtp: true, devOtp: otpCode }
        }

        return { success: true, needsOtp: true }
      }

      authInProgressRef.current = false
      return { success: false, error: "Login failed" }
    } catch (error: unknown) {
      authInProgressRef.current = false

      const firebaseError = error as { code?: string; message?: string }

      // Handle MFA required error
      if (firebaseError.code === 'auth/multi-factor-auth-required') {
        const mfaError = error as MultiFactorError
        const resolver = getMultiFactorResolver(auth, mfaError)
        const result = await initiateMfaVerification(resolver)

        if (result.success && result.verificationId && result.phoneHint) {
          setPendingMfa({
            resolver,
            verificationId: result.verificationId,
            phoneHint: result.phoneHint
          })
          return {
            success: true,
            needsMfa: true,
            mfaPhoneHint: result.phoneHint
          }
        }
        return { success: false, error: result.error || "Failed to initiate MFA verification." }
      }

      // Check if this might be an OAuth user trying to use password login
      if (firebaseError.code === 'auth/wrong-password' || firebaseError.code === 'auth/invalid-credential') {
        try {
          // Check if user exists with OAuth provider
          const { data: profileData } = await supabase
            .from('profiles')
            .select('oauth_provider')
            .eq('email', normalizedEmail)
            .maybeSingle()

          if (profileData?.oauth_provider) {
            const providerName = profileData.oauth_provider.charAt(0).toUpperCase() + profileData.oauth_provider.slice(1)
            return {
              success: false,
              error: `This email is linked to ${providerName} sign-in. Please use the "${providerName === 'Google' ? 'Login with Google' : 'Login with GitHub'}" button instead.`
            }
          }
        } catch (profileCheckError) {
          console.error('Profile check error:', profileCheckError)
        }
      }

      // Map Firebase error codes to user-friendly messages
      if (firebaseError.code === 'auth/user-not-found') {
        return { success: false, error: "No account found with this email" }
      }
      if (firebaseError.code === 'auth/wrong-password' || firebaseError.code === 'auth/invalid-credential') {
        return { success: false, error: "Invalid email or password" }
      }
      if (firebaseError.code === 'auth/too-many-requests') {
        return { success: false, error: "Too many failed attempts. Please try again later." }
      }

      return { success: false, error: firebaseError.message || "An error occurred during login" }
    }
  }

  const signup = async (name: string, email: string, password: string): Promise<AuthResult> => {
    const normalizedEmail = email.toLowerCase().trim()

    // Set flag to prevent auth state listener from triggering during signup
    authInProgressRef.current = true

    try {
      // Sign up with Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password)

      if (userCredential.user) {
        // Update the user's display name
        await updateProfile(userCredential.user, { displayName: name })

        // Sign out - we'll sign them in after OTP verification
        await signOut(auth)

        // Generate and send OTP via Resend
        const otpCode = generateOtp()
        const emailResult = await sendOtpEmail(normalizedEmail, otpCode, "signup")

        setPendingAuth({
          type: "signup",
          email: normalizedEmail,
          name,
          password,
          otpCode,
        })

        // Clear the flag - auth flow is complete, OTP form should show
        authInProgressRef.current = false

        // If email failed but fallback is enabled, return with devOtp for testing
        if (!emailResult.success && emailResult.fallback) {
          return { success: true, needsOtp: true, devOtp: otpCode }
        }

        return { success: true, needsOtp: true }
      }

      authInProgressRef.current = false
      return { success: false, error: "Signup failed" }
    } catch (error: unknown) {
      authInProgressRef.current = false
      console.error('Signup error:', error)

      const firebaseError = error as { code?: string; message?: string }

      // Map Firebase error codes to user-friendly messages
      if (firebaseError.code === 'auth/email-already-in-use') {
        return { success: false, error: "An account with this email already exists. Please sign in instead, or use 'Forgot password' if you don't remember your password." }
      }
      if (firebaseError.code === 'auth/weak-password') {
        return { success: false, error: "Password is too weak. Please use at least 6 characters." }
      }
      if (firebaseError.code === 'auth/invalid-email') {
        return { success: false, error: "Invalid email address." }
      }

      return { success: false, error: firebaseError.message || "An error occurred during signup" }
    }
  }

  const verifyOtp = async (code: string): Promise<boolean> => {
    if (!pendingAuth) return false

    // Verify our custom OTP code
    if (code !== pendingAuth.otpCode) {
      return false
    }

    try {
      if (pendingAuth.type === "signup" || pendingAuth.type === "login") {
        // Sign in with Firebase using stored credentials
        const userCredential = await signInWithEmailAndPassword(auth, pendingAuth.email, pendingAuth.password!)

        if (userCredential.user) {
          // Create/update profile in Supabase if signup
          if (pendingAuth.type === 'signup' && pendingAuth.name) {
            await supabase.from('profiles').upsert({
              id: userCredential.user.uid,
              name: pendingAuth.name,
              email: pendingAuth.email,
              updated_at: new Date().toISOString(),
            })

            // Link any pending team invitations to this user
            await supabase
              .from('team_members')
              .update({
                user_id: userCredential.user.uid,
                status: 'Active'
              })
              .eq('email', pendingAuth.email.toLowerCase())
              .eq('status', 'Pending')
          }

          const profile = await getProfile(userCredential.user)
          setUser(profile)
          setPendingAuth(null)
          return true
        }
      }

      return false
    } catch (error) {
      console.error('OTP verification error:', error)
      return false
    }
  }

  const resendOtp = async (): Promise<{ devOtp?: string }> => {
    if (pendingAuth) {
      // Generate new OTP and send via Resend
      const newOtp = generateOtp()
      const emailResult = await sendOtpEmail(pendingAuth.email, newOtp, pendingAuth.type)

      setPendingAuth({ ...pendingAuth, otpCode: newOtp })

      // Return devOtp if email failed for testing
      if (!emailResult.success && emailResult.fallback) {
        return { devOtp: newOtp }
      }
    }
    return {}
  }

  const cancelOtp = () => {
    setPendingAuth(null)
  }

  // Verify MFA SMS code
  const verifyMfa = async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!pendingMfa) {
      return { success: false, error: "No MFA verification in progress" }
    }

    try {
      const { resolver, verificationId } = pendingMfa

      // Create credential with the verification code
      const cred = PhoneAuthProvider.credential(verificationId, code)
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred)

      // Complete the sign-in
      const userCredential = await resolver.resolveSignIn(multiFactorAssertion)

      if (userCredential.user) {
        const profile = await getProfile(userCredential.user)
        setUser(profile)
        setPendingMfa(null)
        return { success: true }
      }

      return { success: false, error: "MFA verification failed" }
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string }

      if (firebaseError.code === 'auth/invalid-verification-code') {
        return { success: false, error: "Invalid verification code. Please try again." }
      }
      if (firebaseError.code === 'auth/code-expired') {
        return { success: false, error: "Verification code expired. Please request a new one." }
      }

      console.error('MFA verification error:', error)
      return { success: false, error: firebaseError.message || "MFA verification failed" }
    }
  }

  // Cancel MFA flow
  const cancelMfa = () => {
    setPendingMfa(null)
    mfaResolverRef.current = null
    // Clean up recaptcha verifier and container
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear()
      } catch {
        // Ignore clear errors
      }
      recaptchaVerifierRef.current = null
    }
    // Remove the recaptcha container from DOM
    const container = document.getElementById('recaptcha-container')
    if (container) {
      container.remove()
    }
  }

  // Resend MFA SMS code
  const resendMfa = async (): Promise<{ success: boolean; error?: string }> => {
    if (!mfaResolverRef.current) {
      return { success: false, error: "No MFA session active. Please try logging in again." }
    }

    const result = await initiateMfaVerification(mfaResolverRef.current)

    if (result.success && result.verificationId && result.phoneHint) {
      setPendingMfa({
        resolver: mfaResolverRef.current,
        verificationId: result.verificationId,
        phoneHint: result.phoneHint
      })
      return { success: true }
    }

    return { success: false, error: result.error || "Failed to resend verification code." }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Logout error:', error)
    }
    // Clear user state immediately
    setUser(null)
    setPendingAuth(null)
    // Clear persisted GitHub OAuth user
    persistGitHubUser(null)
  }

  // Update user profile in context (for real-time UI updates)
  const updateUserProfile = (updates: Partial<Pick<User, 'name' | 'avatar'>>) => {
    if (user) {
      setUser({
        ...user,
        ...updates,
      })
    }
  }

  // OAuth login with Google using Firebase popup
  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string; needsMfa?: boolean; mfaPhoneHint?: string }> => {
    try {
      const result = await signInWithPopup(auth, googleProvider)

      if (result.user) {
        // Create/update profile in Supabase for OAuth users
        await supabase.from('profiles').upsert({
          id: result.user.uid,
          name: result.user.displayName || '',
          email: result.user.email || '',
          avatar_url: result.user.photoURL || null,
          oauth_provider: 'google',
          updated_at: new Date().toISOString(),
        })

        // Link any pending team invitations
        if (result.user.email) {
          await supabase
            .from('team_members')
            .update({
              user_id: result.user.uid,
              status: 'Active'
            })
            .eq('email', result.user.email.toLowerCase())
            .eq('status', 'Pending')
        }
      }

      return { success: true }
    } catch (error: unknown) {
      console.error('Google OAuth error:', error)
      const firebaseError = error as { code?: string; message?: string }

      // Handle MFA required error for OAuth
      if (firebaseError.code === 'auth/multi-factor-auth-required') {
        const mfaError = error as MultiFactorError
        const resolver = getMultiFactorResolver(auth, mfaError)
        const result = await initiateMfaVerification(resolver)

        if (result.success && result.verificationId && result.phoneHint) {
          setPendingMfa({
            resolver,
            verificationId: result.verificationId,
            phoneHint: result.phoneHint
          })
          return {
            success: true,
            needsMfa: true,
            mfaPhoneHint: result.phoneHint
          }
        }
        return { success: false, error: result.error || "Failed to initiate MFA verification." }
      }

      if (firebaseError.code === 'auth/popup-closed-by-user') {
        return { success: false, error: "Sign-in cancelled" }
      }
      if (firebaseError.code === 'auth/account-exists-with-different-credential') {
        return { success: false, error: "An account already exists with this email using a different sign-in method" }
      }

      return { success: false, error: firebaseError.message || "Failed to sign in with Google" }
    }
  }

  // OAuth login with GitHub - redirects to GitHub OAuth flow via API
  const loginWithGitHub = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      // Redirect to GitHub OAuth via our API endpoint
      window.location.href = '/api/auth/github'
      return { success: true }
    } catch (error: unknown) {
      console.error('GitHub OAuth error:', error)
      return { success: false, error: "Failed to initiate GitHub sign-in" }
    }
  }

  // Handle OAuth callback from API-based GitHub auth
  const handleOAuthCallback = async (userData: User) => {
    try {
      // Ensure provider is set
      const userWithProvider = { ...userData, provider: userData.provider || 'github' }

      // Store user in state (isAuthenticated is derived from !!user)
      setUser(userWithProvider)

      // Persist GitHub user to localStorage for session persistence
      persistGitHubUser(userWithProvider)

      // Create/update profile in Supabase for OAuth users
      await supabase.from('profiles').upsert({
        id: userWithProvider.id,
        name: userWithProvider.name || '',
        email: userWithProvider.email || '',
        avatar_url: userWithProvider.avatar || null,
        oauth_provider: userWithProvider.provider,
        updated_at: new Date().toISOString(),
      })

      // Link any pending team invitations
      if (userWithProvider.email) {
        await supabase
          .from('team_members')
          .update({
            user_id: userWithProvider.id,
            status: 'Active'
          })
          .eq('email', userWithProvider.email.toLowerCase())
          .eq('status', 'Pending')
      }
    } catch (error) {
      console.error('Error handling OAuth callback:', error)
    }
  }

  // Request password reset - sends OTP via Resend
  const requestPasswordReset = async (email: string): Promise<AuthResult> => {
    const normalizedEmail = email.toLowerCase().trim()

    try {
      let userExists = false
      let apiAvailable = true

      // Check if user exists via server-side API (checks Firebase via Admin SDK)
      try {
        const checkResponse = await fetch('/api/auth/check-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail }),
        })

        if (checkResponse.status === 404) {
          // API not available (local dev) - try client-side check
          apiAvailable = false
        } else {
          const checkData = await checkResponse.json()
          userExists = checkResponse.ok && checkData.exists
        }
      } catch {
        // Network error - API not available
        apiAvailable = false
      }

      // If API not available, try client-side check by attempting sign-in
      if (!apiAvailable) {
        try {
          // Try to sign in with a dummy password - Firebase will tell us if user exists
          await signInWithEmailAndPassword(auth, normalizedEmail, 'dummy-password-check-12345')
          // If we get here, user exists (but wrong password)
          userExists = true
        } catch (error: unknown) {
          const firebaseError = error as { code?: string }
          // These errors mean the user EXISTS but password is wrong
          if (firebaseError.code === 'auth/wrong-password' ||
              firebaseError.code === 'auth/invalid-credential' ||
              firebaseError.code === 'auth/too-many-requests') {
            userExists = true
          }
          // auth/user-not-found means user doesn't exist
          // Other errors - assume user might exist to be safe
          else if (firebaseError.code !== 'auth/user-not-found') {
            userExists = true
          }
        }
      }

      if (!userExists) {
        return { success: false, error: "No account found with this email address" }
      }

      // Generate and send OTP via Resend
      const otpCode = generateOtp()
      const emailResult = await sendOtpEmail(normalizedEmail, otpCode, "reset-password")

      setPendingAuth({
        type: "reset-password",
        email: normalizedEmail,
        otpCode,
      })

      // If email failed but fallback is enabled, return with devOtp for testing
      if (!emailResult.success && emailResult.fallback) {
        return { success: true, devOtp: otpCode }
      }

      return { success: true }
    } catch (error) {
      console.error('Password reset error:', error)
      return { success: false, error: "Failed to send reset email" }
    }
  }

  // Verify reset OTP - our custom OTP verification
  const verifyResetOtp = async (code: string): Promise<boolean> => {
    if (!pendingAuth || pendingAuth.type !== "reset-password") return false

    // Verify our custom OTP code
    return code === pendingAuth.otpCode
  }

  // Reset password after OTP verification
  const resetPassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!pendingAuth || pendingAuth.type !== "reset-password") {
      return { success: false, error: "No password reset in progress" }
    }

    try {
      // Call server-side API to reset password using Firebase Admin
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: pendingAuth.email,
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Password reset error:', data)
        return { success: false, error: data.error || 'Failed to reset password' }
      }

      setPendingAuth(null)
      return { success: true }
    } catch (error) {
      console.error('Password update error:', error)
      return { success: false, error: "Failed to update password" }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        pendingAuth,
        pendingMfa,
        login,
        signup,
        verifyOtp,
        verifyMfa,
        resendMfa,
        cancelMfa,
        resendOtp,
        cancelOtp,
        logout,
        loginWithGoogle,
        loginWithGitHub,
        handleOAuthCallback,
        requestPasswordReset,
        verifyResetOtp,
        resetPassword,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

