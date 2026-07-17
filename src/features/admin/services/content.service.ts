import "server-only";

import { adminAuth, adminDb } from "./admin.service";

import type { FlashCard } from "@/features/flashcard/types";
import type { AdminDeck, PaginatedContent } from "../types";

export async function getGlobalContentPaginated(limit = 50): Promise<PaginatedContent> {
    // We now query 'lessons' which represent the "Flashcards" (groups of words)
    const snap = await adminDb.collectionGroup("lessons").limit(limit).get();
    const countSnap = await adminDb.collectionGroup("lessons").count().get();

    const ownerIds = Array.from(
        new Set(snap.docs.map((doc) => doc.ref.parent.parent?.id).filter(Boolean)),
    );
    const ownersMap: Record<
        string,
        { name: string | null; email: string | null; avatar: string | null }
    > = {};

    if (ownerIds.length > 0) {
        const usersResult = await adminAuth.getUsers(ownerIds.map((id) => ({ uid: id! })));
        usersResult.users.forEach((u) => {
            ownersMap[u.uid] = {
                name: u.displayName || null,
                email: u.email || null,
                avatar: u.photoURL || null,
            };
        });
    }

    const items: AdminDeck[] = snap.docs.map((doc) => {
        const data = doc.data();
        const ownerId = doc.ref.parent.parent?.id || "unknown";
        const owner = ownersMap[ownerId] || { name: "Unknown", email: null, avatar: null };

        return {
            id: doc.id,
            ownerId,
            ownerName: owner.name,
            ownerEmail: owner.email,
            ownerAvatar: owner.avatar,
            title: data.title || "Untitled Deck",
            description: data.description || "",
            cardCount: typeof data.cardCount === "number" ? data.cardCount : 0,
            createdAt: (() => {
                if (data.createdAt?.toDate) return (data.createdAt.toDate() as Date).toISOString();
                if (typeof data.createdAt === "number")
                    return new Date(data.createdAt).toISOString();
                if (typeof data.createdAt === "string") return data.createdAt;
                return null;
            })(),
            path: doc.ref.path,
            categories: data.categories || [],
            themeColor: data.themeColor || "#1cb0f6",
        };
    });

    return {
        items,
        nextPageToken: snap.docs.length === limit ? snap.docs[snap.docs.length - 1].id : null,
        total: countSnap.data().count,
    };
}

export async function getDeckCards(path: string): Promise<(FlashCard & { path: string })[]> {
    if (!path) throw new Error("Path is required");

    // Path format: artifacts/{appID}/users/{userId}/lessons/{lessonId}
    const parts = path.split("/");
    const lessonId = parts[parts.length - 1];
    const userId = parts[parts.indexOf("users") + 1];
    const appID = parts[parts.indexOf("artifacts") + 1];

    if (!userId || !lessonId || !appID) {
        throw new Error("Invalid lesson path provided");
    }

    const cardsRef = adminDb
        .collection("artifacts")
        .doc(appID)
        .collection("users")
        .doc(userId)
        .collection("cards");

    const cardsSnap = await cardsRef.where("lessonId", "==", lessonId).get();

    return cardsSnap.docs.map(
        (doc) =>
            ({
                id: doc.id,
                ...doc.data(),
                path: doc.ref.path,
            }) as FlashCard & { path: string },
    );
}

export async function deleteGlobalFlashcard(
    path: string,
): Promise<{ ownerId: string; lessonId: string; title: string | null }> {
    if (!path) throw new Error("Path is required");
    // Capture owner + title BEFORE deleting so the owner can be notified.
    // Path shape: artifacts/{appId}/users/{ownerId}/lessons/{lessonId}
    const ref = adminDb.doc(path);
    const snap = await ref.get();
    const data = snap.exists ? snap.data() : undefined;
    const parts = path.split("/");
    const appId = parts[parts.indexOf("artifacts") + 1] ?? "";
    const ownerId = parts[parts.indexOf("users") + 1] ?? "";
    const lessonId = parts[parts.indexOf("lessons") + 1] ?? "";

    // Cards live in a flat, top-level collection (artifacts/{appId}/users/{ownerId}/cards),
    // linked to this lesson only via a `lessonId` field — not a Firestore subcollection of
    // the lesson doc. Deleting the lesson alone orphans every one of its cards.
    if (appId && ownerId && lessonId) {
        const cardsRef = adminDb
            .collection("artifacts")
            .doc(appId)
            .collection("users")
            .doc(ownerId)
            .collection("cards");
        const cardsSnap = await cardsRef.where("lessonId", "==", lessonId).get();

        if (!cardsSnap.empty) {
            const bulkWriter = adminDb.bulkWriter();
            cardsSnap.docs.forEach((cardDoc) => void bulkWriter.delete(cardDoc.ref));
            await bulkWriter.close();
        }
    }

    await ref.delete();

    return { ownerId, lessonId, title: (data?.title as string | undefined) ?? null };
}
