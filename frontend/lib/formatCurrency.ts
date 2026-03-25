// Lazily-built cache: one Intl.NumberFormat instance per currency code
const cache = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: string): Intl.NumberFormat {
  if (!cache.has(currency)) {
    cache.set(
      currency,
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }
  return cache.get(currency)!;
}

export function formatCurrency(value: number, currency = "USD"): string {
  return getFormatter(currency).format(value);
}
