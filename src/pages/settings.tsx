import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  IconSettings,
  IconBell,
  IconPalette,
  IconShield,
  IconLanguage,
  IconDeviceFloppy,
} from "@tabler/icons-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import Swal from "sweetalert2"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    language: "en",
    timezone: "UTC",
    twoFactor: false,
    sessionTimeout: "30",
  })

  const isDark = document.documentElement.classList.contains("dark")

  const handleSave = () => {
    localStorage.setItem("app_settings", JSON.stringify(settings))
    Swal.fire({
      icon: "success",
      title: "Settings saved",
      timer: 1500,
      showConfirmButton: false,
      background: isDark ? "#171717" : "#ffffff",
      color: isDark ? "#ffffff" : "#171717",
    })
  }

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <IconSettings className="h-6 w-6" />
                Settings
              </h1>
              <p className="text-muted-foreground">
                Manage your application preferences and configurations
              </p>
            </div>
            <Button onClick={handleSave}>
              <IconDeviceFloppy className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconBell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><Label>Email Notifications</Label><p className="text-sm text-muted-foreground">Receive updates via email</p></div>
                <Switch checked={settings.emailNotifications} onCheckedChange={(checked) => setSettings(s => ({ ...s, emailNotifications: checked }))} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div><Label>Push Notifications</Label><p className="text-sm text-muted-foreground">Browser push notifications</p></div>
                <Switch checked={settings.pushNotifications} onCheckedChange={(checked) => setSettings(s => ({ ...s, pushNotifications: checked }))} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div><Label>Marketing Emails</Label><p className="text-sm text-muted-foreground">Receive promotional content</p></div>
                <Switch checked={settings.marketingEmails} onCheckedChange={(checked) => setSettings(s => ({ ...s, marketingEmails: checked }))} />
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><IconPalette className="h-5 w-5" />Preferences</CardTitle>
              <CardDescription>Customize your experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><IconLanguage className="h-4 w-4" />Language</Label>
                  <Select value={settings.language} onValueChange={(v) => setSettings(s => ({ ...s, language: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select value={settings.timezone} onValueChange={(v) => setSettings(s => ({ ...s, timezone: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">Eastern Time</SelectItem>
                      <SelectItem value="PST">Pacific Time</SelectItem>
                      <SelectItem value="GMT">GMT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><IconShield className="h-5 w-5" />Security</CardTitle>
              <CardDescription>Manage security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><Label>Two-Factor Authentication</Label><p className="text-sm text-muted-foreground">Add an extra layer of security</p></div>
                <Switch checked={settings.twoFactor} onCheckedChange={(checked) => setSettings(s => ({ ...s, twoFactor: checked }))} />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Session Timeout (minutes)</Label>
                <Input type="number" value={settings.sessionTimeout} onChange={(e) => setSettings(s => ({ ...s, sessionTimeout: e.target.value }))} className="max-w-[200px]" />
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

