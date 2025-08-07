# BPIQ Explorer

A Next.js application to explore BiopharmIQ API data including drug pipelines and catalyst events.

## Features

- Browse drug pipeline data with pagination
- View historical catalyst events (Premium API)
- Filter by Big Movers and Suspected Movers
- Track drugs with upcoming catalysts
- View detailed drug information including:
  - Company and ticker information
  - Development stage
  - Indications
  - Catalyst dates
  - Source links

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env.local`:
```
BPIQ_API_KEY=your_api_key_here
NEXT_PUBLIC_API_BASE_URL=https://api.bpiq.com/api/v1
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- Radix UI components
- TanStack Query for data fetching
- date-fns for date formatting

## API Endpoints

- `/drugs` - Get drug pipeline data
- `/historical-catalysts/screener/` - Get historical catalyst events (Premium API only)