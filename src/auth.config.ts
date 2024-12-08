import type { DefaultConfig as AuthConfig } from 'next-auth'
import type { Session } from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const authConfig = {
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const { email, password } = credentials as {
          email: string
          password: string
        }
        
        if (email === "user@example.com" && password === "password") {
          return { id: "1", name: "User", email }
        }
        return null
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }: { auth: Session | null, request: { nextUrl: URL } }) {
      const isLoggedIn = !!auth?.user
      const isOnProtectedRoute = ["/create", "/feed"].includes(nextUrl.pathname)
      
      if (isOnProtectedRoute) {
        if (isLoggedIn) return true
        return false
      }
      return true
    },
  },
} satisfies AuthConfig 