import { AuthForm } from "@/components/ui/auth-form"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>

        <div className="mt-8">
          <AuthForm type="login" />
        </div>
      </div>
    </div>
  )
} 