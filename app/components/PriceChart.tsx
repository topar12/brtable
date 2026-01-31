import { useMemo } from "react";

interface PricePoint {
  date: string;
  price: number;
}

interface PriceChartProps {
  data: PricePoint[];
  currentPrice: number;
  minPrice: number;
  maxPrice: number;
  days: number;
}

interface ChartPoint {
  x: number;
  y: number;
  price: number;
  date: string;
}

interface ChartData {
  points: ChartPoint[];
  path: string;
  areaPath: string;
  min: number;
  max: number;
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
}

export function PriceChart({ data, currentPrice, minPrice, maxPrice, days }: PriceChartProps) {
  const chartData = useMemo<ChartData | null>(() => {
    if (!data.length) {
      return null;
    }

    const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const width = 300;
    const height = 100;
    const padding = { top: 10, right: 10, bottom: 20, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const min = Math.min(...sorted.map((d) => d.price), minPrice);
    const max = Math.max(...sorted.map((d) => d.price), maxPrice);
    const range = max - min || 1;

    const points: ChartPoint[] = sorted.map((d, i) => {
      const x = padding.left + (i / (sorted.length - 1 || 1)) * chartWidth;
      const y = padding.top + chartHeight - ((d.price - min) / range) * chartHeight;
      return { x, y, price: d.price, date: d.date };
    });

    if (points.length === 0) {
      return null;
    }

    const path = points.reduce((acc: string, point: ChartPoint, i: number) => {
      if (i === 0) return `M ${point.x} ${point.y}`;
      return `${acc} L ${point.x} ${point.y}`;
    }, "");

    const areaPath = `${path} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

    return { points, path, areaPath, min, max, width, height, padding };
  }, [data, minPrice, maxPrice]);

  if (!chartData) {
    return (
      <div style={{ height: "120px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
        가격 데이터가 없습니다
      </div>
    );
  }

  const { points, path, areaPath, min, max, width, height, padding } = chartData;

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", maxWidth: "400px", height: "auto" }}>
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={areaPath} fill="url(#priceGradient)" />
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2" />

        {points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="3"
            fill="var(--accent)"
            stroke="white"
            strokeWidth="1"
          />
        ))}

        <text x={padding.left - 5} y={padding.top + 5} textAnchor="end" fontSize="10" fill="var(--muted)">
          {max.toLocaleString()}원
        </text>
        <text x={padding.left - 5} y={padding.top + 75} textAnchor="end" fontSize="10" fill="var(--muted)">
          {min.toLocaleString()}원
        </text>

        <text x={padding.left} y={height - 5} fontSize="10" fill="var(--muted)">
          {days}일 추이
        </text>
      </svg>
    </div>
  );
}
