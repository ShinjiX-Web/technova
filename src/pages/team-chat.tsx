import { useState, useEffect, useRef } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
  IconMessageCircle,
  IconSend,
  IconSettings,
  IconTrash,
  IconBan,
  IconUpload,
  IconPalette,
  IconUser,
  IconCircleCheck,
  IconDotsVertical,
  IconFile,
  IconDownload,
} from "@tabler/icons-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import Swal from "sweetalert2"

// Chat background themes
const CHAT_THEMES = [
  { id: "default", name: "Default", class: "" },
  { id: "gradient-blue", name: "Blue Gradient", class: "bg-gradient-to-br from-blue-500/10 to-purple-500/10" },
  { id: "gradient-green", name: "Green Gradient", class: "bg-gradient-to-br from-green-500/10 to-teal-500/10" },
  { id: "gradient-orange", name: "Sunset", class: "bg-gradient-to-br from-orange-500/10 to-pink-500/10" },
  { id: "gradient-dark", name: "Dark Mode", class: "bg-neutral-900/50" },
  { id: "pattern-dots", name: "Dots Pattern", class: "bg-[radial-gradient(circle,_rgba(255,255,255,0.1)_1px,_transparent_1px)] bg-[size:20px_20px]" },
]

// Status options
const STATUS_OPTIONS = [
  { value: "Available", label: "Available", color: "bg-green-500" },
  { value: "Busy", label: "Busy", color: "bg-red-500" },
  { value: "Away", label: "Away", color: "bg-amber-500" },
  { value: "Do not disturb", label: "Do not disturb", color: "bg-red-600" },
  { value: "Offline", label: "Appear offline", color: "bg-gray-400" },
]

interface TeamMember {
  id: string
  name: string
  email: string
  avatar_url: string | null
  status: string
  last_seen?: string | null
  user_id?: string | null
  is_chat_blocked?: boolean
  chat_nickname?: string | null
}

interface ChatMessage {
  id: string
  owner_id: string
  sender_id: string
  sender_name: string
  sender_email: string
  sender_avatar: string | null
  message: string
  created_at: string
  file_url?: string | null
  file_name?: string | null
  file_type?: string | null
}

interface ChatSettings {
  user_id: string
  chat_theme: string
  nickname: string | null
  status: string | null
}

// Notification sound - using a base64 encoded short beep sound
const NOTIFICATION_SOUND = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleBoRHoTG7umUUDs8oNnlv3kdAB5+xt/fkz0yPKbV5b5zFQAmdMvf4pRAPDmj0+S8cBIAL3zL3N+QPTI7pNTkvHASAC98y9zfkD0yO6TU5LxwEgAvfMvc35A9MjwR"

