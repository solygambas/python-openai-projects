import { NextRequest, NextResponse } from 'next/server';

const FRED_API_BASE = 'https://api.stlouisfed.org/fred/series/observations';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const seriesId = searchParams.get('series_id');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  if (!seriesId) {
    return NextResponse.json(
      { error: 'series_id is required' },
      { status: 400 }
    );
  }

  const apiKey = process.env.NEXT_PUBLIC_FRED_API_KEY;
  
  if (!apiKey || apiKey === 'your_fred_api_key_here') {
    return NextResponse.json(
      { error: 'FRED API key not configured' },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: apiKey,
    file_type: 'json',
    sort_order: 'asc'
  });

  if (startDate) params.append('observation_start', startDate);
  if (endDate) params.append('observation_end', endDate);

  try {
    const response = await fetch(`${FRED_API_BASE}?${params}`);
    
    if (!response.ok) {
      throw new Error(`FRED API error: ${response.status}`);
    }

    const data = await response.json();
    
    const observations = data.observations
      .filter((obs: any) => obs.value !== '.')
      .map((obs: any) => ({
        date: obs.date,
        value: parseFloat(obs.value)
      }));

    return NextResponse.json({ observations });
  } catch (error) {
    console.error('Error fetching FRED data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from FRED API' },
      { status: 500 }
    );
  }
}