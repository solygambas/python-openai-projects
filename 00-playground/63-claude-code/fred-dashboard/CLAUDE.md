# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application that displays economic indicators from the Federal Reserve Economic Data (FRED) API. The app features a dashboard with real-time charts showing key economic metrics like Consumer Price Index (CPI), unemployment rate, and Treasury yields.

## Architecture

The application follows Next.js App Router architecture with these key layers:

### API Layer (`app/api/fred/route.ts`)

- Proxy endpoint for FRED API requests to handle CORS and API key management
- Requires `NEXT_PUBLIC_FRED_API_KEY` environment variable
- Filters invalid data points (marked as '.') and transforms response format
- Falls back gracefully when API key is missing or invalid

### Data Layer (`libs/fred-api.ts`)

- Client-side API functions for fetching FRED data
- Defines FRED series IDs for different economic indicators
- Includes mock data fallback for development/testing
- TypeScript interfaces for data structures

### Hook Layer (`hooks/useFredData.ts`)

- React hook that manages FRED data fetching with loading/error states
- Handles caching and re-fetching when parameters change
- Returns standardized data format for chart components

### UI Layer (`app/page.tsx`)

- Main dashboard component with sidebar navigation and chart grid
- Uses Recharts library for data visualization
- Responsive design with Tailwind CSS
- Real-time data fetching for last 2 years of economic data

## Common Development Commands

```bash
# Install dependencies
npm install

# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Environment Setup

Create a `.env.local` file with:

```
NEXT_PUBLIC_FRED_API_KEY=your_actual_fred_api_key_here
```

Get your free FRED API key from: https://fred.stlouisfed.org/docs/api/api_key.html

## Key Dependencies

- **Next.js 15**: React framework with App Router
- **Recharts**: Data visualization library for economic charts
- **Lucide React**: Icon library for UI elements
- **Tailwind CSS v4**: Utility-first CSS framework
- **TypeScript**: Type safety throughout the application

## Data Flow

1. Dashboard component renders with predefined date range (last 2 years)
2. Multiple `useFredData` hooks fetch different economic indicators simultaneously
3. Each hook calls `fetchFredData` which proxies through `/api/fred` endpoint
4. API route fetches from FRED API using configured API key
5. Data is transformed and displayed in Recharts components
6. Loading states and error handling are managed at hook level

## Series IDs

The app currently displays these FRED series:

- `CPIAUCSL`: Consumer Price Index
- `UNRATE`: Unemployment Rate
- `DGS10`: 10-Year Treasury Constant Maturity Rate
- `DGS3MO`: 3-Month Treasury Constant Maturity Rate
- `FEDFUNDS`: Federal Funds Rate (available but not currently displayed)

## Chart Configuration

Charts are configured with:

- 2-year historical data range
- Responsive containers
- Custom date formatting for X-axis
- Appropriate Y-axis domains for each metric type
- Tooltip formatting with proper units (%, currency, index values)
- Direct links to FRED series pages for detailed data
