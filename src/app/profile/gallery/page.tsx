"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"

interface Post {
  id: string
  prompt: string
  image_url: string
  image_path: string
  created_at: string
  user_id: string
}

export default function ProfileGalleryPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    fetchUserPosts()
  }, [])

  const fetchUserPosts = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) {
        router.push('/login')
        return
      }

      // Fetch user's posts
      const { data, error } = await supabase
        .from("posts")
        .select(`
          id,
          prompt,
          image_url,
          image_path,
          created_at,
          user_id
        `)
        .eq('user_id', user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Supabase error:", error)
        throw error
      }

      // Get public URLs for images if not already set
      const postsWithUrls = await Promise.all(
        (data || []).map(async (post) => {
          if (!post.image_url && post.image_path) {
            const { data: { publicUrl } } = supabase.storage
              .from("images")
              .getPublicUrl(post.image_path)
            return { ...post, image_url: publicUrl }
          }
          return post
        })
      )

      setPosts(postsWithUrls)
    } catch (error) {
      console.error("Error details:", error)
      if (error instanceof Error) {
        console.error("Error message:", error.message)
      }
      toast({
        title: "Error",
        description: "Failed to load your images. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (postId: string, imagePath: string) => {
    try {
      // Delete the image from storage
      const { error: storageError } = await supabase.storage
        .from("images")
        .remove([imagePath])

      if (storageError) throw storageError

      // Delete the post from the database
      const { error: dbError } = await supabase
        .from("posts")
        .delete()
        .eq('id', postId)

      if (dbError) throw dbError

      // Update the UI
      setPosts(posts.filter(post => post.id !== postId))
      toast({
        title: "Success",
        description: "Image deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting post:", error)
      toast({
        title: "Error",
        description: "Failed to delete image. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My AI Gallery</h1>
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
          <p className="text-muted-foreground mb-4">Create your first AI-generated image!</p>
          <Button onClick={() => router.push("/create")}>Create Image</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div key={post.id} className="rounded-lg overflow-hidden bg-card">
              <div className="relative aspect-square group">
                {post.image_url && (
                  <Image
                    src={post.image_url}
                    alt={post.prompt}
                    fill
                    className="object-cover transition-opacity group-hover:opacity-75"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="outline"
                    className="bg-red-500 hover:bg-red-600 text-white"
                    onClick={() => handleDelete(post.id, post.image_path)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <p className="font-medium line-clamp-2">{post.prompt}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
} 