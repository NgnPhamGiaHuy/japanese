/**
 * DeckCard — Individual deck entry on dashboard
 *
 * @remarks
 * Displays deck metadata (title, tags, count) and high score badges.
 * Provides entry points to Study, Speed Quiz, and Match game.
 */

/**
 * DeckCard — Individual deck entry on dashboard
 *
 * @remarks
 * Displays deck metadata (title, tags, count) and high score badges.
 * Provides entry points to Study, Speed Quiz, and Match game.
 */
/**
 * DeckCard — Individual deck entry on dashboard
 *
 * @remarks
 * Displays deck metadata (title, tags, count) and high score badges.
 * Provides entry points to Study, Speed Quiz, and Match game.
 */
import Link from "next/link";

import { BookOpen, Edit2, Gamepad2, Trash2, Zap } from "lucide-react";

import { buildShareId } from "@/features/flashcard";
import { useVisibility, VisibilityLevel } from "@/features/flashcard/core";
import { resolveRole, ROLE_CONFIG } from "@/features/flashcard/core/utils/rbac";
import { Button, TierBadge, UserMeta } from "@/shared/components/ui";
import { CARD_BASE, SPACING } from "@/shared/constants";
import { hexToThemeColor } from "@/shared/utils";
import { useAppStore } from "@/store";

import type { DeckCardProps } from "../types";

