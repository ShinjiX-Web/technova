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

interface OTPFormProps extends React.ComponentProps<typeof Card> {
  onCancel?: () => void
  devOtp?: string | null  // For development: show OTP when email fails
}

export function OTPForm({ onCancel, devOtp: initialDevOtp, ...props }: OTPFormProps) {
  const [otp, setOtp] = useState("")
  const [error, setError] = useState("")
  const [devOtp, setDevOtp] = useState<string | null>(initialDevOtp || null)
  const [isLoading, setIsLoading] = useState(false)
  const { pendingAuth, verifyOtp, resendOtp, cancelOtp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const authType = pendingAuth?.type
      const success = await verifyOtp(otp)
      if (success) {
        // Navigate with state to show success popup on dashboard
        navigate("/dashboard", {
          state: {
            showSuccess: true,
            isSignup: authType === "signup"
          }
        })
      } else {
        setError("Invalid verification code. Please try again.")
        setOtp("")
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    const result = await resendOtp()
    setOtp("")
    setError("")
    if (result.devOtp) {
      setDevOtp(result.devOtp)
    }
  }

  const handleCancel = () => {
    cancelOtp()
    onCancel?.()
  }

  return (
    <Card className="bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800" {...props}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">
          Enter verification code
        </CardTitle>
        <CardDescription>
          We sent a 6-digit code to <span className="font-medium">{pendingAuth?.email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
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
            <Field>
              <FieldLabel htmlFor="otp" className="text-sm font-medium">Verification code</FieldLabel>
              <InputOTP
                maxLength={6}
                id="otp"
                required
                value={otp}
                onChange={setOtp}
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
                Check your browser console for the OTP code (demo only).
              </FieldDescription>
            </Field>
            <FieldGroup className="pt-2">
              <Button
                type="submit"
                disabled={isLoading || otp.length !== 6}
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
                  className="cursor-pointer underline underline-offset-4 hover:text-primary"
                >
                  Resend
                </button>
              </FieldDescription>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
