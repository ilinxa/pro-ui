/** Format bytes as a human-readable string ("4.2 MB", "812 KB", "32 B"). */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded = value < 10 ? value.toFixed(1) : Math.round(value).toString();
  return `${rounded} ${units[unit]}`;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

/** Format an ISO date string as "May 9, 2026". Returns the input if unparseable. */
export function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return dateFormatter.format(date);
}

/** Capitalize an extension for display in the list view's Type column. */
export function formatKind(ext: string, type: "file" | "folder"): string {
  if (type === "folder") return "Folder";
  if (!ext) return "File";
  return ext.toUpperCase();
}

/** Plural-aware count: "1 item" / "5 items". */
export function formatItemCount(n: number, label = "items"): string {
  return `${n} ${n === 1 ? label.replace(/s$/, "") : label}`;
}
