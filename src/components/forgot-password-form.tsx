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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp"
import { Link } from "react-router-dom"

type Step = "email" | "otp" | "new-password" | "success"

interface ForgotPasswordFormProps extends React.ComponentProps<"div"> {}

export function ForgotPasswordForm({
  className,
  ...props
}: ForgotPasswordFormProps) {
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [devOtp, setDevOtp] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { requestPasswordReset, verifyResetOtp, resetPassword, resendOtp, cancelOtp } = useAuth()

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setDevOtp(null)
    setIsLoading(true)

    try {
      const result = await requestPasswordReset(email)
      if (result.success) {
        setStep("otp")
        if (result.devOtp) {
          setDevOtp(result.devOtp)
        }
      } else {
        setError(result.error || "Failed to send reset email")
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const isValid = await verifyResetOtp(otp)
      if (isValid) {
        setStep("new-password")
      } else {
        setError("Invalid verification code. Please try again.")
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)

    try {
      const result = await resetPassword(newPassword)
      if (result.success) {
        setStep("success")
      } else {
        setError(result.error || "Failed to reset password")
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setError("")
    const result = await resendOtp()
    if (result.devOtp) {
      setDevOtp(result.devOtp)
    }
  }

  const handleCancel = () => {
    cancelOtp()
    setStep("email")
    setOtp("")
    setNewPassword("")
    setConfirmPassword("")
  }

  // Success step
  if (step === "success") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold">Password Reset!</CardTitle>
            <CardDescription>
              Your password has been successfully reset.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/login">
              <Button className="w-full cursor-pointer">
                Back to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // OTP verification step
  if (step === "otp") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              Check your email
            </CardTitle>
            <CardDescription>
              We sent a verification code to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleOtpSubmit}>
              <FieldGroup>
                {devOtp && (
                  <div className="p-3 text-sm text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-800">
                    <span className="font-semibold">🔧 Dev Mode:</span> Email failed to send. Your code is: <code className="font-mono font-bold text-lg">{devOtp}</code>
                  </div>
                )}
                {error && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    {error}
                  </div>
                )}
                <Field className="flex flex-col items-center">
                  <FieldLabel className="sr-only">Verification Code</FieldLabel>
                  <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </Field>
                <Field className="pt-2">
                  <Button type="submit" disabled={isLoading || otp.length !== 6} className="w-full cursor-pointer">
                    {isLoading ? "Verifying..." : "Verify Code"}
                  </Button>
                </Field>
                <FieldDescription className="text-center text-sm">
                  Didn't receive the code?{" "}
                  <button type="button" onClick={handleResendOtp} className="underline underline-offset-4 hover:text-primary cursor-pointer">
                    Resend
                  </button>
                </FieldDescription>
                <FieldDescription className="text-center text-sm">
                  <button type="button" onClick={handleCancel} className="underline underline-offset-4 hover:text-primary cursor-pointer">
                    Cancel
                  </button>
                </FieldDescription>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // New password step
  if (step === "new-password") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              Set new password
            </CardTitle>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit}>
              <FieldGroup>
                {error && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    {error}
                  </div>
                )}
                <Field>
                  <FieldLabel htmlFor="new-password" className="text-sm font-medium">New Password</FieldLabel>
                  <Input
                    id="new-password"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-10 bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700"
                    placeholder="Enter new password"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="confirm-password" className="text-sm font-medium">Confirm Password</FieldLabel>
                  <Input
                    id="confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-10 bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700"
                    placeholder="Confirm new password"
                  />
                </Field>
                <Field className="pt-2">
                  <Button type="submit" disabled={isLoading} className="w-full cursor-pointer">
                    {isLoading ? "Resetting..." : "Reset Password"}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Email step (default)
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            Forgot password?
          </CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a verification code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailSubmit}>
            <FieldGroup>
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  {error}
                </div>
              )}
              <Field>
                <FieldLabel htmlFor="email" className="text-sm font-medium">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-700"
                  placeholder="email@example.com"
                />
              </Field>
              <Field className="pt-2">
                <Button type="submit" disabled={isLoading} className="w-full cursor-pointer">
                  {isLoading ? "Sending..." : "Send Verification Code"}
                </Button>
                <FieldDescription className="text-center text-sm pt-4">
                  Remember your password?{" "}
                  <Link to="/login" className="underline underline-offset-4 hover:text-primary">
                    Back to login
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
