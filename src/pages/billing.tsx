import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconCreditCard, IconReceipt, IconDownload } from "@tabler/icons-react"

export default function BillingPage() {
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
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Billing</h1>
              <p className="text-muted-foreground">
                Manage your subscription and payment methods
              </p>
            </div>
          </div>

          {/* Current Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCreditCard className="h-5 w-5" />
                Current Plan
              </CardTitle>
              <CardDescription>
                Your current subscription details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">Pro Plan</p>
                  <p className="text-muted-foreground">$29/month • Renews on Jan 15, 2026</p>
                </div>
                <Button variant="outline">Change Plan</Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>
                Manage your payment methods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center text-white text-xs font-bold">
                    VISA
                  </div>
                  <div>
                    <p className="font-medium">•••• •••• •••• 4242</p>
                    <p className="text-sm text-muted-foreground">Expires 12/2026</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
            </CardContent>
          </Card>

          {/* Billing History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconReceipt className="h-5 w-5" />
                Billing History
              </CardTitle>
              <CardDescription>
                Download your past invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { date: "Dec 15, 2025", amount: "$29.00", status: "Paid" },
                  { date: "Nov 15, 2025", amount: "$29.00", status: "Paid" },
                  { date: "Oct 15, 2025", amount: "$29.00", status: "Paid" },
                ].map((invoice, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{invoice.date}</p>
                      <p className="text-sm text-muted-foreground">{invoice.amount}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-green-600 dark:text-green-400">{invoice.status}</span>
                      <Button variant="ghost" size="icon">
                        <IconDownload className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

