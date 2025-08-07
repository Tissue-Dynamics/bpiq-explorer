"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DrugsTable } from "@/components/drugs-table"
import { HistoricalCatalystsTable } from "@/components/historical-catalysts-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Beaker, Calendar, TrendingUp } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">BPIQ Explorer</h1>
          <p className="text-muted-foreground text-lg">
            Explore BiopharmIQ API data - Drug pipelines and catalyst events
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Connected</div>
              <p className="text-xs text-muted-foreground">
                v1.0.1 API
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Drugs</CardTitle>
              <Beaker className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,400+</div>
              <p className="text-xs text-muted-foreground">
                In pipeline
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Big Movers</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Track</div>
              <p className="text-xs text-muted-foreground">
                High impact events
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Catalysts</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Monitor</div>
              <p className="text-xs text-muted-foreground">
                Upcoming events
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="drugs" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="drugs">Drugs</TabsTrigger>
            <TabsTrigger value="historical">Historical Catalysts</TabsTrigger>
          </TabsList>
          <TabsContent value="drugs" className="space-y-4">
            <DrugsTable />
          </TabsContent>
          <TabsContent value="historical" className="space-y-4">
            <HistoricalCatalystsTable />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}