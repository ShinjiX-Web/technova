import { useState } from "react"
import { useNavigate } from "react-router-dom"
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { useAuth } from "@/contexts/auth-context"

interface MFAFormProps extends React.ComponentProps<typeof Card> {
  onCancel?: () => void
}

export function MFAForm({ onCancel, ...props }: MFAFormProps) {
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const { pendingMfa, verifyMfa, resendMfa, cancelMfa } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")
    setIsLoading(true)

    try {
      const result = await verifyMfa(code)
      if (result.success) {
        navigate("/dashboard", {
          state: { showSuccess: true }
        })
      } else {
        setError(result.error || "Invalid verification code. Please try again.")
        setCode("")
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setError("")
    setSuccessMessage("")
    setIsResending(true)

    try {
      const result = await resendMfa()
      if (result.success) {
        setSuccessMessage("A new verification code has been sent to your phone.")
        setCode("")
      } else {
        setError(result.error || "Failed to resend code. Please try again.")
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  const handleCancel = () => {
    cancelMfa()
    onCancel?.()
  }

  return (
    <Card className="bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800" {...props}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Enter the verification code sent to your phone ending in{" "}
          <span className="font-medium">{pendingMfa?.phoneHint || '****'}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {successMessage && (
              <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-lg">
                {successMessage}
              </div>
            )}
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
                {error}
              </div>
            )}
            <Field>
              <FieldLabel htmlFor="mfa-code" className="text-sm font-medium">
                Verification code
              </FieldLabel>
              <InputOTP
                maxLength={6}
                id="mfa-code"
                required
                value={code}
                onChange={setCode}
              >
                <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:border-neutral-700 *:data-[slot=input-otp-slot]:h-10 *:data-[slot=input-otp-slot]:w-10">
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              <FieldDescription className="text-xs">
                Check your phone for the SMS verification code.
              </FieldDescription>
            </Field>
            <FieldGroup className="pt-2">
              <Button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="cursor-pointer w-full h-10"
              >
                {isLoading ? "Verifying..." : "Verify"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="cursor-pointer w-full h-10"
              >
                Cancel
              </Button>
              <FieldDescription className="text-center text-sm pt-2">
                Didn&apos;t receive the code?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="cursor-pointer underline underline-offset-4 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? "Sending..." : "Resend"}
                </button>
              </FieldDescription>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

