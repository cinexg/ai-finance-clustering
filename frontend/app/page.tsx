"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Download, LayoutDashboard, Plus } from "lucide-react";
import type { Transaction, ClusterSummary } from "@/types";
import { exportTransactionsCsv } from "@/lib/exportCsv";
import { useSettings } from "@/context/SettingsContext";
import SummaryCard from "@/components/SummaryCard";
import ClusterChart from "@/components/ClusterChart";
import TransactionTable from "@/components/TransactionTable";
import TransactionModal from "@/components/TransactionModal";
import ThemeToggle from "@/components/ThemeToggle";
import CurrencySelect from "@/components/CurrencySelect";

const BASE_URL = "http://localhost:8000";

const CURRENCY_OPTIONS = [
  { code: "USD", label: "US Dollar",   symbol: "$" },
  { code: "EUR", label: "Euro",        symbol: "€" },
  { code: "GBP", label: "Pound",       symbol: "£" },
  { code: "INR", label: "Indian Rupee",symbol: "₹" },
  { code: "JPY", label: "Yen",         symbol: "¥" },
];

function buildClusterSummaries(transactions: Transaction[]): ClusterSummary[] {
  const map = new Map<string, ClusterSummary>();
  for (const tx of transactions) {
    const key = tx.manual_category ?? tx.cluster_name;
    const existing = map.get(key);
    const amount = tx.amount ?? 0;
    if (existing) {
      existing.total += amount;
      existing.count += 1;
    } else {
      map.set(key, { cluster_name: key, total: amount, count: 1 });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export default function DashboardPage() {
  const { currency, setCurrency } = useSettings();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // undefined = closed | null = add mode | Transaction = edit mode
  const [modalTarget, setModalTarget] = useState<Transaction | null | undefined>(undefined);

  const fetchClusters = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/clusters`);
      if (!res.ok) throw new Error(`Server error: ${res.status} ${res.statusText}`);
      const data: Transaction[] = await res.json();
      setTransactions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClusters(); }, [fetchClusters]);

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`${BASE_URL}/api/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      await fetchClusters();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    for (const tx of transactions) {
      cats.add(tx.cluster_name);
      if (tx.manual_category) cats.add(tx.manual_category);
    }
    return Array.from(cats).sort();
  }, [transactions]);

  // Derived stats
  const totalSpent = transactions.reduce((sum, tx) => sum + (tx.amount ?? 0), 0);
  const avgTransaction = transactions.length > 0 ? totalSpent / transactions.length : 0;
  const clusterSummaries = buildClusterSummaries(transactions);
  const categoryCount = clusterSummaries.length;
  const isModalOpen = modalTarget !== undefined;

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading transactions…</p>
        </div>
      </div>
    );
  }

  // ── Fatal error state ──────────────────────────────────────────────────────
  if (error && transactions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center shadow-sm dark:border-red-900 dark:bg-red-950">
          <p className="text-base font-semibold text-red-700 dark:text-red-400">
            Failed to load data
          </p>
          <p className="mt-1 text-sm text-red-500">{error}</p>
          <p className="mt-3 text-xs text-zinc-400">
            Make sure the backend is running at{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              localhost:8000
            </code>
          </p>
        </div>
      </div>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* ── Header ── */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Finance Dashboard
              </h1>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                ML-powered spending clusters
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <CurrencySelect
              value={currency}
              options={CURRENCY_OPTIONS}
              onChange={setCurrency}
            />
            <ThemeToggle />
            <button
              onClick={() => exportTransactionsCsv(transactions)}
              className="flex h-9 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={() => setModalTarget(null)}
              className="flex h-9 items-center gap-2 rounded-xl bg-violet-600 px-3 text-sm font-medium text-white transition-colors hover:bg-violet-700"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Transaction</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Mutation error banner ── */}
      {error && transactions.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
            {error}
          </p>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        {/* 4-stat summary row */}
        <SummaryCard
          totalTransactions={transactions.length}
          totalSpent={totalSpent}
          avgTransaction={avgTransaction}
          categoryCount={categoryCount}
        />

        {/* Pie chart — ResponsiveContainer handles dynamic resize */}
        <ClusterChart data={clusterSummaries} />

        {/* Transaction table — overflow-x-auto keeps mobile scroll contained */}
        <TransactionTable
          transactions={transactions}
          onEdit={(tx) => setModalTarget(tx)}
          onDelete={handleDelete}
        />
      </main>

      {/* ── Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <TransactionModal
            transaction={modalTarget ?? undefined}
            availableCategories={availableCategories}
            onClose={() => setModalTarget(undefined)}
            onSuccess={fetchClusters}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
