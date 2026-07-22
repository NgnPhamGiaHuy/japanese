# 04 — Component Inventory

> Discovery-phase documentation. Source of truth: the code under `/Users/yuh.nguyenpham/GitHub/japanese/src` as of commit `a0bbbc4`. All paths below are relative to `src/` unless prefixed otherwise. "Used by" lists are derived from grepping import statements (test files `*.test.*` and `*.stories.*` excluded). Statements are **Observed** unless explicitly marked **Inferred**.

**Client/server marker.** Files containing the `"use client"` directive are marked ⬥client. Files with no directive are marked ⬦no-directive; whether a no-directive file executes as a server or client component depends on its importer (React Server Components semantics), so for those the runtime placement noted is **Inferred** from consumers. A consolidated list of no-directive files is in [§5](#5-use-client-directive-summary).

---

## 1. Shared components — `shared/components/`

Two subdirectories exist: `ui/` (21 exported components + 1 internal module + barrel) and `layout/` (1 module + barrel). Observed via `find shared/components -type f`.

### 1.1 Barrels

- `shared/components/ui/index.ts` re-exports (observed, lines 1–24): `Alert` (+ types `AlertType`, `AlertAction`), `Button`, `Input`, `Textarea`, `ConfirmModal`, `DatePicker`, `Drawer`, `Select` (+ type `SelectOption`), `StatCard`, `UserAvatar`, `UserMeta`, `ActionCard`, `SettingsMenu`, `Badge` (+ type `BadgeVariant`), `Card`, `EmptyState`, `ModeSelectionCard`, `LoadingSpinner`, `Modal`, `NotFoundScreen`. `DialogChrome` is **not** in the barrel — it is imported directly by sibling dialog components.
- `shared/components/layout/index.ts` re-exports everything from `./ScreenHeader` (line 1).

### 1.2 `ui/` components — full detail

#### ActionCard — `shared/components/ui/ActionCard.tsx` ⬦no-directive
- **Purpose** (docblock, lines 1–15): "Reusable action card with icon and content … navigation cards with primary/secondary variants. Supports progress bars, badges, and custom styling."
- **Props** (lines 21–51): `href, primary?, icon, title, subtitle?, badge?, progress?{value,label}, primaryBg?, primaryBorderB?, primaryHover?, primaryText?, primaryBgLight?, className?`.
- **Depends on**: `Link` from `@/i18n/navigation` (line 16).
- **Used by (2)**: `features/home/components/HomePage.tsx`, `features/kana/hub/components/KanaHub.tsx`.
- **Responsibilities**: renders a locale-aware `<Link>` styled as a large tile; two layout modes (progress row vs. centered column, lines 75–77); progress bar width driven by `progress.value` (line 104).

#### Alert — `shared/components/ui/Alert.tsx` ⬦no-directive
- **Purpose** (docblock, lines 1–12): "Premium toast notification content … Purely presentational — timing, stacking, positioning, swipe-dismiss, and the accessible live-region announcement are all owned by sonner (rendered via `toast.custom()` in AlertProvider)."
- **Props** (lines 30–39): `type: AlertType ("info"|"success"|"warning"|"error"), message, onClose, action?: AlertAction`.
- **Depends on**: `useTranslations` (next-intl), lucide icons, `SEMANTIC_STATUS` from `@/shared/utils`, sibling `Button` (lines 13–18).
- **Used by (1)**: `shared/providers/AlertProvider.tsx` (rendered through sonner's `toast.custom`, AlertProvider.tsx:51–61).
- **Responsibilities**: severity→color/icon mapping via `CONFIG` (lines 41–73); optional inline action button that also dismisses (lines 89–101); close button with localized `aria-label` (lines 102–109).

#### Badge — `shared/components/ui/Badge.tsx` ⬦no-directive
- **Purpose** (docblock, lines 1–9): "Versatile badge component for status, tags, or counts."
- **Props** (lines 22–35): `children, variant? ("default"|"primary"|"success"|"warning"|"danger"|"info"), size? ("sm"|"md"|"lg"), className?, icon?, dot?`.
- **Depends on**: `SEMANTIC_STATUS` (line 12), lucide `LucideIcon` type.
- **Used by (7)**: `features/admin/components/users/RoleCell.tsx`, `features/admin/components/reports/LogTypeBadge.tsx`, `LogRow.tsx`, `LogLevelBadge.tsx`, `LogSourceBadge.tsx`, `features/admin/components/content/DeckCardItem.tsx`, `app/[locale]/(main)/profile/page.tsx`. Additionally the `BadgeVariant` type is imported by `features/admin/domain/logMeta.ts:23`.
- **Responsibilities**: variant/size class lookup tables (lines 37–52); optional status dot and icon sizing per size (lines 66–67). A Storybook story exists at `shared/components/ui/Badge.stories.tsx`.

#### Button — `shared/components/ui/Button.tsx` ⬥client
- **Purpose** (docblock, lines 146–157): "Premium interactive button component … Duolingo-style 3D button with spring animations and glassmorphism support."
- **Props** (interface `ButtonProps`, lines 95–144): `children?, onClick?, variant? ("primary"|"secondary"|"outline"|"ghost"|"plain"), size? ("md"|"icon"|"icon-sm"|"auto"), color? (ThemeColor: 8 named themes or arbitrary hex), alphabet? ("hiragana"|"katakana"|"both"), className?, icon?, iconSize?, iconClassName?, disabled?, loading?, active?, type?, onMouseEnter?, onMouseLeave?, badge?, id?, title?, aria-label?, role?, aria-checked?, aria-pressed?, style?`. `forwardRef<HTMLButtonElement>` (line 158).
- **Depends on**: `m` from `motion/react` (renders `m.button`, line 226 — requires an ancestor `LazyMotion`), lucide `Loader2`, `cn` from `@/shared/utils`.
- **Used by (84 importing files)** — the most-consumed component in the codebase. 9 of the 84 are inside `shared/components` itself (`Alert`, `ConfirmModal`, `DatePicker`, `DialogChrome`, `ModeSelectionCard`, `NotFoundScreen`, `Select`, `SettingsMenu`, `layout/ScreenHeader`); the rest span every feature (admin, flashcard, kana, game, home, notifications, command-palette is the exception) and app routes (`login/page.tsx`, `profile/page.tsx`, `notifications/page.tsx`, `settings/SettingsPageClient.tsx`, survival screens, etc.). Count obtained by grepping `import … Button … from "@/shared/components/ui"` / `"./Button"`.
- **Responsibilities**: theme resolution (`alphabet` preset → `ALPHABET_MAP`, else `color`; custom hex handled through inline `style`, lines 187–223); spring hover/tap animation (lines 228–230); loading state swaps icon for spinner and blocks `onClick` (lines 238, 245–249); `active` ring driven by `--theme-color` CSS var (line 212).

#### Card — `shared/components/ui/Card.tsx` ⬥client
- **Purpose** (docblock, lines 3–14): "Reusable card container component … consistent styling across the app."
- **Props** (lines 20–33): `children, variant? ("default"|"elevated"|"flat"|"dashboard"), padding? ("none"|"sm"|"compact"|"md"|"lg"), interactive?, className?, onClick?` — with `onClick` present the element renders as `<button>` (line 62).
- **Depends on**: `cn` from `@/shared/utils`.
- **Used by (11)**: `app/[locale]/(main)/settings/SettingsPageClient.tsx`, `app/[locale]/(main)/profile/page.tsx`, `features/admin/components/shared/AdminChartContainer.tsx`, `AdminTableShell.tsx`, `AdminStatCard.tsx`, `AdminCard.tsx`, `features/admin/components/settings/AdminSettingsPageContent.tsx`, `features/admin/components/reports/LogsSummaryHeader.tsx`, `LogsFilters.tsx`, `features/admin/components/content/DeckCardItem.tsx`, `features/flashcard/dashboard/components/DeckCard.tsx`.
- **Responsibilities**: variant/padding class tables (lines 35–49); hover-lift treatment when `interactive` (lines 51–52).

#### ConfirmModal — `shared/components/ui/ConfirmModal.tsx` ⬥client
- **Purpose** (docblock, lines 37–53): "High-stakes confirmation dialog … dangerous or important actions (e.g., deletions, resets)."
- **Props** (lines 16–35): `isOpen, onClose, onConfirm, title, message, confirmText?, cancelText?, variant? ("danger"|"warning"|"info"), loading?`.
- **Depends on**: `@base-ui/react/dialog`, lucide icons, `SEMANTIC_STATUS`, sibling `Button`, `DIALOG_BACKDROP_CLASSNAME`/`DialogCloseButton` from `./DialogChrome` (lines 3–10).
- **Used by (7)**: `app/[locale]/(main)/settings/SettingsPageClient.tsx`, `features/home/components/HomePage.tsx`, `features/admin/components/users/UsersActionConfirmModal.tsx`, `features/admin/components/content/AdminContentPageContent.tsx`, `features/flashcard/dashboard/components/FlashcardDashboard.tsx`, `features/flashcard/games/study/components/StudyModeSelector.tsx`, `features/flashcard/games/study/components/StudySession.tsx`.
- **Responsibilities**: variant→icon/color mapping (lines 55–74); blocks close while `loading` (line 92); localized default confirm/cancel labels via `useTranslations("Common")` (lines 87, 136, 145).

#### DatePicker — `shared/components/ui/DatePicker.tsx` ⬥client
- **Purpose** (docblock, lines 31–44): "Premium date selection component … custom calendar dropdown … timezone-safe ISO date strings."
- **Props** (lines 16–29): `value? (ISO "YYYY-MM-DD"), onChange(value?), placeholder?, label?, className?, disabled?`.
- **Depends on**: `react-day-picker` (+ its stylesheet, line 13), `@base-ui/react/popover`, `date-fns` (`format`, `parseISO`), `clsx`, lucide icons, sibling `Button`.
- **Used by (1)**: `features/admin/components/shared/AdminDateRangeFilter.tsx`.
- **Responsibilities**: local-midnight ISO parsing to avoid off-by-one-day (comment, lines 55–58); clear button emits `onChange(undefined)` (lines 105–117); fully custom `classNames` theme for `DayPicker` (lines 137–159).

#### DialogChrome — `shared/components/ui/DialogChrome.tsx` ⬥client (internal, not in barrel)
- **Purpose** (comments): shared chrome for Base-UI-Dialog-based overlays — exports `DIALOG_BACKDROP_CLASSNAME` (backdrop classes) and `DialogCloseButton` (the ghost "X" `Dialog.Close` button). Documents the two-tier pattern (T-110a): Tier 1 (`Modal`, `ConfirmModal`) renders both exports itself; Tier 2 (bespoke compositions) imports only `DIALOG_BACKDROP_CLASSNAME`, keeping its own close-affordance styling.
- **Props**: `DialogCloseButton({ disabled? })`.
- **Depends on**: `@base-ui/react/dialog`, lucide `X`, sibling `Button`.
- **Used by (6)**: Tier 1 — `Modal.tsx`, `ConfirmModal.tsx` (both exports). Tier 2, backdrop only — `features/admin/components/content/DeckDetailsPanel.tsx`, `features/admin/components/shared/AdminSidebar.tsx`, `features/flashcard/sharing/components/ShareModal.tsx`, `features/command-palette/components/CommandPalette.tsx` (converged onto the shared constant, T-110a; previously each hardcoded or duplicated its own backdrop className). `Drawer.tsx` — removed, T-110b.

#### ~~Drawer~~ — removed (T-110b)
- Formerly `shared/components/ui/Drawer.tsx` — a zero-render-site primitive (CS-1's named counter-example: built ahead of any consumer). NQ-3 resolved to its default, delete; deleted along with its barrel export. See `docs/migrations-ledger.md` `LDG-06` (closed).

#### EmptyState — `shared/components/ui/EmptyState.tsx` ⬦no-directive
- **Purpose** (docblock, lines 1–14): "Reusable empty state component for displaying missing content."
- **Props** (lines 19–40): `icon, title, description, action?, iconBg?, iconBorder?, iconTextColor?, rotateIcon?, fullScreen?, iconStrokeWidth?`.
- **Depends on**: lucide `LucideIcon` type only.
- **Used by (11)**: `features/admin/components/shared/AdminGuard.tsx`, `AdminErrorState.tsx`, `features/admin/components/content/AdminContentPageContent.tsx`, `features/admin/components/dashboard/AdminOverviewPage.tsx`, `features/admin/components/users/UsersTable.tsx`, `features/admin/components/analytics/AdminAnalyticsPageContent.tsx`, `features/admin/components/reports/AdminReportsPageContent.tsx`, `features/home/components/HomePage.tsx`, `features/flashcard/components/FlashcardLearn.tsx`, `FlashcardMistakeReview.tsx`, `FlashcardPractice.tsx`.
- **Responsibilities**: inline (`py-20`) vs. `fullScreen` fixed takeover rendering (lines 54–61); tilted icon well styling (line 63).

#### Input — `shared/components/ui/Input.tsx` ⬥client
- **Purpose** (docblock, lines 25–35): "Shared text input … reads an ambient `--theme-color` CSS variable for its focus border."
- **Props** (lines 13–23): extends `InputHTMLAttributes` (minus `size`) + `variant? ("default"|"underline"), icon?, iconSize?, containerClassName?`. `forwardRef<HTMLInputElement>` (line 36).
- **Depends on**: `cn`.
- **Used by (6)**: `features/admin/components/shared/AdminSearchInput.tsx`, `features/admin/components/reports/LogsFilters.tsx`, `features/flashcard/components/AIBulkPanel.tsx`, `LessonBuilderMeta.tsx`, `DraggableCard.tsx`, `ShareCollaboratorsPanel.tsx`.
- **Responsibilities**: bordered default variant with optional leading icon (lines 62–81); borderless "underline" title-style variant (lines 48–60).

#### LoadingSpinner — `shared/components/ui/LoadingSpinner.tsx` ⬥client
- **Purpose** (docblock, lines 1–10): "Premium loading spinner … inline or as a full-screen overlay with optional status labels."
- **Props** (lines 18–27): `color?, size?, fullScreen? (default true), label?`.
- **Depends on**: `useTranslations("Common")` (line 35), lucide `Loader2`.
- **Used by (22)**: all six immersive game pages (`app/[locale]/(immersive)/flashcard/[id]/{match,speed,study}/page.tsx` and the three `shared/[shareId]` equivalents), `app/[locale]/(main)/flashcard/[id]/page.tsx`, `[id]/edit/page.tsx`, `shared/[shareId]/page.tsx`, `shared/[shareId]/SharedLessonPageClient.tsx`, `features/admin/components/content/AdminContentPageContent.tsx`, `DeckDetailsPanel.tsx`, `features/admin/components/shared/AdminGuard.tsx`, `DataTableBody.tsx`, `DataTableMobileList.tsx`, `features/admin/components/users/AdminUsersPageContent.tsx`, `features/admin/components/analytics/AnalyticsDetailModal.tsx`, `AnalyticsExportModal.tsx`, `AdminAnalyticsPageContent.tsx`, `features/admin/components/dashboard/AdminOverviewPage.tsx`, `features/admin/components/reports/AdminReportsPageContent.tsx`, `features/flashcard/components/LessonBuilderImportPane.tsx`.
- **Responsibilities**: spinner + ping halo (lines 38–44); full-screen overlay at `z-[100]` (lines 62–66); localized subtitle under `label`.

#### Modal — `shared/components/ui/Modal.tsx` ⬥client
- **Purpose** (docblock, lines 30–41): "Reusable Base Modal Component … handles backdrop, animations, and accessible close behavior."
- **Props** (lines 8–19): `isOpen, onClose, title?, children, maxWidth? ("sm"…"4xl")`.
- **Depends on**: `@base-ui/react/dialog`, `./DialogChrome`.
- **Used by (2)**: `features/admin/components/analytics/AnalyticsDetailModal.tsx`, `AnalyticsExportModal.tsx`.
- **Responsibilities**: centered popup with max-width table (lines 21–28), header + scrollable content area (lines 56–67).

#### ModeSelectionCard — `shared/components/ui/ModeSelectionCard.tsx` ⬥client
- **Purpose** (docblock, lines 1–17): "Interactive card for selecting study or game modes."
- **Props** (lines 25–42): `id?, icon, iconBgColor, iconColor, title, description, bestScore?, onClick`.
- **Depends on**: sibling `Button` (rendered as `variant="plain"` wrapper, lines 55–60).
- **Used by (1)**: `features/kana/quiz/components/QuizSetup.tsx`.

#### NotFoundScreen — `shared/components/ui/NotFoundScreen.tsx` ⬦no-directive
- **Purpose** (docblock, lines 1–14): "Full-screen error screen for missing resources … reusable 404/not found screen."
- **Props** (lines 20–29): `title?, description?, buttonText?, onBack`.
- **Depends on**: `useTranslations("Common")` (line 32), sibling `Button`.
- **Used by (3)**: `app/[locale]/(immersive)/flashcard/shared/[shareId]/{match,speed,study}/page.tsx`.

#### Select — `shared/components/ui/Select.tsx` ⬥client
- **Purpose** (docblock, lines 50–63): "Premium custom dropdown selection component … alternative to native select elements."
- **Props** (lines 21–42): generic `<T extends string|number>`: `value, options: SelectOption<T>[], onChange, onRemove?, removeLabel?, disabled?, themeHex?, align?, variant? ("full"|"compact"), className?`.
- **Depends on**: `@base-ui/react/select`, lucide, sibling `Button`.
- **Used by (3)**: `features/admin/components/reports/LogsFilters.tsx`, `features/flashcard/components/SharePrivacyPicker.tsx`, `ShareCollaboratorsPanel.tsx` (each also imports the `SelectOption` type). `features/flashcard/games/speed/engine/questions/QuestionEngine.ts` matches the word "Select" but does not import this component (observed).
- **Responsibilities**: `REMOVE_SENTINEL` symbol keeps the optional "remove" action a real listbox item (lines 44–48, 149–159); compact/full density variants; check indicator colored by `themeHex`.

#### SettingsMenu — `shared/components/ui/SettingsMenu.tsx` ⬦no-directive
- **Purpose** (docblock, lines 1–18): "Dropdown settings panel for managing application preferences … toggles for audio/display and confirmation workflows for destructive actions."
- **Props** (lines 50–69): `isOpen, onToggle, primaryBg, audioToggle?, displayToggle?, dangerAction? (with showConfirm/onRequestConfirm/onCancelConfirm), buttonClassName?`.
- **Depends on**: `@base-ui/react/menu`, `@base-ui/react/switch`, lucide, sibling `Button`.
- **Used by (1)**: `features/kana/hub/components/KanaHub.tsx`.
- **Responsibilities**: `Menu.CheckboxItem` rows with a purely visual `ToggleSwitch` (`role="switch"` semantics, `pointer-events-none`, lines 74–90); inline two-step danger confirmation without closing the menu (lines 169–233).

#### StatCard — `shared/components/ui/StatCard.tsx` ⬥client
- **Purpose** (docblock, lines 28–42): "Visual card for displaying key performance indicators or metrics."
- **Props** (lines 11–26): `icon (LucideIcon | ReactElement), title, value, trend?, color?, loading?, index?` (index staggers the entrance animation).
- **Depends on**: `m` from `motion/react` (m.div, line 59), lucide.
- **Used by (2)**: `app/[locale]/(main)/profile/page.tsx`, `features/home/components/HomePage.tsx`.

#### Textarea — `shared/components/ui/Textarea.tsx` ⬥client
- **Purpose** (docblock, lines 18–23): "Shared multi-line text field, styled to match Input's variants."
- **Props** (lines 13–16): extends `TextareaHTMLAttributes` + `variant? ("default"|"underline")`. `forwardRef`.
- **Depends on**: `cn`.
- **Used by (1)**: `features/flashcard/components/LessonBuilderMeta.tsx`.

#### UserAvatar — `shared/components/ui/UserAvatar.tsx` ⬦no-directive
- **Purpose** (docblock, lines 15–24): "Circular user profile image with activity status … falls back to a Trophy icon if no image."
- **Props** (lines 4–13): `src?, active, activeColor?, size?`.
- **Depends on**: lucide `Trophy`.
- **Used by (1)**: `app/[locale]/(main)/_components/BottomNav.tsx`.

#### UserMeta — `shared/components/ui/UserMeta.tsx` ⬥client
- **Purpose** (docblock, lines 38–49): "Displays user identity with an avatar and secondary metadata … automatically generates fallback initials."
- **Props** (lines 6–15): `name, avatar (string|null), subtitle?, className?`.
- **Depends on**: nothing beyond React (initials helper `getInitials`, lines 27–36).
- **Used by (3)**: `app/[locale]/(main)/settings/SettingsPageClient.tsx`, `features/flashcard/dashboard/components/DeckCard.tsx`, `features/flashcard/detail/components/DetailHeader.tsx`.

### 1.3 `layout/` — ScreenHeader module

#### ScreenHeader — `shared/components/layout/ScreenHeader.tsx` ⬥client
- **Exports** (observed): `ScreenHeader` (default + named, lines 109–137), `ScreenHeaderRow` (lines 56–99), `ScreenHeaderBackButton` (lines 33–54), `SCREEN_HEADER_BACK_BUTTON_CLASS` (line 16); internal (non-exported) `ScreenHeaderBackLink` (lines 19–31).
- **Purpose**: sticky top screen header bar. `ScreenHeader` = back control + centered truncating title + right slot; `ScreenHeaderRow` = free-form header row with optional `symmetricSidebars` 3-slot layout and a `"light" | "dark"` bar variant (lines 67–70); `ScreenHeaderBackButton` = ghost icon Button.
- **Depends on**: `Link` from `@/i18n/navigation`, shared `Button`, `cn`, lucide `ArrowLeft`.
- **Used by (14 importing files via `@/shared/components/layout`)**: `app/[locale]/(immersive)/kana/survival/_components/SurvivalDropScreen.tsx`, `SurvivalQuizScreen.tsx`, `SurvivalSetupScreen.tsx`, `app/[locale]/(main)/settings/SettingsPageClient.tsx`, `app/[locale]/(main)/profile/page.tsx`, `app/[locale]/(main)/notifications/page.tsx`, `features/flashcard/dashboard/components/FlashcardDashboard.tsx`, `features/flashcard/games/speed/components/SpeedPlaying.tsx`, `features/flashcard/games/match/components/MatchPlaying.tsx`, `features/kana/learn/components/KanaLearn.tsx`, `features/kana/chart/components/KanaChart.tsx`, `features/kana/quiz/components/QuizSetup.tsx`, `features/kana/quiz/components/QuizPlaying.tsx`, `features/kana/practice/components/PracticeHeader.tsx`.

---

## 2. Feature components — `features/*/`

Every `.tsx` component file per feature (tests/stories excluded). "Client" column: ✓ = contains `"use client"`; ✗ = no directive (see §5). "Used by" lists importer files (barrel `index.ts` re-exports omitted for brevity where a real consumer exists).

### 2.1 `features/admin/`

#### analytics/

| Component | File | Client | Purpose (from docblock/code) | Used by |
|---|---|---|---|---|
| AdminAnalyticsPageContent | `features/admin/components/analytics/AdminAnalyticsPageContent.tsx` | ✓ | Analytics page orchestrator; loads all charts via `next/dynamic` with `ssr: false` and `ChartSkeleton` loading placeholders (lines ~1–20) | `app/[locale]/(main)/admin/analytics/page.tsx` |
| AnalyticsDetailModal | `analytics/AnalyticsDetailModal.tsx` | ✓ | "Detailed Analytics Data Drilldown Modal" reusing shared `Modal` | AdminAnalyticsPageContent |
| AnalyticsExportModal | `analytics/AnalyticsExportModal.tsx` | ✓ | "Analytics & AI Dataset Export Configuration Modal" | AdminAnalyticsPageContent |
| ContentDistributionChart | `analytics/ContentDistributionChart.tsx` | ✓ | "Flashcard Content Distribution Pie Chart" | AdminAnalyticsPageContent (dynamic) |
| EngagementChart | `analytics/EngagementChart.tsx` | ✓ | "Feature Engagement Vertical Bar Chart" | AdminAnalyticsPageContent (dynamic) |
| ErrorTrendChart | `analytics/ErrorTrendChart.tsx` | ✓ | "System Error Trends Line Chart" (`stepAfter`) | AdminAnalyticsPageContent (dynamic) |
| LogLevelChart | `analytics/LogLevelChart.tsx` | ✓ | "Log Level Distribution — donut chart" | AdminAnalyticsPageContent (dynamic) |
| LogVolumeChart | `analytics/LogVolumeChart.tsx` | ✓ | "Log Volume Over Time — stacked bar chart" | AdminAnalyticsPageContent (dynamic) |
| RetentionChart | `analytics/RetentionChart.tsx` | ✓ | "User Retention Rate Area Chart" | AdminAnalyticsPageContent (dynamic) |
| TopActionsChart | `analytics/TopActionsChart.tsx` | ✓ | Top actions horizontal chart; per-action-prefix palette mapping (`colorForAction`) | AdminAnalyticsPageContent (dynamic) |

**AdminAnalyticsPageContent** (screen root): the page shell for `/admin/analytics`. Observed: charts (`GrowthChart`, `RoleChart`, `EngagementChart`, etc.) are wrapped in `next/dynamic(…, { ssr: false, loading: ChartSkeleton })` so each recharts chunk loads on demand (file comments cite E11-T2). It composes `AdminPageLayout`/`AdminPageHeader`/`AdminErrorState`, shared `Button`/`EmptyState`/`LoadingSpinner`, and the two modals.

#### content/

| Component | File | Client | Purpose | Used by |
|---|---|---|---|---|
| AdminContentPageContent | `content/AdminContentPageContent.tsx` | ✓ | "Global Content Moderation Page" — orchestrates deck auditing; delegates to ContentOverviewStats + DecksTable | `app/[locale]/(main)/admin/content/page.tsx` |
| ContentOverviewStats | `content/ContentOverviewStats.tsx` | ✓ | "High-level Content Statistics … strictly presentational" | AdminContentPageContent |
| DeckCardItem | `content/DeckCardItem.tsx` | ✓ | "Vocabulary Item Card for the Deck Preview" | DeckDetailsPanel |
| DeckDetailsPanel | `content/DeckDetailsPanel.tsx` | ✓ | "Slide-over Panel for Deck Content Preview" | AdminContentPageContent |
| DeckMobileRow | `content/DeckMobileRow.tsx` | ✓ | Mobile card layout for a deck row; `flexRender`s the actions column cell | DecksTable |
| DecksTable | `content/DecksTable.tsx` | ✓ | "Global Decks Administrative Table" on the shared `@tanstack/react-table` engine | AdminContentPageContent |

#### dashboard/

| Component | File | Client | Purpose | Used by |
|---|---|---|---|---|
| AdminOverviewPage | `dashboard/AdminOverviewPage.tsx` | ✓ | "Admin Operational Dashboard Overview" — metrics, activity feed, system health | `app/[locale]/(main)/admin/page.tsx` |
| GrowthChart | `dashboard/GrowthChart.tsx` | ✓ | "User Acquisition Growth Line Chart" (dual-axis) | AdminAnalyticsPageContent (dynamic) |
| QuickActionsCard | `dashboard/QuickActionsCard.tsx` | ✓ | "Administrative Quick Actions Card" | AdminOverviewPage |
| RoleChart | `dashboard/RoleChart.tsx` | ✓ | "Access Role Distribution Pie Chart" (donut) | AdminAnalyticsPageContent (dynamic) |
| SystemHealthCard | `dashboard/SystemHealthCard.tsx` | ✓ | "System Health Monitoring Card" | AdminOverviewPage |

Note (observed): `GrowthChart` and `RoleChart` live under `dashboard/` but their only current importer is `analytics/AdminAnalyticsPageContent.tsx`.

#### reports/

| Component | File | Client | Purpose | Used by |
|---|---|---|---|---|
| AdminReportsPageContent | `reports/AdminReportsPageContent.tsx` | ✓ | "Admin Reports & Audit Logs Page" — virtualized log stream, cursor pagination, filters, summary chips | `app/[locale]/(main)/admin/reports/page.tsx` |
| LogCopyButton | `reports/LogCopyButton.tsx` | ✓ | Clipboard-copy utility button with checkmark feedback | LogRow |
| LogLevelBadge | `reports/LogLevelBadge.tsx` | ✓ | "Log Severity Level Badge" | LogRow |
| LogMetadataViewer | `reports/LogMetadataViewer.tsx` | ✓ | "Structured metadata viewer for log entries" | LogRow |
| LogRow | `reports/LogRow.tsx` | ✓ | "Individual Log Entry Row" — expandable, severity-coded border | LogsVirtualList, AdminOverviewPage |
| LogSourceBadge | `reports/LogSourceBadge.tsx` | ✓ | "Displays the architectural source of the log event" (client/server) | LogRow |
| LogTypeBadge | `reports/LogTypeBadge.tsx` | ✓ | "Functional Log Type Badge" (Auth/Content/System) | LogRow |
| LogsFilters | `reports/LogsFilters.tsx` | ✓ | "Log Filtering Interface" — search, level, type, user, date range | AdminReportsPageContent |
| LogsSummaryHeader | `reports/LogsSummaryHeader.tsx` | ✓ | "Log Distribution Summary Header" — clickable severity chips | AdminReportsPageContent |
| LogsVirtualList | `reports/LogsVirtualList.tsx` | ✓ | Windowed log list via `@tanstack/react-virtual` with dynamic row measurement | AdminReportsPageContent |

**LogsVirtualList** (structurally significant): docblock (lines 1–8) states rows have variable height because `LogRow` expands on click, so it uses `measureElement` + ResizeObserver-driven dynamic sizing; the docblock also records that a prior implementation rendered all rows despite its name.

#### settings/

| Component | File | Client | Purpose | Used by |
|---|---|---|---|---|
| AdminSettingsPageContent | `settings/AdminSettingsPageContent.tsx` | ✓ | "Admin System Settings Page" — renders an explicit "not available" state; no backend wiring (docblock) | `app/[locale]/(main)/admin/settings/page.tsx` |

#### shared/ (admin-internal shared pieces)

| Component | File | Client | Purpose | Used by |
|---|---|---|---|---|
| AdminBulkActionsBar | `shared/AdminBulkActionsBar.tsx` | ✓ | "Standardized Bulk Actions Bar for Admin Tables" | UsersTableToolbar |
| AdminCard | `shared/AdminCard.tsx` | ✓ | "Standardized Admin Card with consistent header typography" | SystemHealthCard, QuickActionsCard |
| AdminChartContainer | `shared/AdminChartContainer.tsx` | ✓ | "Standardized Container for Admin Dashboards Charts" | all 9 chart components (RetentionChart, ErrorTrendChart, LogVolumeChart, RoleChart, GrowthChart, TopActionsChart, LogLevelChart, ContentDistributionChart, EngagementChart) |
| AdminDateRangeFilter | `shared/AdminDateRangeFilter.tsx` | ✓ | "Standardized Date Range Filter" — pair of DatePickers + reset | LogsFilters |
| AdminErrorState | `shared/AdminErrorState.tsx` | ✓ | "Admin Standard Error State" with optional retry | AdminContentPageContent, AdminAnalyticsPageContent, AdminUsersPageContent, AnalyticsDetailModal, AdminReportsPageContent |
| AdminGuard | `shared/AdminGuard.tsx` | ✓ | "Global Admin Route Guard" — client-side RBAC read from AdminContext | `app/[locale]/(main)/admin/layout.tsx` |
| AdminPageHeader | `shared/AdminPageHeader.tsx` | ✓ | Responsive admin page header | all five admin page-content components |
| AdminPageLayout | `shared/AdminPageLayout.tsx` | ✓ | Padding/spacing wrapper for all admin pages | all five admin page-content components |
| AdminSearchInput | `shared/AdminSearchInput.tsx` | ✓ | Thin wrapper around shared `Input` for admin search | AdminContentPageContent, LogsFilters, UsersTableToolbar |
| AdminSidebar | `shared/AdminSidebar.tsx` | ✓ | Admin navigation: fixed desktop sidebar + mobile top bar with a hand-rolled Base-UI Dialog drawer (lines 112–166) | `app/[locale]/(main)/admin/layout.tsx` |
| AdminStatCard | `shared/AdminStatCard.tsx` | ✓ | "Admin Statistical Summary Card" (KPIs + trend) | ContentOverviewStats, AnalyticsDetailModal |
| AdminTable | `shared/AdminTable.tsx` | ✓ | `<table>`-based shell composing AdminTableShell + the table element | DecksTable, UsersTable |
| AdminTableShell | `shared/AdminTableShell.tsx` | ✓ | Table-agnostic Card/toolbar/pagination chrome for admin data surfaces | AdminTable, AdminReportsPageContent |
| ChartSkeleton | `shared/ChartSkeleton.tsx` | ✗ | Placeholder for `next/dynamic` chart loading; mirrors AdminChartContainer's card shape | AdminAnalyticsPageContent |
| DataTableBody | `shared/DataTableBody.tsx` | ✓ | Shared desktop `<tbody>`; `colSpan` derived from visible leaf columns | DecksTable, UsersTable |
| DataTableHeader | `shared/DataTableHeader.tsx` | ✓ | Shared desktop `<thead>`; alignment via `columnDef.meta.align`; adds `aria-sort` | DecksTable, UsersTable |
| DataTableMobileList | `shared/DataTableMobileList.tsx` | ✓ | Shared mobile card-list body; per-table `renderRow` | DecksTable, UsersTable |

**AdminTable / AdminTableShell / DataTable\*** (structurally significant): the admin data-grid stack. `AdminTableShell` (docblock, lines 1–8) provides the Card container, toolbar, pagination, and mobile-list chrome; `AdminTable` composes it with an actual `<table>`; `DataTableHeader`/`DataTableBody`/`DataTableMobileList` are the shared TanStack-table-driven internals used by both `UsersTable` and `DecksTable`. Reports reuses `AdminTableShell` directly for its non-`<table>` virtualized list (AdminTableShell docblock).

**AdminGuard**: reads `useAdminRole()` from AdminContext (AdminGuard.tsx:8, 26) and gates all `/admin` routes from `app/[locale]/(main)/admin/layout.tsx:17`; its docblock (lines 1–9) records that it deliberately does not re-verify the token because `AdminProvider` is mounted once at the app root.

#### users/

| Component | File | Client | Purpose | Used by |
|---|---|---|---|---|
| ActionsCell | `users/ActionsCell.tsx` | ✓ | "User Row Actions Table Cell" (promote/demote/delete; superadmin-protected) | `features/admin/hooks/useUsersTableColumns.tsx` |
| AdminUsersPageContent | `users/AdminUsersPageContent.tsx` | ✓ | "Admin Users Management Page" — fetching, role checks, pagination | `app/[locale]/(main)/admin/users/page.tsx` |
| RoleCell | `users/RoleCell.tsx` | ✓ | "User Role & Status Table Cell" | useUsersTableColumns, UserMobileRow |
| UserCell | `users/UserCell.tsx` | ✓ | "User Identity Table Cell" (avatar + profile info) | useUsersTableColumns |
| UserIdentityAvatar | `users/UserIdentityAvatar.tsx` | ✓ | Avatar + presence dot at two sizes (10/11) | UserCell, UserMobileRow |
| UserMobileRow | `users/UserMobileRow.tsx` | ✓ | Mobile card layout for a user row; `flexRender`s the actions cell | UsersTable |
| UsersActionConfirmModal | `users/UsersActionConfirmModal.tsx` | ✓ | "Specialized Confirmation Modal for User Management" (bulk + individual) | UsersTable |
| UsersTable | `users/UsersTable.tsx` | ✓ | "Administrative Users Management Table Orchestrator" | AdminUsersPageContent |
| UsersTablePagination | `users/UsersTablePagination.tsx` | ✓ | Pagination with "…" truncation | UsersTable |
| UsersTableToolbar | `users/UsersTableToolbar.tsx` | ✓ | Toolbar toggling search vs. bulk actions on selection | UsersTable |

Also containing JSX (hooks, not components, noted for completeness): `features/admin/hooks/useUsersTableColumns.tsx` (column defs for Users table) and `features/admin/hooks/useDecksTableColumns.tsx` (display-only column defs for Content table), both ⬥client.

Barrel: `features/admin/components/index.ts` exports `AdminAnalyticsPageContent`, `AdminOverviewPage`, `AdminReportsPageContent`, `AdminSettingsPageContent`, `AdminGuard`, `AdminSidebar`, `AdminUsersPageContent` (observed, lines 1–7).

### 2.2 `features/command-palette/`

| Component | File | Client | Purpose | Used by |
|---|---|---|---|---|
| CommandPalette | `components/CommandPalette.tsx` | ✓ | cmdk-based palette; positioned on the same Base UI Dialog primitive as `Modal.tsx` (file comment, line 53); rows fuzzy-match localized labels + per-action keyword messages; reads `useAdminRole()` (line 59) to gate admin actions | CommandPaletteLauncher |
| CommandPaletteLauncher | `components/CommandPaletteLauncher.tsx` | ✓ | Always-mounted ⌘K/Ctrl+K listener; dynamically imports the cmdk UI on first keypress, then keeps it mounted (`hasOpened` latch, docblock lines 1–6) | `lib/providers.tsx:91` (mounted globally inside `Providers`) |

### 2.3 `features/flashcard/`

#### components/ (core study/builder/comments/share)

| Component | File | Client | Purpose | Used by |
|---|---|---|---|---|
| AIBulkPanel | `components/AIBulkPanel.tsx` | ✓ | AI bulk card-generation panel (JLPT level/count/topic pickers feeding the import preview) | LessonBuilderImportPane |
| CommentInput | `components/CommentInput.tsx` | ✓ | "Reusable text entry component for comments and replies" (auto-expanding, keyboard shortcuts) | CommentItem, CommentPanel |
| CommentItem | `components/CommentItem.tsx` | ✓ | "Primitive UI component for a single comment message" (actions, permission checks) | CommentThread |
| CommentPanel | `components/CommentPanel.tsx` | ✓ | "Flashcard Commenting Hub" — Firebase subscription lifecycle, nested CRUD, scroll management | DetailCommentsPanel |
| CommentThread | `components/CommentThread.tsx` | ✓ | Top-level comment + flat replies ("Google Docs style" 2-level limit) | CommentPanel |
| DraggableCard | `components/DraggableCard.tsx` | ✓ | Sortable lesson-builder card row; dedicated grip handle drives drag | LessonBuilderCardList |
| FlashcardAudioButton | `components/FlashcardAudioButton.tsx` | ✓ | Circular audio-replay button on a card face; shared by the three study modes (docblock) | FlashcardLearn, FlashcardPractice, FlashcardMistakeReview |
| FlashcardLearn | `components/FlashcardLearn.tsx` | ✓ | "Recall-based introduction mode" — front face, then reveal + SM-2 grade buttons | StudySession |
| FlashcardMistakeReview | `components/FlashcardMistakeReview.tsx` | ✓ | "High-intensity recovery mode" with AI memory tips | StudySession |
| FlashcardPractice | `components/FlashcardPractice.tsx` | ✓ | "Core SRS-integrated study mode" — switches recognition (MC) vs. recall (flip) | StudySession |
| GradeButtons | `components/GradeButtons.tsx` | ✓ | Four-button SM-2 grade row (Again/Hard/Good/Easy), shared by the three modes | FlashcardLearn, FlashcardPractice, FlashcardMistakeReview |
| ImportDropzone | `components/ImportDropzone.tsx` | ✓ | `react-dropzone` file area accepting images/CSV/TXT for lesson import (lines 5, 34–40) | LessonBuilderImportPane |
| ImportPasteArea | `components/ImportPasteArea.tsx` | ✓ | Paste-in text area panel for the import flow | LessonBuilderImportPane |
| ImportPreview | `components/ImportPreview.tsx` | ✗ | "Staging UI for validating and correcting batch-imported flashcard data" (CSV/Paste/AI) | AIBulkPanel, LessonBuilderImportPane, `hooks/useLessonBuilder.ts` |
| LessonBuilder | `components/LessonBuilder.tsx` | ✓ | Full-screen lesson create/edit surface; composes Meta + ImportPane + CardList over `useLessonBuilder` (lines 9–41) | `app/[locale]/(main)/flashcard/create/page.tsx`, `flashcard/[id]/edit/page.tsx` |
| LessonBuilderCardList | `components/LessonBuilderCardList.tsx` | ✓ | Sortable card list section of the builder | LessonBuilder |
| LessonBuilderImportPane | `components/LessonBuilderImportPane.tsx` | ✓ | Import pane switching between dropzone/paste/AI modes | LessonBuilder |
| LessonBuilderMeta | `components/LessonBuilderMeta.tsx` | ✓ | Lesson metadata form (title/description etc., react-hook-form `register` prop) | LessonBuilder |
| McChoiceGrid | `components/McChoiceGrid.tsx` | ✓ | Four-option multiple-choice grid shared by Practice + MistakeReview | FlashcardPractice, FlashcardMistakeReview |
| ShareCollaboratorsPanel | `components/ShareCollaboratorsPanel.tsx` | ✓ | Collaborator list/roles + invite input inside the share modal (roles viewer/commenter/editor, lines 1–2) | ShareModal |
| ShareModal | `components/ShareModal.tsx` | ✓ | "Collaborative Access Controller" — public access modes, email invites, role lifecycle | `app/[locale]/(main)/flashcard/[id]/page.tsx`, `shared/[shareId]/SharedLessonPageClient.tsx`, HomePage, FlashcardDashboard |
| SharePrivacyPicker | `components/SharePrivacyPicker.tsx` | ✓ | "General access" section — privacy mode dropdown + default public role (capped at commenter) | ShareModal |
| StudyProgressHeader | `components/StudyProgressHeader.tsx` | ✓ | Session progress header (current/total, colored progress bar) | FlashcardLearn, FlashcardPractice, FlashcardMistakeReview |
| StudySummaryScreen | `components/StudySummaryScreen.tsx` | ✓ | End-of-session summary (stats, XP, continue) | FlashcardLearn, FlashcardPractice, FlashcardMistakeReview |

**FlashcardLearn / FlashcardPractice / FlashcardMistakeReview** (screen roots within a session): the three study modes selected by `StudySession`; all three share `FlashcardAudioButton`, `GradeButtons`, `StudyProgressHeader`, and `StudySummaryScreen` (each of those four docblocks states it was extracted from previously hand-rolled copies).

**ShareModal** (multi-consumer): mounted from four places (deck detail, shared-lesson page, home page, dashboard). Composes `SharePrivacyPicker` and `ShareCollaboratorsPanel`; the docblock (lines 28–35) describes the three public-access modes and RBAC invite flow.

#### dashboard/components/

| Component | File | Client | Purpose | Used by |
|---|---|---|---|---|
| DashboardEmpty | `dashboard/components/DashboardEmpty.tsx` | ✗ | Per-tab empty state with CTA | FlashcardDashboard |
| DashboardError | `dashboard/components/DashboardError.tsx` | ✗ | Error state for dashboard | FlashcardDashboard |
| DashboardLoading | `dashboard/components/DashboardLoading.tsx` | ✗ | Loading skeleton for dashboard | FlashcardDashboard |
| DashboardTabs | `dashboard/components/DashboardTabs.tsx` | ✗ | Tab switcher for personal/shared/discover decks | FlashcardDashboard |
| DeckCard | `dashboard/components/DeckCard.tsx` | ✗ | Individual deck entry — metadata, high-score badges, Study/Speed/Match entry points | SortableDeckCard, HomePage |
| FlashcardDashboard | `dashboard/components/FlashcardDashboard.tsx` | ✓ (directive at line 11, after docblock) | "Central hub for flashcard management" — deck lifecycle across tabs, gamification sync, share flow | `app/[locale]/(main)/flashcard/page.tsx` |
| SortableDeckCard | `dashboard/components/SortableDeckCard.tsx` | ✗ | @dnd-kit draggable wrapper around DeckCard for reordering | FlashcardDashboard |

**FlashcardDashboard** (screen root): orchestrates deck tabs, drag-reorder (via `SortableDeckCard`), `ConfirmModal` deletion, and `ShareModal`; consumes `ScreenHeader`. None of the dashboard files carry `"use client"`; all are reached from `app/[locale]/(main)/flashcard/page.tsx`, which does (**Inferred**: they execute as client components via their client importer).

#### detail/components/

| Component | File | Client | Purpose | Used by |
|---|---|---|---|---|
| ActionRow | `detail/components/ActionRow.tsx` | ✓ | Icon-circle + title/subtitle action row primitive | DetailActionsPanel |
| CardCommentBadge | `detail/components/CardCommentBadge.tsx` | ✓ | Per-card comment count badge; fetches its own metadata to avoid list re-renders | SortableCardItem |
| DetailActionsPanel | `detail/components/DetailActionsPanel.tsx` | ✓ | Left panel — role-dependent owner/shared-user actions | FlashcardDetailLayout |
| DetailCardsPanel | `detail/components/DetailCardsPanel.tsx` | ✓ | Center panel — dnd-kit card grid with fractional-index reordering | FlashcardDetailLayout |
| DetailCommentsPanel | `detail/components/DetailCommentsPanel.tsx` | ✓ | Right panel — sticky comment column wrapping CommentPanel | FlashcardDetailLayout |
| DetailHeader | `detail/components/DetailHeader.tsx` | ✓ | Hero header — deck metadata, creator (UserMeta), tags, primary actions | FlashcardDetailLayout |
| FlashcardDetailLayout | `detail/components/FlashcardDetailLayout.tsx` | ✓ | "Deck Detail View Orchestrator" — three-zone interface (Actions/Preview/Comments) | `app/[locale]/(main)/flashcard/[id]/page.tsx`, `shared/[shareId]/SharedLessonPageClient.tsx` |
| SortableCardItem | `detail/components/SortableCardItem.tsx` | ✓ | dnd-kit sortable card cell preserving text selection | DetailCardsPanel |

#### games/match/components/

| Component | File | Client | Purpose | Used by |
|---|---|---|---|---|
| MatchCard | `games/match/components/MatchCard.tsx` | ✓ | Single match tile; dynamic font sizing by label length; surface states default/selected/matched/error | MatchGrid |
| MatchGame | `games/match/components/MatchGame.tsx` | ✓ | "Feature Root Component" — orchestrates match lifecycle, composes phase views | `app/[locale]/(immersive)/flashcard/[id]/match/page.tsx`, `shared/[shareId]/match/page.tsx` |
| MatchGrid | `games/match/components/MatchGrid.tsx` | ✓ | Tile grid bound to `useMatchGameStore` | MatchPlaying |
| MatchIntro | `games/match/components/MatchIntro.tsx` | ✓ | Intro screen (wraps GameIntroScreen) | MatchGame |
| MatchPlaying | `games/match/components/MatchPlaying.tsx` | ✓ | Play HUD + grid (LivesDisplay, MiniLeaderboard, ScreenHeaderRow) | MatchGame |
| MatchResults | `games/match/components/MatchResults.tsx` | ✓ | Results screen (wraps GameResultsScreen) | MatchGame |

#### games/speed/components/

| Component | File | Client | Purpose | Used by |
|---|---|---|---|---|
| SpeedConstraintError | `games/speed/components/SpeedConstraintError.tsx` | ✓ | Minimum-card-requirement screen (<4 cards) | both speed pages (`[id]` and `shared/[shareId]`) |
| SpeedGame | `games/speed/components/SpeedGame.tsx` | ✓ | "Feature Root Component" — speed quiz lifecycle on the GameEngine architecture; personal + shared decks | both speed pages |
| SpeedIntro | `games/speed/components/SpeedIntro.tsx` | ✓ | Intro screen (wraps GameIntroScreen) | SpeedGame |
| SpeedPlaying | `games/speed/components/SpeedPlaying.tsx` | ✓ | Active gameplay screen (HUD, MiniLeaderboard, ScreenHeaderRow) | SpeedGame |
| SpeedResults | `games/speed/components/SpeedResults.tsx` | ✓ | Results screen (wraps GameResultsScreen) | SpeedGame |

#### games/study/components/

| Component | File | Client | Purpose | Used by |
|---|---|---|---|---|
| ModeButton | `games/study/components/ModeButton.tsx` | ✓ | Study-mode selection button | StudyModeSelector |
| StudyModeSelector | `games/study/components/StudyModeSelector.tsx` | ✓ | Mode selection screen; deck status; recommends optimal mode from SRS state | StudySession |
| StudySession | `games/study/components/StudySession.tsx` | ✓ | "Pure phase-router — delegates all session state, grading, and completion logging to useStudySession" | `app/[locale]/(immersive)/flashcard/[id]/study/page.tsx`, `shared/[shareId]/study/page.tsx` |

### 2.4 `features/game/` (shared game primitives)

| Component | File | Client | Purpose | Used by |
|---|---|---|---|---|
| GameIntroScreen | `components/GameIntroScreen.tsx` | ✓ | Reusable intro/setup screen (icon, title, best score, start; optional children) | SpeedIntro, MatchIntro |
| GameResultsScreen | `components/GameResultsScreen.tsx` | ✓ | Reusable results screen (confetti, score, tier badge, stats, actions) | MatchResults, SpeedResults |
| Leaderboard | `components/Leaderboard.tsx` | ✓ | Full leaderboard with medals + loading skeleton | SurvivalGameOverScreen, SurvivalSetupScreen, GameResultsScreen |
| LivesDisplay | `components/LivesDisplay.tsx` | ✓ | Hearts/lives row | SurvivalQuizScreen, SurvivalDropScreen, MatchPlaying |
| MiniLeaderboard | `components/MiniLeaderboard.tsx` | ✓ | Compact in-game leaderboard strip | SurvivalDropScreen, SurvivalQuizScreen, MatchPlaying, SpeedPlaying |
| StatGrid | `components/StatGrid.tsx` | ✓ (directive at line 12) | "Colored value + uppercase label" stat tile grid; densities default/compact/large | StudySummaryScreen, StudyModeSelector, GameResultsScreen |
| StreakHud | `components/StreakHud.tsx` | ✓ | Exports `GameStreakScoreStack` (default), `StreakComboBadge`, `gameQuizStreakColumnClassName` — right HUD: timer → streak → score | via barrel `features/game/components/index.ts:4` (`GameStreakScoreStack` used by SurvivalDropScreen, SurvivalQuizScreen) |
| TierBadge | `components/TierBadge.tsx` | ✗ | Emoji + themed background tier indicator by score | DeckCard |

### 2.5 `features/home/`

| Component | File | Client | Purpose | Used by |
|---|---|---|---|---|
| HomePage | `components/HomePage.tsx` | ✓ | Home screen root — "Continue Studying" tile config, ActionCards, StatCards, deck previews (DeckCard), ShareModal + ConfirmModal wiring | `app/[locale]/(main)/page.tsx` |

### 2.6 `features/kana/`

#### chart/components/

| Component | File | Client | Purpose | Used by |
|---|---|---|---|---|
| ChartBlockGrid | `chart/components/ChartBlockGrid.tsx` | ✓ | Grid for one chart block (Basic/Dakuten…) — headers + kana rows | ChartSection, KanaChart |
| ChartCell | `chart/components/ChartCell.tsx` | ✓ | Single kana cell — romaji toggle, learned styling, audio on click | ChartBlockGrid |
| ChartSection | `chart/components/ChartSection.tsx` | ✓ | Titled section showing one or both alphabets side by side | KanaChart |
| KanaChart | `chart/components/KanaChart.tsx` | ✓ | Chart screen root — romaji toggle, alphabet switching (reads `useKanaStore`), learned state | `app/[locale]/(main)/kana/chart/page.tsx` |

#### components/ (kana-wide shared)

| Component | File | Client | Purpose | Used by |
|---|---|---|---|---|
| AlphabetSwitcher | `components/AlphabetSwitcher.tsx` | ✓ | Hiragana/Katakana/Both selector buttons | KanaHub |
| AnswerFeedback | `components/AnswerFeedback.tsx` | ✓ | Correct/incorrect feedback banner with replay-audio hook | SurvivalQuizScreen, QuizPlaying |
| DrawingCanvas | `components/DrawingCanvas.tsx` | ✓ | Canvas for handwriting practice with optional guide + clear-on-`stepKey` | PracticeCanvasArea |
| KanaAudioButton | `components/KanaAudioButton.tsx` | ✓ | Circular play-audio icon button shared by learn/quiz/practice (docblock) | QuizPlaying, PracticeCanvasArea, LearnCard |
| KanaMCOptionsGrid | `components/KanaMCOptionsGrid.tsx` | ✗ | Multiple-choice romaji grid shared by Quiz and Survival | SurvivalQuizScreen, QuizPlaying |
| KanaStrokeAnimation | `components/KanaStrokeAnimation.tsx` | ✓ | Animated stroke-order SVG; also exports `fetchKanaSvg` helper | LearnCard, DrawingCanvas, PracticeCanvasArea |

#### hub/, learn/, practice/, quiz/

| Component | File | Client | Purpose | Used by |
|---|---|---|---|---|
| KanaHub | `hub/components/KanaHub.tsx` | ✓ | Kana hub screen — mode navigation + progress; uses ActionCard, SettingsMenu, AlphabetSwitcher | `app/[locale]/(main)/kana/page.tsx` |
| KanaLearn | `learn/components/KanaLearn.tsx` | ✓ | Learn screen root — navigation, progress, character cards | `app/[locale]/(main)/kana/learn/page.tsx` |
| LearnCard | `learn/components/LearnCard.tsx` | ✓ | Character card with stroke animation / static display + audio | KanaLearn |
| LearnProgress | `learn/components/LearnProgress.tsx` | ✓ | Position indicator + sequential/random mode toggle | KanaLearn |
| KanaPractice | `practice/components/KanaPractice.tsx` | ✓ | Practice screen root — navigation, mode switching, canvas display | `app/[locale]/(immersive)/kana/practice/page.tsx` |
| PracticeCanvasArea | `practice/components/PracticeCanvasArea.tsx` | ✓ | Reference (or "???" in recall mode) + DrawingCanvas + audio | KanaPractice |
| PracticeHeader | `practice/components/PracticeHeader.tsx` | ✓ | Header with mode/random toggles (uses ScreenHeader) | KanaPractice |
| KanaQuiz | `quiz/components/KanaQuiz.tsx` | ✓ | Quiz root — phases setup/playing/done | `app/[locale]/(immersive)/kana/quiz/page.tsx` |
| QuizPlaying | `quiz/components/QuizPlaying.tsx` | ✓ | Active quiz — MC and typing modes, progress, streak, feedback | KanaQuiz |
| QuizResults | `quiz/components/QuizResults.tsx` | ✓ | Final score + play again / change mode | KanaQuiz |
| QuizSetup | `quiz/components/QuizSetup.tsx` | ✓ | Mode selection (Multiple Choice / Type Romaji / Smart Review) via ModeSelectionCard | KanaQuiz |

### 2.7 `features/notifications/`

| Component | File | Client | Purpose | Used by |
|---|---|---|---|---|
| InviteActions | `components/InviteActions.tsx` | ✓ | Accept/Decline buttons for invite notifications | NotificationRow |
| NotificationIcon | `components/NotificationIcon.tsx` | ✗ | Type→icon circle mapping (invite/comment/share/system…) | NotificationRow |
| NotificationRow | `components/NotificationRow.tsx` | ✓ | Single notification row incl. collapsed actor avatar stack (`CollapsedActors`) | `app/[locale]/(main)/notifications/_components/NotificationsVirtualList.tsx` |

`features/notifications/context/NotificationsContext.tsx` is a provider, documented in `07-Provider-Inventory.md`.

---

## 3. App-level components

### 3.1 `app/_components/`

| Component | File | Client | Purpose | Used by |
|---|---|---|---|---|
| ErrorFallback | `app/_components/ErrorFallback.tsx` | ✗ | Shared visual for every error boundary. Deliberately uses plain `<a>`/`<button>` and props-passed copy so it renders with no providers/router (docblock, lines 12–24) | `app/global-error.tsx`, `app/[locale]/(main)/error.tsx`, `app/[locale]/(immersive)/error.tsx`, `app/[locale]/login/error.tsx` |
| MaintenanceScreen | `app/_components/MaintenanceScreen.tsx` | ✗ | Full-page maintenance notice rendered by the root layout when the `maintenance_mode` Remote Config flag is on; translates via next-intl (docblock, lines 5–11) | `app/[locale]/layout.tsx:58` |
| ReactScan | `app/_components/ReactScan.tsx` | ✓ | Development-only: dynamically imports `react-scan` and enables scanning; renders null | `app/[locale]/layout.tsx:56` |

### 3.2 Route-segment `_components/`

| Component | File | Client | Purpose | Used by |
|---|---|---|---|---|
| BottomNav | `app/[locale]/(main)/_components/BottomNav.tsx` | ✓ | App-wide bottom navigation for the `(main)` group: routes home/kana/decks/alerts/(admin)/profile; unread badge from `useNotifications()` (line 111), admin item gated by `useAdminRole()` (line 112), avatar via `UserAvatar` + `useAppStore` | `app/[locale]/(main)/layout.tsx:1,11` |
| NotificationsVirtualList | `app/[locale]/(main)/notifications/_components/NotificationsVirtualList.tsx` | ✓ | Windowed, time-grouped inbox list via `useWindowVirtualizer` (page-scroll, variable-height rows — docblock lines 18–30) | `app/[locale]/(main)/notifications/page.tsx` |
| SkeletonRows / NotificationsEmptyState | `app/[locale]/(main)/notifications/_components/NotificationsPlaceholders.tsx` | ✗ | Loading skeleton rows and per-filter empty states for the notifications page (named exports, lines 5, 26) | `app/[locale]/(main)/notifications/page.tsx:24` (sole importer) |
| SurvivalSetupScreen | `app/[locale]/(immersive)/kana/survival/_components/SurvivalSetupScreen.tsx` | ✓ | Survival setup screen — mode pick (Infinity/Time Attack/Drop), best scores, Leaderboard | `…/kana/survival/page.tsx` |
| SurvivalQuizScreen | `…/SurvivalQuizScreen.tsx` | ✓ | Playing screen for Infinity/Time Attack (multiple-choice romaji): MiniLeaderboard, LivesDisplay, AnswerFeedback, KanaMCOptionsGrid | `…/kana/survival/page.tsx` |
| SurvivalDropScreen | `…/SurvivalDropScreen.tsx` | ✓ | Playing screen for the Drop mode (typing falling characters); key handling on the container | `…/kana/survival/page.tsx` |
| SurvivalGameOverScreen | `…/SurvivalGameOverScreen.tsx` | ✓ | Game-over screen with final score + Leaderboard | `…/kana/survival/page.tsx` |

All four survival screens receive the whole game object as `game: ReturnType<typeof useSurvivalGame>` (observed in each props interface).

### 3.3 Error boundaries and top-level special files

| File | Client | Purpose |
|---|---|---|
| `app/global-error.tsx` | ✓ | Root boundary; renders its own `<html>/<body>` and English-only `ErrorFallback` because it replaces the root layout (docblock lines 14–18, comment lines 33–38) |
| `app/[locale]/(main)/error.tsx` | ✓ | `(main)` segment boundary → localized `ErrorFallback`; logs + `Sentry.captureException` |
| `app/[locale]/(immersive)/error.tsx` | ✓ | `(immersive)` segment boundary → localized `ErrorFallback`; Sentry capture |
| `app/[locale]/login/error.tsx` | ✓ | login segment boundary → `ErrorFallback` |
| `app/[locale]/not-found.tsx` | ✗ | Localized 404 page (Ghost icon, home link) |
| `app/[locale]/layout.tsx` | ✗ (server) | Root locale layout: fonts, metadata, `ReactScan`, `NextIntlClientProvider`, maintenance gate, `Providers` (lines 53–65) |
| `app/[locale]/(main)/layout.tsx` | ✗ (server) | Renders children + `BottomNav`; comment records AdminProvider intentionally not mounted here (lines 3–6) |
| `app/[locale]/(immersive)/layout.tsx` | ✗ (server) | Pass-through fragment layout (whole file is 3 lines) |
| `app/[locale]/(main)/admin/layout.tsx` | ✗ (server) | Wraps admin routes in `AdminGuard` + `AdminSidebar` (lines 15–27) |

---

## 4. Cross-cutting observations

- **Dialog stack**: every overlay (Modal, ConfirmModal, DeckDetailsPanel, AdminSidebar's mobile drawer, ShareModal, CommandPalette) is built on `@base-ui/react` Dialog primitives and now shares one backdrop source, `DialogChrome.tsx`'s `DIALOG_BACKDROP_CLASSNAME` (T-110a) — Tier 1 (Modal, ConfirmModal) also shares its close button; Tier 2 (the rest) keeps bespoke close-affordance styling. `Drawer`, a zero-consumer Tier-1 candidate, was removed rather than adopted (T-110b).
- **Animation**: components rendering `m.*` elements (`Button`, `StatCard`, `LessonBuilder`, others) rely on the single `LazyMotion` mount in `lib/providers.tsx:78` (see `07-Provider-Inventory.md`).
- **Admin chart loading**: all recharts-based charts are loaded via `next/dynamic` with `ssr: false` from `AdminAnalyticsPageContent.tsx` with `ChartSkeleton` placeholders (observed in file).
- **Two virtualized lists** exist: `LogsVirtualList` (fixed-height inner scroller) and `NotificationsVirtualList` (`useWindowVirtualizer`, window-scroll) — the difference is documented in NotificationsVirtualList's docblock (lines 23–28).

## 5. `"use client"` directive summary

Files under `shared/components/`, `features/`, and `app/` **without** the directive anywhere in the file (observed via `grep -L`-equivalent set difference; server pages/layouts omitted — listed in §3.3):

- `shared/components/ui/`: `ActionCard.tsx`, `Alert.tsx`, `Badge.tsx`, `EmptyState.tsx`, `NotFoundScreen.tsx`, `SettingsMenu.tsx`, `UserAvatar.tsx`
- `features/`: `admin/components/shared/ChartSkeleton.tsx`, `flashcard/components/ImportPreview.tsx`, `flashcard/dashboard/components/{DashboardEmpty,DashboardError,DashboardLoading,DashboardTabs,DeckCard,SortableDeckCard}.tsx`, `game/components/TierBadge.tsx`, `kana/components/KanaMCOptionsGrid.tsx`, `notifications/components/NotificationIcon.tsx`
- `app/`: `_components/ErrorFallback.tsx`, `_components/MaintenanceScreen.tsx`, `[locale]/(main)/notifications/_components/NotificationsPlaceholders.tsx`

Placement note: several files carry the directive **after** a leading docblock rather than on line 1 (e.g. `flashcard/dashboard/components/FlashcardDashboard.tsx:11`, most `features/flashcard/components/*` and `features/kana/*/components/*` files) — a first-line check under-reports the directive; the list above is based on whole-file search.

**Inferred**: every directive-less component above is currently only imported by client components (per the used-by lists), so all execute in the client bundle — except `MaintenanceScreen` (rendered directly by the server `app/[locale]/layout.tsx`; next-intl's `useTranslations` is callable in server components) and `ErrorFallback` (its four importers are all `"use client"` error boundaries). No case was found where the same directive-less component is imported from both a server and a client context, other than `MaintenanceScreen`.

## Uncertainties

- Usage counts are import-based; dynamic `import()` consumers are counted where grep matched the module path (`AdminAnalyticsPageContent`'s chart imports, `CommandPaletteLauncher`'s cmdk import). Any consumer constructing paths dynamically at runtime would be missed — none were observed.
- The Button consumer count (84) includes every file whose import statement names `Button` and resolves to `shared/components/ui`; multi-line import statements would evade the line-based grep, but spot-checks found all imports in this codebase are single-line.
- `features/admin/hooks/useDecksTableColumns.tsx` / `useUsersTableColumns.tsx` are hooks that return JSX cell renderers; they are inventoried under §2.1 users/ as hooks, not components.
