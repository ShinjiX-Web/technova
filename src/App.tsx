import { useState } from "react"
import { Link } from "react-router-dom"
import { LoginForm } from "@/components/login-form"
import { SignupForm } from "@/components/ui/signup-form"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { IconArrowLeft } from "@tabler/icons-react"

export default function App() {
  const [isSignup, setIsSignup] = useState(false)

  return (
    <div className="relative flex min-h-svh w-full items-center justify-center p-4">
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-50">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <IconArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>

      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50">
        <ModeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {isSignup ? (
          <SignupForm onToggle={() => setIsSignup(false)} />
        ) : (
          <LoginForm onToggle={() => setIsSignup(true)} />
        )}
      </div>
    </div>
  )
}
