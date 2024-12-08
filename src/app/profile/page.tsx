"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "@/components/ui/use-toast"
import Image from "next/image"

interface Profile {
  id: string
  name: string
  email: string
}

interface Post {
  id: string
  created_at: string
  prompt: string
  image_path: string
  user_id: string
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProfileAndPosts = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (!user) throw new Error("Not authenticated")

        // Get profile data
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError) throw profileError
        setProfile(profileData)

        // Get user's posts
        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (postsError) throw postsError
        setPosts(postsData || [])

      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch profile data. Please try again.",
          variant: "destructive",
        })
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfileAndPosts()
  }, [])

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      router.push("/login")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <main className="container max-w-2xl mx-auto p-4">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Profile</h1>
          <Button variant="outline" onClick={() => router.push("/feed")}>
            Back to Feed
          </Button>
        </div>

        {/* Profile Info */}
        <div className="bg-card rounded-lg p-6 space-y-4">
          <div>
            <h2 className="font-medium text-gray-500">Name</h2>
            <p className="text-lg">{profile?.name}</p>
          </div>
          <div>
            <h2 className="font-medium text-gray-500">Email</h2>
            <p className="text-lg">{profile?.email}</p>
          </div>
          <Button 
            onClick={handleSignOut}
            className="w-full"
            variant="outline"
          >
            Sign Out
          </Button>
        </div>

        {/* User's Posts */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Posts</h2>
          {posts.length === 0 ? (
            <div className="text-center py-8 bg-card rounded-lg">
              <p className="text-gray-500 mb-4">You haven't created any posts yet.</p>
              <Button onClick={() => router.push("/create")}>
                Create Your First Post
              </Button>
            </div>
          ) : (
            <div className="grid gap-6">
              {posts.map((post) => (
                <article key={post.id} className="bg-card rounded-lg overflow-hidden shadow-sm">
                  <div className="relative aspect-square">
                    <Image
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${post.image_path}`}
                      alt={post.prompt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 768px"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <time className="text-sm text-gray-500">
                        {new Date(post.created_at).toLocaleDateString()}
                      </time>
                    </div>
                    <p className="text-gray-500">{post.prompt}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
} 