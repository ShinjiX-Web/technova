import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import type { User as SupabaseUser } from "@supabase/supabase-js"

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

// Auth result type
interface AuthResult {
  success: boolean
  needsOtp?: boolean
  error?: string
  devOtp?: string  // For development: show OTP when email fails
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  pendingAuth: PendingAuth | null
  login: (email: string, password: string) => Promise<AuthResult>
  signup: (name: string, email: string, password: string) => Promise<AuthResult>
  verifyOtp: (code: string) => Promise<boolean>
  resendOtp: () => Promise<{ devOtp?: string }>
  cancelOtp: () => void
  logout: () => void
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>
  loginWithGitHub: () => Promise<{ success: boolean; error?: string }>
  handleOAuthCallback: (userData: User) => void
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
    console.log('📧 Sending OTP email to:', email, 'type:', type);

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

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Failed to send OTP email:', response.status, data);
      // Return fallback mode - email failed but we can still show OTP for testing
      console.log('🔑 [DEV MODE] OTP code:', otp);
      return { success: false, fallback: true };
    }

    console.log('✅ OTP email sent successfully');
    return { success: true, fallback: false };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    // Return fallback mode on network errors too
    console.log('🔑 [DEV MODE] OTP code:', otp);
    return { success: false, fallback: true };
  }
}

