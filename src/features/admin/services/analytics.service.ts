import "server-only";

import { adminAuth, adminDb, APP_ID } from "./admin.service";
import { getLogs } from "./log.service";
import { getAdminStats } from "./user.service";

import type { AnalyticsData } from "../types";

const DISCOVERY_LIMIT = 1000;
const FEATURE_ALIASES: Record<string, string[]> = {
    flashcards: ["flashcard", "deck", "lesson", "content", "study"],
    kana: ["kana", "hiragana", "katakana", "survival", "quiz"],
    matching: ["match", "session", "matching"],
};

/**
 * Fetches pre-aggregated analytics from the 'analytics_daily' collection.
 */
export async function getAdminAnalytics(days = 30): Promise<AnalyticsData> {
    const snapshots = await adminDb
        .collection("analytics_daily")
        .orderBy("date", "desc")
        .limit(days)
        .get();

    const docs = snapshots.docs.map((d) => d.data());

    // In case no snapshots yet, provide a base structure
    const baseDocs =
        docs.length > 0
            ? docs
            : [
                  {
                      date: new Date().toISOString().split("T")[0],
                      totalUsers: 0,
                      newUsers: 0,
                      activeUsers: 0,
                      errors: 0,
                  },
              ];

    // Sort ascending for charts
    const sorted = [...baseDocs].sort((a, b) => a.date.localeCompare(b.date));

    // Distribution of roles - Dynamically derived from active stats
    const stats = await getAdminStats();
    const superAdmins = stats.activeSuperAdmins;
    const otherAdmins = stats.activeAdmins;
    const standardUsers = Math.max(0, stats.totalUsers - (superAdmins + otherAdmins));

    const rolesData = {
        Superadmin: superAdmins,
        Admin: otherAdmins,
        User: standardUsers,
    };

    // 3. Content Analytics - Improved categorization with explicit field support
    const lessonsSampleSnap = await adminDb.collectionGroup("lessons").limit(200).get();
    const lessonsSample = lessonsSampleSnap.docs.map((d) => d.data());

    const catCounts = { Vocabulary: 0, Grammar: 0, Kanji: 0, Other: 0, Uncategorized: 0 };
    const uncategorizedSamples: string[] = [];

    lessonsSample.forEach((lesson) => {
        // Multi-Categorization Engine
        const cats = (lesson.categories || []).map((c: string) => c.toLowerCase());
        const explicitType = lesson.type?.toLowerCase();
        let matchedPrimary = false;

        // 1. Process explicit categories
        if (cats.length > 0) {
            if (cats.some((c: string) => c.includes("vocab") || c.includes("tango"))) {
                catCounts.Vocabulary++;
                matchedPrimary = true;
            }
            if (cats.some((c: string) => c.includes("grammar") || c.includes("bunpou"))) {
                catCounts.Grammar++;
                matchedPrimary = true;
            }
            if (cats.some((c: string) => c.includes("kanji"))) {
                catCounts.Kanji++;
                matchedPrimary = true;
            }

            if (!matchedPrimary) {
                catCounts.Other++;
                return; // Categorized as Other, skip keywords
            }

            // If we matched primary ones, we don't count it as other, but we also don't return early
            // because we might want to check the 'type' field too (legacy compat)
        }

        // 2. Process legacy 'type' field (if not already matched by categories)
        if (!matchedPrimary && explicitType) {
            if (explicitType.includes("vocab") || explicitType.includes("tango")) {
                catCounts.Vocabulary++;
                matchedPrimary = true;
            } else if (explicitType.includes("grammar") || explicitType.includes("bunpou")) {
                catCounts.Grammar++;
                matchedPrimary = true;
            } else if (explicitType.includes("kanji")) {
                catCounts.Kanji++;
                matchedPrimary = true;
            } else {
                catCounts.Other++;
                return;
            }
        }

        if (matchedPrimary) return;

        // 3. Final Fallback: Keyword discovery
        const text = `${lesson.title || ""} ${lesson.description || ""}`.toLowerCase();
        if (text.includes("grammar") || text.includes("bunpou") || text.includes("文法")) {
            catCounts.Grammar++;
        } else if (text.includes("kanji") || text.includes("漢字")) {
            catCounts.Kanji++;
        } else if (
            text.includes("vocabulary") ||
            text.includes("vocab") ||
            text.includes("tango") ||
            text.includes("deck") ||
            text.includes("words") ||
            text.includes("単語")
        ) {
            catCounts.Vocabulary++;
        } else {
            catCounts.Uncategorized++;
            if (uncategorizedSamples.length < 5) {
                uncategorizedSamples.push(lesson.title || "Untitled");
            }
        }
    });

    // Log categorization issues for debugging
    if (catCounts.Uncategorized > lessonsSample.length * 0.3) {
        console.warn(
            `[Analytics] High uncategorized content: ${catCounts.Uncategorized}/${lessonsSample.length} lessons have no metadata.`,
        );
        console.warn(`Sample uncategorized titles:`, uncategorizedSamples);
    }

    const totalSample = lessonsSample.length || 1;
    const contentDistribution = [
        {
            name: "Vocabulary",
            value: Math.round((catCounts.Vocabulary / totalSample) * stats.totalFlashcards),
        },
        {
            name: "Grammar",
            value: Math.round((catCounts.Grammar / totalSample) * stats.totalFlashcards),
        },
        {
            name: "Kanji",
            value: Math.round((catCounts.Kanji / totalSample) * stats.totalFlashcards),
        },
    ];

    if (catCounts.Other > 0) {
        contentDistribution.push({
            name: "Other",
            value: Math.round((catCounts.Other / totalSample) * stats.totalFlashcards),
        });
    }

    if (catCounts.Uncategorized > 0) {
        contentDistribution.push({
            name: "Uncategorized",
            value: Math.round((catCounts.Uncategorized / totalSample) * stats.totalFlashcards),
        });
    }

    // 4. Feature Engagement - Consolidated Discovery Pool (Sync with Drilldown)
    const [logsSnap, sessionsSnap] = await Promise.all([
        adminDb.collection("system_logs").orderBy("timestamp", "desc").limit(DISCOVERY_LIMIT).get(),
        adminDb
            .collection("artifacts")
            .doc(APP_ID)
            .collection("public")
            .doc("data")
            .collection("game_sessions")
            .orderBy("updatedAt", "desc")
            .limit(DISCOVERY_LIMIT)
            .get(),
    ]);

    const discoveryPool = [
        ...logsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        ...sessionsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })),
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

    const engagementData = [
        { feature: "Flashcards", count: nFc, percentage: Math.round((nFc / totalEngage) * 100) },
        { feature: "Kana", count: nKana, percentage: Math.round((nKana / totalEngage) * 100) },
        {
            feature: "Matching",
            count: nMatch,
            percentage: Math.round((nMatch / totalEngage) * 100),
        },
    ];

    // 5. Retention Analytics - Sampling Discovery (Sync with User Cohorts)
    const usersSampleSnap = await adminDb
        .collection("artifacts")
        .doc(APP_ID)
        .collection("users")
        .orderBy("lastSeenAt", "desc")
        .limit(100)
        .get();

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const lifespans = usersSampleSnap.docs.map((doc) => {
        const d = doc.data();
        const created = d.createdAt?.toDate ? d.createdAt.toDate().getTime() : now;
        const last = d.lastSeenAt?.toDate ? d.lastSeenAt.toDate().getTime() : now;
        return (last - created) / dayMs;
    });

    const getRetentionRate = (days: number) => {
        if (lifespans.length === 0) return 0;
        const retained = lifespans.filter((l) => l >= days).length;
        return Math.round((retained / lifespans.length) * 100);
    };

    const retentionData = [
        { day: 0, rate: 100 },
        { day: 1, rate: getRetentionRate(1) },
        { day: 7, rate: getRetentionRate(7) },
        { day: 30, rate: getRetentionRate(30) },
    ];

    // ── 6. Log-derived charts (reuses logsSnap — zero extra Firestore reads) ──
    const LOG_TYPES_LIST = ["AUTH", "ADMIN_ACTION", "USER_ACTION", "CONTENT", "SYSTEM", "ERROR"];
    const ENTITY_TO_LOG_TYPE_MAP: Record<string, string> = {
        auth: "AUTH",
        authentication: "AUTH",
        user: "AUTH",
        admin: "ADMIN_ACTION",
        admin_action: "ADMIN_ACTION",
        deck: "USER_ACTION",
        card: "USER_ACTION",
        study: "USER_ACTION",
        share: "USER_ACTION",
        user_action: "USER_ACTION",
        content: "CONTENT",
        lesson: "CONTENT",
        flashcard: "CONTENT",
        error: "ERROR",
    };

    const volumeMap = new Map<string, Record<string, number>>();
    const levelCounts: Record<string, number> = {};
    const actionCounts: Record<string, number> = {};

    logsSnap.docs.forEach((d) => {
        const raw = d.data() as Record<string, unknown>;
        const tsRaw = raw.timestamp;
        const ts =
            typeof tsRaw === "number"
                ? tsRaw
                : tsRaw && typeof (tsRaw as any).toDate === "function"
                  ? (tsRaw as any).toDate().getTime()
                  : typeof tsRaw === "string"
                    ? Date.parse(tsRaw)
                    : null;
        if (!ts || !Number.isFinite(ts)) return;

        const date = new Date(ts).toISOString().slice(0, 10);
        const metaType = (raw.metadata as any)?.logType as string | undefined;
        const entityType = typeof raw.entityType === "string" ? raw.entityType.toLowerCase() : "";
        const resolvedType =
            metaType && LOG_TYPES_LIST.includes(metaType)
                ? metaType
                : (ENTITY_TO_LOG_TYPE_MAP[entityType] ?? "SYSTEM");

        if (!volumeMap.has(date)) {
            volumeMap.set(date, {
                total: 0,
                AUTH: 0,
                ADMIN_ACTION: 0,
                USER_ACTION: 0,
                CONTENT: 0,
                SYSTEM: 0,
                ERROR: 0,
            });
        }
        const bucket = volumeMap.get(date)!;
        bucket.total = (bucket.total ?? 0) + 1;
        bucket[resolvedType] = (bucket[resolvedType] ?? 0) + 1;

        const level = typeof raw.level === "string" ? raw.level : "info";
        levelCounts[level] = (levelCounts[level] ?? 0) + 1;

        const action = typeof raw.action === "string" ? raw.action : null;
        if (action) actionCounts[action] = (actionCounts[action] ?? 0) + 1;
    });

    const logVolume = Array.from(volumeMap.entries())
        .map(([date, counts]) => ({ date, ...counts }) as any)
        .sort((a: any, b: any) => a.date.localeCompare(b.date))
        .slice(-30);

    const logsByLevel = Object.entries(levelCounts)
        .map(([level, count]) => ({ level, count }))
        .sort((a, b) => b.count - a.count);

    const topActions = Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    return {
        growth: sorted.map((d) => ({
            date: d.date,
            newUsers: d.newUsers || 0,
            totalUsers: d.totalUsers || 0,
        })),
        activity: sorted.map((d) => ({
            date: d.date,
            dau: d.activeUsers || 0,
            wau: typeof d.wau === "number" ? d.wau : 0,
        })),
        engagement: engagementData,
        retention: retentionData,
        roles: Object.entries(rolesData).map(([name, value]) => ({ name, value: value as number })),
        content: contentDistribution,
        errorTrends: sorted.map((d) => ({
            date: d.date,
            errors: d.errors || 0,
        })),
        timeRange: "30d",
        logVolume,
        logsByLevel,
        topActions,
    };
}

