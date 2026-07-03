import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { storage } from "@/lib/firebase";

/**
 * Orchestrates the upload of card images to Firebase Storage.
 *
 * @remarks
 * Enforcement Rules:
 * 1. **MIME Type**: Only `image/*` allowed to prevent non-visual file injection.
 * 2. **Size Constraint**: Hard limit of 2MB to optimize loading times and storage costs.
 * 3. **Pathing**: Deterministic pathing `users/{userId}/cards/{cardId}_{timestamp}.ext`
 *    ensures collision resistance and enables bulk cleanup for orphaned cards.
 *
 * @param file - Raw browser File object from input.
 * @param userId - UID of the card owner.
 * @param cardId - Target flashcard ID for naming consistency.
 * @returns Object containing both the public URL and the internal Storage reference path.
 */
export async function uploadCardImage(
    file: File,
    userId: string,
    cardId: string,
): Promise<{ imageUrl: string; imagePath: string }> {
    // Basic validation
    if (!file.type.startsWith("image/")) {
        throw new Error("File must be an image");
    }
    if (file.size > 2 * 1024 * 1024) {
        throw new Error("Image must be smaller than 2MB");
    }

    const extension = file.name.split(".").pop() || "jpg";
    const imagePath = `users/${userId}/cards/${cardId}_${Date.now()}.${extension}`;
    const storageRef = ref(storage, imagePath);

    await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(storageRef);

    return { imageUrl, imagePath };
}

export async function deleteCardImage(imagePath: string): Promise<void> {
    if (!imagePath) return;
    try {
        const storageRef = ref(storage, imagePath);
        await deleteObject(storageRef);
    } catch (error) {
        console.error("[deleteCardImage] Error deleting image from storage:", error);
    }
}
