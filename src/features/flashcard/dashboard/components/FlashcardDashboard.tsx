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

import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";

import ShareModal from "@/features/flashcard/components/ShareModal";
import { useLessons } from "@/features/flashcard/hooks";
import { buildShareId } from "@/features/flashcard/services";
import { useRouter } from "@/i18n/navigation";
import { ScreenHeader } from "@/shared/components/layout";
import { Button, ConfirmModal } from "@/shared/components/ui";
import { SPACING } from "@/shared/constants";
import DashboardEmpty from "./DashboardEmpty";
import DashboardError from "./DashboardError";
import DashboardLoading from "./DashboardLoading";
import DashboardTabs from "./DashboardTabs";
import SortableDeckCard from "./SortableDeckCard";
import { useDashboardModals, useDashboardState } from "../hooks";

import type { DragEndEvent } from "@dnd-kit/core";
import type { Lesson } from "@/features/flashcard/types";

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
        getGameStats,
    } = useDashboardState();

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        void handleLessonsReorder(String(active.id), String(over.id));
    };

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
        <div className="bg-bg min-h-dvh pb-28">
            <ScreenHeader
                title="Flashcards"
                backHref="/"
                right={
                    <Button
                        variant="primary"
                        color="purple"
                        size="icon"
                        onClick={() => router.push("/flashcard/create")}
                        className="-mr-2 shadow-none"
                        icon={Plus}
                        iconSize={20}
                        aria-label="Create deck"
                    />
                }
            />

            <div className={`${SPACING.pagePadding} mx-auto max-w-2xl pt-6`}>
                <DashboardTabs
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    sharedCount={sharedLessons.length}
                    publicCount={publicLessons.length}
                    personalCount={lessons.length}
                />

                {error && <DashboardError error={error} />}

                {loading && <DashboardLoading />}

                {!loading && !error && orderedLessons.length === 0 && (
                    <DashboardEmpty activeTab={activeTab} />
                )}

                {/* All tabs render through the same sortable list for layout
                    consistency — only personal/shared decks are actually
                    draggable (canReorder), discover decks render inert. */}
                {!loading && !error && orderedLessons.length > 0 && (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={orderedLessons.map((lesson) => lesson.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-4">
                                {orderedLessons.map((lesson) => {
                                    const { matchStats, speedStats } = getGameStats(lesson.id);
                                    const isDiscover = activeTab === "discover";
                                    const sid = resolveShareId(lesson);

                                    return (
                                        <SortableDeckCard
                                            key={
                                                isDiscover
                                                    ? `${lesson.ownerId}-${lesson.id}`
                                                    : lesson.id
                                            }
                                            lesson={lesson}
                                            isShared={activeTab === "shared" || isDiscover}
                                            matchStats={matchStats}
                                            speedStats={speedStats}
                                            onDelete={
                                                isDiscover
                                                    ? undefined
                                                    : () => setDeletingLesson(lesson)
                                            }
                                            onShare={
                                                isDiscover
                                                    ? () => {
                                                          if (sid)
                                                              router.push(
                                                                  `/flashcard/shared/${sid}`,
                                                              );
                                                      }
                                                    : () => setSharingLesson(lesson)
                                            }
                                            canReorder={
                                                activeTab === "personal" || activeTab === "shared"
                                            }
                                        />
                                    );
                                })}
                            </div>
                        </SortableContext>
                    </DndContext>
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
