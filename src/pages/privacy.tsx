import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { IconArrowLeft } from "@tabler/icons-react"

export default function PrivacyPolicy() {
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

          <h1 className="text-3xl md:text-4xl font-bold mb-8">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 1, 2026</p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground">
                TechNova ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website technova.surf and use our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>
              <p className="text-muted-foreground mb-2">We may collect information about you in various ways, including:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>Personal Data:</strong> Name, email address, phone number, and other contact information you provide.</li>
                <li><strong>Account Data:</strong> Username, password, and preferences associated with your account.</li>
                <li><strong>Usage Data:</strong> Information about how you use our website and services.</li>
                <li><strong>Device Data:</strong> IP address, browser type, operating system, and device identifiers.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">3. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-2">We use the information we collect to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send promotional communications (with your consent)</li>
                <li>Respond to your comments, questions, and requests</li>
                <li>Monitor and analyze trends, usage, and activities</li>
                <li>Detect, investigate, and prevent fraudulent transactions and abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">4. Sharing of Information</h2>
              <p className="text-muted-foreground">
                We do not sell your personal information. We may share your information with third-party service providers who perform services on our behalf, such as payment processing, data analysis, email delivery, hosting, and customer service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">5. Data Security</h2>
              <p className="text-muted-foreground">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">6. Your Rights</h2>
              <p className="text-muted-foreground">
                Depending on your location, you may have rights regarding your personal data, including the right to access, correct, delete, or port your data. Contact us to exercise these rights.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">7. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <p className="text-muted-foreground mt-2">
                <strong>Email:</strong> privacy@technova.surf<br />
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

