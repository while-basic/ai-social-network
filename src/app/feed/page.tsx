"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { Heart, MessageCircle, Download, UserPlus, UserMinus } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Profile {
  id: string
  name: string | null
  avatar_url: string | null
}

interface Post {
  id: string
  prompt: string
  image_url: string
  created_at: string
  user_id: string
  user: {
    id: string
    email: string
  } | null
  likes: { user_id: string }[]
  comments: {
    id: string
    content: string
    created_at: string
    user_id: string
    user: {
      id: string
      email: string
    } | null
  }[]
  _count: {
    likes: number
    comments: number
  }
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [commenting, setCommenting] = useState<string | null>(null)
  const [comment, setComment] = useState("")
  const [following, setFollowing] = useState<Set<string>>(new Set())
  const supabase = createClientComponentClient()
  const router = useRouter()

  const fetchPosts = async () => {
    try {
      console.log("Checking authentication...")
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.error("Auth error:", authError)
        throw new Error("Authentication failed")
      }
      if (!user) {
        console.log("No user found, redirecting to login...")
        router.push("/login")
        return
      }
      console.log("User authenticated:", user.id)

      // Fetch posts
      console.log("Fetching posts data...")
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })

      if (postsError) {
        console.error("Posts error:", postsError)
        throw postsError
      }

      if (!postsData) {
        console.log("No posts found")
        setPosts([])
        return
      }

      // Fetch likes
      console.log("Fetching likes...")
      const { data: likesData, error: likesError } = await supabase
        .from("likes")
        .select("*")
        .in("post_id", postsData.map(post => post.id))

      if (likesError) {
        console.error("Likes error:", likesError)
      }

      // Fetch comments
      console.log("Fetching comments...")
      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select("*")
        .in("post_id", postsData.map(post => post.id))

      if (commentsError) {
        console.error("Comments error:", commentsError)
      }

      // Transform the data
      const transformedPosts = postsData.map(post => ({
        ...post,
        user: {
          id: post.user_id,
          email: post.user_id === user.id ? user.email : `user_${post.user_id.slice(0, 8)}`
        },
        likes: likesData?.filter(like => like.post_id === post.id) || [],
        comments: commentsData?.filter(comment => comment.post_id === post.id).map(comment => ({
          ...comment,
          user: {
            id: comment.user_id,
            email: comment.user_id === user.id ? user.email : `user_${comment.user_id.slice(0, 8)}`
          }
        })) || [],
        _count: {
          likes: likesData?.filter(like => like.post_id === post.id).length || 0,
          comments: commentsData?.filter(comment => comment.post_id === post.id).length || 0
        }
      }))

      console.log("Setting posts:", transformedPosts)
      setPosts(transformedPosts)
    } catch (error) {
      console.error("Error fetching posts:", error)
      if (error instanceof Error) {
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
      }
      toast({
        title: "Error",
        description: "Failed to load posts. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const post = posts.find(p => p.id === postId)
      const hasLiked = post?.likes?.some(like => like.user_id === user.id)

      if (hasLiked) {
        // Unlike
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id)

        if (error) throw error
      } else {
        // Like
        const { error } = await supabase
          .from("likes")
          .insert({ post_id: postId, user_id: user.id })

        if (error) throw error
      }

      // Refresh posts
      fetchPosts()
    } catch (error) {
      console.error("Error liking post:", error)
      toast({
        title: "Error",
        description: "Failed to like post. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleComment = async (postId: string) => {
    if (!comment.trim()) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          user_id: user.id,
          content: comment.trim()
        })

      if (error) throw error

      // Reset comment state
      setComment("")
      setCommenting(null)

      // Refresh posts
      fetchPosts()
    } catch (error) {
      console.error("Error commenting:", error)
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDownload = async (imageUrl: string, prompt: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${prompt.slice(0, 30)}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading image:", error)
      toast({
        title: "Error",
        description: "Failed to download image. Please try again.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  return (
    <main className="container max-w-2xl mx-auto p-4 py-8">
      <div className="space-y-8">
        {loading ? (
          // Loading skeletons
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-card rounded-lg p-4 space-y-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-72 w-full rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">No posts yet</h2>
            <p className="text-muted-foreground mb-4">Be the first to create an AI-generated image!</p>
            <Button onClick={() => router.push("/create")}>Create Image</Button>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-card rounded-lg overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <Link 
                    href={`/profile/${post.user_id}`}
                    className="flex items-center space-x-3 group"
                  >
                    <div className="relative h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">
                          {post.user?.email?.[0].toUpperCase() || "A"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium group-hover:underline">
                        {post.user?.email?.split("@")[0] || "Anonymous"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </Link>
                </div>
              </div>

              <div className="relative aspect-square">
                <Image
                  src={post.image_url}
                  alt={post.prompt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>

              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post.id)}
                      className="space-x-1"
                    >
                      <Heart
                        className={`h-5 w-5 ${
                          post.likes?.some(like => like.user_id === post.user_id)
                            ? "fill-current text-red-500"
                            : ""
                        }`}
                      />
                      <span>{post._count.likes}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCommenting(commenting === post.id ? null : post.id)}
                      className="space-x-1"
                    >
                      <MessageCircle className="h-5 w-5" />
                      <span>{post._count.comments}</span>
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(post.image_url, post.prompt)}
                  >
                    <Download className="h-5 w-5" />
                  </Button>
                </div>

                <p className="font-medium">{post.prompt}</p>

                {post.comments && post.comments.length > 0 && (
                  <div className="space-y-2">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="flex items-start space-x-2">
                        <Link href={`/profile/${comment.user_id}`}>
                          <span className="font-medium hover:underline">
                            {comment.user?.email?.split("@")[0] || "Anonymous"}
                          </span>
                        </Link>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {commenting === post.id && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 px-3 py-2 bg-background rounded-md border"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleComment(post.id)
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleComment(post.id)}
                      disabled={!comment.trim()}
                    >
                      Post
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  )
} 