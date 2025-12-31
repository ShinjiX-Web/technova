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
        setStatus("Verifying session...")

        // Supabase automatically handles the OAuth callback and sets the session
        // from the URL hash (#access_token=...). We just need to verify it worked.
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Session error:", sessionError)
          navigate(`/login?error=${encodeURIComponent(sessionError.message)}`, { replace: true })
          return
        }

        if (session) {
          console.log("OAuth session established for:", session.user.email)
          setStatus("Saving profile...")

          // Save OAuth provider to profiles table for detection during email/password login
          const provider = session.user.app_metadata?.provider
          if (provider) {
            await supabase.from('profiles').upsert({
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || '',
              avatar_url: session.user.user_metadata?.avatar_url,
              oauth_provider: provider,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'id' })
          }

          setStatus("Redirecting to dashboard...")
          // Small delay to ensure the auth context picks up the session
          setTimeout(() => {
            navigate("/dashboard", { replace: true })
          }, 500)
        } else {
          // No session found - try to exchange the code if present
          const code = searchParams.get("code")

          if (code) {
            setStatus("Exchanging authorization code...")
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
                await supabase.from('profiles').upsert({
                  id: data.session.user.id,
                  email: data.session.user.email,
                  name: data.session.user.user_metadata?.name || data.session.user.user_metadata?.full_name || '',
                  avatar_url: data.session.user.user_metadata?.avatar_url,
                  oauth_provider: provider,
                  updated_at: new Date().toISOString(),
                }, { onConflict: 'id' })
              }

              setStatus("Redirecting to dashboard...")
              setTimeout(() => {
                navigate("/dashboard", { replace: true })
              }, 500)
              return
            }
          }

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

