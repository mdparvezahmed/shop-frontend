"use client";

import { Area, Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps, type TooltipValueType } from "recharts";
import { formatNumber, formatPrice } from "@/lib/utils";
import type { SalesPoint } from "@/types/admin-operations";
import { shortDateLabel } from "./helpers";

/**
 * Revenue (area, left axis) and order count (bars, right axis) per day — or per
 * month for the yearly view. Colours come from the theme tokens so the chart
 * follows light/dark mode.
 */
export function SalesChart({ data }: { data: SalesPoint[] }) {
  const tick = { fill: "var(--muted-foreground)", fontSize: 11 };
  const compact = (n: number) => (n >= 100000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: "var(--primary)", stopOpacity: 0.22 }} />
              <stop offset="100%" style={{ stopColor: "var(--primary)", stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={shortDateLabel}
            tick={tick}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            minTickGap={16}
          />
          <YAxis yAxisId="revenue" tick={tick} tickLine={false} axisLine={false} tickFormatter={compact} width={48} />
          <YAxis yAxisId="orders" orientation="right" tick={tick} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
          <Tooltip content={ChartTooltip} cursor={{ fill: "var(--muted)", opacity: 0.6 }} />
          <Bar yAxisId="orders" dataKey="orders" name="Orders" fill="var(--accent)" fillOpacity={0.35} radius={[3, 3, 0, 0]} maxBarSize={22} />
          <Area
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="url(#revenueFill)"
            dot={data.length <= 2 ? { r: 3, fill: "var(--primary)" } : false}
            activeDot={{ r: 4, fill: "var(--primary)", stroke: "var(--card)", strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: TooltipContentProps<TooltipValueType, string | number>) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as SalesPoint | undefined;
  if (!point) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium">{shortDateLabel(String(label ?? point.date))}</p>
      <p className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-primary" /> Revenue <span className="ml-auto pl-3 font-semibold tabular-nums">{formatPrice(point.revenue)}</span>
      </p>
      <p className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-accent/60" /> Orders <span className="ml-auto pl-3 font-semibold tabular-nums">{formatNumber(point.orders)}</span>
      </p>
    </div>
  );
}
