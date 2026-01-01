import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { IconArrowLeft } from "@tabler/icons-react"

export default function TermsOfService() {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  )

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"))
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 dark:border-neutral-800/50 bg-white/60 dark:bg-neutral-950/60 backdrop-blur-md">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center">
              <img
                src={isDark ? "/logo_white.svg" : "/logo_black.svg"}
                alt="TechNova"
                className="h-50 w-auto object-contain"
              />
            </Link>
            <div className="flex items-center gap-3">
              <ModeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="py-12 lg:py-20">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <IconArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold mb-8">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 1, 2026</p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-4">1. Agreement to Terms</h2>
              <p className="text-muted-foreground">
                By accessing or using TechNova's website at technova.surf and our services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">2. Use of Services</h2>
              <p className="text-muted-foreground mb-2">You agree to use our services only for lawful purposes and in accordance with these Terms. You agree not to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Use the services in any way that violates applicable laws or regulations</li>
                <li>Attempt to gain unauthorized access to our systems or networks</li>
                <li>Interfere with or disrupt the integrity or performance of our services</li>
                <li>Transmit any malicious code, viruses, or harmful components</li>
                <li>Collect or harvest any information from our services without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">3. User Accounts</h2>
              <p className="text-muted-foreground">
                When you create an account with us, you must provide accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">4. Intellectual Property</h2>
              <p className="text-muted-foreground">
                The services and all content, features, and functionality are owned by TechNova and are protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works without our express written permission.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">5. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                To the fullest extent permitted by law, TechNova shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">6. Termination</h2>
              <p className="text-muted-foreground">
                We may terminate or suspend your access to our services immediately, without prior notice, for any reason, including if you breach these Terms of Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">7. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">8. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions about these Terms, please contact us at:
              </p>
              <p className="text-muted-foreground mt-2">
                <strong>Email:</strong> legal@technova.surf<br />
                <strong>Website:</strong> https://technova.surf
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200/50 dark:border-neutral-800/50 bg-white/60 dark:bg-neutral-950/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img src={isDark ? "/logo_white.svg" : "/logo_black.svg"} alt="TechNova" className="h-8 w-auto object-contain" />
              <span className="font-semibold">TechNova</span>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
            </div>
            <p className="text-sm text-muted-foreground">© 2026 TechNova. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

