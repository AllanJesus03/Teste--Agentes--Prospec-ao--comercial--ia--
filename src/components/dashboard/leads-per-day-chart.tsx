"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface LeadsPerDayChartProps {
  data?: Array<{ date: string; count: number }>;
}

const FALLBACK = [
  { date: "Hoje", count: 0 },
];

function formatDay(date: string): string {
  try {
    const [, m, d] = date.split("-");
    return `${d}/${m}`;
  } catch {
    return date;
  }
}

export function LeadsPerDayChart({ data }: LeadsPerDayChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return FALLBACK;
    return data.map((d) => ({ ...d, label: formatDay(d.date) }));
  }, [data]);

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            stroke="var(--muted-foreground)"
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11 }}
            stroke="var(--muted-foreground)"
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border)",
              fontSize: 12,
            }}
            labelFormatter={(label) => `Data: ${label}`}
          />
          <Area
            type="monotone"
            dataKey="count"
            name="Leads"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#leadGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}