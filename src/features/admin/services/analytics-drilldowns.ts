/**
 * @file analytics-drilldowns
 * The "show me the records behind this chart click" detail queries —
 * split out of analytics.service.ts (E11-T3). Grouped together because they
 * share a purpose (AnalyticsDetailModal data), not shared code — each has
 * its own discovery/filtering logic; see analytics-content.ts and
 * analytics-engagement.ts's headers for why those aren't unified with the
 * aggregate-chart builders despite superficial resemblance.
 */
import { adminAuth, adminDb, APP_ID } from "./admin.service";
import { DISCOVERY_LIMIT, FEATURE_ALIASES } from "./analytics-constants";

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
                ...d.data(),
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

        // rawPool merges 3 differently-shaped Firestore collections (logs,
        // game sessions, admin grants) into one heuristic discovery pool —
        // there's no single sound type across them without a much larger
        // rewrite of this discovery approach, out of scope for this split.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // allLessons' shape includes an unbounded `...data` spread (arbitrary
    // lesson document fields beyond the explicitly-listed ones above), so
    // `categories` here isn't statically knowable without also typing every
    // possible lesson document field — same reasoning as getFeatureUsageDetails.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // Map to modal-compatible format — same unbounded-spread reasoning as above.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
