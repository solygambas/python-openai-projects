export interface FredDataPoint {
  date: string;
  value: number;
}

export interface FredSeries {
  id: string;
  title: string;
  units: string;
  data: FredDataPoint[];
}

const FRED_API_BASE = 'https://api.stlouisfed.org/fred/series/observations';

export const FRED_SERIES_IDS = {
  CPI: 'CPIAUCSL',
  UNEMPLOYMENT: 'UNRATE',
  TREASURY_10Y: 'DGS10',
  FED_FUNDS: 'FEDFUNDS',
  TREASURY_3M: 'DGS3MO'
};

export async function fetchFredData(
  seriesId: string,
  startDate?: string,
  endDate?: string
): Promise<FredDataPoint[]> {
  const params = new URLSearchParams({
    series_id: seriesId,
  });

  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);

  try {
    const response = await fetch(`/api/fred?${params}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data.observations || [];
  } catch (error) {
    console.error(`Error fetching FRED data for ${seriesId}:`, error);
    return getMockData(seriesId);
  }
}

function getMockData(seriesId: string): FredDataPoint[] {
  const baseDate = new Date('2023-01-01');
  const dataPoints: FredDataPoint[] = [];
  
  for (let i = 0; i < 24; i++) {
    const date = new Date(baseDate);
    date.setMonth(date.getMonth() + i);
    
    let value: number;
    switch (seriesId) {
      case FRED_SERIES_IDS.CPI:
        value = 299.17 + (i * 0.8) + (Math.random() * 2 - 1);
        break;
      case FRED_SERIES_IDS.UNEMPLOYMENT:
        value = 3.4 + (Math.sin(i / 3) * 0.3) + (Math.random() * 0.2);
        break;
      case FRED_SERIES_IDS.TREASURY_10Y:
        value = 3.5 + (i * 0.05) + (Math.sin(i / 4) * 0.5);
        break;
      case FRED_SERIES_IDS.FED_FUNDS:
        value = 4.5 + (i < 6 ? i * 0.25 : 1.5);
        break;
      case FRED_SERIES_IDS.TREASURY_3M:
        value = 4.5 + (i < 6 ? i * 0.25 : 1.5) + (Math.random() * 0.1);
        break;
      default:
        value = 100 + (i * 2) + (Math.random() * 5);
    }
    
    dataPoints.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value * 100) / 100
    });
  }
  
  return dataPoints;
}