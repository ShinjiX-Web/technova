import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState("Completing authentication...")

  useEffect(() => {
    const handleCallback = async () => {
      // Check for error in URL params
      const error = searchParams.get("error")
      const errorDescription = searchParams.get("error_description")

      if (error) {
        console.error("OAuth error:", error, errorDescription)
        navigate(`/login?error=${encodeURIComponent(errorDescription || error)}`, { replace: true })
        return
      }

      try {
        const code = searchParams.get("code")

        // If we have a code (PKCE flow), exchange it first
        if (code) {
          setStatus("Exchanging authorization code...")
          console.log("Found auth code, exchanging for session...")

          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            console.error("Code exchange error:", exchangeError)
            navigate(`/login?error=${encodeURIComponent(exchangeError.message)}`, { replace: true })
            return
          }

          if (data.session) {
            console.log("OAuth session established via code exchange for:", data.session.user.email)
            setStatus("Saving profile...")

            // Save OAuth provider to profiles table
            const provider = data.session.user.app_metadata?.provider
            if (provider) {
              try {
                await supabase.from('profiles').upsert({
                  id: data.session.user.id,
                  email: data.session.user.email,
                  name: data.session.user.user_metadata?.name || data.session.user.user_metadata?.full_name || '',
                  avatar_url: data.session.user.user_metadata?.avatar_url,
                  oauth_provider: provider,
                  updated_at: new Date().toISOString(),
                }, { onConflict: 'id' })
              } catch (profileErr) {
                console.error("Profile save error (non-fatal):", profileErr)
              }
            }

            setStatus("Redirecting to dashboard...")
            setTimeout(() => {
              navigate("/dashboard", { replace: true })
            }, 500)
            return
          }
        }

        // No code in URL - check if we already have a session (implicit flow or already exchanged)
        setStatus("Verifying session...")
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Session error:", sessionError)
          navigate(`/login?error=${encodeURIComponent(sessionError.message)}`, { replace: true })
          return
        }

        if (session) {
          console.log("OAuth session found for:", session.user.email)
          setStatus("Saving profile...")

          // Save OAuth provider to profiles table for detection during email/password login
          const provider = session.user.app_metadata?.provider
          if (provider) {
            try {
              await supabase.from('profiles').upsert({
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || '',
                avatar_url: session.user.user_metadata?.avatar_url,
                oauth_provider: provider,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'id' })
            } catch (profileErr) {
              console.error("Profile save error (non-fatal):", profileErr)
            }
          }

          setStatus("Redirecting to dashboard...")
          setTimeout(() => {
            navigate("/dashboard", { replace: true })
          }, 500)
        } else {
          console.error("No session found after OAuth callback")
          navigate("/login?error=no_session", { replace: true })
        }
      } catch (err) {
        console.error("Callback error:", err)
        navigate("/login?error=callback_failed", { replace: true })
      }
    }

    handleCallback()
  }, [searchParams, navigate])

  return (
    <div className="flex min-h-svh items-center justify-center bg-white dark:bg-neutral-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  )
}

