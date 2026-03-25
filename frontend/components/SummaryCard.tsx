"use client";

import { DollarSign, LayoutGrid, ListOrdered, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/formatCurrency";
import { useSettings } from "@/context/SettingsContext";

interface SummaryCardProps {
  totalTransactions: number;
  totalSpent: number;
  avgTransaction: number;
  categoryCount: number;
}

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
}

function StatCard({ icon, iconBg, label, value }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="truncate text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function SummaryCard({
  totalTransactions,
  totalSpent,
  avgTransaction,
  categoryCount,
}: SummaryCardProps) {
  const { currency } = useSettings();

  return (
    // 1-col mobile → 2-col tablet → 4-col desktop
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        iconBg="bg-violet-100 dark:bg-violet-950"
        icon={<ListOrdered className="h-5 w-5 text-violet-600 dark:text-violet-400" />}
        label="Total Transactions"
        value={totalTransactions.toString()}
      />
      <StatCard
        iconBg="bg-emerald-100 dark:bg-emerald-950"
        icon={<DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        label="Total Spent"
        value={formatCurrency(totalSpent, currency)}
      />
      <StatCard
        iconBg="bg-sky-100 dark:bg-sky-950"
        icon={<TrendingDown className="h-5 w-5 text-sky-600 dark:text-sky-400" />}
        label="Avg. Transaction"
        value={totalTransactions > 0 ? formatCurrency(avgTransaction, currency) : "—"}
      />
      <StatCard
        iconBg="bg-amber-100 dark:bg-amber-950"
        icon={<LayoutGrid className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
        label="Clusters"
        value={categoryCount.toString()}
      />
    </div>
  );
}
