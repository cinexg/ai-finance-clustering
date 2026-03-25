"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

interface CurrencyOption {
  code: string;
  label: string;
  symbol: string;
}

interface CurrencySelectProps {
  value: string;
  options: CurrencyOption[];
  onChange: (code: string) => void;
}

export default function CurrencySelect({
  value,
  options,
  onChange,
}: CurrencySelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.code === value) ?? options[0];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  function choose(code: string) {
    onChange(code);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Select currency"
        aria-expanded={open}
        className="flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      >
        <span className="text-base leading-none">{selected.symbol}</span>
        <span className="hidden sm:inline">{selected.code}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 min-w-[130px] rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          {options.map((opt) => {
            const isActive = opt.code === value;
            return (
              <button
                key={opt.code}
                type="button"
                onClick={() => choose(opt.code)}
                className={[
                  "flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "text-violet-600 dark:text-violet-400"
                    : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-700/60",
                ].join(" ")}
              >
                <span className="w-4 text-center text-base leading-none">
                  {opt.symbol}
                </span>
                <span className="flex-1 text-left">{opt.label}</span>
                {isActive && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
