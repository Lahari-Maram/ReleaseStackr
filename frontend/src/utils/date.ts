/**
 * Formats an ISO date string cleanly into user's local browser timezone with date & time.
 * E.g., "Oct 15, 2026, 05:30 PM"
 */
export function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Formats a date string with day of week for detail views.
 * E.g., "Thu, Oct 15, 2026, 05:30 PM"
 */
export function formatFullDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Checks if a release is overdue:
 * Target date has passed AND status is not 'DONE'.
 */
export function isOverdue(dateStr: string, status: string): boolean {
  if (status === 'DONE') return false;
  try {
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return false;
    return target.getTime() < Date.now();
  } catch {
    return false;
  }
}
