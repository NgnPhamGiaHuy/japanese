import "server-only";

import { adminAuth, adminDb } from "./admin.service";

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
            cardCount: data.cardCount || 0,
            createdAt:
                typeof data.createdAt === "number"
                    ? new Date(data.createdAt).toISOString()
                    : new Date().toISOString(),
            path: doc.ref.path,
        };
    });

    return {
        items,
        nextPageToken: snap.docs.length === limit ? snap.docs[snap.docs.length - 1].id : null,
        total: countSnap.data().count,
    };
}

export async function getDeckCards(path: string): Promise<any[]> {
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

    return cardsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        path: doc.ref.path,
    }));
}

export async function deleteGlobalFlashcard(path: string): Promise<void> {
    if (!path) throw new Error("Path is required");
    // Deep delete: typically we would also delete the subcollection 'cards'
    // For now, delete the lesson document.
    // In a full implementation, we'd iterate cards too.
    await adminDb.doc(path).delete();
}
