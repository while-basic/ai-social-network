import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json()

    const response = await fetch(imageUrl)
    const imageBlob = await response.blob()

    return new NextResponse(imageBlob, {
      headers: {
        "Content-Type": "image/png",
      },
    })
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: "Failed to download image" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  }
} 