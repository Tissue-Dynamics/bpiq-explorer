import fs from 'fs'
import path from 'path'
import { Pool } from 'pg'

// PostgreSQL connection config
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'bpiq',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
})

interface ImportStats {
  companies: { inserted: number, updated: number },
  indications: { inserted: number, updated: number },
  stageEvents: { inserted: number, updated: number },
  drugs: { inserted: number, updated: number },
  historicalCatalysts: { inserted: number, updated: number },
  errors: string[]
}

async function importDrugsData(filePath: string): Promise<ImportStats> {
  const stats: ImportStats = {
    companies: { inserted: 0, updated: 0 },
    indications: { inserted: 0, updated: 0 },
    stageEvents: { inserted: 0, updated: 0 },
    drugs: { inserted: 0, updated: 0 },
    historicalCatalysts: { inserted: 0, updated: 0 },
    errors: []
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const { data } = JSON.parse(fileContent)
    
    console.log(`📦 Importing ${data.length} drugs...`)
    
    // Start transaction
    const client = await pool.connect()
    await client.query('BEGIN')
    
    try {
      for (const drug of data) {
        // 1. Insert/Update Company
        if (drug.company) {
          const companyResult = await client.query(`
            INSERT INTO companies (id, ticker, name)
            VALUES ($1, $2, $3)
            ON CONFLICT (id) DO UPDATE
            SET ticker = EXCLUDED.ticker, name = EXCLUDED.name
            RETURNING id
          `, [drug.company.id, drug.company.ticker, drug.company.name])
          
          if (companyResult.rowCount === 1) {
            stats.companies.inserted++
          }
        }
        
        // 2. Insert/Update Stage Event
        if (drug.stage_event) {
          await client.query(`
            INSERT INTO stage_events (id, wix_id, label, stage_label, stage, event_label, event, score, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (id) DO UPDATE
            SET label = EXCLUDED.label, score = EXCLUDED.score
          `, [
            drug.stage_event.id,
            drug.stage_event.wix_id,
            drug.stage_event.label,
            drug.stage_event.stage_label,
            drug.stage_event.stage,
            drug.stage_event.event_label,
            drug.stage_event.event,
            drug.stage_event.score,
            drug.stage_event.created_at,
            drug.stage_event.updated_at
          ])
          stats.stageEvents.inserted++
        }
        
        // 3. Insert/Update Indications
        if (drug.indications && drug.indications.length > 0) {
          for (const indication of drug.indications) {
            await client.query(`
              INSERT INTO indications (id, wix_id, title, nickname, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6)
              ON CONFLICT (id) DO UPDATE
              SET title = EXCLUDED.title, nickname = EXCLUDED.nickname
            `, [
              indication.id,
              indication.wix_id,
              indication.title,
              indication.nickname,
              indication.created_at,
              indication.updated_at
            ])
            stats.indications.inserted++
          }
        }
        
        // 4. Insert/Update Drug
        await client.query(`
          INSERT INTO drugs (
            id, company_id, stage_event_id, wix_id, drug_name, ticker,
            is_big_mover, is_suspected_mover, mechanism_of_action, note,
            catalyst_date, catalyst_date_text, indications_text, has_catalyst,
            catalyst_source, market, last_name_updated, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
          ON CONFLICT (id) DO UPDATE
          SET 
            drug_name = EXCLUDED.drug_name,
            is_big_mover = EXCLUDED.is_big_mover,
            is_suspected_mover = EXCLUDED.is_suspected_mover,
            catalyst_date = EXCLUDED.catalyst_date,
            catalyst_date_text = EXCLUDED.catalyst_date_text,
            has_catalyst = EXCLUDED.has_catalyst,
            updated_at = EXCLUDED.updated_at,
            scraped_at = CURRENT_TIMESTAMP
        `, [
          drug.id,
          drug.company?.id,
          drug.stage_event?.id,
          drug.wix_id,
          drug.drug_name,
          drug.ticker,
          drug.is_big_mover,
          drug.is_suspected_mover,
          drug.mechanism_of_action,
          drug.note,
          drug.catalyst_date,
          drug.catalyst_date_text,
          drug.indications_text,
          drug.has_catalyst,
          drug.catalyst_source,
          drug.market,
          drug.last_name_updated,
          drug.created_at,
          drug.updated_at
        ])
        stats.drugs.inserted++
        
        // 5. Link Drug-Indications
        if (drug.indications && drug.indications.length > 0) {
          for (const indication of drug.indications) {
            await client.query(`
              INSERT INTO drug_indications (drug_id, indication_id)
              VALUES ($1, $2)
              ON CONFLICT DO NOTHING
            `, [drug.id, indication.id])
          }
        }
      }
      
      await client.query('COMMIT')
      console.log('✅ Drugs import completed successfully')
      
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('❌ Error importing drugs:', error)
    stats.errors.push(String(error))
  }
  
  return stats
}

async function importHistoricalCatalysts(filePath: string): Promise<ImportStats> {
  const stats: ImportStats = {
    companies: { inserted: 0, updated: 0 },
    indications: { inserted: 0, updated: 0 },
    stageEvents: { inserted: 0, updated: 0 },
    drugs: { inserted: 0, updated: 0 },
    historicalCatalysts: { inserted: 0, updated: 0 },
    errors: []
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const { data } = JSON.parse(fileContent)
    
    console.log(`📦 Importing ${data.length} historical catalysts...`)
    
    const client = await pool.connect()
    await client.query('BEGIN')
    
    try {
      for (const catalyst of data) {
        // Insert/Update Company if present
        if (catalyst.company) {
          await client.query(`
            INSERT INTO companies (id, ticker, name)
            VALUES ($1, $2, $3)
            ON CONFLICT (id) DO UPDATE
            SET ticker = EXCLUDED.ticker, name = EXCLUDED.name
          `, [catalyst.company.id, catalyst.ticker, catalyst.company.name])
          stats.companies.inserted++
        }
        
        // Insert Historical Catalyst
        await client.query(`
          INSERT INTO historical_catalysts (
            id, company_id, ticker, drug_name, drug_indication,
            stage, catalyst_date, catalyst_source, catalyst_text
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO UPDATE
          SET 
            catalyst_text = EXCLUDED.catalyst_text,
            scraped_at = CURRENT_TIMESTAMP
        `, [
          catalyst.id,
          catalyst.company?.id,
          catalyst.ticker,
          catalyst.drug_name,
          catalyst.drug_indication,
          catalyst.stage,
          catalyst.catalyst_date,
          catalyst.catalyst_source,
          catalyst.catalyst_text
        ])
        stats.historicalCatalysts.inserted++
      }
      
      await client.query('COMMIT')
      console.log('✅ Historical catalysts import completed successfully')
      
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('❌ Error importing historical catalysts:', error)
    stats.errors.push(String(error))
  }
  
  return stats
}

async function recordScrapeHistory(type: string, stats: ImportStats, metadata: any) {
  try {
    await pool.query(`
      INSERT INTO scrape_history (
        scrape_type, started_at, completed_at, records_fetched,
        pages_processed, errors, status, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      type,
      metadata.startTime || new Date(),
      new Date(),
      type === 'drugs' ? stats.drugs.inserted : stats.historicalCatalysts.inserted,
      metadata.pagesProcessed || 0,
      stats.errors,
      stats.errors.length > 0 ? 'failed' : 'completed',
      JSON.stringify(metadata)
    ])
  } catch (error) {
    console.error('Error recording scrape history:', error)
  }
}

async function printDatabaseStats() {
  try {
    const result = await pool.query('SELECT * FROM get_database_stats()')
    console.log('\n📊 Database Statistics:')
    console.log('─'.repeat(40))
    result.rows.forEach(row => {
      console.log(`${row.metric}: ${row.value.toLocaleString()}`)
    })
    
    // Year-by-year breakdown
    const yearStats = await pool.query('SELECT * FROM catalyst_events_by_year')
    if (yearStats.rows.length > 0) {
      console.log('\n📅 Historical Catalysts by Year:')
      console.log('─'.repeat(40))
      yearStats.rows.forEach(row => {
        console.log(`${row.year}: ${row.event_count.toLocaleString()} events (${row.unique_companies} companies)`)
      })
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  const filePath = args[1]
  
  console.log('🗄️  BPIQ PostgreSQL Import Tool')
  console.log('─'.repeat(40))
  
  try {
    // Test database connection
    await pool.query('SELECT 1')
    console.log('✅ Database connected successfully\n')
    
    switch (command) {
      case 'drugs':
        if (!filePath) {
          console.error('Please provide a drugs JSON file path')
          process.exit(1)
        }
        const drugStats = await importDrugsData(filePath)
        console.log('\nImport Summary:', drugStats)
        await recordScrapeHistory('drugs', drugStats, { filePath })
        break
        
      case 'historical':
        if (!filePath) {
          console.error('Please provide a historical catalysts JSON file path')
          process.exit(1)
        }
        const histStats = await importHistoricalCatalysts(filePath)
        console.log('\nImport Summary:', histStats)
        await recordScrapeHistory('historical_catalysts', histStats, { filePath })
        break
        
      case 'stats':
        await printDatabaseStats()
        break
        
      default:
        console.log('Usage:')
        console.log('  npm run import drugs <file.json>      - Import drugs data')
        console.log('  npm run import historical <file.json> - Import historical catalysts')
        console.log('  npm run import stats                  - Show database statistics')
    }
    
  } catch (error) {
    console.error('Fatal error:', error)
  } finally {
    await pool.end()
  }
}

main().catch(console.error)