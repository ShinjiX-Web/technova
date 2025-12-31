import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { IconUsers, IconUserPlus, IconMail } from "@tabler/icons-react"

export default function TeamPage() {
  const teamMembers = [
    { name: "Alex Johnson", email: "alex@example.com", role: "Admin", avatar: "", status: "Active" },
    { name: "Sarah Chen", email: "sarah@example.com", role: "Developer", avatar: "", status: "Active" },
    { name: "Mike Wilson", email: "mike@example.com", role: "Designer", avatar: "", status: "Active" },
    { name: "Emily Davis", email: "emily@example.com", role: "Developer", avatar: "", status: "Away" },
    { name: "James Brown", email: "james@example.com", role: "Manager", avatar: "", status: "Active" },
    { name: "Lisa Anderson", email: "lisa@example.com", role: "Developer", avatar: "", status: "Offline" },
  ]

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-500"
      case "Away": return "bg-yellow-500"
      default: return "bg-gray-400"
    }
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
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Team</h1>
              <p className="text-muted-foreground">
                Manage your team members and their roles
              </p>
            </div>
            <Button>
              <IconUserPlus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </div>

          {/* Team Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teamMembers.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Now</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teamMembers.filter(m => m.status === "Active").length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
              </CardContent>
            </Card>
          </div>

          {/* Team Members List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconUsers className="h-5 w-5" />
                Team Members
              </CardTitle>
              <CardDescription>All members in your organization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.email} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                      </Avatar>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(member.status)}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                    <Badge variant="outline">{member.role}</Badge>
                    <Button variant="ghost" size="icon">
                      <IconMail className="h-4 w-4" />
                    </Button>
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

