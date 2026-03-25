"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { Transaction } from "@/types";
import DatePicker from "@/components/DatePicker";
import CategorySelect from "@/components/CategorySelect";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface TransactionModalProps {
  transaction?: Transaction;   // undefined = add mode, populated = edit mode
  availableCategories: string[];
  onClose: () => void;
  onSuccess: () => void;
}

interface ModalForm {
  date: string;
  vendor: string;
  amount: number;
  manual_category: string | null;
}

const EMPTY_FORM: ModalForm = {
  date: "",
  vendor: "",
  amount: 0,
  manual_category: null,
};

export default function TransactionModal({
  transaction,
  availableCategories,
  onClose,
  onSuccess,
}: TransactionModalProps) {
  const isEdit = !!transaction;

  const [form, setForm] = useState<ModalForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit && transaction) {
      setForm({
        date: transaction?.date ?? "",
        vendor: transaction?.vendor ?? "",
        amount: transaction?.amount ?? 0,
        manual_category: transaction?.manual_category ?? null,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError(null);
  }, [transaction, isEdit]);

  function handleTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "amount" ? parseFloat(value) || 0 : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const url = isEdit && transaction
        ? `${BASE_URL}/api/transactions/${transaction.transaction_id}`
        : `${BASE_URL}/api/transactions`;

      // For PUT: always include manual_category so the backend knows
      // whether to keep, change, or clear (null) the override.
      const body = isEdit
        ? {
            date: form.date,
            vendor: form.vendor,
            amount: form.amount,
            manual_category: form.manual_category,
          }
        : {
            date: form.date,
            vendor: form.vendor,
            amount: form.amount,
            ...(form.manual_category !== null && {
              manual_category: form.manual_category,
            }),
          };

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.detail ?? `Request failed: ${res.status}`);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 " +
    "placeholder:text-zinc-400 outline-none transition " +
    "focus:border-violet-500 focus:ring-2 focus:ring-violet-100 " +
    "dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 " +
    "dark:placeholder:text-zinc-600 dark:focus:ring-violet-900";

  const labelClass = "mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 dark:bg-black/60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="w-full max-w-md rounded-2xl bg-white shadow-xl dark:border dark:border-zinc-800 dark:bg-zinc-900"
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {isEdit ? "Edit Transaction" : "Add Transaction"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {/* Date — custom popover picker */}
          <div>
            <label className={labelClass}>Date</label>
            <DatePicker
              value={form.date}
              onChange={(iso) => setForm((p) => ({ ...p, date: iso }))}
              required
            />
          </div>

          {/* Vendor */}
          <div>
            <label className={labelClass}>Vendor</label>
            <input
              type="text"
              name="vendor"
              value={form.vendor}
              onChange={handleTextChange}
              required
              placeholder="e.g. Starbucks, Amazon"
              className={inputClass}
            />
          </div>

          {/* Amount */}
          <div>
            <label className={labelClass}>Amount ($)</label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleTextChange}
              required
              min={0}
              step={0.01}
              placeholder="0.00"
              className={inputClass}
            />
          </div>

          {/* Category override */}
          <div>
            <label className={labelClass}>Category</label>
            <CategorySelect
              value={form.manual_category}
              options={availableCategories}
              onChange={(cat) =>
                setForm((p) => ({ ...p, manual_category: cat }))
              }
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-60"
            >
              {submitting ? "Saving…" : isEdit ? "Save Changes" : "Add Transaction"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}