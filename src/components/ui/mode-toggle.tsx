import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/ui/theme-provider"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    // console.log("Toggling theme from", theme, "to", newTheme)
    setTheme(newTheme)
  }

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme} title={`Current theme: ${theme}`} className="cursor-pointer">
      <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme (current: {theme})</span>
    </Button>
  )
}