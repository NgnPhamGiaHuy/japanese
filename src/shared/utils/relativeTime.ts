/**
 * Relative timestamp, computed against an injected `now` so it can tick live
 * (see shared/hooks useNow) and be tested deterministically. Format:
 * "just now / Xm ago / Xh ago / Xd ago / MMM d".
 *
 * The wording and the absolute-date fallback are locale-dependent, so both are
 * injected rather than hardcoded: this module used to return English literals
 * and format with a hardcoded "en-US", which put "just now" next to a Japanese
 * author name in every ja render of the inbox and of a card comment thread.
 * The bucket arithmetic itself is locale-independent and stays here, pure and
 * directly testable.
 *
 * The parameter is optional and defaults to English, so a caller with no
 * translator (and this module's own unit test) keeps the previous output.
 */

/** Localized wording for each bucket. `useRelativeTimeLabels` builds one. */
export interface RelativeTimeLabels {
    justNow: string;
    minutes: (count: number) => string;
    hours: (count: number) => string;
    days: (count: number) => string;
    /** BCP-47 tag for the absolute-date fallback beyond a week. */
    locale: string;
}

const EN: RelativeTimeLabels = {
    justNow: "just now",
    minutes: (n) => `${n}m ago`,
    hours: (n) => `${n}h ago`,
    days: (n) => `${n}d ago`,
    locale: "en-US",
};

export function formatRelativeTime(ts: number, now: number, labels: RelativeTimeLabels = EN) {
    const diff = now - ts;
    const m = Math.floor(diff / 60_000);
    if (m < 1) return labels.justNow;
    if (m < 60) return labels.minutes(m);
    const h = Math.floor(m / 60);
    if (h < 24) return labels.hours(h);
    const d = Math.floor(h / 24);
    if (d < 7) return labels.days(d);
    return new Date(ts).toLocaleDateString(labels.locale, { month: "short", day: "numeric" });
}
