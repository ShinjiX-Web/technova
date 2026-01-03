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
  IconMoodSmile,
  IconCornerDownLeft,
  IconX,
  IconVolume,
  IconPhoto,
  IconMinus,
  IconMaximize,
  IconMinimize,
} from "@tabler/icons-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import Swal from "sweetalert2"
import { PrivateChatPanel } from "@/components/private-chat-dialog"
import { ReactionPicker } from "@/components/reaction-picker"
import { MessageReactions } from "@/components/message-reactions"
import { MediaPicker } from "@/components/media-picker"
import { NotificationSoundSettings } from "@/components/notification-sound-settings"
import { playNotificationSound } from "@/lib/notification-sounds"

// Chat background themes with better light mode support
const CHAT_THEMES = [
  { id: "default", name: "Default", class: "", style: {} },
  { id: "gradient-blue", name: "Blue Gradient", class: "bg-gradient-to-br from-blue-500/20 to-purple-500/20 dark:from-blue-500/10 dark:to-purple-500/10", style: {} },
  { id: "gradient-green", name: "Green Gradient", class: "bg-gradient-to-br from-green-500/20 to-teal-500/20 dark:from-green-500/10 dark:to-teal-500/10", style: {} },
  { id: "gradient-orange", name: "Sunset", class: "bg-gradient-to-br from-orange-500/20 to-pink-500/20 dark:from-orange-500/10 dark:to-pink-500/10", style: {} },
  { id: "gradient-purple", name: "Purple Haze", class: "bg-gradient-to-br from-purple-500/20 to-indigo-500/20 dark:from-purple-500/10 dark:to-indigo-500/10", style: {} },
  { id: "pattern-dots", name: "Dots Pattern", class: "bg-[radial-gradient(circle,_rgba(0,0,0,0.08)_1px,_transparent_1px)] dark:bg-[radial-gradient(circle,_rgba(255,255,255,0.1)_1px,_transparent_1px)] bg-[size:20px_20px]", style: {} },
  { id: "pattern-grid", name: "Grid Pattern", class: "bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]", style: {} },
  { id: "custom", name: "Custom Image", class: "", style: {} },
]

