import { z } from "zod";

export const logSourceSchema = z.enum(["client", "server", "cloud_function"]);
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

export type SystemLogInputParsed = z.infer<typeof systemLogInputSchema>;
