import { useState, useEffect } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconMoodSmile, IconGif, IconSticker, IconSearch, IconLoader2 } from "@tabler/icons-react"

// Emoji categories
const EMOJI_CATEGORIES = {
  "😀": ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "😉", "😍", "🥰", "😘", "😋", "😛", "🤪", "😜", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰"],
  "👍": ["👍", "👎", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "👋", "🤚", "🖐️", "✋", "🖖", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💪", "🦾", "🦿"],
  "❤️": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟"],
  "🎉": ["🎉", "🎊", "🎁", "🎈", "🏆", "🥇", "🥈", "🥉", "⚽", "🏀", "🎮", "🎲", "🎯", "🎵", "🎶", "🔔", "📣", "💡", "🔥", "⭐", "🌟", "✨", "💫", "🌈", "☀️", "🌙", "⚡", "💥", "💢", "💯"],
  "🍕": ["🍕", "🍔", "🍟", "🌭", "🍿", "🧀", "🥓", "🥚", "🍳", "🥞", "🧇", "🥐", "🍞", "🥖", "🥨", "🧁", "🍰", "🎂", "🍩", "🍪", "🍫", "🍬", "🍭", "🍮", "🍯", "🍼", "☕", "🍵", "🧃", "🥤"],
}

// Sticker packs (using emojis as stickers for simplicity)
const STICKER_PACKS = {
  "Cute": ["🐱", "🐶", "🐰", "🦊", "🐻", "🐼", "🐨", "🦁", "🐯", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🦆", "🦅", "🦉", "🦋"],
  "Love": ["💕", "💖", "💗", "💓", "💞", "💘", "💝", "😍", "🥰", "😘", "💋", "🌹", "🌸", "💐", "🎀", "💑", "👫", "👬", "👭", "💏"],
  "Fun": ["🎉", "🎊", "🥳", "🎈", "🎁", "🎂", "🍾", "🥂", "🎵", "🎶", "💃", "🕺", "🎤", "🎸", "🎮", "🎲", "🎯", "🏆", "🥇", "⭐"],
  "Work": ["💻", "📱", "⌨️", "🖥️", "🖨️", "📂", "📁", "📋", "📊", "📈", "📉", "✏️", "📝", "✅", "❌", "💡", "🔍", "📧", "📞", "🗓️"],
}

// Popular GIFs (static URLs for demo - in production, use GIPHY API)
const TRENDING_GIFS = [
  "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif",
  "https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif",
  "https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif",
  "https://media.giphy.com/media/xT1XGWbE0XiBDX2T8Q/giphy.gif",
  "https://media.giphy.com/media/3o7TKoWXm3okO1kgHC/giphy.gif",
  "https://media.giphy.com/media/xT5LMHxhOfscxPfIfm/giphy.gif",
]

interface MediaPickerProps {
  onSelectEmoji: (emoji: string) => void
  onSelectGif: (gifUrl: string) => void
  onSelectSticker: (sticker: string) => void
  trigger?: React.ReactNode
}

export function MediaPicker({ onSelectEmoji, onSelectGif, onSelectSticker, trigger }: MediaPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState("emoji")
  const [emojiCategory, setEmojiCategory] = useState("😀")
  const [stickerPack, setStickerPack] = useState("Cute")
  const [gifSearch, setGifSearch] = useState("")
  const [gifs, setGifs] = useState<string[]>(TRENDING_GIFS)
  const [loadingGifs, setLoadingGifs] = useState(false)

  const emojis = EMOJI_CATEGORIES[emojiCategory as keyof typeof EMOJI_CATEGORIES] || []
  const stickers = STICKER_PACKS[stickerPack as keyof typeof STICKER_PACKS] || []

  // Search GIFs using GIPHY API (simplified - uses trending for demo)
  useEffect(() => {
    if (!gifSearch.trim()) {
      setGifs(TRENDING_GIFS)
      return
    }
    // In production, call GIPHY API here
    setLoadingGifs(true)
    // Simulate API call delay
    const timer = setTimeout(() => {
      setGifs(TRENDING_GIFS) // Would be search results in production
      setLoadingGifs(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [gifSearch])

  const handleEmojiSelect = (emoji: string) => {
    onSelectEmoji(emoji)
    setIsOpen(false)
  }

  const handleGifSelect = (gifUrl: string) => {
    onSelectGif(gifUrl)
    setIsOpen(false)
  }

  const handleStickerSelect = (sticker: string) => {
    onSelectSticker(sticker)
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="outline" size="icon">
            <IconMoodSmile className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-10">
            <TabsTrigger value="emoji" className="gap-1">
              <IconMoodSmile className="h-4 w-4" /> Emoji
            </TabsTrigger>
            <TabsTrigger value="gif" className="gap-1">
              <IconGif className="h-4 w-4" /> GIF
            </TabsTrigger>
            <TabsTrigger value="sticker" className="gap-1">
              <IconSticker className="h-4 w-4" /> Sticker
            </TabsTrigger>
          </TabsList>

          {/* Emoji Tab */}
          <TabsContent value="emoji" className="p-2 m-0">
            <div className="flex gap-1 mb-2 justify-center flex-wrap">
              {Object.keys(EMOJI_CATEGORIES).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setEmojiCategory(cat)}
                  className={`text-lg p-1 rounded transition-colors ${emojiCategory === cat ? "bg-primary/20 ring-1 ring-primary" : "hover:bg-muted"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <ScrollArea className="h-40">
              <div className="grid grid-cols-8 gap-0.5">
                {emojis.map((emoji, idx) => (
                  <button key={`${emoji}-${idx}`} onClick={() => handleEmojiSelect(emoji)} className="text-xl hover:bg-muted rounded p-1 transition-colors hover:scale-110">
                    {emoji}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* GIF Tab */}
          <TabsContent value="gif" className="p-2 m-0">
            <div className="relative mb-2">
              <IconSearch className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search GIFs..." value={gifSearch} onChange={(e) => setGifSearch(e.target.value)} className="pl-8 h-8" />
            </div>
            <ScrollArea className="h-40">
              {loadingGifs ? (
                <div className="flex items-center justify-center h-full"><IconLoader2 className="h-6 w-6 animate-spin" /></div>
              ) : (
                <div className="grid grid-cols-2 gap-1">
                  {gifs.map((gif, idx) => (
                    <img key={idx} src={gif} alt="GIF" className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleGifSelect(gif)} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Sticker Tab */}
          <TabsContent value="sticker" className="p-2 m-0">
            <div className="flex gap-1 mb-2 justify-center flex-wrap">
              {Object.keys(STICKER_PACKS).map((pack) => (
                <button key={pack} onClick={() => setStickerPack(pack)} className={`text-xs px-2 py-1 rounded transition-colors ${stickerPack === pack ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}>
                  {pack}
                </button>
              ))}
            </div>
            <ScrollArea className="h-40">
              <div className="grid grid-cols-5 gap-1">
                {stickers.map((sticker, idx) => (
                  <button key={`${sticker}-${idx}`} onClick={() => handleStickerSelect(sticker)} className="text-3xl hover:bg-muted rounded p-2 transition-colors hover:scale-110">
                    {sticker}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}

