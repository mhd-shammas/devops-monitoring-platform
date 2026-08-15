/**
 * Formats bytes into human-readable format (B, KB, MB, GB)
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  const validIndex = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, validIndex)).toFixed(dm))} ${sizes[validIndex]}`;
}

/**
 * Parses an incoming ISO timestamp string as UTC.
 * If the string lacks a timezone designator (Z or offset), it appends 'Z'
 * so standard Date parsing treats it as UTC rather than local time.
 */
function parseUtcDate(isoString: string): Date {
  if (!isoString) return new Date(NaN);
  const trimmed = isoString.trim();
  const hasTimezone = /[Zz]|([+-]\d{2}:?\d{2})$/.test(trimmed);
  const normalized = hasTimezone ? trimmed : `${trimmed}Z`;
  return new Date(normalized);
}

/**
 * Formats UTC ISO timestamp to browser's local readable format
 */
export function formatTimestamp(isoString: string): string {
  try {
    const date = parseUtcDate(isoString);
    if (isNaN(date.getTime())) return isoString;

    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return isoString;
  }
}

/**
 * Returns relative time string e.g. "5 seconds ago" based on UTC timestamp
 */
export function getRelativeTime(isoString: string): string {
  try {
    const date = parseUtcDate(isoString);
    if (isNaN(date.getTime())) return "";

    const now = Date.now();
    const past = date.getTime();
    const diffSeconds = Math.max(0, Math.floor((now - past) / 1000));

    if (diffSeconds < 5) return "Just now";
    if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } catch {
    return "";
  }
}

/**
 * Formats UTC ISO timestamp for chart X-axis (e.g. "15:27:41")
 */
export function formatChartTime(isoString: string): string {
  try {
    const date = parseUtcDate(isoString);
    if (isNaN(date.getTime())) return isoString;

    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return isoString;
  }
}

/**
 * Formats seconds into human-readable duration (e.g. "45s", "3m 12s", "1h 14m")
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || isNaN(seconds)) {
    return "Ongoing";
  }
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  const mins = Math.floor(s / 60);
  const remSec = s % 60;
  if (mins < 60) return `${mins}m ${remSec}s`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins}m`;
}

