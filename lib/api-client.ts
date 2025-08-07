import { ApiResponse, Drug, HistoricalCatalyst } from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.bpiq.com/api/v1"

class BPIQApiClient {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.BPIQ_API_KEY || ""
  }

  private async fetch<T>(endpoint: string, params?: URLSearchParams): Promise<T> {
    const url = new URL(endpoint, API_BASE_URL)
    if (params) {
      url.search = params.toString()
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Token ${this.apiKey}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async getDrugs(params?: {
    limit?: number
    offset?: number
  }): Promise<ApiResponse<Drug>> {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.append("limit", params.limit.toString())
    if (params?.offset) searchParams.append("offset", params.offset.toString())

    return this.fetch<ApiResponse<Drug>>("/drugs/", searchParams)
  }

  async getHistoricalCatalysts(params?: {
    limit?: number
    offset?: number
  }): Promise<ApiResponse<HistoricalCatalyst>> {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.append("limit", params.limit.toString())
    if (params?.offset) searchParams.append("offset", params.offset.toString())

    return this.fetch<ApiResponse<HistoricalCatalyst>>("/historical-catalysts/screener/", searchParams)
  }

  async fetchAllPages<T>(
    fetchFn: (offset: number) => Promise<ApiResponse<T>>,
    limit = 100
  ): Promise<T[]> {
    const allResults: T[] = []
    let offset = 0
    let hasMore = true

    while (hasMore) {
      const response = await fetchFn(offset)
      allResults.push(...response.results)
      hasMore = response.next !== null
      offset += limit
    }

    return allResults
  }
}

export const apiClient = new BPIQApiClient()