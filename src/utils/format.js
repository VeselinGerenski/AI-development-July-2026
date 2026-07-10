// Date / text formatting helpers.

const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const DATE_FMT_LONG = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

/** "Sat, Jul 12, 7:00 PM" */
export function formatDate(iso) {
  if (!iso) return '';
  return DATE_FMT.format(new Date(iso));
}

/** "Saturday, July 12, 2026, 7:00 PM" */
export function formatDateLong(iso) {
  if (!iso) return '';
  return DATE_FMT_LONG.format(new Date(iso));
}

/** True if the given date is in the past. */
export function isPast(iso) {
  return new Date(iso).getTime() < Date.now();
}

/** Value for a datetime-local input from an ISO string. */
export function toDateTimeLocal(iso) {
  const d = iso ? new Date(iso) : new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Truncate text to a maximum length with an ellipsis. */
export function truncate(text, max = 120) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
}

/** Relative time like "3h ago" / "just now". */
export function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return formatDate(iso);
}
