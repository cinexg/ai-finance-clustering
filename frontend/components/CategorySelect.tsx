"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Plus, Sparkles, X } from "lucide-react";

interface CategorySelectProps {
  value: string | null;      // null  = let ML decide
  options: string[];         // existing category names
  onChange: (value: string | null) => void;
}

export default function CategorySelect({
  value,
  options,
  onChange,
}: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  );
  const hasExactMatch = options.some(
    (o) => o.toLowerCase() === search.toLowerCase()
  );
  const canCreate = search.trim().length > 0 && !hasExactMatch;

  function select(cat: string | null) {
    onChange(cat);
    setOpen(false);
    setSearch("");
  }

  const displayValue = value ?? null;

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={
          "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm " +
          "outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 " +
          "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 " +
          "dark:focus:ring-violet-900"
        }
      >
        {displayValue ? (
          <span className="text-zinc-900 dark:text-zinc-100">{displayValue}</span>
        ) : (
          <span className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
            <Sparkles className="h-3.5 w-3.5" />
            ML suggested (auto)
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={
            "absolute left-0 top-full z-50 mt-1 w-full rounded-xl border shadow-xl " +
            "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
          }
        >
          {/* Search input */}
          <div className="border-b border-zinc-100 p-2 dark:border-zinc-700">
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search or create…"
              className={
                "w-full rounded-lg bg-zinc-50 px-2.5 py-1.5 text-sm outline-none " +
                "text-zinc-900 placeholder:text-zinc-400 " +
                "dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              }
            />
          </div>

          <ul className="max-h-48 overflow-y-auto py-1">
            {/* Revert to ML option */}
            <li>
              <button
                type="button"
                onClick={() => select(null)}
                className={
                  "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors " +
                  "hover:bg-zinc-50 dark:hover:bg-zinc-700/60 " +
                  (displayValue === null
                    ? "text-violet-600 dark:text-violet-400"
                    : "text-zinc-500 dark:text-zinc-400")
                }
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span>ML suggested (auto)</span>
                {displayValue === null && (
                  <Check className="ml-auto h-3.5 w-3.5" />
                )}
              </button>
            </li>

            {/* Divider */}
            {(filtered.length > 0 || canCreate) && (
              <li className="my-1 border-t border-zinc-100 dark:border-zinc-700" />
            )}

            {/* Existing categories */}
            {filtered.map((cat) => (
              <li key={cat}>
                <button
                  type="button"
                  onClick={() => select(cat)}
                  className={
                    "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors " +
                    "hover:bg-zinc-50 dark:hover:bg-zinc-700/60 " +
                    (displayValue === cat
                      ? "text-violet-600 dark:text-violet-400 font-medium"
                      : "text-zinc-700 dark:text-zinc-300")
                  }
                >
                  <span className="flex-1 text-left">{cat}</span>
                  {displayValue === cat && (
                    <Check className="h-3.5 w-3.5 shrink-0" />
                  )}
                </button>
              </li>
            ))}

            {/* Create new category */}
            {canCreate && (
              <li>
                <button
                  type="button"
                  onClick={() => select(search.trim())}
                  className={
                    "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors " +
                    "text-violet-600 dark:text-violet-400 " +
                    "hover:bg-violet-50 dark:hover:bg-violet-950/40"
                  }
                >
                  <Plus className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Create{" "}
                    <span className="font-medium">"{search.trim()}"</span>
                  </span>
                </button>
              </li>
            )}

            {filtered.length === 0 && !canCreate && (
              <li className="px-3 py-2 text-sm text-zinc-400 dark:text-zinc-600">
                No categories found
              </li>
            )}
          </ul>

          {/* Clear current override (only shown when a manual category is set) */}
          {displayValue && (
            <div className="border-t border-zinc-100 p-2 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => select(null)}
                className={
                  "flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs " +
                  "text-red-500 hover:bg-red-50 transition-colors " +
                  "dark:text-red-400 dark:hover:bg-red-950/40"
                }
              >
                <X className="h-3 w-3" />
                Clear override — revert to ML
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
