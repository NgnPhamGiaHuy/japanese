import { format, formatDistanceToNow } from "date-fns";

/**
 * Formats an ISO timestamp into relative and absolute strings.
 *
 * @param iso - The ISO date string to format.
 * @returns An object containing relative (e.g., "5m ago") and absolute (formatted date) strings.
 */
export const formatLogTimestamp = (iso: string): { relative: string; absolute: string } => {
    try {
        const d = new Date(iso);
        const absolute = format(d, "MMM d, h:mm:ss a");
        const relative = formatDistanceToNow(d, { addSuffix: true });
        return { relative, absolute };
    } catch {
        return { relative: iso, absolute: iso };
    }
};

/**
 * Generates a truncated string preview of the metadata object.
 *
 * @param meta - The metadata object.
 * @param max - Maximum character length before truncation.
 * @returns A JSON string preview or an empty string.
 */
export function getMetadataPreview(meta: Record<string, unknown>, max = 140): string {
    if (!meta || Object.keys(meta).length === 0) return "";
    try {
        const s = JSON.stringify(meta);
        return s.length > max ? `${s.slice(0, max)}…` : s;
    } catch {
        return "";
    }
}
