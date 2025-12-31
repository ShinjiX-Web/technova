import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconUsers, IconUserPlus, IconDotsVertical, IconEdit, IconTrash, IconSend, IconClock } from "@tabler/icons-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import Swal from "sweetalert2"

// Team member type
interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  position: string
  avatar_url: string | null
  status: "Active" | "Away" | "Offline" | "Pending"
  owner_id: string
  user_id?: string | null
  created_at: string
}

// Available roles and positions
const ROLES = ["Admin", "Manager", "Developer", "Designer", "Analyst", "Member"]
const POSITIONS = ["CEO", "CTO", "CFO", "Team Lead", "Senior Developer", "Junior Developer", "UI/UX Designer", "Product Manager", "Data Analyst", "Intern", "Contractor", ""]

export default function TeamPage() {
  const { user } = useAuth()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [pendingInvites, setPendingInvites] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form state for invite
  const [inviteForm, setInviteForm] = useState({ email: "", name: "", role: "Member", position: "" })

  // Form state for edit
  const [editForm, setEditForm] = useState({ name: "", role: "Member", position: "" })

  // Dark mode detection for SweetAlert
  const isDark = document.documentElement.classList.contains("dark")
  const getSwalTheme = () => ({ background: isDark ? "#171717" : "#ffffff", color: isDark ? "#ffffff" : "#171717" })

  // Check if user is a team owner or a member of someone else's team
  const [isTeamOwner, setIsTeamOwner] = useState(true)
  const [teamOwnerInfo, setTeamOwnerInfo] = useState<{ id: string; name: string } | null>(null)

  // Fetch team members
  const fetchTeamMembers = async () => {
    if (!user) return
    console.log("Fetching team members for user:", user.id, user.email)
    try {
      // First check if user owns a team (has invited others)
      const { data: ownedTeam, error: ownedError } = await supabase
        .from("team_members")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })

      console.log("Owned team query result:", { ownedTeam, ownedError })

      if (ownedError) {
        console.error("Owned team query error details:", JSON.stringify(ownedError, null, 2))
        throw ownedError
      }

      // Check if user is a member of someone else's team (by user_id OR by email)
      let memberOf = null

      // First try by user_id (user_id is TEXT type)
      const { data: memberById } = await supabase
        .from("team_members")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (memberById) {
        memberOf = memberById
      } else if (user.email) {
        // Try by email if user_id not found
        // Get all team members with this email (could be multiple teams)
        const { data: membersByEmail } = await supabase
          .from("team_members")
          .select("*")
          .eq("email", user.email.toLowerCase())

        // Filter to find one where this user is NOT the owner
        // We compare owner_id strings in JS to avoid UUID type issues
        const memberByEmail = membersByEmail?.find(m => {
          // Check if any of the owned team entries have this member
          const isOwnTeam = ownedTeam?.some(owned => owned.id === m.id)
          return !isOwnTeam
        })

        if (memberByEmail) {
          memberOf = memberByEmail
          // Update the user_id and sync name/avatar from their actual profile
          const actualName = user.name || memberByEmail.name
          const actualAvatar = user.avatar || memberByEmail.avatar_url
          await supabase
            .from("team_members")
            .update({
              user_id: user.id,
              status: "Active",
              name: actualName, // Sync with their Google/Firebase name
              avatar_url: actualAvatar // Sync avatar from their profile
            })
            .eq("id", memberByEmail.id)

          // Update memberOf with the synced data for immediate display
          memberOf = { ...memberByEmail, name: actualName, avatar_url: actualAvatar, status: "Active" }
        }
      }

      if (memberOf) {
        // User is a member of another team - show that team
        setIsTeamOwner(false)

        // Get the team owner's full profile
        const { data: ownerProfile } = await supabase
          .from("profiles")
          .select("id, name, email, avatar_url")
          .eq("id", memberOf.owner_id)
          .single()

        setTeamOwnerInfo(ownerProfile)

        // Get all members of that team
        const { data: teamData, error: teamError } = await supabase
          .from("team_members")
          .select("*")
          .eq("owner_id", memberOf.owner_id)
          .order("created_at", { ascending: false })

        if (teamError) throw teamError

        // Create owner entry to show in the team list (for members viewing)
        const ownerEntry: TeamMember = {
          id: `owner-${memberOf.owner_id}`,
          name: ownerProfile?.name || "Team Owner",
          email: ownerProfile?.email || "",
          role: "Admin",
          position: "Team Owner",
          avatar_url: ownerProfile?.avatar_url || null,
          status: "Active",
          owner_id: memberOf.owner_id,
          user_id: memberOf.owner_id,
          created_at: new Date().toISOString(),
        }

        const active = teamData?.filter((m) => m.status !== "Pending") || []
        const pending = teamData?.filter((m) => m.status === "Pending") || []
        // Add owner at the beginning of the list
        setTeamMembers([ownerEntry, ...active])
        setPendingInvites(pending)
      } else {
        // User owns their own team
        setIsTeamOwner(true)
        setTeamOwnerInfo(null)

        // Create owner entry to show in the team list
        const ownerEntry: TeamMember = {
          id: `owner-${user.id}`,
          name: user.name,
          email: user.email,
          role: "Admin",
          position: "Team Owner",
          avatar_url: user.avatar || null,
          status: "Active",
          owner_id: user.id,
          user_id: user.id,
          created_at: new Date().toISOString(),
        }

        const active = ownedTeam?.filter((m) => m.status !== "Pending") || []
        const pending = ownedTeam?.filter((m) => m.status === "Pending") || []
        // Add owner at the beginning of the list
        setTeamMembers([ownerEntry, ...active])
        setPendingInvites(pending)
      }
    } catch (error) {
      console.error("Error fetching team members:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTeamMembers()
  }, [user])

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-500"
      case "Away": return "bg-yellow-500"
      case "Pending": return "bg-blue-500"
      default: return "bg-gray-400"
    }
  }

  // Handle invite member
  const handleInvite = async () => {
    if (!inviteForm.email || !inviteForm.name) {
      Swal.fire({ icon: "error", title: "Missing Information", text: "Please fill in name and email", ...getSwalTheme() })
      return
    }
    setIsSaving(true)
    try {
      // Create team member record
      console.log("Inserting team member with owner_id:", user?.id)
      const { data: insertData, error: insertError } = await supabase
        .from("team_members")
        .insert({ owner_id: user?.id, name: inviteForm.name, email: inviteForm.email.toLowerCase(), role: inviteForm.role, position: inviteForm.position, status: "Pending" })
        .select()

      console.log("Insert result:", { insertData, insertError })

      if (insertError) throw insertError

      // Send invitation email with timeout
      let emailSent = false
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

        const emailRes = await fetch("/api/team/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: inviteForm.email, inviterName: user?.name, teamName: "TechNova", role: inviteForm.role }),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
        emailSent = emailRes.ok
      } catch (emailError) {
        console.error("Failed to send invite email:", emailError)
      }

      if (emailSent) {
        Swal.fire({ icon: "success", title: "Invitation Sent!", text: `Invitation sent to ${inviteForm.email}`, timer: 2000, showConfirmButton: false, ...getSwalTheme() })
      } else {
        Swal.fire({ icon: "success", title: "Member Added!", text: `${inviteForm.name} added to team. Email invitation requires domain verification in Resend.`, timer: 3000, showConfirmButton: false, ...getSwalTheme() })
      }
      setIsInviteOpen(false)
      setInviteForm({ email: "", name: "", role: "Member", position: "" })
      fetchTeamMembers()
    } catch (error) {
      console.error("Error inviting member:", error)
      Swal.fire({ icon: "error", title: "Error", text: "Failed to add team member", ...getSwalTheme() })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle edit member
  const handleEdit = async () => {
    if (!selectedMember || !editForm.name) return
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("team_members")
        .update({ name: editForm.name, role: editForm.role, position: editForm.position })
        .eq("id", selectedMember.id)

      if (error) throw error

      Swal.fire({ icon: "success", title: "Updated!", text: "Team member updated successfully", timer: 2000, showConfirmButton: false, ...getSwalTheme() })
      setIsEditOpen(false)
      setSelectedMember(null)
      fetchTeamMembers()
    } catch (error) {
      console.error("Error updating member:", error)
      Swal.fire({ icon: "error", title: "Error", text: "Failed to update team member", ...getSwalTheme() })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle delete member
  const handleDelete = async (member: TeamMember) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Remove Team Member?",
      text: `Are you sure you want to remove ${member.name} from the team?`,
      showCancelButton: true,
      confirmButtonText: "Yes, remove",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      ...getSwalTheme(),
    })

    if (result.isConfirmed) {
      try {
        const { error } = await supabase.from("team_members").delete().eq("id", member.id)
        if (error) throw error
        Swal.fire({ icon: "success", title: "Removed!", text: `${member.name} has been removed from the team`, timer: 2000, showConfirmButton: false, ...getSwalTheme() })
        fetchTeamMembers()
      } catch (error) {
        console.error("Error deleting member:", error)
        Swal.fire({ icon: "error", title: "Error", text: "Failed to remove team member", ...getSwalTheme() })
      }
    }
  }

  // Handle resend invite
  const handleResendInvite = async (member: TeamMember) => {
    try {
      await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: member.email, inviterName: user?.name, teamName: "TechNova", role: member.role }),
      })
      Swal.fire({ icon: "success", title: "Invitation Resent!", text: `Invitation resent to ${member.email}`, timer: 2000, showConfirmButton: false, ...getSwalTheme() })
    } catch (error) {
      console.error("Error resending invite:", error)
      Swal.fire({ icon: "error", title: "Error", text: "Failed to resend invitation", ...getSwalTheme() })
    }
  }

  // Open edit dialog
  const openEditDialog = (member: TeamMember) => {
    setSelectedMember(member)
    setEditForm({ name: member.name, role: member.role, position: member.position || "" })
    setIsEditOpen(true)
  }

  // Render member card
  const renderMemberCard = (member: TeamMember, isPending = false) => (
    <div key={member.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarImage src={member.avatar_url || ""} />
          <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
        </Avatar>
        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(member.status)}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium">{member.name}</p>
          {isPending && <Badge variant="outline" className="text-xs">Pending</Badge>}
          {member.user_id === user?.id && <Badge variant="outline" className="text-xs bg-primary/10">You</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">{member.email}</p>
        {member.position && <p className="text-xs text-muted-foreground">{member.position}</p>}
      </div>
      <Badge variant={member.role === "Admin" ? "destructive" : member.role === "Manager" ? "default" : "secondary"}>{member.role}</Badge>
      {/* Don't show edit/delete for the owner's own entry */}
      {isTeamOwner && member.id !== `owner-${user?.id}` && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><IconDotsVertical className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEditDialog(member)}><IconEdit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
            {isPending && (
              <DropdownMenuItem onClick={() => handleResendInvite(member)}><IconSend className="mr-2 h-4 w-4" />Resend Invite</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleDelete(member)} className="text-destructive"><IconTrash className="mr-2 h-4 w-4" />Remove</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )

  return (
    <SidebarProvider style={{ "--sidebar-width": "calc(var(--spacing) * 72)", "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Team</h1>
              <p className="text-muted-foreground">
                {isTeamOwner
                  ? "Manage your team members and their roles"
                  : `You are a member of ${teamOwnerInfo?.name || "a team"}'s organization`}
              </p>
            </div>
            {isTeamOwner && (
              <Button onClick={() => setIsInviteOpen(true)}>
                <IconUserPlus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            )}
          </div>

          {/* Team Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Members</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{teamMembers.length}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active Now</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{teamMembers.filter((m) => m.status === "Active").length}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pending Invites</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{pendingInvites.length}</div></CardContent>
            </Card>
          </div>

          {/* Pending Invites */}
          {pendingInvites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><IconClock className="h-5 w-5" />Pending Invitations</CardTitle>
                <CardDescription>Invitations waiting for response</CardDescription>
              </CardHeader>
              <CardContent><div className="space-y-4">{pendingInvites.map((member) => renderMemberCard(member, true))}</div></CardContent>
            </Card>
          )}

          {/* Team Members List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><IconUsers className="h-5 w-5" />Team Members</CardTitle>
              <CardDescription>All active members in your organization</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading team members...</div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <IconUsers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No team members yet</p>
                  <p className="text-sm">Invite your first team member to get started</p>
                </div>
              ) : (
                <div className="space-y-4">{teamMembers.map((member) => renderMemberCard(member))}</div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>

      {/* Invite Member Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>Send an invitation to join your team</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-name">Name</Label>
              <Input id="invite-name" placeholder="John Doe" value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input id="invite-email" type="email" placeholder="john@example.com" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={inviteForm.role} onValueChange={(value) => setInviteForm({ ...inviteForm, role: value })}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>{ROLES.map((role) => (<SelectItem key={role} value={role}>{role}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-position">Position (Optional)</Label>
              <Select value={inviteForm.position} onValueChange={(value) => setInviteForm({ ...inviteForm, position: value })}>
                <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                <SelectContent>{POSITIONS.filter(p => p).map((pos) => (<SelectItem key={pos} value={pos}>{pos}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={isSaving}>{isSaving ? "Sending..." : "Send Invitation"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>Update team member information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>{ROLES.map((role) => (<SelectItem key={role} value={role}>{role}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-position">Position</Label>
              <Select value={editForm.position} onValueChange={(value) => setEditForm({ ...editForm, position: value })}>
                <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                <SelectContent>{POSITIONS.filter(p => p).map((pos) => (<SelectItem key={pos} value={pos}>{pos}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={isSaving}>{isSaving ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
