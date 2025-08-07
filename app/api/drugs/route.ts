import { NextRequest, NextResponse } from "next/server"
import { apiClient } from "@/lib/api-client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "30")
    const offset = parseInt(searchParams.get("offset") || "0")

    const data = await apiClient.getDrugs({ limit, offset })
    return NextResponse.json(data)
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch drugs data" },
      { status: 500 }
    )
  }
}