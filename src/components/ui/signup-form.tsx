import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { OTPForm } from "@/components/otp-form"

interface SignupFormProps extends React.ComponentProps<"div"> {
  onToggle?: () => void
}

export function SignupForm({ className, onToggle, ...props }: SignupFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { signup, pendingAuth } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    setIsLoading(true)

    try {
      const result = await signup(name, email, password)
      if (!result.success) {
        setError(result.error || "An account with this email already exists")
      }
      // If needsOtp is true, the pendingAuth state will be set and OTP form will show
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Show OTP form if we have pending auth from signup
  if (pendingAuth?.type === "signup") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <OTPForm />
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            Create an account
          </CardTitle>
          <CardDescription>
            Enter your information below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  {error}
                </div>
              )}
              <Field>
                <FieldLabel htmlFor="name" className="text-sm font-medium">Full Name</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email" className="text-sm font-medium">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700"
                />
                <FieldDescription className="text-xs">
                  We'll use this to contact you. We will not share your email with anyone else.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="password" className="text-sm font-medium">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700"
                />
                <FieldDescription className="text-xs">
                  Must be at least 8 characters long.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm-password" className="text-sm font-medium">
                  Confirm Password
                </FieldLabel>
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-10 bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700"
                />
                <FieldDescription className="text-xs">
                  Please confirm your password.
                </FieldDescription>
              </Field>
              <Field className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="cursor-pointer w-full h-10"
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  className="cursor-pointer w-full h-10"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign up with Google
                </Button>
                <FieldDescription className="text-center text-sm pt-2">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={onToggle}
                    className="cursor-pointer underline underline-offset-4 hover:text-primary"
                  >
                    Sign in
                  </button>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
