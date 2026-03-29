/**
 * Shared utilities used by both client and server.
 */

/**
 * Converts any date string or Date object to a YYYY-MM-DD string.
 * Safe against timezone drift by always treating the value as local midnight.
 */
export function formatDateOnly(d: string | Date): string {
  if (d instanceof Date) return d.toISOString().split("T")[0];
  // Already YYYY-MM-DD — return as-is to avoid re-parsing
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  return new Date(d).toISOString().split("T")[0];
}

/**
 * Calculates the number of calendar days between two date strings (inclusive).
 */
export function calculateDaysBetween(startDate: string, endDate: string): number {
  const s = new Date(startDate + "T00:00:00");
  const e = new Date(endDate + "T00:00:00");
  const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 0;
}
