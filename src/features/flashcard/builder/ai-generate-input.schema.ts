/**
 * @file Zod v4 schema for the AI bulk-generation form (AIBulkPanel) —
 * T-109e's second rhf+zodResolver conversion target alongside
 * useLessonBuilder/useShareInvites. `level` mirrors features/ai/types.ts's
 * JLPTLevel union exactly; `mode` is this form's own "quick"/"guided"
 * literal (kept as a separate schema, not a re-derivation of AI's domain
 * types, since this form's concern — validating what the user typed — is
 * distinct from the AI feature's own domain types).
 */
import { z } from "zod";

export const AI_GENERATE_COUNT_OPTIONS = [8, 12, 16, 20] as const;

export const aiGenerateInputSchema = z.object({
    mode: z.enum(["quick", "guided"]),
    topic: z.string().trim().min(1, "Topic is required").max(80),
    count: z.union([z.literal(8), z.literal(12), z.literal(16), z.literal(20)]),
    level: z.enum(["N5", "N4", "N3", "N2", "General"]),
});

export type AIGenerateInput = z.infer<typeof aiGenerateInputSchema>;
