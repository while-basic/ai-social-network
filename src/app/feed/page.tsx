"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Image from "next/image"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"

interface Post {
  id: string
  created_at: string
  prompt: string
  image_path: string
  user_id: string
  profiles: {
    id: string
    name: string
  }
}

export default function FeedPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [startY, setStartY] = useState(0)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [followingIds, setFollowingIds] = useState<string[]>([])
  const [feedType, setFeedType] = useState<'all' | 'following'>('following')

  const fetchPosts = async () => {
    try {
      let query = supabase
        .from("posts")
        .select(`
          *,
          profiles (
            id,
            name
          )
        `)
        .order("created_at", { ascending: false })

      if (feedType === 'following' && followingIds.length > 0) {
        query = query.in('user_id', followingIds)
      }

      const { data, error } = await query

      if (error) throw error

      setPosts(data || [])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch posts. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const fetchFollowing = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setCurrentUserId(user.id)

      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)

      if (error) throw error

      setFollowingIds(data.map(follow => follow.following_id))
    } catch (error) {
      console.error('Error fetching following:', error)
    }
  }

  const handleFollow = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: currentUserId, following_id: userId })

      if (error) throw error

      setFollowingIds(prev => [...prev, userId])
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

  const handleUnfollow = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', userId)

      if (error) throw error

      setFollowingIds(prev => prev.filter(id => id !== userId))
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

  useEffect(() => {
    fetchFollowing()
  }, [])

  useEffect(() => {
    if (followingIds) {
      fetchPosts()
    }
  }, [followingIds, feedType])

  // Pull to refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].pageY)
  }

  const handleTouchMove = useCallback(
    async (e: React.TouchEvent) => {
      const currentY = e.touches[0].pageY
      const diff = currentY - startY

      if (diff > 100 && !isRefreshing && window.scrollY === 0) {
        setIsRefreshing(true)
        await fetchPosts()
      }
    },
    [startY, isRefreshing]
  )

  return (
    <main 
      className="container max-w-2xl mx-auto p-4"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      <div className="sticky top-0 bg-background z-10 py-4 border-b space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Feed</h1>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/create")}>
              Create
            </Button>
            <Button variant="outline" onClick={() => router.push("/profile")}>
              Profile
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={feedType === 'following' ? 'default' : 'outline'}
            onClick={() => setFeedType('following')}
          >
            Following
          </Button>
          <Button
            variant={feedType === 'all' ? 'default' : 'outline'}
            onClick={() => setFeedType('all')}
          >
            All Posts
          </Button>
        </div>
      </div>

      {isRefreshing && (
        <div className="flex justify-center py-4 text-sm text-gray-500">
          Refreshing...
        </div>
      )}

      <div className="space-y-8 py-8">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              {feedType === 'following' 
                ? "You're not following anyone yet or they haven't posted anything."
                : "No posts yet."}
            </p>
            <Button onClick={() => router.push("/create")}>
              Create First Post
            </Button>
          </div>
        ) : (
          <div className="grid gap-8">
            {posts.map((post) => (
              <article key={post.id} className="bg-card rounded-lg overflow-hidden shadow-sm">
                <div className="relative aspect-square">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${post.image_path}`}
                    alt={post.prompt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 768px"
                    priority
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Link 
                        href={`/profile/${post.user_id}`}
                        className="font-medium hover:underline"
                      >
                        {post.profiles?.name}
                      </Link>
                      {currentUserId && post.user_id !== currentUserId && (
                        followingIds.includes(post.user_id) ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUnfollow(post.user_id)}
                          >
                            Unfollow
                          </Button>
                        ) : (
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleFollow(post.user_id)}
                          >
                            Follow
                          </Button>
                        )
                      )}
                    </div>
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
    </main>
  )
} 