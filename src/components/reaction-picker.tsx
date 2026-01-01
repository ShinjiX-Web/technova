import { useState } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { IconMoodSmile } from "@tabler/icons-react"

// Common emoji categories
const EMOJI_CATEGORIES = {
  "😀": ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "😉", "😍", "🥰", "😘", "😋", "😛", "🤪", "😜", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕"],
  "👍": ["👍", "👎", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "👋", "🤚", "🖐️", "✋", "🖖", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💪", "🦾", "🦿"],
  "❤️": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟"],
  "🎉": ["🎉", "🎊", "🎁", "🎈", "🏆", "🥇", "🥈", "🥉", "⚽", "🏀", "🎮", "🎲", "🎯", "🎵", "🎶", "🔔", "📣", "💡", "🔥", "⭐", "🌟", "✨", "💫", "🌈", "☀️", "🌙", "⚡", "💥", "💢", "💯", "💤", "💬", "💭", "🗯️", "💣", "💎", "🎀"],
  "🍕": ["🍕", "🍔", "🍟", "🌭", "🍿", "🧀", "🥓", "🥚", "🍳", "🥞", "🧇", "🥐", "🍞", "🥖", "🥨", "🧁", "🍰", "🎂", "🍩", "🍪", "🍫", "🍬", "🍭", "🍮", "🍯", "🍼", "☕", "🍵", "🧃", "🥤", "🍺", "🍻", "🥂", "🍷", "🍸", "🍹", "🧊"],
}

// Quick reactions for easy access
const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "💯"]

interface ReactionPickerProps {
  onReact: (type: "emoji", value: string) => void
  trigger?: React.ReactNode
}

export function ReactionPicker({ onReact, trigger }: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("😀")

  const handleReaction = (value: string) => {
    onReact("emoji", value)
    setIsOpen(false)
  }

  const emojis = EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES] || []

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <IconMoodSmile className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        {/* Quick reactions */}
        <div className="flex gap-1 mb-2 pb-2 border-b justify-center">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className="text-xl hover:bg-muted rounded p-1 transition-colors hover:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>
        {/* Category tabs */}
        <div className="flex gap-1 mb-2 justify-center">
          {Object.keys(EMOJI_CATEGORIES).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-lg p-1 rounded transition-colors ${selectedCategory === cat ? "bg-primary/20 ring-1 ring-primary" : "hover:bg-muted"}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <ScrollArea className="h-32">
          <div className="grid grid-cols-8 gap-0.5">
            {emojis.map((emoji, idx) => (
              <button
                key={`${emoji}-${idx}`}
                onClick={() => handleReaction(emoji)}
                className="text-lg hover:bg-muted rounded p-1 transition-colors hover:scale-110"
              >
                {emoji}
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

