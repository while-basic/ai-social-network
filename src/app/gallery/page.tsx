"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"

interface Profile {
  id: string
  name: string | null
}

interface Post {
  id: string
  prompt: string
  image_url: string
  created_at: string
  user_id: string
  profiles: Profile | null
}

export default function GalleryPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      console.log("Fetching posts...")
      const { data, error } = await supabase
        .from("posts")
        .select(`
          id,
          prompt,
          image_url,
          created_at,
          user_id,
          profiles (
            id,
            name
          )
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Supabase error:", error)
        throw error
      }

      console.log("Posts data:", data)
      setPosts(data as Post[] || [])
    } catch (error) {
      console.error("Error details:", error)
      if (error instanceof Error) {
        console.error("Error message:", error.message)
        console.error("Error stack:", error.stack)
      }
      toast({
        title: "Error",
        description: "Failed to load images. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">AI Image Gallery</h1>
        <Button onClick={() => router.push("/create")}>Create New</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-lg overflow-hidden bg-card">
              <Skeleton className="w-full h-64" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No images yet</h2>
          <p className="text-muted-foreground mb-4">Be the first to create an AI-generated image!</p>
          <Button onClick={() => router.push("/create")}>Create Image</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div key={post.id} className="rounded-lg overflow-hidden bg-card">
              <div className="relative aspect-square">
                <Image
                  src={post.image_url}
                  alt={post.prompt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <div className="p-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Created by {post.profiles?.name || "Anonymous"}
                </p>
                <p className="font-medium line-clamp-2">{post.prompt}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
} 