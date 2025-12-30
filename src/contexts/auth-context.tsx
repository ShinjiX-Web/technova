import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

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
  password: string
  otpCode: string
}

// Auth result type with optional devOtp for development fallback
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = "auth_user"
const USERS_KEY = "auth_users"

// Generate a random 6-digit OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Send OTP email via API - returns { success, fallback } where fallback=true means show OTP in UI
async function sendOtpEmail(email: string, otp: string, type: "login" | "signup" | "reset-password"): Promise<{ success: boolean; fallback: boolean }> {
  try {
    console.log('📧 Sending OTP email to:', email, 'type:', type);

    const response = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp, type }),
    });

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingAuth, setPendingAuth] = useState<PendingAuth | null>(null)

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEY)
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<AuthResult> => {
    // Normalize email (lowercase + trim) to handle mobile keyboard quirks
    const normalizedEmail = email.toLowerCase().trim()

    // Get stored users
    const usersJson = localStorage.getItem(USERS_KEY)
    const users: Array<User & { password: string }> = usersJson ? JSON.parse(usersJson) : []

    // Find user (case-insensitive email comparison)
    const foundUser = users.find((u) => u.email.toLowerCase().trim() === normalizedEmail && u.password === password)

    if (foundUser) {
      // Generate OTP and set pending auth
      const otpCode = generateOtp()

      // Send OTP email
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

    return { success: false, error: "Invalid email or password" }
  }

  const signup = async (name: string, email: string, password: string): Promise<AuthResult> => {
    // Normalize email (lowercase + trim) to handle mobile keyboard quirks
    const normalizedEmail = email.toLowerCase().trim()

    // Get stored users
    const usersJson = localStorage.getItem(USERS_KEY)
    const users: Array<User & { password: string }> = usersJson ? JSON.parse(usersJson) : []

    // Check if email already exists (case-insensitive)
    if (users.some((u) => u.email.toLowerCase().trim() === normalizedEmail)) {
      return { success: false, error: "An account with this email already exists" }
    }

    // Generate OTP and set pending auth
    const otpCode = generateOtp()

    // Send OTP email
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

  const verifyOtp = async (code: string): Promise<boolean> => {
    if (!pendingAuth) return false

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (code !== pendingAuth.otpCode) {
      return false
    }

    if (pendingAuth.type === "signup") {
      // Complete signup
      const usersJson = localStorage.getItem(USERS_KEY)
      const users: Array<User & { password: string }> = usersJson ? JSON.parse(usersJson) : []

      const newUser = {
        id: crypto.randomUUID(),
        name: pendingAuth.name || "",
        email: pendingAuth.email,
        password: pendingAuth.password,
      }

      users.push(newUser)
      localStorage.setItem(USERS_KEY, JSON.stringify(users))

      const { password: _, ...userWithoutPassword } = newUser
      setUser(userWithoutPassword)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userWithoutPassword))
    } else {
      // Complete login
      const usersJson = localStorage.getItem(USERS_KEY)
      const users: Array<User & { password: string }> = usersJson ? JSON.parse(usersJson) : []
      const foundUser = users.find((u) => u.email === pendingAuth.email && u.password === pendingAuth.password)

      if (foundUser) {
        const { password: _, ...userWithoutPassword } = foundUser
        setUser(userWithoutPassword)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userWithoutPassword))
      }
    }

    setPendingAuth(null)
    return true
  }

  const resendOtp = async (): Promise<{ devOtp?: string }> => {
    if (pendingAuth) {
      const newOtp = generateOtp()

      // Send new OTP email
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

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  // OAuth login with Google
  // In production, this would redirect to Google OAuth flow
  // For now, it's a placeholder that simulates the flow
  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    // TODO: Implement actual Google OAuth flow
    // Example production implementation:
    // window.location.href = `${API_URL}/auth/google`
    // The callback would then set the user in localStorage

    console.log("🔐 Google OAuth: In production, this would redirect to Google OAuth")
    return { success: false, error: "Google OAuth not configured. Please set up Google OAuth credentials." }
  }

  // OAuth login with GitHub
  const loginWithGitHub = async (): Promise<{ success: boolean; error?: string }> => {
    // Redirect to GitHub OAuth endpoint
    window.location.href = '/api/auth/github';
    return { success: true };
  }

  // Handle OAuth callback - call this when returning from OAuth provider
  const handleOAuthCallback = (userData: User) => {
    setUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  }

  // Request password reset - sends OTP to email
  const requestPasswordReset = async (email: string): Promise<AuthResult> => {
    // Normalize email (lowercase + trim) to handle mobile keyboard quirks
    const normalizedEmail = email.toLowerCase().trim()

    // Check if user exists
    const usersJson = localStorage.getItem(USERS_KEY)
    const users: Array<User & { password: string }> = usersJson ? JSON.parse(usersJson) : []

    const userExists = users.some((u) => u.email.toLowerCase().trim() === normalizedEmail)
    if (!userExists) {
      return { success: false, error: "No account found with this email address" }
    }

    // Generate OTP
    const otpCode = generateOtp()

    // Send OTP email
    const emailResult = await sendOtpEmail(normalizedEmail, otpCode, "reset-password")

    setPendingAuth({
      type: "reset-password",
      email: normalizedEmail,
      password: "", // Will be set later
      otpCode,
    })

    // If email failed but fallback is enabled, return with devOtp for testing
    if (!emailResult.success && emailResult.fallback) {
      return { success: true, devOtp: otpCode }
    }

    return { success: true }
  }

  // Verify reset OTP
  const verifyResetOtp = async (code: string): Promise<boolean> => {
    if (!pendingAuth || pendingAuth.type !== "reset-password") return false

    await new Promise((resolve) => setTimeout(resolve, 500))

    return code === pendingAuth.otpCode
  }

  // Reset password after OTP verification
  const resetPassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!pendingAuth || pendingAuth.type !== "reset-password") {
      return { success: false, error: "No password reset in progress" }
    }

    const usersJson = localStorage.getItem(USERS_KEY)
    const users: Array<User & { password: string }> = usersJson ? JSON.parse(usersJson) : []

    const userIndex = users.findIndex((u) => u.email.toLowerCase().trim() === pendingAuth.email.toLowerCase().trim())
    if (userIndex === -1) {
      return { success: false, error: "User not found" }
    }

    // Update password
    users[userIndex].password = newPassword
    localStorage.setItem(USERS_KEY, JSON.stringify(users))

    setPendingAuth(null)

    return { success: true }
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

