/**
 * @file SharedLessonPageClient
 * Public landing page for shared flashcard decks.
 * Handles role-based access for non-owners (Viewer, Commenter, Editor).
 */

"use client";

import { useTranslations } from "next-intl";
import { use, useState } from "react";

import { RefreshCw } from "lucide-react";

import {
    canEdit,
    FlashcardDetailLayout,
    ShareModal,
    useLessons,
    useSharedLesson,
} from "@/features/flashcard";
import { emitNotification } from "@/features/notifications";
import { useRouter } from "@/i18n/navigation";
import { useAppStore } from "@/lib/app-store";
import { SITE_URL } from "@/lib/site";
import { Button, LoadingSpinner } from "@/shared/components/ui";
import { useCopyToClipboard } from "@/shared/hooks";
import { useAlert } from "@/shared/providers";

import type { LearningResource, WithContext } from "schema-dts";
import type { DeckContext, FlashCard, PublicSharedLessonPreview } from "@/features/flashcard";

interface SharedLessonPageClientProps {
    shareId: string;
    /**
     * Server-resolved, Admin SDK public preview — passed as a Promise and
     * unwrapped here via `use()` (the hybrid RSC pattern): the server starts
     * the fetch and streams the resolved HTML inline, while the client still
     * performs its own full, viewer-aware resolution below (role, per-user
     * progress) via useSharedLesson. Resolves to null for private/invite-only
     * shares or an invalid token — never a live subscription, this preview is
     * one-shot only.
     */
    previewPromise: Promise<PublicSharedLessonPreview | null>;
}

/**
 * Shared Deck View
 *
 * @remarks
 * Orchestrates:
 * 1. Data Fetching: Resolves a shareId token via useSharedLesson (auth-aware, error-classified).
 * 2. Role Resolution: Google Docs-style permissions model.
 * 3. Duplication: Allows viewers to save a personal copy with fresh SRS state.
 */
export default function SharedLessonPageClient({
    shareId,
    previewPromise,
}: SharedLessonPageClientProps) {
    const t = useTranslations("FlashcardDetail");
    const tCommon = useTranslations("Common");
    const preview = use(previewPromise);
    const router = useRouter();
    const { user } = useAppStore();
    const { showAlert } = useAlert();
    const { saveFullLesson, shareLesson, updateLessonRoles } = useLessons();

    const { result, status, error } = useSharedLesson(shareId);

    const [saving, setSaving] = useState(false);
    const { copied: linkCopied, copy: copyLink } = useCopyToClipboard();
    const [sharingLesson, setSharingLesson] = useState(false);

    const jsonLd: WithContext<LearningResource> | null = preview
        ? {
              "@context": "https://schema.org",
              "@type": "LearningResource",
              name: preview.title,
              description: preview.description || undefined,
              url: `${SITE_URL}/flashcard/shared/${shareId}`,
              learningResourceType: "Flashcard deck",
              inLanguage: "ja",
              ...(preview.ownerName
                  ? { author: { "@type": "Person" as const, name: preview.ownerName } }
                  : {}),
          }
        : null;
    const jsonLdScript = jsonLd && (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );

    if (status === "loading") {
        return (
            <div className="bg-bg fixed inset-0 flex flex-col items-center justify-center gap-6 p-6 text-center">
                {jsonLdScript}
                {preview && (
                    <div className="max-w-md">
                        <h1 className="text-text mb-2 text-2xl font-black">{preview.title}</h1>
                        {preview.description && (
                            <p className="text-muted font-bold">{preview.description}</p>
                        )}
                    </div>
                )}
                <LoadingSpinner fullScreen={false} />
            </div>
        );
    }

    // Network / quota error — show retry UI instead of a false 404.
    if (status === "error") {
        const isQuota = error?.code === "quota-exceeded";
        return (
            <div className="bg-bg flex min-h-screen flex-col items-center justify-center p-6 text-center">
                {jsonLdScript}
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border-b-8 border-gray-200 bg-white shadow-sm">
                    <span className="text-4xl">{isQuota ? "⏳" : "📡"}</span>
                </div>
                <h1 className="text-text mb-2 text-2xl font-black">
                    {isQuota ? t("serviceBusyTitle") : t("connectionErrorTitle")}
                </h1>
                <p className="text-muted mb-8 font-bold">
                    {isQuota ? t("serviceBusyMessage") : t("connectionErrorMessage")}
                </p>
                <div className="flex gap-3">
                    <Button
                        onClick={() => window.location.reload()}
                        variant="primary"
                        color="blue"
                        icon={RefreshCw}
                    >
                        {t("tryAgain")}
                    </Button>
                    <Button onClick={() => router.back()} variant="secondary">
                        {tCommon("goBack")}
                    </Button>
                </div>
            </div>
        );
    }

    if (status !== "ready" || !result) {
        return (
            <div className="bg-bg flex min-h-screen flex-col items-center justify-center p-6 text-center">
                {jsonLdScript}
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border-b-8 border-gray-200 bg-white shadow-sm">
                    <span className="text-4xl">🔒</span>
                </div>
                <h1 className="text-text mb-2 text-2xl font-black">{t("deckNotFoundTitle")}</h1>
                <p className="text-muted mb-8 font-bold">{t("deckNotFoundSharedMessage")}</p>
                <Button onClick={() => router.back()} variant="secondary">
                    {tCommon("goBack")}
                </Button>
            </div>
        );
    }

    const { lesson, cards, meta } = result;

    const isOwner = meta.viewerRole === "owner";
    const role = (
        meta.viewerRole === "none" ? "viewer" : meta.viewerRole
    ) as import("@/features/flashcard").DeckRole;

    const ctx: DeckContext = {
        lesson: lesson as unknown as import("@/features/flashcard").Lesson,
        cards: cards as import("@/features/flashcard").FlashCard[],
        ownerId: meta.sourceUserId,
        lessonId: meta.sourceLessonId,
        role,
        isOwner,
        basePath: `/flashcard/shared/${shareId}`,
    };

    const handleDuplicate = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const cleanLesson = {
                ...lesson,
                id: "",
                userId: user.uid,
                ownerId: user.uid,
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
            await saveFullLesson(
                cleanLesson as unknown as import("@/features/flashcard").Lesson,
                cleanCards,
                true,
            );

            // Tell the original owner their deck was saved (server derives the
            // recipient + skips self).
            if (meta.sourceUserId && meta.sourceLessonId && meta.sourceUserId !== user.uid) {
                void emitNotification({
                    kind: "deck_duplicated",
                    ownerId: meta.sourceUserId,
                    lessonId: meta.sourceLessonId,
                });
            }

            router.back();
        } catch (err) {
            console.error("[SharedLessonPage] Duplicate failed:", err);
            showAlert("error", t("duplicateFailed"));
        } finally {
            setSaving(false);
        }
    };

    const handleCopyLink = async () => {
        await copyLink(window.location.href);
        showAlert("success", tCommon("linkCopiedToClipboard"));
    };

    return (
        <>
            {jsonLdScript}
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
                    canEdit(role)
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
                    lesson={ctx.lesson}
                    onShareLink={async (isPub, pRole, isPublic) => {
                        await shareLesson(meta.sourceLessonId, isPub, pRole, isPublic);
                    }}
                    onUpdateRoles={async (roles, collabs) => {
                        await updateLessonRoles(meta.sourceLessonId, roles, collabs);
                    }}
                    onClose={() => setSharingLesson(false)}
                />
            )}
        </>
    );
}
