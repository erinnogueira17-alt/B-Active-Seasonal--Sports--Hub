import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sport emoji mapping. Checks case-insensitively and MUST check "hockey"
 * before the generic fallback to avoid mismatches.
 */
export function sportEmoji(text: string | null | undefined): string {
  const t = (text ?? "").toLowerCase();
  if (t.includes("table tennis")) return "🏓";
  if (t.includes("hockey")) return "🏑";
  if (t.includes("football") || t.includes("soccer")) return "⚽";
  if (t.includes("rugby")) return "🏉";
  if (t.includes("cricket")) return "🏏";
  if (t.includes("netball")) return "🏐";
  if (t.includes("athletics") || t.includes("running")) return "🏃";
  if (t.includes("tennis")) return "🎾";
  if (t.includes("swimming")) return "🏊";
  return "🏅";
}

export function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export function formatDate(d: Date | string, opts?: Intl.DateTimeFormatOptions): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, opts ?? { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString();
}

export const TERMS = [
  { value: "term1", label: "Term 1" },
  { value: "term2", label: "Term 2" },
  { value: "term3", label: "Term 3" },
  { value: "term4", label: "Term 4" },
] as const;

export type Term = (typeof TERMS)[number]["value"];

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
