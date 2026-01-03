import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  IconFileWord,
  IconWand,
  IconSparkles,
  IconClipboard,
  IconHistory,
  IconLanguage,
  IconPencil,
  IconCheck,
  IconAlertCircle,
} from "@tabler/icons-react"

interface Template {
  id: string
  name: string
  description: string
  icon: React.ReactNode
}

export default function WordAssistantPage() {
  const [inputText, setInputText] = useState("")
  const [outputText, setOutputText] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const templates: Template[] = [
    { id: "improve", name: "Improve Writing", description: "Enhance clarity and flow", icon: <IconPencil className="h-5 w-5" /> },
    { id: "summarize", name: "Summarize", description: "Create a concise summary", icon: <IconClipboard className="h-5 w-5" /> },
    { id: "grammar", name: "Fix Grammar", description: "Correct errors and typos", icon: <IconCheck className="h-5 w-5" /> },
    { id: "translate", name: "Translate", description: "Convert to another language", icon: <IconLanguage className="h-5 w-5" /> },
    { id: "formal", name: "Make Formal", description: "Professional tone", icon: <IconFileWord className="h-5 w-5" /> },
    { id: "creative", name: "Make Creative", description: "Add flair and style", icon: <IconSparkles className="h-5 w-5" /> },
  ]

  const handleProcess = (templateId: string) => {
    if (!inputText.trim()) return
    setIsProcessing(true)
    // Simulate AI processing
    setTimeout(() => {
      setOutputText(`[${templateId.toUpperCase()}] Processed version of your text:\n\n${inputText}`)
      setIsProcessing(false)
    }, 1500)
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <IconFileWord className="h-6 w-6" />
                Word Assistant
              </h1>
              <p className="text-muted-foreground">
                AI-powered writing tools to enhance your documents
              </p>
            </div>
            <Button variant="outline">
              <IconHistory className="h-4 w-4 mr-2" />
              History
            </Button>
          </div>

          {/* Quick Templates */}
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
            {templates.map((template) => (
              <Card 
                key={template.id} 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleProcess(template.id)}
              >
                <CardContent className="p-4 text-center">
                  <div className="mx-auto mb-2 w-fit p-2 rounded-lg bg-primary/10">
                    {template.icon}
                  </div>
                  <p className="font-medium text-sm">{template.name}</p>
                  <p className="text-xs text-muted-foreground">{template.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Editor */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">Input</CardTitle>
                <CardDescription>Paste or type your text here</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <Textarea
                  placeholder="Enter your text here..."
                  className="min-h-[300px] resize-none"
                  value={inputText}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputText(e.target.value)}
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">{inputText.length} characters</span>
                  <Button onClick={() => handleProcess("improve")} disabled={!inputText.trim() || isProcessing}>
                    <IconWand className="h-4 w-4 mr-2" />
                    {isProcessing ? "Processing..." : "Process"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Output
                  {isProcessing && <Badge variant="secondary">Processing...</Badge>}
                </CardTitle>
                <CardDescription>AI-enhanced result</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <Textarea
                  placeholder="Your processed text will appear here..."
                  className="min-h-[300px] resize-none"
                  value={outputText}
                  readOnly
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">{outputText.length} characters</span>
                  <Button variant="outline" onClick={() => navigator.clipboard.writeText(outputText)} disabled={!outputText}>
                    <IconClipboard className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tips */}
          <Card className="bg-muted/30">
            <CardContent className="p-4 flex items-start gap-3">
              <IconAlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Tips for best results</p>
                <p className="text-sm text-muted-foreground">
                  Provide clear, well-structured input text. The AI works best with complete sentences and paragraphs.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

