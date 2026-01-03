import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  IconSearch,
  IconFilter,
  IconFile,
  IconFolder,
  IconUsers,
  IconChartBar,
  IconClock,
} from "@tabler/icons-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SearchResult {
  id: string
  title: string
  type: "document" | "folder" | "team" | "report"
  description: string
  date: string
  path: string
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [hasSearched, setHasSearched] = useState(false)

  const [results] = useState<SearchResult[]>([
    { id: "1", title: "Q4 Financial Report", type: "document", description: "Annual financial summary for Q4 2024", date: "2024-01-15", path: "/data-library/finance" },
    { id: "2", title: "Marketing Team", type: "team", description: "Marketing department members", date: "2024-01-14", path: "/team/marketing" },
    { id: "3", title: "Project Archives", type: "folder", description: "Archived project documents", date: "2024-01-13", path: "/data-library/archives" },
    { id: "4", title: "Monthly Analytics", type: "report", description: "Website traffic and user engagement", date: "2024-01-12", path: "/reports/analytics" },
    { id: "5", title: "Brand Guidelines.pdf", type: "document", description: "Company brand standards", date: "2024-01-11", path: "/data-library/brand" },
    { id: "6", title: "Sales Performance Report", type: "report", description: "Q4 sales metrics", date: "2024-01-10", path: "/reports/sales" },
  ])

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "document": return <IconFile className="h-5 w-5 text-blue-500" />
      case "folder": return <IconFolder className="h-5 w-5 text-amber-500" />
      case "team": return <IconUsers className="h-5 w-5 text-green-500" />
      case "report": return <IconChartBar className="h-5 w-5 text-purple-500" />
    }
  }

  const filteredResults = results.filter(result => {
    const matchesSearch = result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === "all" || result.type === filter
    return matchesSearch && matchesFilter
  })

  const handleSearch = () => {
    setHasSearched(true)
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
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 max-w-4xl mx-auto w-full">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
              <IconSearch className="h-6 w-6" />
              Search
            </h1>
            <p className="text-muted-foreground">Find documents, files, teams, and more</p>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search everything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9 h-11"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[140px] h-11">
                <IconFilter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
                <SelectItem value="folder">Folders</SelectItem>
                <SelectItem value="team">Teams</SelectItem>
                <SelectItem value="report">Reports</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} className="h-11">Search</Button>
          </div>

          {/* Results */}
          {hasSearched && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{filteredResults.length} results found</p>
              {filteredResults.map((result) => (
                <Card key={result.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {getIcon(result.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{result.title}</h3>
                          <Badge variant="secondary" className="text-xs capitalize">{result.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{result.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><IconClock className="h-3 w-3" />{result.date}</span>
                          <span>{result.path}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredResults.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <IconSearch className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No results found. Try different keywords.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {!hasSearched && (
            <Card className="mt-8">
              <CardContent className="p-8 text-center">
                <IconSearch className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Enter a search term and press Enter or click Search</p>
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