/**
 * Fetches real-time snapshot for the operational dashboard.
 */
export async function getDashboardOverview() {
    const [stats, logsResult] = await Promise.all([
        getAdminStats(),
        getLogs({}, 10), // Get last 10 logs for activity feed
    ]);

    return {
        stats,
        recentActivity: logsResult.logs,
    };
}

/**
 * Fetches users created on a specific ISO date (YYYY-MM-DD).
 * Uses server-side range query on the `createdAt` field.
 * Returns data structure compatible with AnalyticsDetailModal.
 */
export async function getUsersByDate(date: string) {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setUTCHours(23, 59, 59, 999);

    const startMs = start.getTime();
    const endMs = end.getTime();

    const snap = await adminDb
        .collection("artifacts")
        .doc(APP_ID)
        .collection("users")
        .where("createdAt", ">=", startMs)
        .where("createdAt", "<=", endMs)
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();

    return snap.docs.map((d) => {
        const data = d.data();
        return {
            uid: d.id,
            id: d.id,
            displayName: data.displayName || data.email?.split("@")[0] || "User",
            userName: data.displayName || data.email?.split("@")[0] || "User",
            email: data.email || null,
            action: "User Registration",
            timestamp: data.createdAt?.toDate
                ? data.createdAt.toDate().toISOString()
                : typeof data.createdAt === "number"
                  ? new Date(data.createdAt).toISOString()
                  : new Date().toISOString(),
            metadata: {
                source: "user_growth",
                registrationDate: date,
            },
        };
    });
}

