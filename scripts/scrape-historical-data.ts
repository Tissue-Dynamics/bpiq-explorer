import fs from 'fs'
import { HistoricalCatalyst, ApiResponse } from '../lib/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.bpiq.com/api/v1"
const API_KEY = process.env.BPIQ_API_KEY || ""

interface ScrapeProgress {
  totalRecords: number
  recordsFetched: number
  pagesProcessed: number
  lastOffset: number
  startTime: Date
  errors: string[]
}

async function fetchHistoricalPage(offset: number, limit: number = 100): Promise<ApiResponse<HistoricalCatalyst>> {
  const url = `${API_BASE_URL}/historical-catalysts/screener/?limit=${limit}&offset=${offset}`
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Token ${API_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

async function scrapeAllHistoricalData() {
  const limit = 100 // Fetch 100 records at a time
  let offset = 0
  let hasMore = true
  const allData: HistoricalCatalyst[] = []
  
  const progress: ScrapeProgress = {
    totalRecords: 0,
    recordsFetched: 0,
    pagesProcessed: 0,
    lastOffset: 0,
    startTime: new Date(),
    errors: []
  }

  console.log('Starting historical data scrape...')
  console.log(`API Key: ${API_KEY ? 'Present' : 'Missing'}`)
  
  try {
    // First request to get total count
    const firstPage = await fetchHistoricalPage(0, limit)
    progress.totalRecords = firstPage.count
    console.log(`Total records to fetch: ${progress.totalRecords}`)
    
    // Add first page data
    allData.push(...firstPage.results)
    progress.recordsFetched = firstPage.results.length
    progress.pagesProcessed = 1
    hasMore = firstPage.next !== null
    offset = limit

    // Fetch remaining pages
    while (hasMore) {
      try {
        console.log(`Fetching page ${progress.pagesProcessed + 1} (offset: ${offset})...`)
        
        // Add a small delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const page = await fetchHistoricalPage(offset, limit)
        allData.push(...page.results)
        
        progress.recordsFetched += page.results.length
        progress.pagesProcessed++
        progress.lastOffset = offset
        
        // Progress update
        const percentage = ((progress.recordsFetched / progress.totalRecords) * 100).toFixed(1)
        const elapsed = ((new Date().getTime() - progress.startTime.getTime()) / 1000).toFixed(1)
        console.log(`Progress: ${progress.recordsFetched}/${progress.totalRecords} (${percentage}%) - ${elapsed}s elapsed`)
        
        hasMore = page.next !== null
        offset += limit
        
        // Save checkpoint every 10 pages
        if (progress.pagesProcessed % 10 === 0) {
          saveCheckpoint(allData, progress)
        }
        
      } catch (error) {
        const errorMsg = `Error at offset ${offset}: ${error}`
        console.error(errorMsg)
        progress.errors.push(errorMsg)
        
        // Save what we have so far
        saveCheckpoint(allData, progress)
        
        // Wait longer before retrying
        console.log('Waiting 5 seconds before retry...')
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }
    
    // Save final data
    const outputFile = `historical_catalysts_${new Date().toISOString().split('T')[0]}.json`
    fs.writeFileSync(outputFile, JSON.stringify({
      metadata: {
        totalRecords: progress.totalRecords,
        recordsFetched: progress.recordsFetched,
        pagesProcessed: progress.pagesProcessed,
        scrapedAt: new Date().toISOString(),
        duration: ((new Date().getTime() - progress.startTime.getTime()) / 1000).toFixed(1) + 's',
        errors: progress.errors
      },
      data: allData
    }, null, 2))
    
    console.log(`\n✅ Scrape complete!`)
    console.log(`Total records: ${allData.length}`)
    console.log(`Pages processed: ${progress.pagesProcessed}`)
    console.log(`Time taken: ${((new Date().getTime() - progress.startTime.getTime()) / 1000).toFixed(1)}s`)
    console.log(`Data saved to: ${outputFile}`)
    
    if (progress.errors.length > 0) {
      console.log(`\n⚠️ Errors encountered: ${progress.errors.length}`)
      progress.errors.forEach(err => console.log(`  - ${err}`))
    }
    
  } catch (error) {
    console.error('Fatal error during scrape:', error)
    saveCheckpoint(allData, progress)
  }
}

function saveCheckpoint(data: HistoricalCatalyst[], progress: ScrapeProgress) {
  const checkpointFile = `checkpoint_historical_${new Date().toISOString().split('T')[0]}.json`
  fs.writeFileSync(checkpointFile, JSON.stringify({
    progress,
    data
  }, null, 2))
  console.log(`Checkpoint saved to ${checkpointFile}`)
}

// Script to scrape all drugs data
async function scrapeAllDrugsData() {
  const limit = 100
  let offset = 0
  let hasMore = true
  const allDrugs: any[] = []
  
  console.log('Starting drugs data scrape...')
  
  try {
    while (hasMore) {
      const url = `${API_BASE_URL}/drugs/?limit=${limit}&offset=${offset}`
      console.log(`Fetching offset ${offset}...`)
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Token ${API_KEY}`,
        },
      })
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      allDrugs.push(...data.results)
      
      console.log(`Fetched ${data.results.length} drugs (total: ${allDrugs.length}/${data.count})`)
      
      hasMore = data.next !== null
      offset += limit
      
      // Be respectful with rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    const outputFile = `drugs_data_${new Date().toISOString().split('T')[0]}.json`
    fs.writeFileSync(outputFile, JSON.stringify({
      metadata: {
        totalRecords: allDrugs.length,
        scrapedAt: new Date().toISOString()
      },
      data: allDrugs
    }, null, 2))
    
    console.log(`✅ Drugs data saved to ${outputFile}`)
    
  } catch (error) {
    console.error('Error scraping drugs data:', error)
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  
  if (!API_KEY) {
    console.error('❌ Error: BPIQ_API_KEY environment variable is not set')
    console.log('Please set it in your .env.local file')
    process.exit(1)
  }
  
  switch (command) {
    case 'historical':
      await scrapeAllHistoricalData()
      break
    case 'drugs':
      await scrapeAllDrugsData()
      break
    case 'all':
      await scrapeAllDrugsData()
      await scrapeAllHistoricalData()
      break
    default:
      console.log('Usage: npm run scrape [historical|drugs|all]')
      console.log('  historical - Scrape all historical catalyst data (Premium API)')
      console.log('  drugs      - Scrape all drugs data')
      console.log('  all        - Scrape both datasets')
  }
}

main().catch(console.error)