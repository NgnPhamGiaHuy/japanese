/**
 * SpeedPlaying — Playing View Wrapper
 *
 * @remarks
 * Thin wrapper around existing SpeedPlayingView component.
 * Maintains backward compatibility while establishing feature boundary.
 */

"use client";

import SpeedPlayingView from "./SpeedPlayingView";

import type { ComponentProps } from "react";

type SpeedPlayingProps = ComponentProps<typeof SpeedPlayingView>;

const SpeedPlaying = (props: SpeedPlayingProps) => {
    return <SpeedPlayingView {...props} />;
};

export default SpeedPlaying;
