import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm lg:flex flex-col">
        <h1 className="text-4xl font-bold mb-8">AI Social Network</h1>
        <p className="text-xl mb-8 text-center">
          Create and share AI-generated images with people around the world
        </p>
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/feed">
              View Feed
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/register">
              Get Started
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
