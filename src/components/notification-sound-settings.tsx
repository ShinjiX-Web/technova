import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { IconVolume, IconVolumeOff, IconPlayerPlay } from "@tabler/icons-react"
import {
  NOTIFICATION_SOUNDS,
  getSelectedSoundId,
  setSelectedSoundId,
  previewSound,
} from "@/lib/notification-sounds"

interface NotificationSoundSettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationSoundSettings({
  open,
  onOpenChange,
}: NotificationSoundSettingsProps) {
  const [selectedSound, setSelectedSound] = useState<string>(getSelectedSoundId())

  // Load saved preference when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedSound(getSelectedSoundId())
    }
  }, [open])

  const handleSoundChange = (soundId: string) => {
    setSelectedSound(soundId)
    setSelectedSoundId(soundId)
    // Auto-preview when selecting
    if (soundId !== "none") {
      previewSound(soundId)
    }
  }

  const handlePreview = (soundId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    previewSound(soundId)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconVolume className="h-5 w-5" />
            Notification Sound
          </DialogTitle>
          <DialogDescription>
            Choose a notification sound for incoming messages. This applies to both team and private messages.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup
            value={selectedSound}
            onValueChange={handleSoundChange}
            className="space-y-3"
          >
            {NOTIFICATION_SOUNDS.map((sound) => (
              <div
                key={sound.id}
                className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors ${
                  selectedSound === sound.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
                onClick={() => handleSoundChange(sound.id)}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value={sound.id} id={sound.id} />
                  <div className="flex flex-col gap-0.5">
                    <Label
                      htmlFor={sound.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      {sound.id === "none" ? (
                        <IconVolumeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <IconVolume className="h-4 w-4 text-muted-foreground" />
                      )}
                      {sound.name}
                    </Label>
                    <span className="text-xs text-muted-foreground ml-6">{sound.description}</span>
                  </div>
                </div>
                {sound.id !== "none" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handlePreview(sound.id, e)}
                    className="h-8 w-8 p-0"
                    title="Preview sound"
                  >
                    <IconPlayerPlay className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

