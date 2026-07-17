/**
 * @file analytics-engagement
 * Feature-engagement chart data — split out of analytics.service.ts's
 * getAdminAnalytics (E11-T3).
 *
 * NOTE: getFeatureUsageDetails (analytics-drilldowns.ts) builds ITS OWN
 * discovery pool (3 collections incl. admins, source-prefixed IDs, no
 * dedup) rather than this file's (2 collections, deduped) — deliberately
 * NOT unified, same reasoning as analytics-content.ts's header: the two
 * pools are not provably identical, so merging them would be an unverified
 * behavior change hidden inside a line-count split.
 */
import { FEATURE_ALIASES } from "./analytics-constants";

import type { QuerySnapshot } from "firebase-admin/firestore";
import type { EngagementPoint } from "../types";

/**
 * Builds the feature-engagement chart series from the two source
 * collections (system_logs + game_sessions), deduped by doc id, keyword-
 * matched against FEATURE_ALIASES.
 */
export function buildEngagementData(
    logsSnap: QuerySnapshot,
    sessionsSnap: QuerySnapshot,
): EngagementPoint[] {
    const discoveryPool = [
        ...logsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        ...sessionsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })),
    ].filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);

    const getCountFor = (keywords: string[]) => {
        return discoveryPool.filter((item) => {
            const haystack = JSON.stringify(item).toLowerCase();
            return keywords.some((kw) => haystack.includes(kw));
        }).length;
    };

    const nFc = getCountFor(FEATURE_ALIASES.flashcards);
    const nKana = getCountFor(FEATURE_ALIASES.kana);
    const nMatch = getCountFor(FEATURE_ALIASES.matching);
    const totalEngage = nFc + nKana + nMatch || 1;

    return [
        { feature: "Flashcards", count: nFc, percentage: Math.round((nFc / totalEngage) * 100) },
        { feature: "Kana", count: nKana, percentage: Math.round((nKana / totalEngage) * 100) },
        {
            feature: "Matching",
            count: nMatch,
            percentage: Math.round((nMatch / totalEngage) * 100),
        },
    ];
}
