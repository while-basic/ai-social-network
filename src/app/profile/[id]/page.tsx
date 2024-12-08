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

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCurrentUser, setIsCurrentUser] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)

  useEffect(() => {
    const fetchProfileAndPosts = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/login")
          return
        }

        setIsCurrentUser(user.id === params.id)

        // Get profile data
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", params.id)
          .single()

        if (profileError) throw profileError
        setProfile(profileData)

        // Get user's posts
        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select("*")
          .eq("user_id", params.id)
          .order("created_at", { ascending: false })

        if (postsError) throw postsError
        setPosts(postsData || [])

        // Check if following
        const { data: followData, error: followError } = await supabase
          .from("follows")
          .select("*")
          .eq("follower_id", user.id)
          .eq("following_id", params.id)
          .single()

        if (!followError) {
          setIsFollowing(true)
        }

        // Get followers count
        const { count: followers, error: followersError } = await supabase
          .from("follows")
          .select("*", { count: 'exact', head: true })
          .eq("following_id", params.id)

        if (!followersError) {
          setFollowersCount(followers || 0)
        }

        // Get following count
        const { count: following, error: followingError } = await supabase
          .from("follows")
          .select("*", { count: 'exact', head: true })
          .eq("follower_id", params.id)

        if (!followingError) {
          setFollowingCount(following || 0)
        }

      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch profile data. Please try again.",
          variant: "destructive",
        })
        router.push("/feed")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfileAndPosts()
  }, [params.id])

  const handleFollow = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: user.id, following_id: params.id })

      if (error) throw error

      setIsFollowing(true)
      setFollowersCount(prev => prev + 1)
      toast({
        title: "Success",
        description: "User followed successfully!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to follow user. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUnfollow = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", params.id)

      if (error) throw error

      setIsFollowing(false)
      setFollowersCount(prev => prev - 1)
      toast({
        title: "Success",
        description: "User unfollowed successfully!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unfollow user. Please try again.",
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
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{profile?.name}</h2>
              {isCurrentUser && (
                <p className="text-gray-500">{profile?.email}</p>
              )}
            </div>
            {!isCurrentUser && (
              <Button
                onClick={isFollowing ? handleUnfollow : handleFollow}
                variant={isFollowing ? "outline" : "default"}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>
            )}
          </div>

          <div className="flex gap-4 text-sm text-gray-500">
            <p>{posts.length} posts</p>
            <p>{followersCount} followers</p>
            <p>{followingCount} following</p>
          </div>
        </div>

        {/* User's Posts */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Posts</h2>
          {posts.length === 0 ? (
            <div className="text-center py-8 bg-card rounded-lg">
              <p className="text-gray-500">No posts yet.</p>
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