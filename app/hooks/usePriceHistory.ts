import { useEffect, useState, useCallback } from "react";
import { getSupabaseClient } from "../utils/supabase";

interface PriceHistoryPoint {
  date: string;
  price: number;
}

interface UsePriceHistoryReturn {
  data: PriceHistoryPoint[];
  isLoading: boolean;
  error: string | null;
}

export function usePriceHistory(skuId: string | null, days: number): UsePriceHistoryReturn {
  const [data, setData] = useState<PriceHistoryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!skuId) {
      setData([]);
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      setData([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);

      const { data: result, error: queryError } = await client
        .from("product_sku_price_snapshots")
        .select("price,captured_at")
        .eq("sku_id", skuId)
        .gte("captured_at", cutoff.toISOString())
        .order("captured_at", { ascending: true });

      if (queryError) {
        setError(queryError.message);
        setData([]);
        return;
      }

      if (!result || result.length === 0) {
        setData([]);
        return;
      }

      const points: PriceHistoryPoint[] = result.map((row: Record<string, unknown>) => ({
        date: String(row.captured_at ?? ""),
        price: Number(row.price ?? 0),
      }));

      setData(points);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [skuId, days]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { data, isLoading, error };
}
