import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { IconChartBar, IconTrendingUp, IconUsers, IconEye, IconClock } from "@tabler/icons-react"

export default function AnalyticsPage() {
  const stats = [
    { label: "Total Views", value: "45,231", change: "+20.1%", icon: IconEye },
    { label: "Active Users", value: "2,350", change: "+15.3%", icon: IconUsers },
    { label: "Avg. Session", value: "4m 32s", change: "+8.2%", icon: IconClock },
    { label: "Bounce Rate", value: "32.5%", change: "-4.1%", icon: IconTrendingUp },
  ]

  const topPages = [
    { page: "/dashboard", views: 12453, unique: 8234 },
    { page: "/projects", views: 8921, unique: 6123 },
    { page: "/analytics", views: 7234, unique: 5421 },
    { page: "/team", views: 5123, unique: 4012 },
    { page: "/settings", views: 3421, unique: 2834 },
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
              <h1 className="text-2xl font-bold">Analytics</h1>
              <p className="text-muted-foreground">
                Monitor your application performance and user engagement
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className={`text-xs ${stat.change.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {stat.change} from last month
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconChartBar className="h-5 w-5" />
                Traffic Overview
              </CardTitle>
              <CardDescription>
                Page views and user sessions over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border rounded-lg bg-muted/30">
                <div className="text-center text-muted-foreground">
                  <IconChartBar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Analytics chart will be displayed here</p>
                  <p className="text-sm">Connect your data source to see real metrics</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Pages */}
          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
              <CardDescription>Most visited pages in your application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 text-sm font-medium text-muted-foreground pb-2 border-b">
                  <span>Page</span>
                  <span className="text-right">Views</span>
                  <span className="text-right">Unique Visitors</span>
                </div>
                {topPages.map((page) => (
                  <div key={page.page} className="grid grid-cols-3 text-sm">
                    <span className="font-mono">{page.page}</span>
                    <span className="text-right">{page.views.toLocaleString()}</span>
                    <span className="text-right text-muted-foreground">{page.unique.toLocaleString()}</span>
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

