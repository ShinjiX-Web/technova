import { useState, useRef, useEffect, createContext, useContext } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { IconSend, IconRobot, IconUser, IconMessageCircle, IconX } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

// Context for controlling the floating chat from other components
interface LiveChatContextType {
  openChat: () => void
  closeChat: () => void
  isOpen: boolean
}

const LiveChatContext = createContext<LiveChatContextType | null>(null)

export function useLiveChat() {
  const context = useContext(LiveChatContext)
  if (!context) {
    throw new Error("useLiveChat must be used within a LiveChatProvider")
  }
  return context
}

// Knowledge base for the chatbot
const KNOWLEDGE_BASE = [
  { keywords: ["password", "reset", "forgot"], answer: "To reset your password, go to Settings > Security > Change Password. If you're locked out, use the 'Forgot Password' link on the login page to receive a reset email." },
  { keywords: ["invite", "team", "member", "add"], answer: "To invite team members, navigate to the Team page and click 'Invite Member'. Enter their email address and they'll receive an invitation to join your team." },
  { keywords: ["file", "upload", "format", "type"], answer: "We support PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, and common image formats (JPG, PNG, GIF). You can upload files in the Data Library section." },
  { keywords: ["export", "data", "download"], answer: "To export your data, go to Settings > Data Management > Export Data. You can choose from CSV, JSON, or PDF format." },
  { keywords: ["security", "secure", "encrypt", "safe"], answer: "Yes, your data is secure! We use industry-standard AES-256 encryption for data at rest and TLS 1.3 for data in transit. We also support multi-factor authentication for added security." },
  { keywords: ["cancel", "subscription", "unsubscribe"], answer: "To cancel your subscription, go to Billing > Manage Subscription > Cancel. Your access will continue until the end of your current billing period." },
  { keywords: ["billing", "payment", "charge", "invoice"], answer: "You can manage your billing in the Billing section. View invoices, update payment methods, and change your subscription plan there." },
  { keywords: ["chat", "message", "team chat"], answer: "The Team Chat feature lets you communicate with your team in real-time. You can send messages, share files, and even have private conversations with individual members." },
  { keywords: ["notification", "alert"], answer: "You can customize your notifications in Settings > Notifications. Choose which events trigger emails and in-app notifications." },
  { keywords: ["account", "profile", "settings"], answer: "Manage your account settings by clicking on your profile in the sidebar and selecting 'Account'. You can update your name, email, avatar, and more." },
  { keywords: ["pricing", "plan", "upgrade", "cost"], answer: "We offer flexible pricing plans. Visit the Billing section to see available plans and upgrade options. Contact sales for enterprise pricing." },
  { keywords: ["hello", "hi", "hey", "greet"], answer: "Hello! 👋 I'm your Technova support assistant. How can I help you today? Feel free to ask about any features, billing, or technical issues." },
  { keywords: ["thank", "thanks", "appreciate"], answer: "You're welcome! 😊 Is there anything else I can help you with?" },
  { keywords: ["ok", "okay", "alright", "got it", "i see", "understood", "cool", "nice", "great", "good", "sure", "yep", "yes", "no", "nope"], answer: "Is there anything else I can help you with? 😊" },
  { keywords: ["bye", "goodbye", "see you", "later", "done", "that's all", "nothing"], answer: "Goodbye! 👋 Feel free to come back anytime if you have more questions. Have a great day!" },
  { keywords: ["live", "human", "agent", "person", "real", "support", "help", "contact", "talk", "speak", "representative", "staff", "email"], answer: "I'd be happy to connect you with our support team! 📧 Please send an email to support@technova.com and our team will get back to you within 24 hours. Include your account email and a description of your issue for faster assistance." },
]

function findAnswer(query: string): string {
  const lowerQuery = query.toLowerCase()

  for (const item of KNOWLEDGE_BASE) {
    if (item.keywords.some(keyword => lowerQuery.includes(keyword))) {
      return item.answer
    }
  }

  return "I'm not sure about that specific question. For personalized assistance, please email our support team at support@technova.com and we'll be happy to help! 📧"
}

const BOT_AVATAR = "/bot.jpg"

// Global floating chat widget with context provider
export function FloatingLiveChat({ children }: { children?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openChat = () => setIsOpen(true)
  const closeChat = () => setIsOpen(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi there! 👋 I'm your Technova support assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    // Re-focus input after sending
    setTimeout(() => inputRef.current?.focus(), 50)

    // Simulate AI thinking delay
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700))

    const answer = findAnswer(userMessage.content)

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: answer,
      timestamp: new Date(),
    }

    setIsTyping(false)
    setMessages((prev) => [...prev, assistantMessage])

    // Re-focus input after bot responds
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <LiveChatContext.Provider value={{ openChat, closeChat, isOpen }}>
      {children}
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center",
          "bg-primary text-primary-foreground hover:scale-110 hover:shadow-xl",
          isOpen && "rotate-90"
        )}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? (
          <IconX className="h-6 w-6" />
        ) : (
          <IconMessageCircle className="h-6 w-6" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] h-[500px] bg-background border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b bg-primary/5 flex-shrink-0">
            <div className="relative">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarImage src={BOT_AVATAR} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <IconRobot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Live Support</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Online now
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <IconX className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages Area - Fixed height with overflow scroll */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            <div className="flex flex-col gap-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 max-w-[85%]",
                    message.role === "user" ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    {message.role === "assistant" ? (
                      <>
                        <AvatarImage src={BOT_AVATAR} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <IconRobot className="h-4 w-4" />
                        </AvatarFallback>
                      </>
                    ) : (
                      <AvatarFallback className="bg-muted">
                        <IconUser className="h-4 w-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2 text-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-3 max-w-[85%]">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={BOT_AVATAR} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <IconRobot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area - Fixed at bottom */}
          <div className="p-4 border-t bg-background flex-shrink-0">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={isTyping}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isTyping}
                size="icon"
              >
                <IconSend className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Powered by Technova AI
            </p>
          </div>
        </div>
      )}
    </LiveChatContext.Provider>
  )
}

