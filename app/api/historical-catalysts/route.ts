import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.bpiq.com/api/v1"
const API_KEY = process.env.BPIQ_API_KEY || ""

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit") || "30"
    const offset = searchParams.get("offset") || "0"

    const url = `${API_BASE_URL}/historical-catalysts/screener/`
    const fetchUrl = new URL(url)
    fetchUrl.searchParams.append("limit", limit)
    fetchUrl.searchParams.append("offset", offset)

    const response = await fetch(fetchUrl.toString(), {
      headers: {
        Authorization: `Token ${API_KEY}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch historical catalysts data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}