export default function TeamChatPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [ownerId, setOwnerId] = useState<string | null>(null)
  const [isTeamOwner, setIsTeamOwner] = useState(false)
  const [chatSettings, setChatSettings] = useState<ChatSettings | null>(null)
  const [isNicknameOpen, setIsNicknameOpen] = useState(false)
  const [nicknameInput, setNicknameInput] = useState("")
  const [selectedTheme, setSelectedTheme] = useState("default")
  const [selectedStatus, setSelectedStatus] = useState("Available")
  const [isBlocked, setIsBlocked] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Dark mode for Swal
  const isDark = document.documentElement.classList.contains("dark")
  const getSwalTheme = () => ({ background: isDark ? "#171717" : "#ffffff", color: isDark ? "#ffffff" : "#171717" })

  // Initialize audio for notifications
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND)
    audioRef.current.volume = 0.5
  }, [])

  // Play notification sound
  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {
        // Ignore errors (e.g., if user hasn't interacted with page yet)
      })
    }
  }

  // Determine the owner_id (team owner's ID for chat room)
  useEffect(() => {
    const determineOwnerId = async () => {
      if (!user) return

      // Check if user is a member of another team
      const { data: memberOf } = await supabase
        .from("team_members")
        .select("owner_id, is_chat_blocked")
        .eq("user_id", user.id)
        .eq("status", "Active")
        .limit(1)

      if (memberOf && memberOf.length > 0) {
        // User is a member - use the team owner's ID
        setOwnerId(memberOf[0].owner_id)
        setIsTeamOwner(false)
        setIsBlocked(memberOf[0].is_chat_blocked || false)
      } else {
        // User is the owner
        setOwnerId(user.id)
        setIsTeamOwner(true)
        setIsBlocked(false)
      }
    }

    determineOwnerId()
  }, [user])

  // Fetch chat settings
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return

      const { data } = await supabase
        .from("chat_settings")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (data) {
        setChatSettings(data)
        setSelectedTheme(data.chat_theme || "default")
        setNicknameInput(data.nickname || "")
        setSelectedStatus(data.status || "Available")
      }
    }

    fetchSettings()
  }, [user])

  // Fetch team members - remove status filter to show all members
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!ownerId) return

      const { data } = await supabase
        .from("team_members")
        .select("id, name, email, avatar_url, status, last_seen, user_id, is_chat_blocked, chat_nickname")
        .eq("owner_id", ownerId)
        // Removed .eq("status", "Active") to show all members regardless of status

      if (data) {
        setTeamMembers(data)
      }
    }

    fetchTeamMembers()
  }, [ownerId])

  // Fetch messages
  const fetchMessages = async () => {
    if (!ownerId) return

    const { data, error } = await supabase
      .from("team_messages")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: true })
      .limit(100)

    if (!error && data) {
      setMessages(data)
    }
  }

  // Subscribe to realtime messages
  useEffect(() => {
    if (!ownerId || !user) return

    fetchMessages()

    const channel = supabase
      .channel(`team-chat-page-${ownerId}-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "team_messages", filter: `owner_id=eq.${ownerId}` },
        (payload) => {
          const newMsg = payload.new as ChatMessage
          setMessages((prev) => {
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          // Play notification sound for messages from others
          if (newMsg.sender_id !== user.id) {
            playNotificationSound()
          }
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [ownerId, user])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Get display name (nickname or real name)
  const getDisplayName = (senderId: string, senderName: string) => {
    if (senderId === user?.id && chatSettings?.nickname) {
      return chatSettings.nickname
    }
    const member = teamMembers.find(m => m.user_id === senderId)
    return member?.chat_nickname || senderName
  }

  // Send message
  const sendMessage = async (fileUrl?: string, fileName?: string, fileType?: string) => {
    if ((!newMessage.trim() && !fileUrl) || !user || !ownerId || isBlocked) return

    setIsLoading(true)
    const messageText = newMessage.trim()
    const displayName = chatSettings?.nickname || user.name || user.email?.split("@")[0] || "User"

    try {
      const { data, error } = await supabase.from("team_messages").insert({
        owner_id: ownerId,
        sender_id: user.id,
        sender_name: displayName,
        sender_email: user.email || "",
        sender_avatar: user.avatar || null,
        message: messageText || (fileName ? `Shared a file: ${fileName}` : ""),
        file_url: fileUrl || null,
        file_name: fileName || null,
        file_type: fileType || null,
      }).select().single()

      if (!error && data) {
        setMessages((prev) => [...prev, data])
      }

      setNewMessage("")
      inputRef.current?.focus()
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user || !ownerId) return

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({ icon: "error", title: "File too large", text: "Maximum file size is 10MB", ...getSwalTheme() })
      return
    }

    setIsLoading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${ownerId}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from("chat-files")
        .upload(fileName, file)

      if (uploadError) {
        throw uploadError
      }

      const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(fileName)

      await sendMessage(urlData.publicUrl, file.name, file.type)
    } catch (error) {
      console.error("Error uploading file:", error)
      Swal.fire({ icon: "error", title: "Upload failed", text: "Could not upload file", ...getSwalTheme() })
    } finally {
      setIsLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // Admin: Clear all chat messages
  const clearChat = async () => {
    if (!isTeamOwner || !ownerId) return

    const result = await Swal.fire({
      title: "Clear All Messages?",
      text: "This will permanently delete all chat messages. This cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, clear all",
      ...getSwalTheme(),
    })

    if (result.isConfirmed) {
      const { error } = await supabase
        .from("team_messages")
        .delete()
        .eq("owner_id", ownerId)

      if (!error) {
        setMessages([])
        Swal.fire({ icon: "success", title: "Chat cleared", timer: 1500, showConfirmButton: false, ...getSwalTheme() })
      }
    }
  }

  // Admin: Toggle user block status
  const toggleBlockUser = async (member: TeamMember) => {
    if (!isTeamOwner) return

    const newBlockedStatus = !member.is_chat_blocked
    const action = newBlockedStatus ? "block" : "unblock"

    const result = await Swal.fire({
      title: `${newBlockedStatus ? "Block" : "Unblock"} ${member.name}?`,
      text: newBlockedStatus
        ? "This user will not be able to send messages in the chat."
        : "This user will be able to send messages again.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${action}`,
      ...getSwalTheme(),
    })

    if (result.isConfirmed) {
      const { error } = await supabase
        .from("team_members")
        .update({ is_chat_blocked: newBlockedStatus })
        .eq("id", member.id)

      if (!error) {
        setTeamMembers(prev => prev.map(m =>
          m.id === member.id ? { ...m, is_chat_blocked: newBlockedStatus } : m
        ))
        Swal.fire({ icon: "success", title: `User ${action}ed`, timer: 1500, showConfirmButton: false, ...getSwalTheme() })
      }
    }
  }

  // Save nickname
  const saveNickname = async () => {
    if (!user) return

    const { error } = await supabase.from("chat_settings").upsert({
      user_id: user.id,
      nickname: nicknameInput.trim() || null,
      chat_theme: selectedTheme,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" })

    if (!error) {
      setChatSettings(prev => ({ ...prev!, nickname: nicknameInput.trim() || null }))
      setIsNicknameOpen(false)
      Swal.fire({ icon: "success", title: "Nickname saved", timer: 1500, showConfirmButton: false, ...getSwalTheme() })
    }
  }

  // Save theme
  const saveTheme = async (themeId: string) => {
    if (!user) return

    setSelectedTheme(themeId)
    const { error } = await supabase.from("chat_settings").upsert({
      user_id: user.id,
      chat_theme: themeId,
      nickname: chatSettings?.nickname || null,
      status: selectedStatus,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" })

    if (!error) {
      setChatSettings(prev => prev ? { ...prev, chat_theme: themeId } : { user_id: user.id, chat_theme: themeId, nickname: null, status: selectedStatus })
    }
  }

  // Update availability status
  const updateStatus = async (status: string) => {
    if (!user) return

    setSelectedStatus(status)

    // Save status to chat_settings for persistence
    const { error } = await supabase.from("chat_settings").upsert({
      user_id: user.id,
      chat_theme: selectedTheme,
      nickname: chatSettings?.nickname || null,
      status: status,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" })

    if (!error) {
      setChatSettings(prev => prev ? { ...prev, status } : { user_id: user.id, chat_theme: selectedTheme, nickname: null, status })
    }

    // Update in team_members if user is a member
    await supabase
      .from("team_members")
      .update({ status: status === "Available" ? "Active" : status, last_seen: new Date().toISOString() })
      .eq("user_id", user.id)

    // Update in profiles
    await supabase
      .from("profiles")
      .update({ last_seen: new Date().toISOString() })
      .eq("id", user.id)

    Swal.fire({ icon: "success", title: `Status: ${status}`, timer: 1500, showConfirmButton: false, ...getSwalTheme() })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Check online status based on last_seen
  const isOnline = (member: TeamMember) => {
    if (!member.last_seen) return false
    const lastSeen = new Date(member.last_seen).getTime()
    return Date.now() - lastSeen < 2 * 60 * 1000 // 2 minutes
  }

  // Get current theme class
  const currentTheme = CHAT_THEMES.find(t => t.id === selectedTheme) || CHAT_THEMES[0]

  // Check if file is an image
  const isImage = (fileType?: string | null) => fileType?.startsWith("image/")

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
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 max-h-[calc(100vh-var(--header-height))] overflow-hidden">
          <div className="flex items-center justify-between flex-shrink-0">
            <div>
              <h1 className="text-2xl font-bold">Team Chat</h1>
              <p className="text-muted-foreground">
                Chat with your team members in real-time
              </p>
            </div>
            {/* Settings Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <IconSettings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setIsNicknameOpen(true)}>
                  <IconUser className="mr-2 h-4 w-4" />
                  Set Nickname
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-sm font-semibold">Status</div>
                {STATUS_OPTIONS.map((status) => (
                  <DropdownMenuItem key={status.value} onClick={() => updateStatus(status.value)}>
                    <div className={`mr-2 h-3 w-3 rounded-full ${status.color}`} />
                    {status.label}
                    {selectedStatus === status.value && <IconCircleCheck className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-sm font-semibold">Theme</div>
                {CHAT_THEMES.map((theme) => (
                  <DropdownMenuItem key={theme.id} onClick={() => saveTheme(theme.id)}>
                    <IconPalette className="mr-2 h-4 w-4" />
                    {theme.name}
                    {selectedTheme === theme.id && <IconCircleCheck className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                ))}
                {isTeamOwner && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5 text-sm font-semibold text-red-500">Admin</div>
                    <DropdownMenuItem onClick={clearChat} className="text-red-500">
                      <IconTrash className="mr-2 h-4 w-4" />
                      Clear All Messages
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
            {/* Team Members Sidebar */}
            <Card className="lg:col-span-1 flex flex-col max-h-full">
              <CardHeader className="pb-3 flex-shrink-0">
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                <CardDescription>{teamMembers.length + 1} members</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 overflow-y-auto flex-1">
                {/* Show current user first */}
                {user && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10">
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar || undefined} />
                        <AvatarFallback className="text-xs">{getInitials(user.name || "You")}</AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${STATUS_OPTIONS.find(s => s.value === selectedStatus)?.color || "bg-green-500"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {chatSettings?.nickname || user.name || "You"} (You)
                      </p>
                      {isTeamOwner && <Badge variant="secondary" className="text-xs mt-0.5">Admin</Badge>}
                    </div>
                  </div>
                )}
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 group">
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">{getInitials(member.name)}</AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${isOnline(member) ? "bg-green-500" : "bg-gray-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.chat_nickname || member.name}
                        {member.is_chat_blocked && <Badge variant="destructive" className="ml-1 text-xs">Blocked</Badge>}
                      </p>
                    </div>
                    {isTeamOwner && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                            <IconDotsVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toggleBlockUser(member)}>
                            <IconBan className="mr-2 h-4 w-4" />
                            {member.is_chat_blocked ? "Unblock from Chat" : "Block from Chat"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Chat Area */}
            <Card className="lg:col-span-3 flex flex-col max-h-full min-h-0">
              <CardHeader className="pb-3 border-b flex-shrink-0">
                <CardTitle className="flex items-center gap-2">
                  <IconMessageCircle className="h-5 w-5" />
                  Team Conversation
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0 min-h-0">
                {/* Messages Area with fixed height and scroll */}
                <div
                  ref={scrollRef}
                  className={`flex-1 overflow-y-auto p-4 space-y-4 min-h-0 ${currentTheme.class}`}
                  style={{ maxHeight: "calc(100vh - 320px)" }}
                >
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.sender_id === user?.id
                      const displayName = getDisplayName(msg.sender_id, msg.sender_name)
                      return (
                        <div key={msg.id} className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={msg.sender_avatar || undefined} />
                            <AvatarFallback className="text-xs">{getInitials(msg.sender_name)}</AvatarFallback>
                          </Avatar>
                          <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
                            <div className={`flex items-center gap-2 mb-1 ${isOwn ? "justify-end" : ""}`}>
                              <span className="text-xs font-medium">{isOwn ? "You" : displayName}</span>
                              <span className="text-xs text-muted-foreground">{formatTime(msg.created_at)}</span>
                            </div>
                            <div className={`rounded-lg px-3 py-2 ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                              {msg.file_url && (
                                <div className="mb-2">
                                  {isImage(msg.file_type) ? (
                                    <img
                                      src={msg.file_url}
                                      alt={msg.file_name || "Image"}
                                      className="max-w-full max-h-48 rounded cursor-pointer"
                                      onClick={() => window.open(msg.file_url!, "_blank")}
                                    />
                                  ) : (
                                    <a
                                      href={msg.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 p-2 rounded bg-background/50 hover:bg-background/80"
                                    >
                                      <IconFile className="h-4 w-4" />
                                      <span className="text-xs truncate">{msg.file_name}</span>
                                      <IconDownload className="h-4 w-4 ml-auto" />
                                    </a>
                                  )}
                                </div>
                              )}
                              {msg.message && !msg.message.startsWith("Shared a file:") && (
                                <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Blocked notice */}
                {isBlocked && (
                  <div className="border-t p-4 bg-red-500/10 text-center">
                    <p className="text-sm text-red-500">You have been blocked from sending messages in this chat.</p>
                  </div>
                )}

                {/* Input Area */}
                {!isBlocked && (
                  <div className="border-t p-4 flex-shrink-0">
                    <div className="flex gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading || !ownerId}
                      >
                        <IconUpload className="h-4 w-4" />
                      </Button>
                      <Input
                        ref={inputRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        disabled={isLoading || !ownerId}
                        className="flex-1"
                      />
                      <Button onClick={() => sendMessage()} disabled={isLoading || !newMessage.trim() || !ownerId}>
                        <IconSend className="h-4 w-4 mr-2" />
                        Send
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>

      {/* Nickname Dialog */}
      <Dialog open={isNicknameOpen} onOpenChange={setIsNicknameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Your Nickname</DialogTitle>
            <DialogDescription>
              Choose a nickname to display in the chat instead of your real name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder="Enter a nickname..."
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use your real name.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNicknameOpen(false)}>Cancel</Button>
            <Button onClick={saveNickname}>Save Nickname</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}

