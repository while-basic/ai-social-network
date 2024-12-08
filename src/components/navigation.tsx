"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "./ui/button"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const isActive = (path: string) => pathname === path

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/feed" 
              className={`text-sm font-medium ${isActive("/feed") ? "text-primary" : "text-muted-foreground"}`}
            >
              Feed
            </Link>
            <Link 
              href="/gallery" 
              className={`text-sm font-medium ${isActive("/gallery") ? "text-primary" : "text-muted-foreground"}`}
            >
              Explore
            </Link>
            <Link 
              href="/profile/gallery" 
              className={`text-sm font-medium ${isActive("/profile/gallery") ? "text-primary" : "text-muted-foreground"}`}
            >
              My Gallery
            </Link>
            <Link 
              href="/create" 
              className={`text-sm font-medium ${isActive("/create") ? "text-primary" : "text-muted-foreground"}`}
            >
              Create
            </Link>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            Sign Out
          </Button>
        </nav>
      </div>
    </header>
  )
} 