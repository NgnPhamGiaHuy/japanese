/**
 * @file MatchPlaying — Playing View Wrapper
 *
 * @remarks
 * Thin wrapper around existing MatchPlayingView component.
 * Maintains backward compatibility while establishing new feature boundary.
 */

"use client";

import MatchPlayingView from "./MatchPlayingView";

import type { ComponentProps } from "react";

type MatchPlayingProps = ComponentProps<typeof MatchPlayingView>;

const MatchPlaying = (props: MatchPlayingProps) => {
    return <MatchPlayingView {...props} />;
};

export default MatchPlaying;
