import type { Transaction } from "@/types";

function escapeCsvField(value: string): string {
  // Wrap in quotes if the field contains a comma, quote, or newline
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportTransactionsCsv(transactions: Transaction[]): void {
  const header = ["Date", "Vendor", "Amount", "Category"];

  const rows = transactions.map((tx) => [
    escapeCsvField(tx.date ?? ""),
    escapeCsvField(tx.vendor ?? "Unknown"),
    tx.amount != null ? tx.amount.toFixed(2) : "",
    escapeCsvField(tx.cluster_name),
  ]);

  const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();

  URL.revokeObjectURL(url);
}
