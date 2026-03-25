"use client";

import { motion } from "framer-motion";
import { Pencil, Pin, Trash2 } from "lucide-react";
import type { Transaction } from "@/types";
import { formatCurrency } from "@/lib/formatCurrency";
import { useSettings } from "@/context/SettingsContext";

const BADGE_STYLES: Record<string, string> = {
  Subscriptions:
    "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  Transport:
    "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  "Food & Dining":
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  Shopping:
    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  "Entertainment & Health":
    "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

const DEFAULT_BADGE = "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";

const rowVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, delay: Math.min(i, 25) * 0.03 },
  }),
};

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

interface ClusterBadgeProps {
  name: string;
  isManual: boolean;
}

function ClusterBadge({ name, isManual }: ClusterBadgeProps) {
  const style = BADGE_STYLES[name] ?? DEFAULT_BADGE;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
      title={isManual ? "Manually categorised" : "ML suggested"}
    >
      {isManual && <Pin className="h-2.5 w-2.5 shrink-0" aria-label="Manual override" />}
      {name}
    </span>
  );
}

export default function TransactionTable({
  transactions,
  onEdit,
  onDelete,
}: TransactionTableProps) {
  const { currency } = useSettings();

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
          All Transactions
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400">
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Vendor</th>
              <th className="px-5 py-3 text-right">Amount</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {transactions.map((tx, i) => {
              const displayCategory = tx.manual_category ?? tx.cluster_name;
              const isManual = tx.manual_category !== null;
              return (
                <motion.tr
                  key={tx.transaction_id}
                  custom={i}
                  variants={rowVariants}
                  initial="hidden"
                  animate="visible"
                  className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <td className="whitespace-nowrap px-5 py-3 text-zinc-500 dark:text-zinc-400">
                    {tx.date ?? <span className="italic text-zinc-400">—</span>}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 font-medium text-zinc-800 dark:text-zinc-100">
                    {tx.vendor ?? (
                      <span className="italic text-zinc-400">Unknown</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-zinc-800 dark:text-zinc-100">
                    {tx.amount != null ? (
                      formatCurrency(tx.amount, currency)
                    ) : (
                      <span className="italic text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <ClusterBadge name={displayCategory} isManual={isManual} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(tx)}
                        className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-violet-600 dark:hover:bg-zinc-700 dark:hover:text-violet-400"
                        aria-label="Edit transaction"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(tx.transaction_id)}
                        className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950 dark:hover:text-red-400"
                        aria-label="Delete transaction"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
