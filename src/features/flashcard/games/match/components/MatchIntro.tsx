/**
 * @file MatchIntro — Intro View Wrapper
 *
 * @remarks
 * Thin wrapper around existing MatchIntroView component.
 * Maintains backward compatibility while establishing new feature boundary.
 */

"use client";

import MatchIntroView from "./MatchIntroView";

import type { ComponentProps } from "react";

type MatchIntroProps = ComponentProps<typeof MatchIntroView>;

const MatchIntro = (props: MatchIntroProps) => {
    return <MatchIntroView {...props} />;
};

export default MatchIntro;
