export interface Company {
  id: number
  ticker: string
  name: string
}

export interface Indication {
  id: number
  created_at: string
  updated_at: string
  wix_id: string
  title: string
  nickname: string
}

export interface StageEvent {
  id: number
  created_at: string
  updated_at: string
  wix_id: string
  label: string
  stage_label: string
  stage: string
  event_label: string
  event: string
  score: number
}

export interface Drug {
  id: number
  company: Company
  indications: Indication[]
  stage_event: StageEvent
  created_at: string
  updated_at: string
  wix_id: string
  drug_name: string
  ticker: string
  is_big_mover: boolean
  mechanism_of_action: string
  note: string
  catalyst_date: string | null
  catalyst_date_text: string
  indications_text: string
  has_catalyst: boolean
  is_suspected_mover: boolean
  catalyst_source: string
  market: string
  last_name_updated: string
}

export interface HistoricalCatalyst {
  id: number
  company: Company
  ticker: string
  drug_name: string
  drug_indication: string
  stage: string
  catalyst_date: string
  catalyst_source: string
  catalyst_text: string
}

export interface ApiResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}