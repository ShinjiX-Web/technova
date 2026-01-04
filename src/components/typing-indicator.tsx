import { useState, useEffect, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface TypingUser {
  userId: string
  userName: string
  userAvatar?: string
}

interface TypingIndicatorProps {
  channelName: string
  currentUserId: string
  currentUserName: string
  currentUserAvatar?: string
}

// Animated dots component
export function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }} />
    </span>
  )
}

export function TypingIndicator({ channelName, currentUserId, currentUserName, currentUserAvatar }: TypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const typingTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  useEffect(() => {
    // Create a realtime channel for typing status
    const channel = supabase.channel(`typing-${channelName}`)
    channelRef.current = channel

    channel
      .on("broadcast", { event: "typing" }, (payload) => {
        const { userId, userName, userAvatar, isTyping } = payload.payload as TypingUser & { isTyping: boolean }
        
        if (userId === currentUserId) return // Ignore own typing events

        if (isTyping) {
          // Add user to typing list
          setTypingUsers((prev) => {
            if (prev.some((u) => u.userId === userId)) return prev
            return [...prev, { userId, userName, userAvatar }]
          })

          // Clear existing timeout for this user
          if (typingTimeoutRef.current[userId]) {
            clearTimeout(typingTimeoutRef.current[userId])
          }

          // Set timeout to remove user after 3 seconds of no typing
          typingTimeoutRef.current[userId] = setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u.userId !== userId))
            delete typingTimeoutRef.current[userId]
          }, 3000)
        } else {
          // Remove user from typing list
          setTypingUsers((prev) => prev.filter((u) => u.userId !== userId))
          if (typingTimeoutRef.current[userId]) {
            clearTimeout(typingTimeoutRef.current[userId])
            delete typingTimeoutRef.current[userId]
          }
        }
      })
      .subscribe()

    return () => {
      // Clear all timeouts
      Object.values(typingTimeoutRef.current).forEach(clearTimeout)
      typingTimeoutRef.current = {}
      supabase.removeChannel(channel)
    }
  }, [channelName, currentUserId])

  // Broadcast typing status
  const broadcastTyping = useCallback((isTyping: boolean) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: {
          userId: currentUserId,
          userName: currentUserName,
          userAvatar: currentUserAvatar,
          isTyping,
        },
      })
    }
  }, [currentUserId, currentUserName, currentUserAvatar])

  // Return both the UI component and the broadcast function
  if (typingUsers.length === 0) {
    return { element: null, broadcastTyping }
  }

  const displayNames = typingUsers.map((u) => u.userName.split(" ")[0])
  const typingText = displayNames.length === 1
    ? `${displayNames[0]} is typing`
    : displayNames.length === 2
    ? `${displayNames[0]} and ${displayNames[1]} are typing`
    : `${displayNames[0]} and ${displayNames.length - 1} others are typing`

  return {
    element: (
      <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground">
        <div className="flex -space-x-2">
          {typingUsers.slice(0, 3).map((u) => (
            <Avatar key={u.userId} className="h-5 w-5 border-2 border-background">
              <AvatarImage src={u.userAvatar} />
              <AvatarFallback className="text-[8px]">{getInitials(u.userName)}</AvatarFallback>
            </Avatar>
          ))}
        </div>
        <span>{typingText}</span>
        <TypingDots />
      </div>
    ),
    broadcastTyping,
  }
}

// Hook version for easier use
export function useTypingIndicator(channelName: string, currentUserId: string, currentUserName: string, currentUserAvatar?: string) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const typingTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const lastTypingRef = useRef<number>(0)

  useEffect(() => {
    if (!channelName || !currentUserId) return

    const channel = supabase.channel(`typing-${channelName}`)
    channelRef.current = channel

    channel
      .on("broadcast", { event: "typing" }, (payload) => {
        const { userId, userName, userAvatar, isTyping } = payload.payload as TypingUser & { isTyping: boolean }
        
        if (userId === currentUserId) return

        if (isTyping) {
          setTypingUsers((prev) => {
            if (prev.some((u) => u.userId === userId)) return prev
            return [...prev, { userId, userName, userAvatar }]
          })

          if (typingTimeoutRef.current[userId]) {
            clearTimeout(typingTimeoutRef.current[userId])
          }

          typingTimeoutRef.current[userId] = setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u.userId !== userId))
            delete typingTimeoutRef.current[userId]
          }, 3000)
        } else {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== userId))
          if (typingTimeoutRef.current[userId]) {
            clearTimeout(typingTimeoutRef.current[userId])
            delete typingTimeoutRef.current[userId]
          }
        }
      })
      .subscribe()

    return () => {
      Object.values(typingTimeoutRef.current).forEach(clearTimeout)
      typingTimeoutRef.current = {}
      supabase.removeChannel(channel)
    }
  }, [channelName, currentUserId])

  const sendTyping = useCallback((isTyping: boolean) => {
    // Throttle typing broadcasts to avoid flooding
    const now = Date.now()
    if (isTyping && now - lastTypingRef.current < 1000) return
    lastTypingRef.current = now

    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: {
          userId: currentUserId,
          userName: currentUserName,
          userAvatar: currentUserAvatar,
          isTyping,
        },
      })
    }
  }, [currentUserId, currentUserName, currentUserAvatar])

  return { typingUsers, sendTyping }
}

