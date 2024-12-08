"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import type { AuthError } from "@supabase/supabase-js"
import { Check, Mail } from "lucide-react"

interface AuthFormProps {
  type: "login" | "register"
}

export function AuthForm({ type }: AuthFormProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
  })

  const handleAuthError = (error: AuthError | Error) => {
    console.error("Auth error details:", error)
    let errorMessage = "Something went wrong. Please try again."

    if ('message' in error) {
      switch (error.message) {
        case "Invalid login credentials":
          errorMessage = "Invalid email or password. Please try again."
          break
        case "User already registered":
          errorMessage = "This email is already registered. Please try logging in."
          break
        case "Password should be at least 6 characters":
          errorMessage = "Password must be at least 6 characters long."
          break
        default:
          errorMessage = error.message
      }
    }

    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    })
  }

  const validateUsername = (username: string) => {
    return /^[a-zA-Z0-9_]+$/.test(username)
  }

  const showSuccessMessage = () => {
    toast({
      title: (
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-500" />
          <span>Account Created Successfully!</span>
        </div>
      ),
      description: (
        <div className="mt-2 flex flex-col gap-2">
          <p>Your account has been created successfully.</p>
          <div className="flex items-center gap-2 rounded-md bg-muted p-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Verify your email</p>
              <p className="text-xs text-muted-foreground">
                We've sent a verification email to {formData.email}
              </p>
            </div>
          </div>
        </div>
      ),
      duration: 10000,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (type === "register") {
        console.log("Starting registration process...")

        // Validate username
        if (!validateUsername(formData.username)) {
          throw new Error("Username can only contain letters, numbers, and underscores")
        }

        console.log("Checking if username exists...")
        // Check if username is already taken
        const { data: existingUser, error: usernameError } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', formData.username)
          .single()

        if (usernameError && usernameError.code !== 'PGRST116') {
          console.error("Username check error:", usernameError)
          throw usernameError
        }

        if (existingUser) {
          throw new Error("This username is already taken")
        }

        console.log("Creating auth user...")
        // Sign up the user
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              username: formData.username,
              full_name: formData.fullName,
            },
          },
        })

        if (signUpError) {
          console.error("Sign up error:", signUpError)
          throw signUpError
        }

        if (!authData.user) {
          throw new Error("Failed to create user account")
        }

        console.log("Creating user profile...")
        // Create profile in the profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            username: formData.username,
            full_name: formData.fullName,
          })

        if (profileError) {
          console.error("Profile creation error:", profileError)
          throw new Error("Failed to create user profile")
        }

        console.log("Registration successful!")
        showSuccessMessage()
        
        // Clear form
        setFormData({
          username: "",
          fullName: "",
          email: "",
          password: "",
        })
      } else {
        // Sign in the user
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })

        if (signInError) {
          throw signInError
        }

        toast({
          title: (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Welcome back!</span>
            </div>
          ),
          description: "You have been successfully logged in.",
          duration: 5000,
        })
        
        router.push("/feed")
        router.refresh()
      }
    } catch (error) {
      console.error("Form submission error:", error)
      handleAuthError(error as AuthError | Error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {type === "register" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Enter your username"
              type="text"
              required
              pattern="[a-zA-Z0-9_]+"
              title="Username can only contain letters, numbers, and underscores"
              disabled={isLoading}
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value.toLowerCase() })
              }
            />
            <p className="text-sm text-muted-foreground">
              Username can only contain letters, numbers, and underscores
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="Enter your full name"
              type="text"
              required
              disabled={isLoading}
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
            />
          </div>
        </>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          placeholder="Enter your email"
          type="email"
          required
          disabled={isLoading}
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          placeholder="Enter your password"
          type="password"
          required
          minLength={6}
          disabled={isLoading}
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
        />
      </div>
      <Button className="w-full" type="submit" disabled={isLoading}>
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
            <span>{type === "login" ? "Signing in..." : "Creating account..."}</span>
          </div>
        ) : type === "login" ? (
          "Sign In"
        ) : (
          "Sign Up"
        )}
      </Button>
    </form>
  )
} 