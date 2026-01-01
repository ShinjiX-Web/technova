import * as React from "react"
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import Swal from "sweetalert2"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { TeamChat } from "@/components/team-chat"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Lifecycle",
      url: "/lifecycle",
      icon: IconListDetails,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: IconChartBar,
    },
    {
      title: "Projects",
      url: "/projects",
      icon: IconFolder,
    },
    {
      title: "Team",
      url: "/team",
      icon: IconUsers,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "Reports",
      url: "#",
      icon: IconReport,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: IconFileWord,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Track dark mode for theme-aware logo
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  )

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"))
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  const handleLogout = async () => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Log Out?",
      text: "Are you sure you want to log out?",
      showCancelButton: true,
      confirmButtonText: "Yes, log out",
      cancelButtonText: "No, stay",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#171717",
      background: isDark ? "#171717" : "#ffffff",
      color: isDark ? "#ffffff" : "#171717",
    })

    if (result.isConfirmed) {
      // Navigate first, then logout to prevent ProtectedRoute from redirecting to /login
      navigate("/")
      logout()

      await Swal.fire({
        icon: "success",
        title: "Logged Out!",
        text: "You have been successfully logged out. See you next time!",
        confirmButtonText: "OK",
        confirmButtonColor: "#171717",
        background: isDark ? "#171717" : "#ffffff",
        color: isDark ? "#ffffff" : "#171717",
      })
    }
  }

  // Use authenticated user data or fallback to demo data
  const userData = user
    ? {
        name: user.name,
        email: user.email,
        avatar: user.avatar || "/avatars/shadcn.jpg",
      }
    : {
        name: "Guest",
        email: "guest@example.com",
        avatar: "/avatars/shadcn.jpg",
      }

  // Team chat state
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [teamMembers, setTeamMembers] = useState<Array<{
    id: string
    name: string
    email: string
    avatar_url: string | null
    status: string
    user_id?: string | null
    last_seen?: string | null
  }>>([])
  const [teamOwnerId, setTeamOwnerId] = useState<string | null>(null)

  // Fetch team members for chat
  useEffect(() => {
    if (!user) return

    const fetchTeam = async () => {
      // Check if user is part of a team (as owner or member)
      const { data: ownedTeam } = await supabase
        .from("team_members")
        .select("*")
        .eq("owner_id", user.id)
        .limit(10)

      if (ownedTeam && ownedTeam.length > 0) {
        setTeamOwnerId(user.id)
        setTeamMembers(ownedTeam.filter(m => m.status !== "Pending"))
        return
      }

      // Check if member of another team
      const { data: memberOf } = await supabase
        .from("team_members")
        .select("*")
        .eq("user_id", user.id)
        .limit(1)

      if (memberOf && memberOf.length > 0) {
        const ownerId = memberOf[0].owner_id
        setTeamOwnerId(ownerId)

        const { data: teamData } = await supabase
          .from("team_members")
          .select("*")
          .eq("owner_id", ownerId)
          .limit(10)

        if (teamData) {
          setTeamMembers(teamData.filter(m => m.status !== "Pending"))
        }
      }
    }

    fetchTeam()
  }, [user])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link to="/dashboard" className="flex items-center gap-3">
                <span className="text-xl font-bold">Technova</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />

        {/* Team Chat Section */}
        {teamMembers.length > 0 && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel>Team</SidebarGroupLabel>
            <SidebarGroupContent className="px-2">
              <TeamChat
                teamMembers={teamMembers}
                ownerId={teamOwnerId}
                isOpen={isChatOpen}
                onToggle={() => setIsChatOpen(!isChatOpen)}
              />
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} onLogout={handleLogout} />
      </SidebarFooter>
    </Sidebar>
  )
}
