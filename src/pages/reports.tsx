import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  IconReport,
  IconPlus,
  IconDownload,
  IconCalendar,
  IconChartBar,
  IconFileAnalytics,
  IconClock,
  IconDotsVertical,
  IconEye,
  IconTrash,
} from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Report {
  id: string
  name: string
  type: "analytics" | "financial" | "performance" | "custom"
  status: "ready" | "generating" | "scheduled"
  lastRun: string
  nextRun?: string
}

export default function ReportsPage() {
  const [reports] = useState<Report[]>([
    { id: "1", name: "Monthly Performance Report", type: "performance", status: "ready", lastRun: "2024-01-15 09:00" },
    { id: "2", name: "Q4 Financial Summary", type: "financial", status: "ready", lastRun: "2024-01-14 14:30" },
    { id: "3", name: "User Analytics Dashboard", type: "analytics", status: "generating", lastRun: "2024-01-13 10:00" },
    { id: "4", name: "Weekly Team Metrics", type: "performance", status: "scheduled", lastRun: "2024-01-12 08:00", nextRun: "2024-01-19 08:00" },
    { id: "5", name: "Custom Sales Report", type: "custom", status: "ready", lastRun: "2024-01-11 16:45" },
    { id: "6", name: "Website Traffic Analysis", type: "analytics", status: "ready", lastRun: "2024-01-10 11:30" },
  ])

  const getTypeIcon = (type: Report["type"]) => {
    switch (type) {
      case "analytics": return <IconChartBar className="h-5 w-5 text-blue-500" />
      case "financial": return <IconFileAnalytics className="h-5 w-5 text-green-500" />
      case "performance": return <IconReport className="h-5 w-5 text-purple-500" />
      case "custom": return <IconReport className="h-5 w-5 text-amber-500" />
    }
  }

  const getStatusBadge = (status: Report["status"]) => {
    switch (status) {
      case "ready": return <Badge className="bg-green-500/20 text-green-600 dark:text-green-400">Ready</Badge>
      case "generating": return <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400">Generating...</Badge>
      case "scheduled": return <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400">Scheduled</Badge>
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
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <IconReport className="h-6 w-6" />
                Reports
              </h1>
              <p className="text-muted-foreground">
                Generate, view, and schedule automated reports
              </p>
            </div>
            <Button>
              <IconPlus className="h-4 w-4 mr-2" />
              Create Report
            </Button>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reports.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ready to View</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reports.filter(r => r.status === "ready").length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reports.filter(r => r.status === "scheduled").length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Reports List */}
          <Card>
            <CardHeader>
              <CardTitle>All Reports</CardTitle>
              <CardDescription>Manage your generated and scheduled reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reports.map((report) => (
                  <div key={report.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 group">
                    {getTypeIcon(report.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{report.name}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <IconClock className="h-3 w-3" />
                        Last run: {report.lastRun}
                        {report.nextRun && (
                          <><IconCalendar className="h-3 w-3 ml-2" />Next: {report.nextRun}</>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(report.status)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                          <IconDotsVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><IconEye className="h-4 w-4 mr-2" />View</DropdownMenuItem>
                        <DropdownMenuItem><IconDownload className="h-4 w-4 mr-2" />Download</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500"><IconTrash className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

