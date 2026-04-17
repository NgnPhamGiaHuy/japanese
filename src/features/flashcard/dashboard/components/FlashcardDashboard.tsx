/**
 * FlashcardDashboard — Central hub for flashcard management
 *
 * @remarks
 * Orchestrates:
 * 1. Synchronized Deck Lifecycle: Personal vs. shared vs. discover views
 * 2. Gamification Sync: Real-time high-scores and tier badges
 * 3. Collaboration Flow: Share-link generation and modal states
 */

"use client";

import { useRouter } from "next/navigation";

import { Plus } from "lucide-react";

import { ShareModal } from "@/features/flashcard";
import { useLessons } from "@/features/flashcard/core/hooks";
import { buildShareId } from "@/features/flashcard/core/services";
import { ScreenHeader } from "@/shared/components/layout";
import { Button, ConfirmModal, ReorderList } from "@/shared/components/ui";
import { SPACING } from "@/shared/constants";
import DashboardEmpty from "./DashboardEmpty";
import DashboardError from "./DashboardError";
import DashboardLoading from "./DashboardLoading";
import DashboardTabs from "./DashboardTabs";
import SortableDeckCard from "./SortableDeckCard";
import { useDashboardModals, useDashboardState } from "../hooks";

import type { Lesson } from "@/features/flashcard/core/types";

const FlashcardDashboard = () => {
    const router = useRouter();
    const { lessons } = useLessons();
    const {
        activeTab,
        handleTabChange,
        sharedLessons,
        publicLessons,
        orderedLessons,
        loading,
        error,
        handleLessonsReorder,
        activeDragLessonIdRef,
        getGameStats,
    } = useDashboardState();

    const {
        sharingLesson,
        setSharingLesson,
        deletingLesson,
        setDeletingLesson,
        isDeleting,
        handleDelete,
        shareLesson,
        updateLessonRoles,
    } = useDashboardModals();

    /**
     * Resolves the share link for a public deck.
     * Uses the stored shareId or generates one from ownerId + lessonId.
     */
    const resolveShareId = (lesson: Lesson): string =>
        lesson.shareId || (lesson.ownerId ? buildShareId(lesson.ownerId, lesson.id) : "");

    return (
        <div className="min-h-[100dvh] bg-[#F7F7F8] pb-28">
            <ScreenHeader
                title="Flashcards"
                backHref="/"
                right={
                    <Button
                        variant="primary"
                        color="purple"
                        onClick={() => router.push("/flashcard/create")}
                        className="-mr-2 !p-2 shadow-none"
                        icon={Plus}
                        iconSize={20}
                    />
                }
            />

            <div className={`${SPACING.pagePadding} mx-auto max-w-2xl pt-6`}>
                <DashboardTabs
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    sharedCount={sharedLessons.length}
                    publicCount={publicLessons.length}
                />

                {error && <DashboardError error={error} />}

                {loading && <DashboardLoading />}

                {!loading && !error && orderedLessons.length === 0 && (
                    <DashboardEmpty activeTab={activeTab} />
                )}

                {/* All tabs use ReorderList for layout consistency */}
                {!loading && !error && orderedLessons.length > 0 && (
                    <ReorderList
                        items={orderedLessons}
                        onReorder={handleLessonsReorder}
                        className="space-y-4"
                    >
                        {orderedLessons.map((lesson) => {
                            const { matchStats, speedStats } = getGameStats(lesson.id);
                            const isDiscover = activeTab === "discover";
                            const sid = resolveShareId(lesson);

                            return (
                                <SortableDeckCard
                                    key={isDiscover ? `${lesson.ownerId}-${lesson.id}` : lesson.id}
                                    lesson={lesson}
                                    isShared={activeTab === "shared" || isDiscover}
                                    matchStats={matchStats}
                                    speedStats={speedStats}
                                    onDelete={
                                        isDiscover ? undefined : () => setDeletingLesson(lesson)
                                    }
                                    onShare={
                                        isDiscover
                                            ? () => {
                                                  if (sid) router.push(`/flashcard/shared/${sid}`);
                                              }
                                            : () => setSharingLesson(lesson)
                                    }
                                    canReorder={activeTab === "personal" || activeTab === "shared"}
                                    onDragStart={() => {
                                        activeDragLessonIdRef.current = lesson.id;
                                    }}
                                    onDragEnd={() => {
                                        activeDragLessonIdRef.current = null;
                                    }}
                                />
                            );
                        })}
                    </ReorderList>
                )}
            </div>

            {sharingLesson &&
                (() => {
                    const liveLesson =
                        lessons.find((l) => l.id === sharingLesson.id) ?? sharingLesson;
                    return (
                        <ShareModal
                            lesson={liveLesson}
                            onShareLink={async (allowLinkAccess, publicRole, isPublic) => {
                                await shareLesson(
                                    liveLesson.id,
                                    allowLinkAccess,
                                    publicRole,
                                    isPublic,
                                );
                            }}
                            onUpdateRoles={async (roles, collabs) => {
                                await updateLessonRoles(liveLesson.id, roles, collabs);
                            }}
                            onClose={() => setSharingLesson(null)}
                        />
                    );
                })()}

            <ConfirmModal
                isOpen={!!deletingLesson}
                onClose={() => setDeletingLesson(null)}
                onConfirm={handleDelete}
                title="Delete Deck?"
                message={`Are you sure you want to permanent delete "${deletingLesson?.title}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
                loading={isDeleting}
            />
        </div>
    );
};

export default FlashcardDashboard;
