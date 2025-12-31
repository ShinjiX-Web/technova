import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { IconFolder, IconPlus, IconDots } from "@tabler/icons-react"

export default function ProjectsPage() {
  const projects = [
    { name: "Website Redesign", status: "In Progress", progress: 65, team: 4, dueDate: "Jan 15, 2026" },
    { name: "Mobile App v2", status: "In Progress", progress: 40, team: 6, dueDate: "Feb 28, 2026" },
    { name: "API Integration", status: "Planning", progress: 15, team: 3, dueDate: "Mar 10, 2026" },
    { name: "Dashboard Analytics", status: "Completed", progress: 100, team: 2, dueDate: "Dec 20, 2025" },
    { name: "User Authentication", status: "Completed", progress: 100, team: 2, dueDate: "Dec 1, 2025" },
    { name: "Payment System", status: "On Hold", progress: 30, team: 3, dueDate: "TBD" },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "default"
      case "In Progress": return "secondary"
      case "Planning": return "outline"
      default: return "destructive"
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
              <h1 className="text-2xl font-bold">Projects</h1>
              <p className="text-muted-foreground">
                Manage and track all your projects
              </p>
            </div>
            <Button>
              <IconPlus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>

          {/* Project Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projects.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projects.filter(p => p.status === "In Progress").length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projects.filter(p => p.status === "Completed").length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projects.reduce((sum, p) => sum + p.team, 0)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Projects List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconFolder className="h-5 w-5" />
                All Projects
              </CardTitle>
              <CardDescription>A list of all your active and completed projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.name} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{project.name}</p>
                        <Badge variant={getStatusColor(project.status) as any}>{project.status}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{project.team} members</span>
                        <span>Due: {project.dueDate}</span>
                      </div>
                      <div className="mt-2">
                        <Progress value={project.progress} className="h-2" />
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <IconDots className="h-4 w-4" />
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

