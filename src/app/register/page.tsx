import { AuthForm } from "@/components/ui/auth-form"
import Link from "next/link"

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-8">
          <AuthForm type="register" />
        </div>
      </div>
    </div>
  )
} 