"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Drug } from "@/lib/types"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { format } from "date-fns"
import { ChevronLeft, ChevronRight, Loader2, ExternalLink } from "lucide-react"

export function DrugsTable() {
  const [page, setPage] = useState(0)
  const limit = 30

  const { data, isLoading, error } = useQuery({
    queryKey: ["drugs", page],
    queryFn: async () => {
      const response = await fetch(`/api/drugs?limit=${limit}&offset=${page * limit}`)
      if (!response.ok) throw new Error("Failed to fetch drugs")
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
          <CardDescription>Failed to load drugs data</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Drugs</h2>
          <p className="text-muted-foreground">
            Total: {data?.count || 0} drugs
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
        {data?.results?.map((drug: Drug) => (
          <Card key={drug.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{drug.drug_name}</CardTitle>
                  <CardDescription>
                    {drug.company.name} ({drug.ticker})
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {drug.is_big_mover && (
                    <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                      Big Mover
                    </span>
                  )}
                  {drug.is_suspected_mover && (
                    <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800">
                      Suspected Mover
                    </span>
                  )}
                  {drug.has_catalyst && (
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                      Has Catalyst
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Stage</p>
                  <p>{drug.stage_event.label}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Indications</p>
                  <p>{drug.indications_text || "N/A"}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Catalyst Date</p>
                  <p>{drug.catalyst_date_text || "TBA"}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Score</p>
                  <p>{drug.stage_event.score}</p>
                </div>
              </div>
              
              {drug.note && (
                <div>
                  <p className="font-medium text-muted-foreground text-sm mb-1">Notes</p>
                  <p className="text-sm">{drug.note}</p>
                </div>
              )}

              {drug.catalyst_source && (
                <div className="flex items-center gap-2">
                  <a
                    href={drug.catalyst_source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Source
                  </a>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Updated: {format(new Date(drug.updated_at), "PPP")}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}