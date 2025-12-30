import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import Swal from "sweetalert2"
import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

import data from "./data.json"

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Section Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="@container/card">
            <CardHeader className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-8 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Data Table Skeleton */}
      <div className="px-4 lg:px-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
          <div className="rounded-lg border">
            <div className="border-b p-4">
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-4 w-24" />
                ))}
              </div>
            </div>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
              <div key={row} className="border-b p-4 last:border-0">
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map((col) => (
                    <Skeleton key={col} className="h-4 w-24" />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()

  // Show success popup if navigated with success state
  useEffect(() => {
    const state = location.state as { showSuccess?: boolean; isSignup?: boolean } | null
    if (state?.showSuccess) {
      // Clear the state to prevent showing popup on refresh
      navigate(location.pathname, { replace: true, state: {} })

      Swal.fire({
        icon: "success",
        title: state.isSignup ? "Account Created!" : "Login Successful!",
        text: state.isSignup
          ? "Your account has been created successfully. Welcome aboard!"
          : "Welcome back! You have been logged in successfully.",
        confirmButtonText: "Continue",
        confirmButtonColor: "#171717",
        background: document.documentElement.classList.contains("dark") ? "#171717" : "#ffffff",
        color: document.documentElement.classList.contains("dark") ? "#ffffff" : "#171717",
      })
    }
  }, [location.state, navigate, location.pathname])

  useEffect(() => {
    // Simulate loading delay of 2.5 seconds
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {isLoading ? (
              <DashboardSkeleton />
            ) : (
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <SectionCards />
                <div className="px-4 lg:px-6">
                  <ChartAreaInteractive />
                </div>
                <DataTable data={data} />
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

