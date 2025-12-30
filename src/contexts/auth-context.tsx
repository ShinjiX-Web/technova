import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  id: string
  name: string
  email: string
}

interface PendingAuth {
  type: "login" | "signup"
  email: string
  name?: string
  password: string
  otpCode: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  pendingAuth: PendingAuth | null
  login: (email: string, password: string) => Promise<{ success: boolean; needsOtp?: boolean; error?: string }>
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; needsOtp?: boolean; error?: string }>
  verifyOtp: (code: string) => Promise<boolean>
  resendOtp: () => void
  cancelOtp: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = "auth_user"
const USERS_KEY = "auth_users"

// Generate a random 6-digit OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
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

  const login = async (email: string, password: string): Promise<{ success: boolean; needsOtp?: boolean; error?: string }> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Get stored users
    const usersJson = localStorage.getItem(USERS_KEY)
    const users: Array<User & { password: string }> = usersJson ? JSON.parse(usersJson) : []

    // Find user
    const foundUser = users.find((u) => u.email === email && u.password === password)

    if (foundUser) {
      // Generate OTP and set pending auth
      const otpCode = generateOtp()
      setPendingAuth({
        type: "login",
        email,
        password,
        otpCode,
      })
      // Log the OTP to console for demo purposes
      console.log(`🔐 OTP Code for ${email}: ${otpCode}`)
      return { success: true, needsOtp: true }
    }

    return { success: false, error: "Invalid email or password" }
  }

  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; needsOtp?: boolean; error?: string }> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Get stored users
    const usersJson = localStorage.getItem(USERS_KEY)
    const users: Array<User & { password: string }> = usersJson ? JSON.parse(usersJson) : []

    // Check if email already exists
    if (users.some((u) => u.email === email)) {
      return { success: false, error: "An account with this email already exists" }
    }

    // Generate OTP and set pending auth
    const otpCode = generateOtp()
    setPendingAuth({
      type: "signup",
      email,
      name,
      password,
      otpCode,
    })
    // Log the OTP to console for demo purposes
    console.log(`🔐 OTP Code for ${email}: ${otpCode}`)
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

  const resendOtp = () => {
    if (pendingAuth) {
      const newOtp = generateOtp()
      setPendingAuth({ ...pendingAuth, otpCode: newOtp })
      console.log(`🔐 New OTP Code for ${pendingAuth.email}: ${newOtp}`)
    }
  }

  const cancelOtp = () => {
    setPendingAuth(null)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
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

