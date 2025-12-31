import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { IconBell, IconMail, IconDeviceMobile } from "@tabler/icons-react"

export default function NotificationsPage() {
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
              <h1 className="text-2xl font-bold">Notifications</h1>
              <p className="text-muted-foreground">
                Manage how you receive notifications
              </p>
            </div>
          </div>

          {/* Email Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconMail className="h-5 w-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>
                Choose what emails you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { id: "marketing", label: "Marketing emails", description: "Receive emails about new products, features, and more." },
                { id: "social", label: "Social notifications", description: "Receive emails for friend requests, follows, and more." },
                { id: "security", label: "Security alerts", description: "Receive emails about your account security." },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor={item.id}>{item.label}</Label>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch id={item.id} defaultChecked={item.id === "security"} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Push Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconDeviceMobile className="h-5 w-5" />
                Push Notifications
              </CardTitle>
              <CardDescription>
                Configure push notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { id: "push-all", label: "All notifications", description: "Receive all push notifications." },
                { id: "push-mentions", label: "Direct mentions only", description: "Only receive notifications when mentioned." },
                { id: "push-none", label: "Nothing", description: "Turn off all push notifications." },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor={item.id}>{item.label}</Label>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch id={item.id} defaultChecked={item.id === "push-mentions"} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* In-App Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconBell className="h-5 w-5" />
                In-App Notifications
              </CardTitle>
              <CardDescription>
                Manage in-app notification settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { id: "app-updates", label: "Product updates", description: "Get notified about new features and updates." },
                { id: "app-tips", label: "Tips and tutorials", description: "Receive helpful tips to get the most out of the app." },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor={item.id}>{item.label}</Label>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch id={item.id} defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

