/**
 * @file SharedLessonPage
 * Public landing page for shared flashcard decks.
 * Handles role-based access for non-owners (Viewer, Commenter, Editor).
 */

"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { ShareModal } from "@/features/flashcard/components";
import { useLessons } from "@/features/flashcard/hooks";
import { getSharedLesson, SharedLessonResult } from "@/features/flashcard/services";
import { Button } from "@/shared/components/ui";
import { useAlert } from "@/shared/providers";
import { useAppStore } from "@/store";
import FlashcardDetailLayout from "../../_components/FlashcardDetailLayout";

import type { FlashCard } from "@/features/flashcard/types";
import type { DeckContext, DeckRole } from "../../_components/FlashcardDetailLayout";

/**
 * Shared Deck View
 *
 * @remarks
 * Orchestrates:
 * 1. **Data Fetching**: Resolves a `shareId` token into lesson/card data via an un-authenticated service.
 * 2. **Role Resolution**: Emulates a "Google Docs" permissions model:
 *    - Owner: Full access.
 *    - editor/commenter/viewer: Scoped based on private invitation or public deck settings.
 * 3. **Duplication (Cloning)**: Allows users to save a personal copy of the deck with a fresh SRS state.
 */
export default function SharedLessonPage({ params }: { params: Promise<{ shareId: string }> }) {
    const { shareId } = use(params);
    const router = useRouter();
    const { user } = useAppStore();
    const { showAlert } = useAlert();
    const { saveFullLesson, shareLesson, updateLessonRoles } = useLessons();

    const [result, setResult] = useState<SharedLessonResult | null>(null);
    const [status, setStatus] = useState<"loading" | "not_found" | "ready">("loading");
    const [saving, setSaving] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const [sharingLesson, setSharingLesson] = useState(false);

    /** Resolves shared lesson data including the original owner's ID and lesson ID */
    const loadSharedLesson = () => {
        getSharedLesson(shareId, user?.uid, user)
            .then((res) => {
                if (!res) setStatus("not_found");
                else setStatus("ready");
                setResult(res);
            })
            .catch(() => setStatus("not_found"));
    };

    useEffect(() => {
        loadSharedLesson();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shareId, user?.uid]);

    if (status === "loading") {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[#F7F7F8]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#1cb0f6]" />
            </div>
        );
    }

    if (status !== "ready" || !result) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F7F8] p-6 text-center">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border-b-8 border-gray-200 bg-white shadow-sm">
                    <span className="text-4xl">🔒</span>
                </div>
                <h1 className="mb-2 text-2xl font-black text-[#3c3c3c]">Deck Not Found</h1>
                <p className="mb-8 font-bold text-[#afafaf]">
                    This deck may be restricted, deleted, or the link is invalid.
                </p>
                <Button onClick={() => router.push("/flashcard")} variant="secondary">
                    Go Back
                </Button>
            </div>
        );
    }

    const { lesson, cards, meta } = result;

    // ── Role resolution (Google Docs model) ──────────────────────────────────
    /**
     * Determines if the user is the functional owner.
     * Checks both source metadata and explicit Firestore permission roles.
     */
    const isOwner = !!(
        user &&
        (user.uid === meta.sourceUserId || lesson.roles?.[user.uid] === "owner")
    );

    let role: DeckRole = "viewer";
    if (isOwner) {
        role = "owner";
    } else if (user && lesson.roles?.[user.uid]) {
        role = lesson.roles[user.uid] as DeckRole;
    } else if (lesson.allowLinkAccess || lesson.isPublic) {
        role = (lesson.publicRole as DeckRole) || "viewer";
    }

    const ctx: DeckContext = {
        lesson,
        cards,
        ownerId: meta.sourceUserId,
        lessonId: meta.sourceLessonId,
        role,
        isOwner,
        basePath: `/flashcard/shared/${shareId}`,
    };

    /**
     * Deck Cloning Logic
     * Deep-copies the deck and resets SRS metadata (interval, repetitions, ease) to defaults.
     * Establishes a lineage link via `sourceLessonId`.
     */
    const handleDuplicate = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const cleanLesson = {
                ...lesson,
                id: "",
                userId: user.uid,
                shareId: undefined,
                allowLinkAccess: false,
                isPublic: false,
                roles: { [user.uid]: "owner" as const },
                collaborators: [user.uid],
                createdAt: Date.now(),
                sourceLessonId: meta.sourceLessonId,
                sourceUserId: meta.sourceUserId,
            };
            const cleanCards: FlashCard[] = cards.map((c) => ({
                ...c,
                id: `c_${crypto.randomUUID()}`,
                lessonId: "",
                easeFactor: 2.5,
                interval: 0,
                repetitions: 0,
                nextReviewAt: 0,
            }));
            await saveFullLesson(cleanLesson, cleanCards, true);
            router.push("/flashcard");
        } catch (err) {
            console.error("[SharedLessonPage] Duplicate failed:", err);
            showAlert("error", "Failed to duplicate deck. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(window.location.href);
        setLinkCopied(true);
        showAlert("success", "Link copied to clipboard");
        setTimeout(() => setLinkCopied(false), 2000);
    };

    return (
        <>
            <FlashcardDetailLayout
                ctx={ctx}
                currentUserId={user?.uid}
                currentUserName={user?.displayName}
                currentUserEmail={user?.email}
                saving={saving}
                linkCopied={linkCopied}
                onDuplicate={user ? handleDuplicate : undefined}
                onCopyLink={handleCopyLink}
                onManageAccess={isOwner ? () => setSharingLesson(true) : undefined}
                onEdit={
                    role === "owner" || role === "editor"
                        ? () =>
                              router.push(
                                  isOwner
                                      ? `/flashcard/${meta.sourceLessonId}/edit`
                                      : `/flashcard/${meta.sourceLessonId}/edit?ownerId=${meta.sourceUserId}&returnTo=/flashcard/shared/${shareId}`,
                              )
                        : undefined
                }
            />

            {sharingLesson && isOwner && (
                <ShareModal
                    lesson={lesson}
                    onShareLink={async (isPub, pRole) => {
                        await shareLesson(lesson.id, isPub, pRole);
                        loadSharedLesson();
                    }}
                    onUpdateRoles={async (roles, collabs) => {
                        await updateLessonRoles(lesson.id, roles, collabs);
                        loadSharedLesson();
                    }}
                    onClose={() => setSharingLesson(false)}
                />
            )}
        </>
    );
}
