"use client"

import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, PlusSquare, User, ImageIcon, ArrowLeft } from "lucide-react"
import Link from "next/link"

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const isAuthPage = pathname === '/login' || pathname === '/register'

  const getTitle = () => {
    switch (pathname) {
      case '/':
        return 'AI Social Network'
      case '/feed':
        return 'Feed'
      case '/create':
        return 'Create'
      case '/profile':
        return 'Profile'
      case '/login':
        return 'Login'
      case '/register':
        return 'Register'
      default:
        if (pathname.startsWith('/profile/')) {
          return 'Profile'
        }
        return 'AI Social Network'
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-2xl items-center justify-between">
        <div className="flex items-center gap-2">
          {pathname !== '/' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to Home</span>
            </Button>
          )}
          <div className="font-bold">{getTitle()}</div>
        </div>
        <div className="flex items-center gap-2">
          {!isAuthPage && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/create')}
              >
                <PlusSquare className="h-5 w-5" />
                <span className="ml-2 hidden sm:inline">Create</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/profile')}
              >
                <User className="h-5 w-5" />
                <span className="ml-2 hidden sm:inline">Profile</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export function Footer() {
  const pathname = usePathname()
  const isAuthPage = pathname === '/login' || pathname === '/register'

  if (isAuthPage) return null

  return (
    <footer className="sticky bottom-0 z-50 w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-2xl items-center">
        <nav className="flex w-full justify-around">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="flex-col h-auto py-2"
          >
            <Link href="/">
              <Home className="h-5 w-5" />
              <span className="text-xs mt-1">Home</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="flex-col h-auto py-2"
          >
            <Link href="/feed">
              <ImageIcon className="h-5 w-5" />
              <span className="text-xs mt-1">Feed</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="flex-col h-auto py-2"
          >
            <Link href="/create">
              <PlusSquare className="h-5 w-5" />
              <span className="text-xs mt-1">Create</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="flex-col h-auto py-2"
          >
            <Link href="/profile">
              <User className="h-5 w-5" />
              <span className="text-xs mt-1">Profile</span>
            </Link>
          </Button>
        </nav>
      </div>
    </footer>
  )
} 