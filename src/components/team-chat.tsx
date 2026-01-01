import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { IconSend, IconMessageCircle } from "@tabler/icons-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

interface TeamMember {
  id: string
  name: string
  email: string
  avatar_url: string | null
  status: string
  user_id?: string | null
  last_seen?: string | null
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
}

interface TeamChatProps {
  teamMembers: TeamMember[]
  ownerId: string | null
}

// Status color helper
const getStatusColor = (status: string, lastSeen?: string | null) => {
  const manualStatuses = ["Away", "Busy", "Do not disturb", "Be right back", "Appear offline"]
  if (manualStatuses.includes(status)) {
    switch (status) {
      case "Away":
      case "Be right back":
        return "bg-amber-500"
      case "Busy":
      case "Do not disturb":
        return "bg-red-500"
      case "Appear offline":
        return "bg-gray-400"
    }
  }

  // Check if online based on last_seen
  if (lastSeen) {
    const timeSince = Date.now() - new Date(lastSeen).getTime()
    if (timeSince < 2 * 60 * 1000) return "bg-green-500"
  }
  return "bg-gray-400"
}

export function TeamChat({ teamMembers, ownerId }: TeamChatProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debug log
  // useEffect(() => {
  //   console.log("TeamChat - ownerId:", ownerId, "user:", user?.id)
  // }, [ownerId, user])

  // Fetch messages
  const fetchMessages = async () => {
    if (!ownerId) {
      console.log("fetchMessages: No ownerId")
      return
    }

    // console.log("Fetching messages for owner:", ownerId)
    const { data, error } = await supabase
      .from("team_messages")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: true })
      .limit(100)

    console.log("Messages fetched:", data?.length, "error:", error)
    if (!error && data) {
      setMessages(data)
    }
  }

  // Subscribe to realtime messages
  useEffect(() => {
    if (!ownerId) return

    fetchMessages()

    const channel = supabase
      .channel(`team-chat-${ownerId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "team_messages", filter: `owner_id=eq.${ownerId}` },
        (payload) => {
          const newMsg = payload.new as ChatMessage
          // Only add if not already in the list (avoid duplicates from local add)
          setMessages((prev) => {
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [ownerId])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !ownerId) {
      console.log("Cannot send - missing:", { message: newMessage.trim(), user: !!user, ownerId })
      return
    }

    setIsLoading(true)
    const messageText = newMessage.trim()

    try {
      const { data, error } = await supabase.from("team_messages").insert({
        owner_id: ownerId,
        sender_id: user.id,
        sender_name: user.name || user.email?.split("@")[0] || "User",
        sender_email: user.email || "",
        sender_avatar: user.avatar || null,
        message: messageText,
      }).select().single()

      if (error) {
        console.error("Error sending message:", error)
        return
      }

      // Add message to state immediately (don't wait for realtime)
      if (data) {
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

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  const formatTime = (date: string) => {
    const msgDate = new Date(date)
    const today = new Date()
    const isToday = msgDate.toDateString() === today.toDateString()

    if (isToday) {
      return msgDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
    return msgDate.toLocaleDateString([], { month: "short", day: "numeric" }) + " " +
           msgDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconMessageCircle className="h-5 w-5" />
          Team Chat
        </CardTitle>
        <CardDescription>Chat with your team members in real-time</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Online Members Bar */}
        <div className="flex gap-2 pb-3 mb-3 border-b overflow-x-auto">
          {teamMembers.slice(0, 10).map((member) => (
            <div key={member.id} className="relative flex-shrink-0" title={`${member.name} - ${member.status}`}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={member.avatar_url || ""} />
                <AvatarFallback className="text-xs">{getInitials(member.name)}</AvatarFallback>
              </Avatar>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background ${getStatusColor(member.status, member.last_seen)}`} />
            </div>
          ))}
          {teamMembers.length > 10 && (
            <span className="text-sm text-muted-foreground self-center">+{teamMembers.length - 10}</span>
          )}
        </div>

        {/* Messages */}
        <div className="h-64 overflow-y-auto mb-3 p-2 bg-muted/30 rounded-lg" ref={scrollRef}>
          <div className="space-y-3">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No messages yet. Start the conversation!</p>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.sender_id === user?.id
                return (
                  <div key={msg.id} className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={msg.sender_avatar || ""} />
                      <AvatarFallback className="text-xs">{getInitials(msg.sender_name)}</AvatarFallback>
                    </Avatar>
                    <div className={`max-w-[70%] ${isOwn ? "text-right" : ""}`}>
                      <div className={`flex items-baseline gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
                        <span className="text-sm font-medium">{isOwn ? "You" : msg.sender_name.split(" ")[0]}</span>
                        <span className="text-xs text-muted-foreground">{formatTime(msg.created_at)}</span>
                      </div>
                      <p className={`text-sm p-2.5 rounded-lg mt-1 ${isOwn ? "bg-primary text-primary-foreground" : "bg-background border"}`}>
                        {msg.message}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Type a message..."
            disabled={isLoading}
          />
          <Button onClick={sendMessage} disabled={isLoading || !newMessage.trim()}>
            <IconSend className="h-4 w-4 mr-2" />
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

