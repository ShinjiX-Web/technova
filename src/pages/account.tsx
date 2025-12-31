import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "@/components/ui/theme-provider"
import { supabase } from "@/lib/supabase"
import Swal from "sweetalert2"
import { IconArrowLeft, IconLoader2, IconCamera, IconTrash } from "@tabler/icons-react"

// Helper to get SweetAlert theme options
const getSwalTheme = (isDark: boolean) => ({
  background: isDark ? '#171717' : '#ffffff',
  color: isDark ? '#ffffff' : '#171717',
  confirmButtonColor: isDark ? '#3b82f6' : '#2563eb',
})

export default function AccountPage() {
  const navigate = useNavigate()
  const { user, updateUserProfile } = useAuth()
  const { theme } = useTheme()
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Determine if we're in dark mode
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    avatar_url: "",
  })

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: "error",
        title: "Invalid File",
        text: "Please upload an image file.",
        ...getSwalTheme(isDark),
      })
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        icon: "error",
        title: "File Too Large",
        text: "Please upload an image smaller than 2MB.",
        ...getSwalTheme(isDark),
      })
      return
    }

    setIsUploadingAvatar(true)
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update the form data with the new avatar URL
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }))

      Swal.fire({
        icon: "success",
        title: "Avatar Uploaded",
        text: "Your profile picture has been updated. Click Save to confirm.",
        timer: 2000,
        showConfirmButton: false,
        ...getSwalTheme(isDark),
      })
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: error.message || "Failed to upload avatar",
        ...getSwalTheme(isDark),
      })
    } finally {
      setIsUploadingAvatar(false)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveAvatar = () => {
    setFormData(prev => ({ ...prev, avatar_url: '' }))
  }

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        avatar_url: user.avatar || "",
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!user) return
    
    setIsSaving(true)
    try {
      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: formData.name,
          email: formData.email,
          avatar_url: formData.avatar_url,
          updated_at: new Date().toISOString(),
        })

      if (error) {
        throw error
      }

      // Also update user metadata in auth
      await supabase.auth.updateUser({
        data: {
          name: formData.name,
          full_name: formData.name,
          avatar_url: formData.avatar_url,
        }
      })

      // Update the auth context for real-time UI updates (sidebar avatar, etc.)
      updateUserProfile({
        name: formData.name,
        avatar: formData.avatar_url,
      })

      Swal.fire({
        icon: "success",
        title: "Profile Updated",
        text: "Your account information has been saved.",
        timer: 2000,
        showConfirmButton: false,
        ...getSwalTheme(isDark),
      })
    } catch (error: any) {
      console.error('Error saving profile:', error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Failed to save profile",
        ...getSwalTheme(isDark),
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
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
        <div className="flex flex-1 flex-col">
          <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-2xl">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-fit"
              onClick={() => navigate("/dashboard")}
            >
              <IconArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>

            {/* Account Header */}
            <div>
              <h1 className="text-2xl font-bold">Account Settings</h1>
              <p className="text-muted-foreground">
                Manage your account information and preferences
              </p>
            </div>

            {/* Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal details and profile picture
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={formData.avatar_url} alt={formData.name} />
                      <AvatarFallback className="text-lg">
                        {getInitials(formData.name || "U")}
                      </AvatarFallback>
                    </Avatar>
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                        <IconLoader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Profile Picture</Label>
                    <div className="flex gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        id="avatar-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                      >
                        <IconCamera className="mr-2 h-4 w-4" />
                        {isUploadingAvatar ? "Uploading..." : "Upload Photo"}
                      </Button>
                      {formData.avatar_url && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveAvatar}
                          disabled={isUploadingAvatar}
                        >
                          <IconTrash className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG or GIF. Max size 2MB.
                    </p>
                  </div>
                </div>

                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed. Contact support if you need to update it.
                  </p>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Account Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Details about your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Account ID</span>
                  <span className="font-mono text-sm">{user?.id?.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Login Provider</span>
                  <span className="capitalize">{user?.provider || "Email"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

