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
}

// Auth result type
interface AuthResult {
  success: boolean
  needsOtp?: boolean
  error?: string
  devOtp?: string  // For development: not used with Supabase
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

// Helper to convert Supabase user to our User type
async function getProfile(supabaseUser: SupabaseUser): Promise<User> {
  // Try to get profile from profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', supabaseUser.id)
    .single()

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
    // Get initial session
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const profile = await getProfile(session.user)
          setUser(profile)
        }
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initSession()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)

      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await getProfile(session.user)
        setUser(profile)
        setPendingAuth(null)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string): Promise<AuthResult> => {
    const normalizedEmail = email.toLowerCase().trim()

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (error) {
        console.error('Login error:', error)
        return { success: false, error: error.message }
      }

      if (data.user) {
        const profile = await getProfile(data.user)
        setUser(profile)
        return { success: true }
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
      // Sign up with Supabase - this will send a confirmation email automatically
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            name: name,
            full_name: name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error('Signup error:', error)
        return { success: false, error: error.message }
      }

      if (data.user) {
        // Check if email confirmation is required
        if (data.user.identities?.length === 0) {
          return { success: false, error: "An account with this email already exists" }
        }

        // If session exists, user is logged in (email confirmation disabled)
        if (data.session) {
          // Create profile in profiles table
          await supabase.from('profiles').upsert({
            id: data.user.id,
            name: name,
            email: normalizedEmail,
            updated_at: new Date().toISOString(),
          })

          const profile = await getProfile(data.user)
          setUser(profile)
          return { success: true }
        }

        // Email confirmation required - set pending auth
        setPendingAuth({
          type: "signup",
          email: normalizedEmail,
          name,
        })
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

    try {
      // Verify OTP with Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        email: pendingAuth.email,
        token: code,
        type: pendingAuth.type === 'signup' ? 'signup' : 'email',
      })

      if (error) {
        console.error('OTP verification error:', error)
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
        }

        const profile = await getProfile(data.user)
        setUser(profile)
        setPendingAuth(null)
        return true
      }

      return false
    } catch (error) {
      console.error('OTP verification error:', error)
      return false
    }
  }

  const resendOtp = async (): Promise<{ devOtp?: string }> => {
    if (pendingAuth) {
      try {
        const { error } = await supabase.auth.resend({
          type: pendingAuth.type === 'signup' ? 'signup' : 'email_change',
          email: pendingAuth.email,
        })

        if (error) {
          console.error('Resend OTP error:', error)
        }
      } catch (error) {
        console.error('Resend OTP error:', error)
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

  // OAuth login with Google
  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
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

  // Request password reset - sends reset email via Supabase
  const requestPasswordReset = async (email: string): Promise<AuthResult> => {
    const normalizedEmail = email.toLowerCase().trim()

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        console.error('Password reset error:', error)
        return { success: false, error: error.message }
      }

      setPendingAuth({
        type: "reset-password",
        email: normalizedEmail,
      })

      return { success: true }
    } catch (error) {
      console.error('Password reset error:', error)
      return { success: false, error: "Failed to send reset email" }
    }
  }

  // Verify reset OTP - with Supabase, user clicks link in email which handles verification
  const verifyResetOtp = async (code: string): Promise<boolean> => {
    if (!pendingAuth || pendingAuth.type !== "reset-password") return false

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: pendingAuth.email,
        token: code,
        type: 'recovery',
      })

      if (error) {
        console.error('Reset OTP verification error:', error)
        return false
      }

      return !!data.user
    } catch (error) {
      console.error('Reset OTP verification error:', error)
      return false
    }
  }

  // Reset password after OTP verification (or after clicking email link)
  const resetPassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        console.error('Password update error:', error)
        return { success: false, error: error.message }
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

