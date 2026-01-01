import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IconSend, IconArrowLeft, IconUpload, IconFile, IconDownload, IconCornerDownLeft, IconX, IconDotsVertical, IconTrash, IconExternalLink } from "@tabler/icons-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { ReactionPicker } from "./reaction-picker"
import { MessageReactions } from "./message-reactions"
import { MediaPicker } from "./media-picker"
import { playNotificationSound } from "@/lib/notification-sounds"
import Swal from "sweetalert2"

export interface PrivateMessage {
  id: string
  team_owner_id: string
  sender_id: string
  receiver_id: string
  sender_name: string
  sender_avatar: string | null
  message: string
  file_url?: string | null
  file_name?: string | null
  file_type?: string | null
  is_read: boolean
  created_at: string
  reply_to_id?: string | null
  reply_to_message?: string | null
  reply_to_sender?: string | null
}

export interface TeamMember {
  id: string
  name: string
  email: string
  avatar_url: string | null
  user_id?: string | null
  chat_nickname?: string | null
  status?: string
  last_seen?: string | null
}

interface PrivateChatPanelProps {
  member: TeamMember
  teamOwnerId: string
  onBack: () => void
  currentThemeClass?: string
  onPopOut?: () => void
  isPopOut?: boolean
}

export function PrivateChatPanel({ member, teamOwnerId, onBack, currentThemeClass, onPopOut, isPopOut }: PrivateChatPanelProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<PrivateMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [replyTo, setReplyTo] = useState<PrivateMessage | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Dark mode for Swal
  const isDark = document.documentElement.classList.contains("dark")
  const getSwalTheme = () => ({ background: isDark ? "#171717" : "#ffffff", color: isDark ? "#ffffff" : "#171717" })

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getMemberId = () => member?.user_id || member?.id

  // Delete individual message
  const deleteMessage = async (messageId: string) => {
    const result = await Swal.fire({
      title: "Delete message?",
      text: "This message will be deleted for everyone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete",
      ...getSwalTheme(),
    })

    if (result.isConfirmed) {
      await supabase.from("private_messages").delete().eq("id", messageId)
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
    }
  }

  // Clear all messages between users
  const clearAllMessages = async () => {
    if (!user || !member) return
    const memberId = getMemberId()

    const result = await Swal.fire({
      title: "Clear all messages?",
      text: "This will delete all messages between you and this person. This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Clear All",
      ...getSwalTheme(),
    })

    if (result.isConfirmed) {
      // Delete messages where current user is sender or receiver with this member
      await supabase
        .from("private_messages")
        .delete()
        .eq("team_owner_id", teamOwnerId)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${memberId}),and(sender_id.eq.${memberId},receiver_id.eq.${user.id})`)

      setMessages([])
      Swal.fire({ title: "Cleared!", text: "All messages have been deleted.", icon: "success", ...getSwalTheme() })
    }
  }

  // Check if file is an image
  const isImage = (fileType?: string | null) => fileType?.startsWith("image/")

  // Fetch private messages
  const fetchMessages = async () => {
    if (!user || !member) return
    const memberId = getMemberId()

    const { data } = await supabase
      .from("private_messages")
      .select("*")
      .eq("team_owner_id", teamOwnerId)
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${memberId}),and(sender_id.eq.${memberId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true })
      .limit(100)

    if (data) {
      setMessages(data)
      // Mark messages as read
      await supabase
        .from("private_messages")
        .update({ is_read: true })
        .eq("receiver_id", user.id)
        .eq("sender_id", memberId)
    }
  }

  // Subscribe to realtime messages
  useEffect(() => {
    if (!user || !member) return

    fetchMessages()

    const memberId = getMemberId()
    const channel = supabase
      .channel(`private-chat-${user.id}-${memberId}-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "private_messages" },
        (payload) => {
          const newMsg = payload.new as PrivateMessage
          if (
            (newMsg.sender_id === user.id && newMsg.receiver_id === memberId) ||
            (newMsg.sender_id === memberId && newMsg.receiver_id === user.id)
          ) {
            setMessages((prev) => {
              if (prev.some(m => m.id === newMsg.id)) return prev
              return [...prev, newMsg]
            })
            // Mark as read if received and play notification sound
            if (newMsg.receiver_id === user.id) {
              supabase.from("private_messages").update({ is_read: true }).eq("id", newMsg.id)
              playNotificationSound()
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, member])

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Focus input
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [member])

  const sendMessage = async (fileUrl?: string, fileName?: string, fileType?: string) => {
    if ((!newMessage.trim() && !fileUrl) || !user || !member) return
    const memberId = getMemberId()

    setIsLoading(true)
    const messageText = newMessage.trim()
    try {
      const { data, error } = await supabase.from("private_messages").insert({
        team_owner_id: teamOwnerId,
        sender_id: user.id,
        receiver_id: memberId,
        sender_name: user.name || user.email?.split("@")[0] || "User",
        sender_avatar: user.avatar || null,
        message: fileUrl ? `Shared a file: ${fileName}` : messageText,
        file_url: fileUrl || null,
        file_name: fileName || null,
        file_type: fileType || null,
        reply_to_id: replyTo?.id || null,
        reply_to_message: replyTo?.message?.substring(0, 100) || null,
        reply_to_sender: replyTo?.sender_name || null,
      }).select().single()

      if (!error && data) {
        // Add message to state immediately (don't wait for realtime)
        setMessages((prev) => {
          if (prev.some(m => m.id === data.id)) return prev
          return [...prev, data]
        })
      }

      setNewMessage("")
      setReplyTo(null)
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsLoading(false)
    }
  }


  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setIsLoading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `private-chat/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(filePath)

      await sendMessage(publicUrl, file.name, file.type)
    } catch (error) {
      console.error("Error uploading file:", error)
    } finally {
      setIsLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Add reaction to a private message
  const addReaction = async (messageId: string, value: string) => {
    if (!user) return
    await supabase.from("private_message_reactions").insert({
      message_id: messageId,
      user_id: user.id,
      user_name: user.name || user.email?.split("@")[0] || "User",
      reaction_type: "emoji",
      reaction_value: value,
    })
  }

  return (
    <Card className={`flex flex-col h-full ${isPopOut ? "border-0 shadow-none" : ""}`}>
      {/* Header */}
      <CardHeader className="pb-3 border-b flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
            <IconArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-9 w-9">
            <AvatarImage src={member.avatar_url || undefined} />
            <AvatarFallback>{getInitials(member.chat_nickname || member.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium truncate">
              {member.chat_nickname || member.name}
            </CardTitle>
            <p className="text-xs text-muted-foreground truncate">{member.email}</p>
          </div>
          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isPopOut && onPopOut && (
                <>
                  <DropdownMenuItem onClick={onPopOut}>
                    <IconExternalLink className="h-4 w-4 mr-2" />
                    Pop Out Chat
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={clearAllMessages} className="text-red-500 focus:text-red-500">
                <IconTrash className="h-4 w-4 mr-2" />
                Clear All Messages
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <div
          ref={scrollRef}
          className={`flex-1 overflow-y-auto p-4 space-y-4 ${currentThemeClass || ""}`}
          style={{ maxHeight: "calc(100vh - 320px)" }}
        >
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm py-20">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id
              return (
                <div key={msg.id} className={`flex gap-2 group ${isOwn ? "flex-row-reverse" : ""}`}>
                  <Avatar className="h-7 w-7 flex-shrink-0">
                    <AvatarImage src={msg.sender_avatar || undefined} />
                    <AvatarFallback className="text-xs">{getInitials(msg.sender_name)}</AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
                    <div className={`flex items-center gap-2 mb-0.5 ${isOwn ? "justify-end" : ""}`}>
                      <span className="text-xs text-muted-foreground">{formatTime(msg.created_at)}</span>
                    </div>
                    <div className="relative">
                      {/* Reply preview */}
                      {msg.reply_to_message && (
                        <div className={`text-xs px-2 py-1 mb-1 rounded border-l-2 border-primary/50 bg-muted/50 ${isOwn ? "text-right" : ""}`}>
                          <span className="font-medium">{msg.reply_to_sender}</span>
                          <p className="text-muted-foreground truncate">{msg.reply_to_message}</p>
                        </div>
                      )}
                      <div className={`rounded-lg px-3 py-2 text-sm ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
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
                          <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                        )}
                      </div>
                      {/* Action buttons */}
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
                          onReact={(_, value) => addReaction(msg.id, value)}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full bg-background/80 hover:bg-background shadow-sm">
                              😊
                            </Button>
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full bg-background/80 hover:bg-red-100 hover:text-red-500 shadow-sm"
                          onClick={() => deleteMessage(msg.id)}
                        >
                          <IconTrash className="h-3 w-3" />
                        </Button>
                      </div>
                      <MessageReactions messageId={msg.id} tableName="private_message_reactions" />
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Reply preview */}
        {replyTo && (
          <div className="border-t px-4 py-2 bg-muted/30 flex items-center gap-2">
            <IconCornerDownLeft className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium">Replying to {replyTo.sender_name}</p>
              <p className="text-xs text-muted-foreground truncate">{replyTo.message}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReplyTo(null)}>
              <IconX className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Input */}
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
              disabled={isLoading}
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
              placeholder="Type a message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={() => sendMessage()} disabled={isLoading || !newMessage.trim()} size="icon">
              <IconSend className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Keep the dialog version for backward compatibility but mark as deprecated
export { PrivateChatPanel as PrivateChatDialog }