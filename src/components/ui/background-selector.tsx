import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  IconPalette,
  IconWaveSine,
  IconSparkles,
  IconPlanet,
  IconBan,
  IconCheck,
  IconRainbow,
  IconMountain,
} from "@tabler/icons-react"
import { getStoredBackgroundType, setStoredBackgroundType } from "./interactive-background"
import type { BackgroundType } from "./interactive-background"

interface BackgroundSelectorProps {
  onBackgroundChange?: (type: BackgroundType) => void
}

const BACKGROUND_OPTIONS: { value: BackgroundType; label: string; icon: React.ReactNode; description: string }[] = [
  { value: "classic-waves", label: "Classic Waves", icon: <IconWaveSine className="h-4 w-4" />, description: "Original wave animation" },
  { value: "waves", label: "Interactive Waves", icon: <IconWaveSine className="h-4 w-4" />, description: "Mouse-reactive waves" },
  { value: "particles", label: "Floating Particles", icon: <IconSparkles className="h-4 w-4" />, description: "Floating 3D particles" },
  { value: "galaxy", label: "Galaxy Spiral", icon: <IconPlanet className="h-4 w-4" />, description: "Colorful galaxy effect" },
  { value: "aurora", label: "Aurora Borealis", icon: <IconRainbow className="h-4 w-4" />, description: "Northern lights effect" },
  { value: "mesh", label: "Mesh Landscape", icon: <IconMountain className="h-4 w-4" />, description: "Animated wireframe terrain" },
  { value: "none", label: "No Background", icon: <IconBan className="h-4 w-4" />, description: "Disable animation" },
]

export function BackgroundSelector({ onBackgroundChange }: BackgroundSelectorProps) {
  const [selected, setSelected] = useState<BackgroundType>(getStoredBackgroundType)

  const handleSelect = (type: BackgroundType) => {
    setSelected(type)
    setStoredBackgroundType(type)
    onBackgroundChange?.(type)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-6 left-6 z-50 h-12 w-12 rounded-full shadow-lg bg-background/80 backdrop-blur-sm border-2 hover:scale-110 transition-transform"
          title="Change Background"
        >
          <IconPalette className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 mb-2 max-h-[70vh] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center gap-2 sticky top-0 bg-popover z-10">
          <IconPalette className="h-4 w-4" />
          Background Style
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {BACKGROUND_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className="flex items-center gap-3 py-2.5 cursor-pointer"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              {option.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{option.label}</p>
              <p className="text-xs text-muted-foreground">{option.description}</p>
            </div>
            {selected === option.value && (
              <IconCheck className="h-4 w-4 text-primary flex-shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

