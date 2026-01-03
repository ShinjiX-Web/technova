import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  IconHelp,
  IconSearch,
  IconBook,
  IconMessageCircle,
  IconMail,
  IconVideo,
  IconExternalLink,
} from "@tabler/icons-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const faqs = [
    { q: "How do I reset my password?", a: "Go to Settings > Security > Change Password, or use the 'Forgot Password' link on the login page." },
    { q: "How can I invite team members?", a: "Navigate to Team page, click 'Invite Member', and enter their email address. They'll receive an invitation." },
    { q: "What file types are supported in Data Library?", a: "We support PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, and common image formats (JPG, PNG, GIF)." },
    { q: "How do I export my data?", a: "Go to Settings > Data Management > Export Data. You can export in CSV, JSON, or PDF format." },
    { q: "Is my data secure?", a: "Yes! We use industry-standard encryption and security practices. All data is encrypted at rest and in transit." },
    { q: "How do I cancel my subscription?", a: "Go to Billing > Manage Subscription > Cancel. Your access continues until the end of the billing period." },
  ]

  const resources = [
    { title: "Getting Started Guide", description: "Learn the basics", icon: <IconBook className="h-6 w-6" />, url: "#" },
    { title: "Video Tutorials", description: "Watch step-by-step guides", icon: <IconVideo className="h-6 w-6" />, url: "#" },
    { title: "API Documentation", description: "For developers", icon: <IconExternalLink className="h-6 w-6" />, url: "#" },
    { title: "Community Forum", description: "Connect with other users", icon: <IconMessageCircle className="h-6 w-6" />, url: "#" },
  ]

  const filteredFaqs = faqs.filter(
    faq => faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 max-w-4xl">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <IconHelp className="h-6 w-6" />
              Help Center
            </h1>
            <p className="text-muted-foreground">Find answers and get support</p>
          </div>

          {/* Search */}
          <div className="relative max-w-lg">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Quick Resources */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {resources.map((resource) => (
              <Card key={resource.title} className="cursor-pointer hover:border-primary transition-colors">
                <CardContent className="p-4">
                  <div className="mb-3 w-fit p-2 rounded-lg bg-primary/10">{resource.icon}</div>
                  <p className="font-medium">{resource.title}</p>
                  <p className="text-sm text-muted-foreground">{resource.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* FAQs */}
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Quick answers to common questions</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                    <AccordionContent>{faq.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              {filteredFaqs.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No results found. Try a different search term.</p>
              )}
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Still need help?</h3>
                  <p className="text-muted-foreground">Our support team is here to assist you</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <IconMessageCircle className="h-4 w-4 mr-2" />
                    Live Chat
                  </Button>
                  <Button>
                    <IconMail className="h-4 w-4 mr-2" />
                    Email Support
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

