"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ClusterSummary } from "@/types";
import { formatCurrency } from "@/lib/formatCurrency";
import { useSettings } from "@/context/SettingsContext";

const PALETTE = [
  "#7c3aed", // violet  — Subscriptions
  "#0ea5e9", // sky     — Transport
  "#10b981", // emerald — Food & Dining
  "#f59e0b", // amber   — Shopping
  "#f43f5e", // rose    — Entertainment & Health
];

interface ClusterChartProps {
  data: ClusterSummary[];
}

// Tooltip is rendered as an inline closure in the JSX so TypeScript infers
// Recharts' own callback parameter types without a conflicting interface.

export default function ClusterChart({ data }: ClusterChartProps) {
  const { currency } = useSettings();
  const chartData = data.map((d) => ({ name: d.cluster_name, value: d.total }));

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-base font-semibold text-zinc-800 dark:text-zinc-100">
        Spending by Cluster
      </h2>
      {chartData.length === 0 && (
        <p className="flex h-[300px] items-center justify-center text-sm text-zinc-400 dark:text-zinc-500">
          No transactions yet
        </p>
      )}
      {chartData.length > 0 && (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={120}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell
                key={index}
                fill={PALETTE[index % PALETTE.length]}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const name = String(payload[0].name ?? "");
              const raw = payload[0].value;
              const value = Array.isArray(raw) ? 0 : Number(raw ?? 0);
              return (
                <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-lg text-sm dark:border-zinc-700 dark:bg-zinc-800">
                  <p className="font-medium text-zinc-800 dark:text-zinc-100">{name}</p>
                  <p className="text-zinc-500 dark:text-zinc-400">
                    {formatCurrency(value, currency)}
                  </p>
                </div>
              );
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => (
              <span className="text-sm text-zinc-600 dark:text-zinc-400">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      )}
    </div>
  );
}
