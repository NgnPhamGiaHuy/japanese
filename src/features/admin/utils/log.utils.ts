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
