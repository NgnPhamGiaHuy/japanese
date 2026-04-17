/**
 * SpeedIntro — Intro View Wrapper
 *
 * @remarks
 * Thin wrapper around existing SpeedIntroView component.
 * Maintains backward compatibility while establishing feature boundary.
 */

"use client";

import SpeedIntroView from "./SpeedIntroView";

import type { ComponentProps } from "react";

type SpeedIntroProps = ComponentProps<typeof SpeedIntroView>;

const SpeedIntro = (props: SpeedIntroProps) => {
    return <SpeedIntroView {...props} />;
};

export default SpeedIntro;
