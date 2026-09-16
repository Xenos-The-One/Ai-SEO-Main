import { ReactNode } from "react";

/**
 * Shared, theme-aware primitives for the client-portal charts.
 *
 * Everything here resolves through CSS variables (--border, --muted-foreground,
 * --popover, --series-*), so a single chart renders correctly in both light and
 * dark mode without JS. Recharts reads these as plain SVG colors at paint time.
 */

/** Horizontal-only, recessive grid. */
export const CHART_GRID = {
  vertical: false,
  stroke: "var(--border)",
  strokeOpacity: 0.7,
} as const;

/** Axis chrome: no tick/axis lines, muted labels. Spread onto XAxis/YAxis. */
export const CHART_AXIS = {
  tickLine: false,
  axisLine: false,
  tickMargin: 10,
  tick: { fill: "var(--muted-foreground)", fontSize: 12 },
} as const;

/** Hover cursors. */
export const BAR_CURSOR = { fill: "var(--muted-foreground)", fillOpacity: 0.06 };
export const LINE_CURSOR = { stroke: "var(--muted-foreground)", strokeOpacity: 0.4, strokeDasharray: "4 4" };

const num = (v: any) => (typeof v === "number" ? v.toLocaleString() : v);

/** A vertical fade for area/bar fills. Render inside a chart's <defs>. */
export function AreaGradient({ id, color, from = 0.35, to = 0.03 }: { id: string; color: string; from?: number; to?: number }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={color} stopOpacity={from} />
      <stop offset="95%" stopColor={color} stopOpacity={to} />
    </linearGradient>
  );
}

type TooltipProps = {
  active?: boolean;
  payload?: any[];
  label?: any;
  labelFormatter?: (label: any) => ReactNode;
  valueFormatter?: (value: any) => ReactNode;
};

/** Themed tooltip: card surface, subtle border/shadow, colored series dots, right-aligned values. */
export function ChartTooltip({ active, payload, label, labelFormatter, valueFormatter = num }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p) => p && p.value != null);
  if (!rows.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm">
      {label != null && (
        <p className="mb-1.5 font-medium text-popover-foreground">{labelFormatter ? labelFormatter(label) : label}</p>
      )}
      <div className="grid gap-1.5">
        {rows.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: p.color || p.payload?.fill || p.fill }}
            />
            <span className="text-muted-foreground">{p.name}</span>
            <span className="ml-auto pl-4 font-medium tabular-nums text-popover-foreground">
              {valueFormatter(p.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Clean legend: circular swatches, muted text. Use as <Legend content={<ChartLegend />} />. */
export function ChartLegend({ payload, formatter }: { payload?: any[]; formatter?: (entry: any) => ReactNode }) {
  if (!payload?.length) return null;
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-4">
      {payload
        .filter((e) => e.type !== "none")
        .map((e, i) => (
          <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: e.color }} />
            {formatter ? formatter(e) : e.value}
          </li>
        ))}
    </ul>
  );
}
