import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { storage } from "@/lib/firebase";

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
