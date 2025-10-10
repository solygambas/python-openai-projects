import { useState, useEffect } from "react";
import { fetchFredData, FredDataPoint } from "@/libs/fred-api";

export function useFredData(
  seriesId: string,
  startDate?: string,
  endDate?: string
) {
  const [data, setData] = useState<FredDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchFredData(seriesId, startDate, endDate);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [seriesId, startDate, endDate]);

  return { data, loading, error };
}
