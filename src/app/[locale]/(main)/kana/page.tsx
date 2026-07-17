/**
 * Kana Hub Page — Pure Orchestrator
 *
 * @remarks
 * Responsibilities (ONLY):
 * - Render KanaHub feature root
 *
 * NO business logic, NO state management, NO direct service calls.
 */

"use client";

import KanaHub from "@/features/kana/hub";

export default function KanaHubPage() {
    return <KanaHub />;
}
