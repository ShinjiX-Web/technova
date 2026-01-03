import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  IconDatabase,
  IconSearch,
  IconUpload,
  IconFolder,
  IconFile,
  IconFileText,
  IconPhoto,
  IconDownload,
  IconTrash,
  IconDotsVertical,
} from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DataItem {
  id: string
  name: string
  type: "folder" | "document" | "image" | "spreadsheet"
  size: string
  modified: string
  tags: string[]
}

export default function DataLibraryPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const [dataItems] = useState<DataItem[]>([
    { id: "1", name: "Q4 Financial Reports", type: "folder", size: "-- ", modified: "2024-01-15", tags: ["finance", "reports"] },
    { id: "2", name: "Marketing Strategy 2024.pdf", type: "document", size: "2.4 MB", modified: "2024-01-14", tags: ["marketing"] },
    { id: "3", name: "Product Roadmap.xlsx", type: "spreadsheet", size: "1.2 MB", modified: "2024-01-13", tags: ["product", "planning"] },
    { id: "4", name: "Brand Assets", type: "folder", size: "-- ", modified: "2024-01-12", tags: ["design", "brand"] },
    { id: "5", name: "Team Photo 2024.jpg", type: "image", size: "4.5 MB", modified: "2024-01-11", tags: ["team", "photos"] },
    { id: "6", name: "Contract Template.docx", type: "document", size: "156 KB", modified: "2024-01-10", tags: ["legal", "templates"] },
    { id: "7", name: "Sales Data Q3.xlsx", type: "spreadsheet", size: "3.1 MB", modified: "2024-01-09", tags: ["sales", "data"] },
    { id: "8", name: "Project Archives", type: "folder", size: "-- ", modified: "2024-01-08", tags: ["archive"] },
  ])

  const getIcon = (type: DataItem["type"]) => {
    switch (type) {
      case "folder": return <IconFolder className="h-5 w-5 text-amber-500" />
      case "document": return <IconFileText className="h-5 w-5 text-blue-500" />
      case "image": return <IconPhoto className="h-5 w-5 text-green-500" />
      case "spreadsheet": return <IconFile className="h-5 w-5 text-emerald-500" />
    }
  }

  const filteredItems = dataItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

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
                <IconDatabase className="h-6 w-6" />
                Data Library
              </h1>
              <p className="text-muted-foreground">
                Manage and organize your documents, files, and data assets
              </p>
            </div>
            <Button>
              <IconUpload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Files Grid */}
          <Card>
            <CardHeader>
              <CardTitle>All Files</CardTitle>
              <CardDescription>{filteredItems.length} items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 cursor-pointer group"
                  >
                    {getIcon(item.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {item.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">{item.size}</span>
                    <span className="text-sm text-muted-foreground">{item.modified}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                          <IconDotsVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><IconDownload className="h-4 w-4 mr-2" />Download</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500"><IconTrash className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

