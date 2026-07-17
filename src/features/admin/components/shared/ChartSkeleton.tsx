/**
 * Placeholder shown by next/dynamic while a recharts-backed chart's chunk
 * loads (E11-T2) — mirrors AdminChartContainer's card shape so there's no
 * layout shift when the real chart replaces it.
 */
const ChartSkeleton = () => (
    <div className="animate-pulse rounded-3xl border-2 border-b-4 border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 h-3 w-32 rounded-full bg-gray-100" />
        <div className="h-[280px] w-full rounded-2xl bg-gray-50" />
    </div>
);

export default ChartSkeleton;