// Helper to convert Supabase user to our User type
async function getProfile(supabaseUser: SupabaseUser): Promise<User> {
  let profile = null

  try {
    // Try to get profile from profiles table with timeout
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single()

    if (!error) {
      profile = data
    } else {
      console.log('Profile not found or error:', error.message)
    }
  } catch (err) {
    console.error('Error fetching profile:', err)
  }

  return {
    id: supabaseUser.id,
    name: profile?.name || supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || '',
    email: supabaseUser.email || '',
    avatar: profile?.avatar_url || supabaseUser.user_metadata?.avatar_url,
    provider: supabaseUser.app_metadata?.provider,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingAuth, setPendingAuth] = useState<PendingAuth | null>(null)

  // Check for existing session on mount and subscribe to auth changes
  useEffect(() => {
    let isMounted = true
    let initialSessionHandled = false

    // Subscribe to auth changes FIRST (before getSession)
    // This ensures we don't miss any events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)

      // Mark that we've handled the initial session
      if (event === 'INITIAL_SESSION') {
        initialSessionHandled = true
      }

      // Handle session establishment (login, OAuth callback, token refresh)
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') && session?.user && isMounted) {
        try {
          const profile = await getProfile(session.user)
          if (isMounted) {
            setUser(profile)
            setPendingAuth(null)
            setIsLoading(false)
          }
        } catch (error) {
          console.error('Error getting profile:', error)
          // Still set the user with basic info even if profile fetch fails
          if (isMounted) {
            setUser({
              id: session.user.id,
              name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || '',
              email: session.user.email || '',
              avatar: session.user.user_metadata?.avatar_url,
              provider: session.user.app_metadata?.provider,
            })
            setIsLoading(false)
          }
        }
      } else if (event === 'INITIAL_SESSION' && !session && isMounted) {
        // No existing session found on page load
        setIsLoading(false)
      } else if (event === 'SIGNED_OUT' && isMounted) {
        setUser(null)
        setIsLoading(false)
      }
    })

    // Fallback: If INITIAL_SESSION doesn't fire within 3 seconds, manually check
    const fallbackTimeout = setTimeout(async () => {
      if (!initialSessionHandled && isMounted) {
        console.log('Fallback: checking session manually')
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user && isMounted) {
            const profile = await getProfile(session.user)
            if (isMounted) {
              setUser(profile)
              setIsLoading(false)
            }
          } else if (isMounted) {
            setIsLoading(false)
          }
        } catch (error) {
          console.error('Fallback session check error:', error)
          if (isMounted) {
            setIsLoading(false)
          }
        }
      }
    }, 3000)

    return () => {
      isMounted = false
      clearTimeout(fallbackTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string): Promise<AuthResult> => {
    const normalizedEmail = email.toLowerCase().trim()

    try {
      // First verify credentials with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (error) {
        console.error('Login error:', error)

        // Check if this might be an OAuth user trying to use password login
        // Supabase returns "Invalid login credentials" for OAuth users without password
        if (error.message === 'Invalid login credentials') {
          try {
            // Check if user exists with OAuth provider with a timeout to prevent hanging
            const profilePromise = supabase
              .from('profiles')
              .select('oauth_provider')
              .eq('email', normalizedEmail)
              .maybeSingle()

            const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
              setTimeout(() => resolve({ data: null, error: new Error('Profile check timeout') }), 3000)
            )

            const { data: profileData, error: profileError } = await Promise.race([profilePromise, timeoutPromise])

            // Only check OAuth provider if the query succeeded and we have data
            if (!profileError && profileData?.oauth_provider) {
              const providerName = profileData.oauth_provider.charAt(0).toUpperCase() + profileData.oauth_provider.slice(1)
              return {
                success: false,
                error: `This email is linked to ${providerName} sign-in. Please use the "${providerName === 'Google' ? 'Login with Google' : 'Login with GitHub'}" button instead.`
              }
            }
          } catch (profileCheckError) {
            // If profile check fails, just return the original error
            console.error('Profile check error:', profileCheckError)
          }
        }

        return { success: false, error: error.message }
      }

      if (data.user) {
        // Credentials valid - sign out temporarily and require OTP
        await supabase.auth.signOut()

        // Generate and send OTP via Resend
        const otpCode = generateOtp()
        const emailResult = await sendOtpEmail(normalizedEmail, otpCode, "login")

        setPendingAuth({
          type: "login",
          email: normalizedEmail,
          password,
          otpCode,
        })

        // If email failed but fallback is enabled, return with devOtp for testing
        if (!emailResult.success && emailResult.fallback) {
          return { success: true, needsOtp: true, devOtp: otpCode }
        }

        return { success: true, needsOtp: true }
      }

      return { success: false, error: "Login failed" }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: "An error occurred during login" }
    }
  }

  const signup = async (name: string, email: string, password: string): Promise<AuthResult> => {
    const normalizedEmail = email.toLowerCase().trim()

    try {
      // Sign up with Supabase - we'll use our own OTP via Resend
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            name: name,
            full_name: name,
          },
        },
      })

      if (error) {
        console.error('Signup error:', error)
        return { success: false, error: error.message }
      }

      if (data.user) {
        // Check if email already exists (identities will be empty)
        if (data.user.identities?.length === 0) {
          return { success: false, error: "An account with this email already exists. Please sign in instead, or use 'Forgot password' if you don't remember your password." }
        }

        // Sign out - we'll sign them in after OTP verification
        await supabase.auth.signOut()

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

        // If email failed but fallback is enabled, return with devOtp for testing
        if (!emailResult.success && emailResult.fallback) {
          return { success: true, needsOtp: true, devOtp: otpCode }
        }

        return { success: true, needsOtp: true }
      }

      return { success: false, error: "Signup failed" }
    } catch (error) {
      console.error('Signup error:', error)
      return { success: false, error: "An error occurred during signup" }
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
        // Sign in with Supabase using stored credentials
        const { data, error } = await supabase.auth.signInWithPassword({
          email: pendingAuth.email,
          password: pendingAuth.password!,
        })

        if (error) {
          console.error('Sign in after OTP error:', error)
          return false
        }

        if (data.user) {
          // Create/update profile if signup
          if (pendingAuth.type === 'signup' && pendingAuth.name) {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              name: pendingAuth.name,
              email: pendingAuth.email,
              updated_at: new Date().toISOString(),
            })

            // Link any pending team invitations to this user
            await supabase
              .from('team_members')
              .update({
                user_id: data.user.id,
                status: 'Active'
              })
              .eq('email', pendingAuth.email.toLowerCase())
              .eq('status', 'Pending')
          }

          const profile = await getProfile(data.user)
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

  const logout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Logout error:', error)
    }
    setUser(null)
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

  // OAuth login with Google
  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: 'select_account', // Force account selection on every login
          },
        },
      })

      if (error) {
        console.error('Google OAuth error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Google OAuth error:', error)
      return { success: false, error: "Failed to initiate Google login" }
    }
  }

  // OAuth login with GitHub
  const loginWithGitHub = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: 'consent', // Force re-authorization on every login
          },
        },
      })

      if (error) {
        console.error('GitHub OAuth error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('GitHub OAuth error:', error)
      return { success: false, error: "Failed to initiate GitHub login" }
    }
  }

  // Handle OAuth callback - not needed with Supabase, but kept for API compatibility
  const handleOAuthCallback = (_userData: User) => {
    // Supabase handles this automatically via onAuthStateChange
  }

  // Request password reset - sends OTP via Resend
  const requestPasswordReset = async (email: string): Promise<AuthResult> => {
    const normalizedEmail = email.toLowerCase().trim()

    try {
      // Check if user exists via server-side API (checks Supabase auth.users)
      const checkResponse = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      })

      const checkData = await checkResponse.json()

      if (!checkResponse.ok || !checkData.exists) {
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
      // Call server-side API to reset password using Supabase Admin
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
        login,
        signup,
        verifyOtp,
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