/**
 * Fetches administrative users by their Firestore role.
 * Returns data structure compatible with AnalyticsDetailModal.
 */
export async function getUsersByRole(role: string) {
    const roleKey = role.toLowerCase();

    if (roleKey === "user") {
        // Query general users from the artifact project
        const snap = await adminDb
            .collection("artifacts")
            .doc(APP_ID)
            .collection("users")
            .limit(50)
            .get();

        return snap.docs.map((d) => {
            const data = d.data();
            return {
                uid: d.id,
                id: d.id,
                displayName: data.displayName || data.email?.split("@")[0] || "User",
                userName: data.displayName || data.email?.split("@")[0] || "User",
                email: data.email || null,
                role: "user",
                action: "Standard User Account",
                timestamp: data.createdAt?.toDate
                    ? data.createdAt.toDate().toISOString()
                    : typeof data.createdAt === "number"
                      ? new Date(data.createdAt).toISOString()
                      : new Date().toISOString(),
                metadata: {
                    lastSeenAt: data.lastSeenAt,
                    role: "user",
                },
            };
        });
    }

    // Administrative roles (admin, superadmin)
    const snap = await adminDb.collection("admins").where("role", "==", roleKey).limit(50).get();
    const adminDocs = snap.docs.map((d) => {
        const data = d.data();
        return {
            uid: d.id,
            role: data.role,
            grantedAt: data.grantedAt,
            grantedBy: data.grantedBy,
        };
    });
    if (adminDocs.length === 0) return [];

    const uids = adminDocs.map((d) => d.uid);
    const usersResult = await adminAuth.getUsers(uids.map((uid) => ({ uid })));

    return usersResult.users.map((u) => {
        const adminDoc = adminDocs.find((a) => a.uid === u.uid);
        const grantedAt = adminDoc?.grantedAt;

        return {
            uid: u.uid,
            id: u.uid,
            displayName: u.displayName || u.email?.split("@")[0] || "Admin",
            userName: u.displayName || u.email?.split("@")[0] || "Admin",
            email: u.email || null,
            role: roleKey,
            action: `${roleKey.charAt(0).toUpperCase() + roleKey.slice(1)} Role Assigned`,
            timestamp: grantedAt || u.metadata.creationTime || new Date().toISOString(),
            metadata: {
                grantedBy: adminDoc?.grantedBy,
                role: roleKey,
            },
        };
    });
}

