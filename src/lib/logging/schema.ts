import { z } from "zod";

import { LOG_SOURCES } from "./log-types";

// Derived, not restated: the accepted values and the `LogSource` union come
// from the same tuple, so they cannot drift apart.
export const logSourceSchema = z.enum(LOG_SOURCES);
export const canonicalLevelSchema = z.enum(["info", "warn", "error"]);

export const systemLogInputSchema = z.object({
    id: z.string().optional(),
    timestamp: z.number().int().positive().optional(),
    userId: z.string().nullable().optional(),
    action: z.string().min(1).max(2000),
    entityType: z.string().min(1).max(200),
    entityId: z.string().nullable().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    level: canonicalLevelSchema,
    source: logSourceSchema,
});
