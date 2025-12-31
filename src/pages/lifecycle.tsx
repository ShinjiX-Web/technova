import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IconListDetails, IconCircleCheck, IconClock, IconAlertCircle } from "@tabler/icons-react"

export default function LifecyclePage() {
  const stages = [
    { name: "Planning", status: "completed", items: 5, color: "bg-green-500" },
    { name: "Development", status: "in-progress", items: 8, color: "bg-blue-500" },
    { name: "Testing", status: "pending", items: 3, color: "bg-yellow-500" },
    { name: "Deployment", status: "pending", items: 2, color: "bg-gray-400" },
  ]

  const recentActivities = [
    { action: "Task completed", project: "Website Redesign", time: "2 hours ago", type: "success" },
    { action: "Review requested", project: "Mobile App", time: "4 hours ago", type: "warning" },
    { action: "Stage advanced", project: "API Integration", time: "1 day ago", type: "info" },
    { action: "Deadline approaching", project: "Dashboard", time: "2 days ago", type: "alert" },
  ]

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
              <h1 className="text-2xl font-bold">Lifecycle</h1>
              <p className="text-muted-foreground">
                Track project stages and workflow progress
              </p>
            </div>
          </div>

          {/* Pipeline Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconListDetails className="h-5 w-5" />
                Pipeline Overview
              </CardTitle>
              <CardDescription>
                Current status of your project lifecycle stages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {stages.map((stage, i) => (
                  <div key={stage.name} className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 flex-1 rounded-full ${stage.color}`} />
                      {i < stages.length - 1 && <div className="w-4 h-0.5 bg-muted" />}
                    </div>
                    <div className="mt-2">
                      <p className="font-medium text-sm">{stage.name}</p>
                      <p className="text-xs text-muted-foreground">{stage.items} items</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stage Details */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stages.map((stage) => (
              <Card key={stage.name}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    {stage.name}
                    <Badge variant={stage.status === "completed" ? "default" : stage.status === "in-progress" ? "secondary" : "outline"}>
                      {stage.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stage.items}</p>
                  <p className="text-sm text-muted-foreground">Total items</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates across your projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      activity.type === "success" ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" :
                      activity.type === "warning" ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" :
                      activity.type === "alert" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                      "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}>
                      {activity.type === "success" ? <IconCircleCheck className="h-4 w-4" /> :
                       activity.type === "alert" ? <IconAlertCircle className="h-4 w-4" /> :
                       <IconClock className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.project}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{activity.time}</p>
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