// Background image presets
const BACKGROUND_IMAGES = [
  { id: "mountains", name: "Mountains", url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80" },
  { id: "ocean", name: "Ocean", url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1920&q=80" },
  { id: "forest", name: "Forest", url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80" },
  { id: "city", name: "City Night", url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1920&q=80" },
  { id: "abstract", name: "Abstract", url: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80" },
  { id: "space", name: "Space", url: "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1920&q=80" },
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
  reply_to_id?: string | null
  reply_to_message?: string | null
  reply_to_sender?: string | null
}

interface ChatSettings {
  user_id: string
  chat_theme: string
  nickname: string | null
  status: string | null
}

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
  const [privateChatMember, setPrivateChatMember] = useState<TeamMember | null>(null)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const [popOutMember, setPopOutMember] = useState<TeamMember | null>(null)
  const [popOutPosition, setPopOutPosition] = useState({ x: 100, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [popOutSize, setPopOutSize] = useState({ width: 450, height: 600 })
  const [isPopOutMinimized, setIsPopOutMinimized] = useState(false)
  const [isPopOutFullscreen, setIsPopOutFullscreen] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isSoundSettingsOpen, setIsSoundSettingsOpen] = useState(false)
  const [isBackgroundDialogOpen, setIsBackgroundDialogOpen] = useState(false)
  const [customBackgroundImage, setCustomBackgroundImage] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Dark mode for Swal
  const isDark = document.documentElement.classList.contains("dark")
  const getSwalTheme = () => ({ background: isDark ? "#171717" : "#ffffff", color: isDark ? "#ffffff" : "#171717" })

  // Load custom background from localStorage
  useEffect(() => {
    const savedBg = localStorage.getItem("chat_background_image")
    if (savedBg) {
      setCustomBackgroundImage(savedBg)
      setSelectedTheme("custom")
    }
  }, [])

  // Fetch unread message counts for private chats
  const fetchUnreadCounts = async () => {
    if (!user || !ownerId) return

    const { data } = await supabase
      .from("private_messages")
      .select("sender_id")
      .eq("team_owner_id", ownerId)
      .eq("receiver_id", user.id)
      .eq("is_read", false)

    if (data) {
      const counts: Record<string, number> = {}
      data.forEach((msg) => {
        counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1
      })
      setUnreadCounts(counts)
    }
  }

  // Fetch unread counts on mount and subscribe to changes
  useEffect(() => {
    if (!user || !ownerId) return

    fetchUnreadCounts()

    const channel = supabase
      .channel(`unread-counts-${user.id}-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "private_messages", filter: `receiver_id=eq.${user.id}` },
        () => {
          fetchUnreadCounts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, ownerId])

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

  // Fetch chat settings from localStorage
  useEffect(() => {
    const fetchSettings = () => {
      if (!user) return

      try {
        const chatSettingsKey = `chat_settings_${user.id}`
        const savedSettings = localStorage.getItem(chatSettingsKey)

        if (savedSettings) {
          const data = JSON.parse(savedSettings)
          setChatSettings({
            user_id: user.id,
            nickname: data.nickname || null,
            chat_theme: data.chat_theme || "default",
            status: data.status || "Available",
          })
          setSelectedTheme(data.chat_theme || "default")
          setNicknameInput(data.nickname || "")
          setSelectedStatus(data.status || "Available")
        }
      } catch (error) {
        console.error("Error loading chat settings:", error)
      }
    }

    fetchSettings()
  }, [user])

  // Fetch team members - include owner/admin in the list
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!ownerId || !user) return

      // Fetch team members
      const { data: membersData } = await supabase
        .from("team_members")
        .select("id, name, email, avatar_url, status, last_seen, user_id, is_chat_blocked, chat_nickname, owner_name, owner_email, owner_avatar")
        .eq("owner_id", ownerId)

      // If user is NOT the owner, we need to add the owner to the list
      if (!isTeamOwner && membersData && membersData.length > 0) {
        // Get owner info from the first member record or fetch from profiles
        const firstMember = membersData[0]

        // Fetch owner profile for more accurate info
        const { data: ownerProfile } = await supabase
          .from("profiles")
          .select("id, name, email, avatar_url, last_seen")
          .eq("id", ownerId)
          .single()

        // Create owner entry
        const ownerEntry: TeamMember = {
          id: `owner-${ownerId}`,
          name: ownerProfile?.name || firstMember.owner_name || "Team Owner",
          email: ownerProfile?.email || firstMember.owner_email || "",
          avatar_url: ownerProfile?.avatar_url || firstMember.owner_avatar || null,
          status: "Active",
          last_seen: ownerProfile?.last_seen || new Date().toISOString(),
          user_id: ownerId,
          is_chat_blocked: false,
          chat_nickname: null,
        }

        // Add owner at the beginning, then other members
        setTeamMembers([ownerEntry, ...membersData])
      } else if (membersData) {
        setTeamMembers(membersData)
      }
    }

    fetchTeamMembers()
  }, [ownerId, user, isTeamOwner])

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
        reply_to_id: replyTo?.id || null,
        reply_to_message: replyTo?.message?.substring(0, 100) || null,
        reply_to_sender: replyTo?.sender_name || null,
      }).select().single()

      if (!error && data) {
        setMessages((prev) => [...prev, data])
      }

      setNewMessage("")
      setReplyTo(null)
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

  // Save nickname - use localStorage since Supabase chat_settings expects UUID format
  const saveNickname = async () => {
    if (!user) return

    const newNickname = nicknameInput.trim() || null

    try {
      // Save to localStorage as primary storage
      const chatSettingsKey = `chat_settings_${user.id}`
      const existingSettings = localStorage.getItem(chatSettingsKey)
      const settings = existingSettings ? JSON.parse(existingSettings) : {}
      settings.nickname = newNickname
      settings.chat_theme = selectedTheme
      settings.status = selectedStatus
      settings.updated_at = new Date().toISOString()
      localStorage.setItem(chatSettingsKey, JSON.stringify(settings))

      setChatSettings(prev => prev
        ? { ...prev, nickname: newNickname }
        : { user_id: user.id, nickname: newNickname, chat_theme: selectedTheme, status: selectedStatus }
      )
      setIsNicknameOpen(false)
      Swal.fire({ icon: "success", title: "Nickname saved", timer: 1500, showConfirmButton: false, ...getSwalTheme() })
    } catch (error) {
      console.error("Error saving nickname:", error)
      Swal.fire({ icon: "error", title: "Failed to save nickname", text: "Could not save settings", ...getSwalTheme() })
    }
  }

  // Save theme - use localStorage
  const saveTheme = (themeId: string) => {
    if (!user) return

    setSelectedTheme(themeId)

    try {
      const chatSettingsKey = `chat_settings_${user.id}`
      const existingSettings = localStorage.getItem(chatSettingsKey)
      const settings = existingSettings ? JSON.parse(existingSettings) : {}
      settings.chat_theme = themeId
      settings.updated_at = new Date().toISOString()
      localStorage.setItem(chatSettingsKey, JSON.stringify(settings))

      setChatSettings(prev => prev ? { ...prev, chat_theme: themeId } : { user_id: user.id, chat_theme: themeId, nickname: null, status: selectedStatus })
    } catch (error) {
      console.error("Error saving theme:", error)
    }
  }

  // Update availability status - use localStorage for persistence
  const updateStatus = async (status: string) => {
    if (!user) return

    setSelectedStatus(status)

    // Save status to localStorage for persistence
    try {
      const chatSettingsKey = `chat_settings_${user.id}`
      const existingSettings = localStorage.getItem(chatSettingsKey)
      const settings = existingSettings ? JSON.parse(existingSettings) : {}
      settings.status = status
      settings.updated_at = new Date().toISOString()
      localStorage.setItem(chatSettingsKey, JSON.stringify(settings))

      setChatSettings(prev => prev ? { ...prev, status } : { user_id: user.id, chat_theme: selectedTheme, nickname: null, status })
    } catch (error) {
      console.error("Error saving status:", error)
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

  // Get current theme class and background style
  const currentTheme = CHAT_THEMES.find(t => t.id === selectedTheme) || CHAT_THEMES[0]
  const backgroundStyle = selectedTheme === "custom" && customBackgroundImage
    ? { backgroundImage: `url(${customBackgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : {}

  // Save background image
  const saveBackgroundImage = (imageUrl: string | null) => {
    if (imageUrl) {
      localStorage.setItem("chat_background_image", imageUrl)
      setCustomBackgroundImage(imageUrl)
      setSelectedTheme("custom")
    } else {
      localStorage.removeItem("chat_background_image")
      setCustomBackgroundImage(null)
      setSelectedTheme("default")
    }
    setIsBackgroundDialogOpen(false)
  }

  // Check if file is an image
  const isImage = (fileType?: string | null) => fileType?.startsWith("image/")

  // Drag handlers for pop-out window - using refs for document-level events
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 })

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button, input, [role='button']")) return
    if (isPopOutFullscreen) return
    e.preventDefault()
    setIsDragging(true)
    dragOffsetRef.current = {
      x: e.clientX - popOutPosition.x,
      y: e.clientY - popOutPosition.y,
    }
  }

  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: popOutSize.width,
      height: popOutSize.height,
    }
  }

  // Document-level mouse move and mouse up handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = Math.max(350, Math.min(resizeStartRef.current.width + (e.clientX - resizeStartRef.current.x), window.innerWidth - popOutPosition.x))
        const newHeight = Math.max(400, Math.min(resizeStartRef.current.height + (e.clientY - resizeStartRef.current.y), window.innerHeight - popOutPosition.y))
        setPopOutSize({ width: newWidth, height: newHeight })
        return
      }
      if (isDragging) {
        setPopOutPosition({
          x: Math.max(0, Math.min(e.clientX - dragOffsetRef.current.x, window.innerWidth - popOutSize.width)),
          y: Math.max(0, Math.min(e.clientY - dragOffsetRef.current.y, window.innerHeight - popOutSize.height)),
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
    }

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      // Prevent text selection while dragging
      document.body.style.userSelect = "none"
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.userSelect = ""
    }
  }, [isDragging, isResizing, popOutPosition.x, popOutPosition.y, popOutSize.width, popOutSize.height])

  // Toggle fullscreen mode
  const togglePopOutFullscreen = () => {
    if (isPopOutFullscreen) {
      setIsPopOutFullscreen(false)
    } else {
      setIsPopOutFullscreen(true)
      setIsPopOutMinimized(false)
    }
  }

  // Toggle minimize mode
  const togglePopOutMinimize = () => {
    if (isPopOutMinimized) {
      setIsPopOutMinimized(false)
    } else {
      setIsPopOutMinimized(true)
      setIsPopOutFullscreen(false)
    }
  }

  // Open private chat with a member
  const openPrivateChat = (member: TeamMember) => {
    if (member.user_id === user?.id) return // Don't allow chat with self
    setPrivateChatMember(member)
  }

  // Add reaction to a message
  const addReactionToMessage = async (messageId: string, type: "emoji", value: string) => {
    if (!user) return

    const { error } = await supabase.from("message_reactions").insert({
      message_id: messageId,
      user_id: user.id,
      user_name: chatSettings?.nickname || user.name || user.email?.split("@")[0] || "User",
      reaction_type: type,
      reaction_value: value,
    })

    if (error && error.code !== "23505") { // Ignore duplicate key errors
      console.error("Error adding reaction:", error)
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
                <DropdownMenuItem onClick={() => setIsSoundSettingsOpen(true)}>
                  <IconVolume className="mr-2 h-4 w-4" />
                  Notification Sound
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
                {CHAT_THEMES.filter(t => t.id !== "custom").map((theme) => (
                  <DropdownMenuItem key={theme.id} onClick={() => { saveTheme(theme.id); setCustomBackgroundImage(null); localStorage.removeItem("chat_background_image"); }}>
                    <IconPalette className="mr-2 h-4 w-4" />
                    {theme.name}
                    {selectedTheme === theme.id && !customBackgroundImage && <IconCircleCheck className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={() => setIsBackgroundDialogOpen(true)}>
                  <IconPhoto className="mr-2 h-4 w-4" />
                  Background Image...
                  {selectedTheme === "custom" && customBackgroundImage && <IconCircleCheck className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
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
                <CardDescription>{teamMembers.filter(m => m.user_id !== user?.id).length + 1} members</CardDescription>
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
                {/* Filter out current user from team members to avoid duplicate */}
                {teamMembers.filter(member => member.user_id !== user?.id).map((member) => {
                  const memberId = member.user_id || member.id
                  const unreadCount = unreadCounts[memberId] || 0
                  return (
                  <div
                    key={member.id}
                    className={`flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 group cursor-pointer ${privateChatMember?.id === member.id ? "bg-primary/10" : ""}`}
                    onClick={() => openPrivateChat(member)}
                    title="Click to open private chat"
                  >
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">{getInitials(member.name)}</AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${isOnline(member) ? "bg-green-500" : "bg-gray-400"}`} />
                      {/* Unread badge */}
                      {unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.chat_nickname || member.name}
                        {member.is_chat_blocked && <Badge variant="destructive" className="ml-1 text-xs">Blocked</Badge>}
                      </p>
                      <p className="text-xs text-muted-foreground">Click to chat</p>
                    </div>
                    {isTeamOwner && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <IconDotsVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleBlockUser(member); }}>
                            <IconBan className="mr-2 h-4 w-4" />
                            {member.is_chat_blocked ? "Unblock from Chat" : "Block from Chat"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Chat Area - Show Private Chat or Team Chat */}
            {privateChatMember ? (
              <div className="lg:col-span-3 flex flex-col max-h-full min-h-0">
                <PrivateChatPanel
                  member={privateChatMember}
                  teamOwnerId={ownerId || ""}
                  onBack={() => setPrivateChatMember(null)}
                  currentThemeClass={currentTheme.class}
                  onPopOut={() => {
                    setPopOutMember(privateChatMember)
                    setPrivateChatMember(null)
                  }}
                />
              </div>
            ) : (
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
                  style={{ maxHeight: "calc(100vh - 320px)", ...backgroundStyle }}
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
                        <div key={msg.id} className={`flex gap-3 group ${isOwn ? "flex-row-reverse" : ""}`}>
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={msg.sender_avatar || undefined} />
                            <AvatarFallback className="text-xs">{getInitials(msg.sender_name)}</AvatarFallback>
                          </Avatar>
                          <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
                            <div className={`flex items-center gap-2 mb-1 ${isOwn ? "justify-end" : ""}`}>
                              <span className="text-xs font-medium">{isOwn ? "You" : displayName}</span>
                              <span className="text-xs text-muted-foreground">{formatTime(msg.created_at)}</span>
                            </div>
                            <div className="relative">
                              <div className={`rounded-lg px-3 py-2 ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                                {/* Reply quote if this is a reply */}
                                {msg.reply_to_message && (
                                  <div className={`mb-2 p-2 rounded text-xs border-l-2 ${isOwn ? "bg-primary-foreground/10 border-primary-foreground/50" : "bg-background/50 border-muted-foreground/50"}`}>
                                    <span className="font-medium">{msg.reply_to_sender}</span>
                                    <p className="opacity-70 truncate">{msg.reply_to_message}</p>
                                  </div>
                                )}
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
                              {/* Action buttons - shows on hover */}
                              <div className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ${isOwn ? "left-0 -translate-x-full pr-1" : "right-0 translate-x-full pl-1"}`}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-full bg-background/80 hover:bg-background shadow-sm"
                                  onClick={() => setReplyTo(msg)}
                                >
                                  <IconCornerDownLeft className="h-3 w-3" />
                                </Button>
                                <ReactionPicker
                                  onReact={(type, value) => addReactionToMessage(msg.id, type, value)}
                                  trigger={
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full bg-background/80 hover:bg-background shadow-sm">
                                      <IconMoodSmile className="h-3 w-3" />
                                    </Button>
                                  }
                                />
                              </div>
                              {/* Message reactions display */}
                              <MessageReactions messageId={msg.id} />
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
                  <div className="border-t flex-shrink-0">
                    {/* Reply preview */}
                    {replyTo && (
                      <div className="px-4 pt-3 pb-0">
                        <div className="flex items-center gap-2 p-2 rounded-t bg-muted/50 border-l-2 border-primary">
                          <IconCornerDownLeft className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-medium">{replyTo.sender_name}</span>
                            <p className="text-xs text-muted-foreground truncate">{replyTo.message}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReplyTo(null)}>
                            <IconX className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="p-4 flex gap-2">
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
                      <MediaPicker
                        onSelectEmoji={(emoji) => setNewMessage((prev) => prev + emoji)}
                        onSelectGif={(gifUrl) => sendMessage(gifUrl, "GIF", "image/gif")}
                        onSelectSticker={(sticker) => {
                          setNewMessage(sticker)
                          setTimeout(() => sendMessage(), 100)
                        }}
                      />
                      <Input
                        ref={inputRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={replyTo ? "Type your reply..." : "Type a message..."}
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
            )}
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

      {/* Pop-out Private Chat - Draggable & Resizable Window */}
      {popOutMember && (
        <div
          className={`fixed z-50 bg-background border shadow-2xl overflow-hidden flex flex-col ${
            isPopOutFullscreen ? "inset-0 rounded-none" : "rounded-lg"
          }`}
          style={
            isPopOutFullscreen
              ? {}
              : {
                  left: popOutPosition.x,
                  top: popOutPosition.y,
                  width: isPopOutMinimized ? 300 : popOutSize.width,
                  height: isPopOutMinimized ? 48 : popOutSize.height,
                }
          }
        >
          {/* Draggable header with window controls */}
          <div
            className={`flex items-center justify-between px-3 py-2 bg-muted/50 border-b select-none shrink-0 ${
              isPopOutFullscreen ? "cursor-default" : "cursor-grab active:cursor-grabbing"
            }`}
            onMouseDown={handleDragStart}
          >
            <span className="text-sm font-medium truncate flex-1 mr-2">
              Private Chat - {popOutMember.chat_nickname || popOutMember.name}
            </span>
            <div className="flex items-center gap-1">
              {/* Minimize button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={togglePopOutMinimize}
                title={isPopOutMinimized ? "Restore" : "Minimize"}
              >
                <IconMinus className="h-3 w-3" />
              </Button>
              {/* Fullscreen toggle button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={togglePopOutFullscreen}
                title={isPopOutFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isPopOutFullscreen ? (
                  <IconMinimize className="h-3 w-3" />
                ) : (
                  <IconMaximize className="h-3 w-3" />
                )}
              </Button>
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-red-500/20 hover:text-red-500"
                onClick={() => setPopOutMember(null)}
                title="Close"
              >
                <IconX className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {/* Chat content - hidden when minimized */}
          {!isPopOutMinimized && (
            <div className="flex-1 min-h-0">
              <PrivateChatPanel
                member={popOutMember}
                teamOwnerId={ownerId || ""}
                onBack={() => setPopOutMember(null)}
                currentThemeClass={currentTheme.class}
                isPopOut
              />
            </div>
          )}
          {/* Resize handle - only show when not minimized or fullscreen */}
          {!isPopOutMinimized && !isPopOutFullscreen && (
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize group"
              onMouseDown={handleResizeStart}
            >
              <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-muted-foreground/50 group-hover:border-primary" />
            </div>
          )}
        </div>
      )}

      {/* Notification Sound Settings Dialog */}
      <NotificationSoundSettings
        open={isSoundSettingsOpen}
        onOpenChange={setIsSoundSettingsOpen}
      />

      {/* Background Image Dialog */}
      <Dialog open={isBackgroundDialogOpen} onOpenChange={setIsBackgroundDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choose Background Image</DialogTitle>
            <DialogDescription>
              Select a preset background or enter a custom image URL.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {BACKGROUND_IMAGES.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => saveBackgroundImage(bg.url)}
                  className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                    customBackgroundImage === bg.url ? "border-primary ring-2 ring-primary" : "border-border"
                  }`}
                >
                  <img src={bg.url} alt={bg.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-xs py-1 text-center">
                    {bg.name}
                  </div>
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Custom Image URL</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/image.jpg"
                  defaultValue={customBackgroundImage || ""}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const input = e.target as HTMLInputElement
                      if (input.value.trim()) {
                        saveBackgroundImage(input.value.trim())
                      }
                    }
                  }}
                />
                <Button onClick={(e) => {
                  const input = (e.target as HTMLButtonElement).previousElementSibling as HTMLInputElement
                  if (input?.value?.trim()) {
                    saveBackgroundImage(input.value.trim())
                  }
                }}>
                  Apply
                </Button>
              </div>
            </div>
            {customBackgroundImage && (
              <Button variant="outline" className="w-full" onClick={() => saveBackgroundImage(null)}>
                Remove Background Image
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}

