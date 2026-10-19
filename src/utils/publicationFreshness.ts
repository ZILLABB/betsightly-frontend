/** The published edition date is a Lagos business date, not the browser timezone. */
export function lagosDayKey(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find(p => p.type === type)?.value ?? "";
  return [part("year"), part("month"), part("day")].join("-");
}

/** True when the last available public card is older than today in Lagos. */
export function isEarlierPublication(publishDate: string | null | undefined, now: Date = new Date()): boolean {
  if (!publishDate || !/^\\d{4}-\\d{2}-\\d{2}/.test(publishDate)) return false;
  return publishDate.slice(0, 10) < lagosDayKey(now);
}
