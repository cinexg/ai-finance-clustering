"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DayPicker } from "react-day-picker";
import { format, parse, isValid } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

// Full Tailwind classNames — no react-day-picker default CSS needed
const DPC = {
  root: "w-64 select-none",
  months: "flex flex-col",
  month: "w-full",
  month_caption: "relative flex h-10 items-center justify-center mb-2",
  caption_label: "text-sm font-semibold text-zinc-800 dark:text-zinc-100",
  nav: "absolute inset-x-0 flex items-center justify-between pointer-events-none",
  button_previous:
    "pointer-events-auto flex h-7 w-7 items-center justify-center rounded-lg " +
    "text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 " +
    "focus:outline-none dark:hover:bg-zinc-700 dark:hover:text-zinc-200",
  button_next:
    "pointer-events-auto flex h-7 w-7 items-center justify-center rounded-lg " +
    "text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 " +
    "focus:outline-none dark:hover:bg-zinc-700 dark:hover:text-zinc-200",
  month_grid: "w-full border-collapse",
  weekdays: "",
  weekday:
    "text-xs font-medium text-zinc-400 dark:text-zinc-500 pb-2 text-center w-9",
  week: "",
  day: "text-center p-0.5",
  // Base day button — layout and hover only; selected/today override colours below
  day_button:
    "h-9 w-9 rounded-xl text-sm font-normal transition-all duration-150 " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 " +
    "hover:bg-violet-50 hover:text-violet-600 " +
    "dark:hover:bg-violet-950/60 dark:hover:text-violet-300",
  // Selected — high-contrast violet fill; !important beats the base hover
  selected:
    "!bg-violet-600 !text-white shadow-md shadow-violet-200 " +
    "hover:!bg-violet-700 dark:shadow-violet-900/50",
  // Today — subtle ring indicator, no fill so it doesn't clash with selected
  today:
    "font-semibold ring-2 ring-inset ring-violet-300 dark:ring-violet-600",
  outside: "opacity-25",
  disabled: "opacity-25 cursor-not-allowed hover:bg-transparent hover:text-inherit",
  hidden: "invisible",
} as const;

interface DatePickerProps {
  value: string; // ISO "YYYY-MM-DD" or ""
  onChange: (iso: string) => void;
  required?: boolean;
}

export default function DatePicker({ value, onChange, required }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parsed = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;
  const selectedDate = parsed && isValid(parsed) ? parsed : undefined;
  const displayLabel = selectedDate ? format(selectedDate, "MMM d, yyyy") : "";

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  function handleSelect(date: Date | undefined) {
    if (date) {
      onChange(format(date, "yyyy-MM-dd"));
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm",
          "outline-none transition-colors",
          "focus:border-violet-500 focus:ring-2 focus:ring-violet-100",
          "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800",
          "dark:focus:ring-violet-900",
        ].join(" ")}
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-zinc-400" />
        <span
          className={
            displayLabel
              ? "text-zinc-900 dark:text-zinc-100"
              : "text-zinc-400 dark:text-zinc-600"
          }
        >
          {displayLabel || "Select a date"}
        </span>
      </button>

      {/* Animated popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={[
              "absolute left-0 top-full z-50 mt-1.5 rounded-2xl border p-4 shadow-2xl",
              "border-zinc-200 bg-white",
              "dark:border-zinc-700 dark:bg-zinc-800",
              "text-zinc-700 dark:text-zinc-300",
            ].join(" ")}
          >
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleSelect}
              defaultMonth={selectedDate ?? new Date()}
              classNames={DPC}
              components={{
                Chevron: ({ orientation }) =>
                  orientation === "left" ? (
                    <ChevronLeft className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  ),
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden sentinel so HTML required validation fires */}
      {required && (
        <input
          aria-hidden
          tabIndex={-1}
          className="sr-only"
          value={value}
          onChange={() => {}}
          required
        />
      )}
    </div>
  );
}
