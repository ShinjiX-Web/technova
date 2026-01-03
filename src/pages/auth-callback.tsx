import { useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { auth, onAuthStateChanged } from "@/lib/firebase"

// This page handles any OAuth redirect scenarios
// With Firebase popup auth, this is mainly a fallback
export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    // Check for error in URL params
    const error = searchParams.get("error")
    const errorDescription = searchParams.get("error_description")

    if (error) {
      console.error("OAuth error:", error, errorDescription)
      navigate(`/login?error=${encodeURIComponent(errorDescription || error)}`, { replace: true })
      return
    }

    // Wait for Firebase auth state to be determined
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is authenticated, redirect to dashboard
        navigate("/dashboard", { replace: true })
      } else {
        // No user, redirect to login
        navigate("/login", { replace: true })
      }
    })

    // Cleanup subscription
    return () => unsubscribe()
  }, [searchParams, navigate])

  return (
    <div className="flex min-h-svh items-center justify-center bg-white dark:bg-neutral-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  )
}

