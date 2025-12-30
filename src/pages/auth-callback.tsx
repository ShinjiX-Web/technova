import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useAuth, type User } from "@/contexts/auth-context"

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { handleOAuthCallback } = useAuth()

  useEffect(() => {
    const userParam = searchParams.get("user")
    const provider = searchParams.get("provider")
    const error = searchParams.get("error")

    if (error) {
      console.error("OAuth error:", error)
      navigate("/login", { replace: true, state: { error: `Authentication failed: ${error}` } })
      return
    }

    if (userParam) {
      try {
        const userData: User = JSON.parse(decodeURIComponent(userParam))
        handleOAuthCallback(userData)
        
        // Navigate to dashboard with success message
        navigate("/dashboard", { 
          replace: true, 
          state: { 
            showSuccess: true, 
            isSignup: false,
            provider 
          } 
        })
      } catch (err) {
        console.error("Failed to parse user data:", err)
        navigate("/login", { replace: true, state: { error: "Failed to process authentication" } })
      }
    } else {
      navigate("/login", { replace: true })
    }
  }, [searchParams, navigate, handleOAuthCallback])

  return (
    <div className="flex min-h-svh items-center justify-center bg-white dark:bg-neutral-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  )
}

