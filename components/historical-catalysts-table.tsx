"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { HistoricalCatalyst } from "@/lib/types"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { ChevronLeft, ChevronRight, Loader2, ExternalLink } from "lucide-react"

export function HistoricalCatalystsTable() {
  const [page, setPage] = useState(0)
  const limit = 30

  const { data, isLoading, error } = useQuery({
    queryKey: ["historical-catalysts", page],
    queryFn: async () => {
      const response = await fetch(`/api/historical-catalysts?limit=${limit}&offset=${page * limit}`)
      if (!response.ok) throw new Error("Failed to fetch historical catalysts")
      return response.json()
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Failed to load historical catalysts data (Premium API)</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This endpoint requires Premium API access. If you have premium access, please check your API key.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Historical Catalysts</h2>
          <p className="text-muted-foreground">
            Total: {data?.count || 0} events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={!data?.previous}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {Math.ceil((data?.count || 0) / limit)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={!data?.next}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {data?.results?.map((catalyst: HistoricalCatalyst) => (
          <Card key={catalyst.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{catalyst.drug_name}</CardTitle>
                  <CardDescription>
                    {catalyst.company.name} ({catalyst.ticker})
                  </CardDescription>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                  {catalyst.stage}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Indication</p>
                  <p>{catalyst.drug_indication}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Catalyst Date</p>
                  <p>{catalyst.catalyst_date}</p>
                </div>
              </div>
              
              {catalyst.catalyst_text && (
                <div>
                  <p className="font-medium text-muted-foreground text-sm mb-1">Event Details</p>
                  <p className="text-sm">{catalyst.catalyst_text}</p>
                </div>
              )}

              {catalyst.catalyst_source && (
                <div className="flex items-center gap-2">
                  <a
                    href={catalyst.catalyst_source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Source
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}