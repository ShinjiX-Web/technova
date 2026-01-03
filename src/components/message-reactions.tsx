import { useState, useEffect, useRef } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { playNotificationSound } from "@/lib/notification-sounds"

export interface Reaction {
  id: string
  message_id: string
  user_id: string
  user_name: string
  reaction_type: string
  reaction_value: string
  created_at: string
}

interface GroupedReaction {
  value: string
  type: string
  count: number
  users: string[]
  hasCurrentUser: boolean
}

interface MessageReactionsProps {
  messageId: string
  tableName?: "message_reactions" | "private_message_reactions"
  messageOwnerId?: string // The user who sent the message - used for notification sounds
}

export function MessageReactions({ messageId, tableName = "message_reactions", messageOwnerId }: MessageReactionsProps) {
  const { user } = useAuth()
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [groupedReactions, setGroupedReactions] = useState<GroupedReaction[]>([])
  const prevReactionCountRef = useRef<number>(0)

  // Fetch reactions for this message
  const fetchReactions = async () => {
    const { data } = await supabase
      .from(tableName)
      .select("*")
      .eq("message_id", messageId)
      .order("created_at", { ascending: true })

    if (data) {
      // Play notification sound if this is the current user's message and a new reaction was added
      if (
        messageOwnerId === user?.id &&
        data.length > prevReactionCountRef.current &&
        prevReactionCountRef.current > 0 // Don't play on initial load
      ) {
        // Check if the new reaction is not from the current user
        const newReactions = data.slice(prevReactionCountRef.current)
        const hasNewReactionFromOthers = newReactions.some(r => r.user_id !== user?.id)
        if (hasNewReactionFromOthers) {
          playNotificationSound()
        }
      }
      prevReactionCountRef.current = data.length
      setReactions(data)
    }
  }

  useEffect(() => {
    fetchReactions()

    // Subscribe to changes
    const channel = supabase
      .channel(`reactions-${messageId}-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: tableName, filter: `message_id=eq.${messageId}` },
        () => {
          fetchReactions()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [messageId, tableName])

  // Group reactions by value
  useEffect(() => {
    const grouped = reactions.reduce((acc, reaction) => {
      const existing = acc.find(r => r.value === reaction.reaction_value)
      if (existing) {
        existing.count++
        existing.users.push(reaction.user_name)
        if (reaction.user_id === user?.id) {
          existing.hasCurrentUser = true
        }
      } else {
        acc.push({
          value: reaction.reaction_value,
          type: reaction.reaction_type,
          count: 1,
          users: [reaction.user_name],
          hasCurrentUser: reaction.user_id === user?.id,
        })
      }
      return acc
    }, [] as GroupedReaction[])

    setGroupedReactions(grouped)
  }, [reactions, user?.id])

  const toggleReaction = async (value: string, type: string) => {
    if (!user) return

    // Check if user already reacted with this emoji
    const existingReaction = reactions.find(
      r => r.user_id === user.id && r.reaction_value === value
    )

    if (existingReaction) {
      // Remove reaction
      await supabase.from(tableName).delete().eq("id", existingReaction.id)
    } else {
      // Add reaction
      await supabase.from(tableName).insert({
        message_id: messageId,
        user_id: user.id,
        user_name: user.name || user.email?.split("@")[0] || "User",
        reaction_type: type,
        reaction_value: value,
      })
    }
    
    fetchReactions()
  }

  if (groupedReactions.length === 0) return null

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1 mt-1">
        {groupedReactions.map((reaction, idx) => (
          <Tooltip key={`${reaction.value}-${idx}`}>
            <TooltipTrigger asChild>
              <button
                onClick={() => toggleReaction(reaction.value, reaction.type)}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-colors ${
                  reaction.hasCurrentUser
                    ? "bg-primary/20 border border-primary/40"
                    : "bg-muted hover:bg-muted/80 border border-transparent"
                }`}
              >
                {reaction.type === "gif" ? (
                  <img src={reaction.value} alt="gif" className="h-4 w-4 rounded" />
                ) : (
                  <span className="text-sm">{reaction.value}</span>
                )}
                {reaction.count > 1 && <span className="text-muted-foreground">{reaction.count}</span>}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {reaction.users.join(", ")}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}

