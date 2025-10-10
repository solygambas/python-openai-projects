# FRED Economic Indicators Dashboard

This is a Next.js 15 application that displays real-time economic indicators from the Federal Reserve Economic Data (FRED) API. The dashboard features interactive charts showing key economic metrics like Consumer Price Index (CPI), unemployment rate, and Treasury yields.

## Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- FRED API key (free from [fred.stlouisfed.org](https://fred.stlouisfed.org/docs/api/api_key.html))

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_FRED_API_KEY=your_actual_fred_api_key_here
```

   > Get your free FRED API key at [fred.stlouisfed.org/docs/api/api_key.html](https://fred.stlouisfed.org/docs/api/api_key.html)

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the dashboard.

## Features

- **Real-time Economic Data**: Fetches live data from FRED API
- **Interactive Charts**: Built with Recharts for responsive data visualization
- **Key Economic Indicators**: 
  - Consumer Price Index (CPI)
  - Unemployment Rate
  - 10-Year Treasury Yield
  - 3-Month Treasury Yield
- **Responsive Design**: Built with Tailwind CSS
- **Mock Data Fallback**: Works without API key for development

## Tech Stack

- Next.js 15 with App Router
- TypeScript
- Tailwind CSS v4
- Recharts
- Lucide React (icons)

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Learn More

- [FRED API Documentation](https://fred.stlouisfed.org/docs/api/) - Learn about Federal Reserve Economic Data API
- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [Recharts Documentation](https://recharts.org/en-US/) - Data visualization library

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
