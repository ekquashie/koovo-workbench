const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** "23 Nov 2026, 21:23" in the viewer's time zone. */
export const formatDateTime = (iso: string): string =>
  DATE_TIME.format(new Date(iso));
