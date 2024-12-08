"use client"

import { useState, useCallback, useEffect } from "react"
import { Header, Footer } from "./navigation"
import { usePathname } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

interface PageContainerProps {
  children: React.ReactNode
  onRefresh?: () => Promise<void>
}

export function PageContainer({ children, onRefresh }: PageContainerProps) {
  const [startY, setStartY] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const pathname = usePathname()
  const isAuthPage = pathname === '/login' || pathname === '/register'
  const isHomePage = pathname === '/'

  // Reset states when pathname changes
  useEffect(() => {
    setIsRefreshing(false)
    setPullDistance(0)
  }, [pathname])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAuthPage || isHomePage) return
    setStartY(e.touches[0].pageY)
  }

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (isAuthPage || isHomePage || !onRefresh || isRefreshing || window.scrollY > 0) return

      const currentY = e.touches[0].pageY
      const diff = currentY - startY
      
      if (diff > 0) {
        setPullDistance(Math.min(diff * 0.5, 100)) // Limit the pull distance
        e.preventDefault() // Prevent scroll when pulling
      }
    },
    [startY, isRefreshing, onRefresh, isAuthPage, isHomePage]
  )

  const handleTouchEnd = useCallback(
    async () => {
      if (isAuthPage || isHomePage || !onRefresh || isRefreshing) return

      if (pullDistance > 60) { // Threshold for refresh
        setIsRefreshing(true)
        try {
          await onRefresh()
          toast({
            title: "Refreshed",
            description: "Content has been updated.",
          })
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to refresh. Please try again.",
            variant: "destructive",
          })
        } finally {
          setIsRefreshing(false)
        }
      }
      setPullDistance(0)
    },
    [pullDistance, onRefresh, isRefreshing, isAuthPage, isHomePage]
  )

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main
        className="flex-1 relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull to refresh indicator */}
        {pullDistance > 0 && (
          <div 
            className="absolute top-0 left-0 right-0 flex items-center justify-center py-2 bg-background/80 backdrop-blur transition-transform"
            style={{ transform: `translateY(${pullDistance}px)` }}
          >
            <div className="text-sm text-muted-foreground">
              {pullDistance > 60 ? "Release to refresh" : "Pull to refresh"}
            </div>
          </div>
        )}
        {isRefreshing && (
          <div className="absolute top-0 left-0 right-0 flex items-center justify-center py-2 bg-background/80 backdrop-blur">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm text-muted-foreground">Refreshing...</span>
            </div>
          </div>
        )}
        <div className="container max-w-2xl mx-auto p-4">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  )
} 