/**
 * TOTAL REWRITE: Robust Feature Engagement Discovery
 *
 * Bypasses restricted log helpers to perform direct, multi-collection
 * discovery across system logs and real-time game sessions.
 */
export async function getFeatureUsageDetails(feature: string) {
    const needle = feature.toLowerCase();
    const searchTerms = [needle, ...(FEATURE_ALIASES[needle] || [])];

    try {
        // 1. Direct Collection Scans (Symmetrical with Aggregate Chart)
        const [logsSnap, sessionsSnap, adminsSnap] = await Promise.all([
            adminDb
                .collection("system_logs")
                .orderBy("timestamp", "desc")
                .limit(DISCOVERY_LIMIT)
                .get(),
            adminDb
                .collection("artifacts")
                .doc(APP_ID)
                .collection("public")
                .doc("data")
                .collection("game_sessions")
                .orderBy("updatedAt", "desc")
                .limit(DISCOVERY_LIMIT)
                .get(),
            adminDb.collection("admins").get(),
        ]);

        // 2. Aggregate into Searchable Pool
        // Prefix IDs by source to prevent cross-collection ID collisions
        const rawPool = [
            ...logsSnap.docs.map((d) => ({ _source: "log", id: `log:${d.id}`, ...d.data() })),
            ...sessionsSnap.docs.map((d) => ({
                _source: "session",
                id: `session:${d.id}`,
                ...(d.data() as any),
            })),
            ...adminsSnap.docs.map((d) => ({ _source: "admin", id: `admin:${d.id}`, ...d.data() })),
        ];

        // 3. Apply Heuristic Filtering (Sync with Chart)
        const matchingItems = rawPool.filter((item) => {
            const h = JSON.stringify(item).toLowerCase();
            return searchTerms.some((term) => h.includes(term));
        });

        // 4. Map to UI Format with Enhanced Details
        const prettifyMode = (m: string) => {
            return m
                .split("_")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(" ")
                .replace("Flashcard ", "Flashcard: ");
        };

        const mapped = matchingItems.map((item: any) => {
            // 1. Universal Timestamp Discovery
            const rawDate =
                item.timestamp ||
                item.updatedAt ||
                item.grantedAt ||
                item.joinedAt ||
                item.createdAt ||
                item.metadata?.timestamp ||
                new Date();
            const timestamp = (rawDate.toDate ? rawDate.toDate() : new Date(rawDate)).toISOString();

            // 2. Universal Subject Discovery
            const subject =
                item.displayName ||
                item.userName ||
                item.metadata?.userName ||
                item.email ||
                item.userEmail ||
                item.userId ||
                item.uid ||
                "System Activity";

            // 3. Universal Action Discovery
            let action = "General Activity";
            if (item.gameMode) {
                action = `${prettifyMode(item.gameMode)} Session`;
            } else if (item.role) {
                action = `${item.role.charAt(0).toUpperCase() + item.role.slice(1)} Privilege Granted`;
            } else if (item.action) {
                action = item.action;
            } else if (item.metadata?.logType || item.entityType) {
                action = item.metadata?.logType || item.entityType;
            } else if (item._source === "admin") {
                action = "Administrative Provisioning";
            }

            // Formatting Action
            const formattedAction = action
                .split("_")
                .join(" ")
                .replace(/\b\w/g, (l: string) => l.toUpperCase());

            // 4. Metadata Enrichment
            const metadata = { ...(item.metadata || item) };
            delete metadata.timestamp;
            delete metadata.updatedAt;
            delete metadata.grantedAt;

            return {
                id: item.id || Math.random().toString(36),
                timestamp,
                userName: subject,
                userEmail: item.email || item.userEmail || item.metadata?.userEmail || "",
                action: formattedAction,
                level: item.level || "info",
                metadata: {
                    ...metadata,
                    source: item._source || "discovery",
                    insight: item.score !== undefined ? `Score: ${item.score}` : undefined,
                },
            };
        });

        const sorted = mapped.sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );

        // Final serialization pass to ensure NO complex objects (Timestamps/Classes) leak to Client
        return JSON.parse(JSON.stringify(sorted.slice(0, DISCOVERY_LIMIT)));
    } catch (error) {
        console.error("[getFeatureUsageDetails] Discovery failed:", error);
        return [];
    }
}

