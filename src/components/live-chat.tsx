import { useState, useRef, useEffect, createContext, useContext } from "react"
import { Button } from "@/components/ui/button"
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
    return { openChat: () => {}, closeChat: () => {}, isOpen: false }
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
const STORAGE_KEY = "technova-chat-messages"

// Quick reply suggestions
const QUICK_REPLIES = [
  "How do I reset my password?",
  "How can I invite team members?",
  "What file types are supported?",
  "Talk to a human",
]

// Format time for display
function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Global floating chat widget with context provider
export function FloatingLiveChat({ children }: { children?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(true)

  const openChat = () => { setIsOpen(true); setIsMinimized(false); setHasUnread(false) }
  const closeChat = () => setIsOpen(false)

  // Load messages from session storage
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return parsed.map((m: Message) => ({ ...m, timestamp: new Date(m.timestamp) }))
      }
    } catch { /* ignore */ }
    return [{
      id: "welcome",
      role: "assistant" as const,
      content: "Hi there! 👋 I'm Nova, your Technova support assistant. How can I help you today?",
      timestamp: new Date(),
    }]
  })

  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Save messages to session storage
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, isMinimized])

  // Escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [isOpen])

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim()
    if (!messageText) return

    setShowQuickReplies(false)

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    setTimeout(() => inputRef.current?.focus(), 50)

    // Simulate AI thinking delay (variable based on response length)
    await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 800))

    const answer = findAnswer(userMessage.content)

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: answer,
      timestamp: new Date(),
    }

    setIsTyping(false)
    setMessages((prev) => [...prev, assistantMessage])

    // Show unread indicator if minimized
    if (isMinimized) {
      setHasUnread(true)
    }

    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const lastMessage = messages[messages.length - 1]

  return (
    <LiveChatContext.Provider value={{ openChat, closeChat, isOpen }}>
      {children}

      {/* Floating Button with notification badge */}
      <button
        onClick={() => {
          if (isOpen && !isMinimized) {
            setIsOpen(false)
          } else {
            openChat()
          }
        }}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center group",
          "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground hover:shadow-xl hover:shadow-primary/25",
          "hover:scale-105 active:scale-95",
          isOpen && !isMinimized && "scale-0 opacity-0"
        )}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        <IconMessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
        {hasUnread && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 border-2 border-background animate-pulse" />
        )}
        {/* Pulse ring effect */}
        <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
      </button>

      {/* Minimized Preview Bar */}
      {isOpen && isMinimized && (
        <button
          onClick={() => { setIsMinimized(false); setHasUnread(false) }}
          className="fixed bottom-6 right-6 z-50 w-[320px] bg-background border rounded-2xl shadow-2xl p-3 flex items-center gap-3 hover:shadow-xl transition-all animate-in slide-in-from-bottom-2 duration-200"
        >
          <div className="relative flex-shrink-0">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarImage src={BOT_AVATAR} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                <IconRobot className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="font-medium text-sm">Nova</p>
            <p className="text-xs text-muted-foreground truncate">
              {lastMessage?.content.slice(0, 40)}...
            </p>
          </div>
          {hasUnread && (
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && !isMinimized && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[550px] bg-background border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 zoom-in-95 duration-300">
          {/* Header with gradient */}
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b flex-shrink-0">
            <div className="relative">
              <Avatar className="h-11 w-11 border-2 border-primary/20 ring-2 ring-primary/10 ring-offset-2 ring-offset-background">
                <AvatarImage src={BOT_AVATAR} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                  <IconRobot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base">Nova</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Always online
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-muted"
                onClick={() => setIsMinimized(true)}
                title="Minimize"
              >
                <span className="h-0.5 w-4 bg-current rounded" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                <IconX className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0 bg-gradient-to-b from-muted/20 to-transparent">
            <div className="flex flex-col gap-3">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2.5 max-w-[88%] animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
                    message.role === "user" ? "ml-auto flex-row-reverse" : ""
                  )}
                  style={{ animationDelay: index === messages.length - 1 ? "0ms" : "0ms" }}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
                      <AvatarImage src={BOT_AVATAR} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs">
                        <IconRobot className="h-3.5 w-3.5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex flex-col gap-1">
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                        message.role === "user"
                          ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-md shadow-sm"
                          : "bg-muted/80 rounded-bl-md border border-border/50"
                      )}
                    >
                      {message.content}
                    </div>
                    <span className={cn(
                      "text-[10px] text-muted-foreground/60 px-1",
                      message.role === "user" ? "text-right" : "text-left"
                    )}>
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  {message.role === "user" && (
                    <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                        <IconUser className="h-3.5 w-3.5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-2.5 max-w-[88%] animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
                  <Avatar className="h-7 w-7 flex-shrink-0">
                    <AvatarImage src={BOT_AVATAR} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs">
                      <IconRobot className="h-3.5 w-3.5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted/80 rounded-2xl rounded-bl-md px-4 py-3 border border-border/50">
                    <div className="flex gap-1.5 items-center">
                      <span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Replies - Show only after welcome message */}
              {showQuickReplies && messages.length === 1 && !isTyping && (
                <div className="flex flex-wrap gap-2 mt-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-500">
                  {QUICK_REPLIES.map((reply) => (
                    <button
                      key={reply}
                      onClick={() => sendMessage(reply)}
                      className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-colors"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t bg-background/80 backdrop-blur-sm flex-shrink-0">
            <div className="flex gap-2 items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={isTyping}
                className="flex-1 px-4 py-2.5 rounded-full border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 transition-all"
              />
              <Button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isTyping}
                size="icon"
                className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/80 hover:opacity-90 shadow-sm disabled:opacity-50"
              >
                <IconSend className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/60 mt-2 text-center">
              Powered by Technova AI • Press Esc to close
            </p>
          </div>
        </div>
      )}
    </LiveChatContext.Provider>
  )
}
