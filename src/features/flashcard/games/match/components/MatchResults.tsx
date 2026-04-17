/**
 * @file MatchResults — Results View Wrapper
 *
 * @remarks
 * Thin wrapper around existing MatchResultsView component.
 * Maintains backward compatibility while establishing new feature boundary.
 */

"use client";

import MatchResultsView from "./MatchResultsView";

import type { ComponentProps } from "react";

type MatchResultsProps = ComponentProps<typeof MatchResultsView>;

const MatchResults = (props: MatchResultsProps) => {
    return <MatchResultsView {...props} />;
};

export default MatchResults;
