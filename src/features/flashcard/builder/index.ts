/**
 * Builder Feature — Public API (ADR-104's "import + AI" sub-module)
 *
 * @remarks
 * Named for its most prominent, longest-standing component (`LessonBuilder`),
 * not the ADR's own "import/AI" phrasing — that phrase describes two of the
 * builder's internal tabs (paste/upload import, AI generation), not the
 * whole sub-module: `DraggableCard` (card editing) and `LessonBuilderMeta`
 * (title/description/theme) are neither import nor AI. T-104a.
 */

export { default as LessonBuilder } from "./components/LessonBuilder";
