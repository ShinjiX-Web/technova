// Notification sound options for chat messages
// Using Web Audio API to generate Slack-like sounds

export interface NotificationSound {
  id: string
  name: string
  description: string
}

// Collection of notification sounds (Slack-inspired)
export const NOTIFICATION_SOUNDS: NotificationSound[] = [
  { id: "knock", name: "Knock Brush", description: "Classic Slack knock sound" },
  { id: "ding", name: "Ding", description: "Simple notification ding" },
  { id: "here_you_go", name: "Here You Go", description: "Friendly two-tone alert" },
  { id: "plink", name: "Plink", description: "Water drop sound" },
  { id: "wow", name: "Wow", description: "Ascending alert" },
  { id: "yoink", name: "Yoink", description: "Playful pop" },
  { id: "none", name: "None (Muted)", description: "No notification sound" },
]

// Storage key for selected sound
const STORAGE_KEY = "chat_notification_sound"

// Audio context singleton
let audioContext: AudioContext | null = null

function ensureAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext()
  }
  // Resume if suspended (browsers require user interaction)
  if (audioContext.state === "suspended") {
    audioContext.resume()
  }
  return audioContext
}

// Sound generator functions (Slack-inspired sounds)
function playKnock(ctx: AudioContext) {
  const now = ctx.currentTime

  // First knock
  const osc1 = ctx.createOscillator()
  const gain1 = ctx.createGain()
  osc1.type = "sine"
  osc1.frequency.setValueAtTime(800, now)
  osc1.frequency.exponentialRampToValueAtTime(400, now + 0.1)
  gain1.gain.setValueAtTime(0.3, now)
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
  osc1.connect(gain1).connect(ctx.destination)
  osc1.start(now)
  osc1.stop(now + 0.1)

  // Second knock
  const osc2 = ctx.createOscillator()
  const gain2 = ctx.createGain()
  osc2.type = "sine"
  osc2.frequency.setValueAtTime(600, now + 0.15)
  osc2.frequency.exponentialRampToValueAtTime(300, now + 0.25)
  gain2.gain.setValueAtTime(0.25, now + 0.15)
  gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.25)
  osc2.connect(gain2).connect(ctx.destination)
  osc2.start(now + 0.15)
  osc2.stop(now + 0.25)
}

function playDing(ctx: AudioContext) {
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = "sine"
  osc.frequency.setValueAtTime(880, now)
  gain.gain.setValueAtTime(0.3, now)
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5)
  osc.connect(gain).connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.5)
}

function playHereYouGo(ctx: AudioContext) {
  const now = ctx.currentTime

  // First tone
  const osc1 = ctx.createOscillator()
  const gain1 = ctx.createGain()
  osc1.type = "sine"
  osc1.frequency.setValueAtTime(523.25, now) // C5
  gain1.gain.setValueAtTime(0.25, now)
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
  osc1.connect(gain1).connect(ctx.destination)
  osc1.start(now)
  osc1.stop(now + 0.15)

  // Second tone (higher)
  const osc2 = ctx.createOscillator()
  const gain2 = ctx.createGain()
  osc2.type = "sine"
  osc2.frequency.setValueAtTime(659.25, now + 0.12) // E5
  gain2.gain.setValueAtTime(0.25, now + 0.12)
  gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35)
  osc2.connect(gain2).connect(ctx.destination)
  osc2.start(now + 0.12)
  osc2.stop(now + 0.35)
}

function playPlink(ctx: AudioContext) {
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = "sine"
  osc.frequency.setValueAtTime(1800, now)
  osc.frequency.exponentialRampToValueAtTime(400, now + 0.15)
  gain.gain.setValueAtTime(0.25, now)
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
  osc.connect(gain).connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.3)
}

function playWow(ctx: AudioContext) {
  const now = ctx.currentTime
  const freqs = [392, 523.25, 659.25] // G4, C5, E5
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(freq, now + i * 0.1)
    gain.gain.setValueAtTime(0.2, now + i * 0.1)
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2)
    osc.connect(gain).connect(ctx.destination)
    osc.start(now + i * 0.1)
    osc.stop(now + i * 0.1 + 0.2)
  })
}

function playYoink(ctx: AudioContext) {
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = "triangle"
  osc.frequency.setValueAtTime(300, now)
  osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1)
  osc.frequency.exponentialRampToValueAtTime(600, now + 0.2)
  gain.gain.setValueAtTime(0.3, now)
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25)
  osc.connect(gain).connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.25)
}

// Map sound IDs to their play functions
const soundPlayers: Record<string, (ctx: AudioContext) => void> = {
  knock: playKnock,
  ding: playDing,
  here_you_go: playHereYouGo,
  plink: playPlink,
  wow: playWow,
  yoink: playYoink,
}

// Get the current selected sound ID
export function getSelectedSoundId(): string {
  if (typeof window === "undefined") return "knock"
  return localStorage.getItem(STORAGE_KEY) || "knock"
}

// Set the selected sound ID
export function setSelectedSoundId(soundId: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, soundId)
}

// Get the selected sound object
export function getSelectedSound(): NotificationSound {
  const id = getSelectedSoundId()
  return NOTIFICATION_SOUNDS.find((s) => s.id === id) || NOTIFICATION_SOUNDS[0]
}

// Play the notification sound
export function playNotificationSound(): void {
  const soundId = getSelectedSoundId()

  // If muted, don't play anything
  if (soundId === "none") return

  const player = soundPlayers[soundId]
  if (player) {
    try {
      const ctx = ensureAudioContext()
      player(ctx)
    } catch {
      // Ignore errors (e.g., if AudioContext not available)
    }
  }
}

// Preview a specific sound
export function previewSound(soundId: string): void {
  if (soundId === "none") return

  const player = soundPlayers[soundId]
  if (player) {
    try {
      const ctx = ensureAudioContext()
      player(ctx)
    } catch {
      // Ignore errors
    }
  }
}

