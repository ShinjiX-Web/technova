import { useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { type User } from "@/contexts/auth-context"

const STORAGE_KEY = "auth_user"

export default function AuthCallback() {
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const userParam = searchParams.get("user")
    const error = searchParams.get("error")

    if (error) {
      console.error("OAuth error:", error)
      window.location.replace(`/login?error=${encodeURIComponent(error)}`)
      return
    }

    if (userParam) {
      try {
        const userData: User = JSON.parse(decodeURIComponent(userParam))

        // Save directly to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))

        // Use window.location for a full page navigation to ensure state is fresh
        window.location.replace("/dashboard")
      } catch (err) {
        console.error("Failed to parse user data:", err)
        window.location.replace("/login?error=parse_failed")
      }
    } else {
      window.location.replace("/login")
    }
  }, [searchParams])

  return (
    <div className="flex min-h-svh items-center justify-center bg-white dark:bg-neutral-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  )
}