/**
 * Fetches content items associated with a category.
 * Returns data structure compatible with AnalyticsDetailModal.
 */
export async function getContentBreakdown(category: string) {
    const needle = category.toLowerCase();
    const snap = await adminDb.collectionGroup("lessons").limit(100).get();

    const allLessons = snap.docs.map((d) => {
        const data = d.data();
        const ownerId = d.ref.parent.parent?.id || "unknown";

        return {
            id: d.id,
            uid: ownerId,
            ownerId,
            title: data.title || "Untitled",
            description: data.description || "",
            category: data.category || null,
            type: data.type || null,
            cardCount: data.cardCount || 0,
            createdAt: data.createdAt,
            ...data,
        };
    });

    const filtered = allLessons.filter((lesson: any) => {
        const cats = (lesson.categories || []).map((c: string) => c.toLowerCase());
        const explicitType = lesson.type?.toLowerCase();
        const text = `${lesson.title || ""} ${lesson.description || ""}`.toLowerCase();

        const isVocab =
            cats.some((c: string) => c.includes("vocab") || c.includes("tango")) ||
            explicitType?.includes("vocab") ||
            explicitType?.includes("tango") ||
            text.includes("vocabulary") ||
            text.includes("vocab") ||
            text.includes("tango") ||
            text.includes("deck") ||
            text.includes("words") ||
            text.includes("単語");

        const isGrammar =
            cats.some((c: string) => c.includes("grammar") || c.includes("bunpou")) ||
            explicitType?.includes("grammar") ||
            explicitType?.includes("bunpou") ||
            text.includes("grammar") ||
            text.includes("bunpou") ||
            text.includes("文法");

        const isKanji =
            cats.some((c: string) => c.includes("kanji")) ||
            explicitType?.includes("kanji") ||
            text.includes("kanji") ||
            text.includes("漢字");

        const hasAnyExplicit = cats.length > 0 || !!explicitType;
        const matchedPrimary = isVocab || isGrammar || isKanji;

        if (needle === "vocabulary") return isVocab;
        if (needle === "grammar") return isGrammar;
        if (needle === "kanji") return isKanji;

        if (needle === "uncategorized") {
            // Uncategorized: No explicit metadata AND no keyword matches
            return !hasAnyExplicit && !matchedPrimary;
        }

        if (needle === "other") {
            // Other: Has explicit metadata but none are primary
            return hasAnyExplicit && !matchedPrimary;
        }

        return false;
    });

    // Map to modal-compatible format
    const mapped = filtered.map((lesson: any) => ({
        id: lesson.id,
        uid: lesson.ownerId,
        displayName: lesson.title,
        userName: lesson.title,
        email: `Owner: ${lesson.ownerId}`,
        title: lesson.title,
        action: `Content: ${lesson.title}`,
        timestamp: lesson.createdAt?.toDate
            ? lesson.createdAt.toDate().toISOString()
            : typeof lesson.createdAt === "number"
              ? new Date(lesson.createdAt).toISOString()
              : null,
        metadata: {
            category: (lesson.categories || [])[0] || needle,
            categories: lesson.categories,
            cardCount: lesson.cardCount,
            description: lesson.description,
        },
    }));

    // Final serialization pass
    return JSON.parse(JSON.stringify(mapped.slice(0, 50)));
}