const DeckCard = ({
    lesson,
    isShared,
    matchStats,
    speedStats,
    onDelete,
    onShare,
}: DeckCardProps) => {
    const { user } = useAppStore();
    const themeColor = lesson.themeColor || "#1cb0f6";
    const visibility = useVisibility(lesson);

    const resolvedRole = resolveRole({ lesson, userId: user?.uid });
    const canEdit = resolvedRole === "owner" || resolvedRole === "editor";
    const canShare = resolvedRole === "owner";
    const canDelete = resolvedRole === "owner";

    const createdByName = lesson.ownerName ?? "Unknown";
    const createdByAvatar = lesson.ownerAvatar ?? null;
    const shouldShowSharedBy =
        !!lesson.lastSharedBy && (!lesson.ownerId || lesson.lastSharedBy !== lesson.ownerId);
    const sharedByName = lesson.lastSharedByName ?? "Unknown";
    const sharedByAvatar = lesson.lastSharedByAvatar ?? null;
    const sharedBySubtitle = user && lesson.lastSharedBy === user.uid ? "You shared" : "Shared by";

    const resolvedShareId =
        lesson.shareId ||
        (lesson.ownerId
            ? buildShareId(lesson.ownerId, lesson.id)
            : lesson.userId
              ? buildShareId(lesson.userId, lesson.id)
              : "");

    const viewPath = isShared ? `/flashcard/shared/${resolvedShareId}` : `/flashcard/${lesson.id}`;
    const speedPath = isShared
        ? `/flashcard/shared/${resolvedShareId}/speed`
        : `/flashcard/${lesson.id}/speed`;
    const matchPath = isShared
        ? `/flashcard/shared/${resolvedShareId}/match`
        : `/flashcard/${lesson.id}/match`;
    const editPath = isShared
        ? `/flashcard/${lesson.id}/edit?ownerId=${lesson.ownerId ?? lesson.userId}`
        : `/flashcard/${lesson.id}/edit`;

    const roleInfo = ROLE_CONFIG[resolvedRole];

    return (
        <div
            className={`group relative ${CARD_BASE} transition-all hover:-translate-y-0.5 hover:shadow-md ${SPACING.cardPadding} hover:z-10`}
        >
            <div className="mb-4 flex items-start justify-between">
                <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-[#3c3c3c]">{lesson.title}</h3>
                        {isShared && (
                            <span
                                style={{
                                    color: roleInfo.color,
                                    backgroundColor: `${roleInfo.color}15`,
                                }}
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-black tracking-tight uppercase"
                                title={`You have ${roleInfo.label} permissions`}
                            >
                                <roleInfo.icon size={10} />
                                {roleInfo.label}
                            </span>
                        )}
                        {!isShared && visibility.level !== VisibilityLevel.PRIVATE && (
                            <span
                                style={{
                                    color: visibility.effectiveColor,
                                    backgroundColor: `${visibility.effectiveColor}15`,
                                }}
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-black tracking-tight uppercase"
                            >
                                <visibility.icon size={10} />
                                {visibility.label}
                            </span>
                        )}
                    </div>
                    {lesson.description && (
                        <p className="mt-1 line-clamp-2 text-sm font-bold text-[#afafaf]">
                            {lesson.description}
                        </p>
                    )}
                    <div className="mt-2 flex flex-col gap-1">
                        <UserMeta
                            name={createdByName}
                            avatar={createdByAvatar}
                            subtitle="Created by"
                            className="!gap-2"
                        />
                        {shouldShowSharedBy && (
                            <UserMeta
                                name={sharedByName}
                                avatar={sharedByAvatar}
                                subtitle={sharedBySubtitle}
                                className="!gap-2"
                            />
                        )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                        {(lesson.categories && lesson.categories.length > 0
                            ? lesson.categories.slice(0, 3)
                            : ["other"]
                        ).map((cat) => (
                            <span
                                key={cat}
                                style={{
                                    color: themeColor,
                                    backgroundColor: `${themeColor}20`,
                                }}
                                className="rounded-lg px-2 py-1 text-[10px] font-black tracking-wider uppercase"
                            >
                                {cat}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="flex shrink-0 flex-col items-center">
                    <div
                        className="mb-1 flex h-14 w-14 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: `${themeColor}20` }}
                    >
                        <span className="text-2xl font-black" style={{ color: themeColor }}>
                            {lesson.cardCount}
                        </span>
                    </div>
                    <span className="text-[9px] font-black text-[#afafaf] uppercase">cards</span>
                </div>
            </div>

            <div className="mt-2 flex flex-col gap-3 sm:mt-0 sm:flex-row sm:gap-2">
                <div className="flex flex-1 gap-2">
                    <Link href={viewPath} className="flex-1">
                        <Button
                            variant="primary"
                            color={hexToThemeColor(themeColor)}
                            icon={BookOpen}
                            className="w-full flex-col gap-1 px-1 py-2 text-[10px] md:flex-row md:gap-2 md:px-2 md:py-3 md:text-sm"
                        >
                            <span className="truncate">View</span>
                        </Button>
                    </Link>

                    <div className="relative flex-1">
                        {speedStats && (
                            <TierBadge
                                score={speedStats.bestScore}
                                className="absolute -top-2 left-1/2 z-10 -translate-x-1/2"
                            />
                        )}
                        <Link href={speedPath} className="block">
                            <Button
                                variant="secondary"
                                color="orange"
                                icon={Zap}
                                className="w-full flex-col gap-1 px-1 py-2 text-[10px] md:flex-row md:gap-2 md:px-2 md:py-3 md:text-sm"
                            >
                                <span className="truncate">Speed</span>
                            </Button>
                        </Link>
                    </div>

                    <div className="relative flex-1">
                        {matchStats && (
                            <TierBadge
                                score={matchStats.bestScore}
                                className="absolute -top-2 left-1/2 z-10 -translate-x-1/2"
                            />
                        )}
                        <Link href={matchPath} className="block">
                            <Button
                                variant="secondary"
                                color="purple"
                                icon={Gamepad2}
                                className="w-full flex-col gap-1 px-1 py-2 text-[10px] md:flex-row md:gap-2 md:px-2 md:py-3 md:text-sm"
                            >
                                <span className="truncate">Match</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="flex items-center justify-around gap-2 border-t-2 border-gray-50 pt-3 sm:justify-end sm:border-t-0 sm:pt-0">
                    {canShare && (
                        <Button
                            variant="ghost"
                            onClick={() => onShare?.()}
                            className="!flex !h-11 !w-11 !items-center !justify-center !rounded-xl !p-0 shadow-none transition-colors hover:shadow-none active:translate-y-0"
                            style={{
                                color: isShared ? roleInfo.color : visibility.effectiveColor,
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = isShared
                                    ? `${roleInfo.color}15`
                                    : `${visibility.effectiveColor}15`;
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor =
                                    "transparent";
                            }}
                            title={visibility.description}
                            icon={isShared ? roleInfo.icon : visibility.icon}
                            iconSize={20}
                        />
                    )}
                    {canEdit && (
                        <Link href={editPath}>
                            <Button
                                variant="ghost"
                                className="!flex !h-11 !w-11 !items-center !justify-center !rounded-xl !p-0 !text-gray-300 shadow-none transition-all hover:shadow-none active:translate-y-0"
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLElement).style.backgroundColor =
                                        `${themeColor}20`;
                                    (e.currentTarget as HTMLElement).style.color = themeColor;
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLElement).style.backgroundColor =
                                        "transparent";
                                    (e.currentTarget as HTMLElement).style.color = "";
                                }}
                                title="Edit deck"
                                icon={Edit2}
                                iconSize={20}
                            />
                        </Link>
                    )}
                    {canDelete && (
                        <Button
                            variant="ghost"
                            onClick={() => onDelete?.()}
                            className="!flex !h-11 !w-11 !items-center !justify-center !rounded-xl !p-0 !text-gray-300 shadow-none transition-colors hover:!bg-[#ffdfe0] hover:!text-[#ea2b2b] hover:shadow-none active:translate-y-0"
                            title="Delete deck"
                            icon={Trash2}
                            iconSize={20}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeckCard;
