import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/ui/mode-toggle"
import {
  IconCode,
  IconDeviceMobile,
  IconCloud,
  IconChartBar,
  IconBrandGoogle,
  IconMail,
  IconUsers,
  IconRocket,
  IconShieldCheck,
  IconHeadset,
} from "@tabler/icons-react"

export default function LandingPage() {
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
            <div className="flex items-center">
              <img
                src={isDark ? "/logo_white.svg" : "/logo_black.svg"}
                alt="Creative Developers"
                className="h-50 w-auto object-contain"
              />
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#services" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Services</a>
              <a href="#why-us" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Why Us</a>
              <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Contact</a>
            </nav>
            <div className="flex items-center gap-3">
              <ModeToggle />
              <Button variant="outline" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Transform Your Business with
            <span className="block text-primary">Digital Excellence</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            We deliver cutting-edge IT solutions and digital marketing strategies that drive growth, enhance visibility, and accelerate your success.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <a href="#contact">Get Started</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#services">Our Services</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive IT and digital marketing solutions tailored to your business needs
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ServiceCard
              icon={<IconCode className="w-8 h-8" />}
              title="Web Development"
              description="Custom websites and web applications built with modern technologies for optimal performance."
            />
            <ServiceCard
              icon={<IconDeviceMobile className="w-8 h-8" />}
              title="Mobile Apps"
              description="Native and cross-platform mobile applications for iOS and Android devices."
            />
            <ServiceCard
              icon={<IconCloud className="w-8 h-8" />}
              title="Cloud Solutions"
              description="Scalable cloud infrastructure and migration services for enterprise needs."
            />
            <ServiceCard
              icon={<IconChartBar className="w-8 h-8" />}
              title="SEO & Analytics"
              description="Data-driven SEO strategies to boost your search rankings and online visibility."
            />
            <ServiceCard
              icon={<IconBrandGoogle className="w-8 h-8" />}
              title="PPC Advertising"
              description="Targeted Google Ads and social media campaigns that maximize ROI."
            />
            <ServiceCard
              icon={<IconMail className="w-8 h-8" />}
              title="Email Marketing"
              description="Engaging email campaigns that nurture leads and drive conversions."
            />
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section id="why-us" className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Us</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Partner with a team that's committed to your success
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard icon={<IconUsers className="w-6 h-6" />} title="Expert Team" description="Skilled professionals with years of industry experience" />
            <FeatureCard icon={<IconRocket className="w-6 h-6" />} title="Fast Delivery" description="Agile methodologies for quick turnaround times" />
            <FeatureCard icon={<IconShieldCheck className="w-6 h-6" />} title="Secure & Reliable" description="Enterprise-grade security for all solutions" />
            <FeatureCard icon={<IconHeadset className="w-6 h-6" />} title="24/7 Support" description="Round-the-clock assistance when you need it" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20 bg-primary/90 text-primary-foreground backdrop-blur-sm">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
            Let's discuss how we can help transform your business with our IT and digital marketing expertise.
          </p>
          <Button size="lg" variant="secondary">
            Contact Us Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200/50 dark:border-neutral-800/50 bg-white/60 dark:bg-neutral-950/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Creative Developers" className="w-12 h-12 object-contain" />
              <span className="font-semibold">Creative Developers</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2026 Creative Developers. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function ServiceCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-xl bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 hover:shadow-lg transition-shadow">
      <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
        {icon}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

