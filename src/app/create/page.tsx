"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "@/components/ui/use-toast"
import OpenAI from "openai"

export default function CreatePage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  })

  const generateImage = async () => {
    if (!prompt) {
      toast({
        title: "Error",
        description: "Please enter a prompt",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    console.log("Starting image generation process...")

    try {
      // Get current user
      console.log("Fetching user...")
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error("User error:", userError)
        throw userError
      }
      if (!user) {
        console.error("No user found")
        throw new Error("Please sign in to create posts")
      }
      console.log("User found:", user.id)

      // Generate image with OpenAI
      console.log("Generating image with OpenAI...")
      if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
        throw new Error("OpenAI API key is not configured")
      }

      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
      })

      console.log("OpenAI response received:", response)
      const imageUrl = response.data[0].url
      if (!imageUrl) throw new Error("No image generated")

      // Download image using our API route
      console.log("Downloading image...")
      const imageRes = await fetch("/api/download-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl }),
      })

      if (!imageRes.ok) {
        const errorText = await imageRes.text()
        console.error("Download error:", errorText)
        throw new Error(`Failed to download image: ${errorText}`)
      }

      const imageBlob = await imageRes.blob()
      console.log("Image downloaded, size:", imageBlob.size)

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.png`
      const filePath = `${user.id}/${fileName}`

      // Upload to Supabase Storage
      console.log("Uploading to Supabase storage...")
      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, imageBlob, {
          contentType: "image/png",
          upsert: false
        })

      if (uploadError) {
        console.error('Storage error:', uploadError)
        throw new Error(`Failed to upload image: ${uploadError.message}`)
      }
      console.log("Image uploaded successfully")

      // Get the public URL for the uploaded image
      console.log("Getting public URL...")
      const { data: { publicUrl } } = supabase.storage
        .from("images")
        .getPublicUrl(filePath)

      console.log("Public URL generated:", publicUrl)

      // Create post in database
      console.log("Creating database entry...")
      const { error: dbError } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          prompt: prompt,
          image_path: filePath,
          image_url: publicUrl,
          created_at: new Date().toISOString()
        })

      if (dbError) {
        // If there's a database error, clean up the uploaded file
        console.error('Database error:', dbError)
        console.log("Cleaning up uploaded file...")
        await supabase.storage
          .from("images")
          .remove([filePath])
          .then(({ error }) => {
            if (error) console.error('Error cleaning up file:', error)
          })

        throw new Error(dbError.message || "Failed to create post")
      }

      console.log("Post created successfully!")
      toast({
        title: "Success",
        description: "Image generated and posted successfully!",
      })

      router.push("/profile/gallery")
    } catch (error) {
      console.error("Error details:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <main className="container max-w-2xl mx-auto p-4 py-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Create AI Image</h1>
          <Button variant="outline" onClick={() => router.push("/feed")}>
            Back to Feed
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Enter your prompt..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
            />
            <p className="text-sm text-gray-500">
              Be specific about what you want to generate.
            </p>
          </div>

          <Button 
            className="w-full" 
            onClick={generateImage}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                <span>Generating...</span>
              </div>
            ) : (
              "Generate Image"
            )}
          </Button>
        </div>
      </div>
    </main>
  )
} 