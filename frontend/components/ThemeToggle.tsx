"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  /**
   * useMounted guard — required for next-themes compatibility.
   *
   * On the server (and during hydration), `resolvedTheme` is `undefined`
   * because next-themes reads the user's stored preference from localStorage
   * or the OS media query — both are client-only APIs. Rendering an icon
   * based on `undefined` would produce a server/client HTML mismatch and a
   * React hydration error.
   *
   * The fix: render an inert placeholder with the same dimensions until the
   * component has mounted (i.e. the first client-side effect has run). After
   * that, `resolvedTheme` is guaranteed to be "light" or "dark" and the real
   * interactive button renders without a flash.
   */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Same h/w as the real button — prevents layout shift in the header
    return (
      <div
        aria-hidden
        className="h-9 w-9 rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
    >
      {isDark ? (
        <Sun className="h-4 w-4 transition-transform duration-200" />
      ) : (
        <Moon className="h-4 w-4 transition-transform duration-200" />
      )}
    </button>
  );
}
