/**
 * SpeedResults — Results View Wrapper
 *
 * @remarks
 * Thin wrapper around existing SpeedResultsView component.
 * Maintains backward compatibility while establishing feature boundary.
 */

"use client";

import SpeedResultsView from "./SpeedResultsView";

import type { ComponentProps } from "react";

type SpeedResultsProps = ComponentProps<typeof SpeedResultsView>;

const SpeedResults = (props: SpeedResultsProps) => {
    return <SpeedResultsView {...props} />;
};

export default SpeedResults;
