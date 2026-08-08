"use client";

import { useTranslations } from "next-intl";

import { BookOpen, CheckCircle2, Clock, Flame, Plus, Sparkles, Trophy } from "lucide-react";

import { DeckCard, matchGameMode, ShareModal, speedGameMode } from "@/features/flashcard";
import { Link } from "@/i18n/navigation";
import { ActionCard, Button, ConfirmModal, EmptyState, StatCard } from "@/shared/components/ui";
import { SECTION_HEADING, SPACING } from "@/shared/constants";
import { useHomeState } from "../hooks/useHomeState";

/** Visual + copy config for the "Continue Studying" tile per recommended action. */
function continueTileConfig(t: ReturnType<typeof useTranslations<"HomePage">>) {
    return {
        continue: {
            icon: Clock,
            bg: "bg-katakana",
            border: "border-katakana-strong",
            text: "text-katakana",
            label: t("tile.reviewsDue"),
            cta: t("tile.reviewNow"),
        },
        learn: {
            icon: Sparkles,
            bg: "bg-hiragana",
            border: "border-hiragana-strong",
            text: "text-hiragana",
            label: t("tile.newCardsReady"),
            cta: t("tile.startLearning"),
        },
        idle: {
            icon: CheckCircle2,
            bg: "bg-hiragana",
            border: "border-hiragana-strong",
            text: "text-hiragana",
            label: t("tile.allCaughtUp"),
            cta: t("tile.keepPracticing"),
        },
    } as const;
}

const HomePage = () => {
    const t = useTranslations("HomePage");
    const tCommon = useTranslations("Common");

    const {
        userData,
        progressLoading,
        lessons,
        lessonsLoading,
        recentLessons,
        topLesson,
        deckStatus,
        action,
        primaryCount,
        gameStats,
        learnedCount,
        totalKanaChars,
        kanaPct,
        sharingLesson,
        setSharingLesson,
        deletingLesson,
        setDeletingLesson,
        isDeleting,
        handleDelete,
        shareLesson,
        updateLessonRoles,
    } = useHomeState();

    const tile = continueTileConfig(t)[action];

    return (
        <div className="bg-bg min-h-dvh">
            <div
                className={`${SPACING.pagePadding} mx-auto max-w-2xl ${SPACING.sectionGap} pt-6 pb-28`}
            >
                {/* Header */}
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-text text-3xl font-black tracking-tight">
                            {t("greeting")}
                        </h1>
                        <p className="text-muted mt-1 font-bold">{t("subtitle")}</p>
                    </div>
                    <div className="border-survival-strong bg-survival flex h-16 w-16 rotate-3 transform items-center justify-center rounded-2xl border-b-4 text-2xl font-black text-white shadow-sm">
                        {progressLoading ? "…" : userData.streak}
                        <Flame size={24} className="ml-1" fill="currentColor" />
                    </div>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <StatCard
                        icon={<Trophy className="text-survival h-8 w-8" />}
                        title={t("totalXp")}
                        value={userData.xp}
                        loading={progressLoading}
                        index={0}
                    />
                    <StatCard
                        icon={<BookOpen className="text-katakana h-8 w-8" />}
                        title={t("lessonsDone")}
                        value={userData.lessonsCompleted}
                        loading={progressLoading}
                        index={1}
                    />
                </div>

                {/* Continue Studying — deck-scoped, real data, single correctly-routed CTA */}
                {topLesson && (
                    <div
                        className={`flex flex-col justify-between rounded-4xl border-2 border-b-8 p-6 text-white shadow-sm ${tile.bg} ${tile.border}`}
                    >
                        <div>
                            <tile.icon size={32} className="mb-2 opacity-80" />
                            <div className="text-4xl font-black">{primaryCount}</div>
                            <h3 className="text-xs font-black tracking-widest text-white/90 uppercase">
                                {tile.label}
                            </h3>
                            <p className="mt-1 line-clamp-1 text-sm font-bold text-white/80">
                                {topLesson.title}
                            </p>
                            {deckStatus.mistakeCount > 0 && (
                                <p className="mt-1 text-xs font-bold text-white/70">
                                    {t("mistakeCount", { count: deckStatus.mistakeCount })}
                                </p>
                            )}
                        </div>
                        <Link
                            href={`/flashcard/${topLesson.id}/study`}
                            className="focus-visible:ring-katakana mt-4 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        >
                            <Button
                                variant="ghost"
                                className={`w-full bg-white ${tile.text} hover:bg-gray-100`}
                            >
                                {tile.cta}
                            </Button>
                        </Link>
                    </div>
                )}

                {/* Kana Section — data-driven, mirrors KanaHub's own hero-tile pattern */}
                <div>
                    <h2 className={`${SECTION_HEADING} mb-4`}>{t("kanaPractice")}</h2>
                    <ActionCard
                        href="/kana"
                        primary
                        icon={<span className="text-2xl font-black text-white">あ→ア</span>}
                        title={t("kanaTitle")}
                        subtitle={t("kanaSubtitle")}
                        progress={{
                            value: kanaPct,
                            label: progressLoading
                                ? t("loadingProgress")
                                : t("charactersMastered", {
                                      learned: learnedCount,
                                      total: totalKanaChars,
                                  }),
                        }}
                        primaryBg="bg-gradient-to-br from-hiragana to-katakana"
                        primaryBorderB="border-hiragana-hover"
                        primaryHover=""
                    />
                </div>

                {/* Flashcard Section */}
                <div>
                    <div className="mb-4 flex items-end justify-between">
                        <h2 className={SECTION_HEADING}>{t("jumpBackIn")}</h2>
                        <Link
                            href="/flashcard"
                            className="text-katakana hover:text-katakana-hover focus-visible:ring-katakana rounded-md text-sm font-black focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        >
                            {t("seeAll")}
                        </Link>
                    </div>

                    {!lessonsLoading && recentLessons.length === 0 ? (
                        <EmptyState
                            icon={Plus}
                            title={t("emptyTitle")}
                            description={t("emptyDescription")}
                            action={
                                <Link href="/flashcard/create">
                                    <Button variant="primary" color="purple">
                                        {t("createDeck")}
                                    </Button>
                                </Link>
                            }
                        />
                    ) : (
                        <div className={`flex flex-col ${SPACING.cardGap}`}>
                            {recentLessons.map((lesson) => (
                                <DeckCard
                                    key={lesson.id}
                                    lesson={lesson}
                                    isShared={false}
                                    matchStats={gameStats[matchGameMode(lesson.id)]}
                                    speedStats={gameStats[speedGameMode(lesson.id)]}
                                    onDelete={() => setDeletingLesson(lesson)}
                                    onShare={() => setSharingLesson(lesson)}
                                />
                            ))}
                        </div>
                    )}
                </div>
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
                            onUpdateRoles={async (roles) => {
                                await updateLessonRoles(liveLesson.id, roles);
                            }}
                            onClose={() => setSharingLesson(null)}
                        />
                    );
                })()}

            <ConfirmModal
                isOpen={!!deletingLesson}
                onClose={() => setDeletingLesson(null)}
                onConfirm={handleDelete}
                title={tCommon("deleteDeckTitle")}
                message={tCommon("deleteDeckMessage", { title: deletingLesson?.title ?? "" })}
                confirmText={tCommon("delete")}
                variant="danger"
                loading={isDeleting}
            />
        </div>
    );
};

export default HomePage;
