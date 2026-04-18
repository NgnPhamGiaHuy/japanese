/**
 * DetailHeader — Hero header with deck info and action buttons
 *
 * @remarks
 * Displays deck metadata, creator info, tags, and primary action buttons.
 * Adapts navigation based on whether user is owner or shared user.
 */

"use client";

import Link from "next/link";
import { useEffect } from "react";

import { ArrowLeft, BookOpen, Gamepad2, Zap } from "lucide-react";

import { Button, UserMeta } from "@/shared/components/ui";

import type { DetailHeaderProps } from "../types";

const DetailHeader = ({ ctx, onEdit }: DetailHeaderProps) => {
    const { lesson, cards, isOwner, basePath, lessonId, role } = ctx;
    const themeHex = lesson.themeColor || "#1cb0f6";
    const canPlay = cards.length >= 4;

    const createdByName = lesson.ownerName ?? "Unknown";
    const createdByAvatar = lesson.ownerAvatar ?? null;

    const sharedByName = lesson.lastSharedByName ?? "Unknown";
    const shouldShowSharedBy =
        !!lesson.lastSharedBy && (!lesson.ownerId || lesson.lastSharedBy !== lesson.ownerId);

    /** Ensure page starts at top on mount or deck change */
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [lessonId]);

    return (
        <header className="relative overflow-hidden border-b-2 border-gray-200 bg-white shadow-sm">
            <div
                className="pointer-events-none absolute inset-0 opacity-10"
                style={{ backgroundColor: themeHex }}
            />
            <div className="relative z-20 px-4 pt-4 text-left">
                <Link
                    href={isOwner ? "/flashcard?tab=personal" : "/flashcard?tab=shared"}
                    className="inline-block"
                >
                    <Button
                        variant="ghost"
                        className="!rounded-xl !p-2 !text-[#3c3c3c] shadow-none transition-all hover:!bg-black/5 hover:shadow-none active:translate-y-0"
                        title="Back to Decks"
                        icon={ArrowLeft}
                        iconSize={24}
                    />
                </Link>
            </div>

            <div className="relative z-10 mx-auto flex max-w-7xl flex-col justify-between gap-6 px-6 pt-4 pb-6 md:flex-row md:items-end">
                <div>
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        {!isOwner && (
                            <span
                                className="flex items-center justify-center rounded-xl border-2 px-3 py-1 text-xs font-black tracking-widest uppercase"
                                style={{
                                    backgroundColor: `${themeHex}10`,
                                    color: themeHex,
                                    borderColor: `${themeHex}40`,
                                }}
                            >
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                            </span>
                        )}
                        <span className="flex items-center justify-center rounded-xl border-2 border-gray-200 bg-gray-100 px-3 py-1 text-xs font-black tracking-widest text-gray-400 uppercase">
                            {lesson.cardCount} Cards
                        </span>
                    </div>

                    <h1 className="text-3xl font-black text-[#3c3c3c] md:text-5xl">
                        {lesson.title}
                    </h1>

                    {lesson.description && (
                        <p className="mt-3 max-w-2xl text-base font-bold text-[#afafaf] md:text-lg">
                            {lesson.description}
                        </p>
                    )}

                    <div className="mt-2 flex flex-col gap-2">
                        <UserMeta
                            name={createdByName}
                            avatar={createdByAvatar}
                            subtitle="Created by"
                        />
                        {shouldShowSharedBy && (
                            <UserMeta
                                name={sharedByName}
                                avatar={lesson.lastSharedByAvatar ?? null}
                                subtitle="Shared by"
                            />
                        )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {(lesson.categories && lesson.categories.length > 0
                            ? lesson.categories.slice(0, 3)
                            : ["other"]
                        ).map((cat) => (
                            <span
                                key={cat}
                                className="rounded-lg px-2 py-1 text-[10px] font-black tracking-wider uppercase"
                                style={{
                                    color: themeHex,
                                    backgroundColor: `${themeHex}20`,
                                }}
                            >
                                {cat}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex shrink-0 flex-col gap-3">
                    <Link href={`${basePath}/study`} className="w-full">
                        <Button
                            variant="primary"
                            color="blue"
                            className="w-full border-b-8 px-8 py-4 text-lg shadow-sm"
                            style={
                                {
                                    backgroundColor: themeHex,
                                    borderColor: `${themeHex}BB`,
                                } as React.CSSProperties
                            }
                            icon={BookOpen}
                            iconSize={24}
                        >
                            Start Study
                        </Button>
                    </Link>

                    <div className="flex gap-3">
                        <Link
                            href={`${basePath}/match`}
                            className={`flex-1 ${!canPlay && "pointer-events-none"}`}
                        >
                            <Button
                                variant="secondary"
                                color="purple"
                                className="w-full"
                                disabled={!canPlay}
                                icon={Gamepad2}
                                iconSize={18}
                            >
                                Match
                            </Button>
                        </Link>
                        <Link
                            href={`${basePath}/speed`}
                            className={`flex-1 ${!canPlay && "pointer-events-none"}`}
                        >
                            <Button
                                variant="secondary"
                                color="orange"
                                className="w-full"
                                disabled={!canPlay}
                                icon={Zap}
                                iconSize={18}
                            >
                                Speed
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default DetailHeader;
