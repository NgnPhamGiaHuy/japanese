import { AlertTriangle, RotateCcw } from "lucide-react";

interface ErrorFallbackProps {
    title?: string;
    /** Full sentence, already naming what crashed. */
    message?: string;
    retryLabel?: string;
    homeLabel?: string;
    reset: () => void;
}

/**
 * Shared visual for every error boundary (segment-level error.tsx files and
 * the root global-error.tsx). Uses plain <a>/<button> markup rather than
 * next/link or the shared design-system primitives — global-error.tsx can
 * fire when the root layout itself has crashed, so this must render safely
 * with no dependency on app providers or router context.
 *
 * Copy arrives as props rather than via useTranslations() for that same
 * reason: global-error.tsx renders outside NextIntlClientProvider, so calling
 * a translation hook here would throw inside the last boundary standing and
 * blank the page. Callers under the provider (the segment error.tsx files)
 * pass localized strings in; the English defaults below are global-error's.
 */
export default function ErrorFallback({
    title = "Something Went Wrong",
    message = "An unexpected error occurred while loading this screen. You can try again, or head back home.",
    retryLabel = "Try Again",
    homeLabel = "Go Home",
    reset,
}: ErrorFallbackProps) {
    return (
        <div className="bg-bg flex min-h-dvh flex-col items-center justify-center p-6 text-center">
            <div className="rounded-6xl text-danger-strong mb-8 flex h-32 w-32 -rotate-6 transform items-center justify-center border-b-8 border-red-300 bg-red-100 shadow-sm">
                <AlertTriangle size={64} strokeWidth={2.5} />
            </div>

            <h1 className="text-text mb-4 text-4xl font-black">{title}</h1>
            <p className="text-muted mb-12 text-lg font-bold">{message}</p>

            <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                    type="button"
                    onClick={reset}
                    className="border-katakana-strong bg-katakana hover:bg-katakana-hover focus-visible:ring-katakana flex items-center gap-2 rounded-2xl border-b-4 px-8 py-4 text-lg font-black text-white transition-all hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-[4px] active:border-b-0"
                >
                    <RotateCcw size={24} strokeWidth={3} />
                    {retryLabel}
                </button>
                {/*
                  eslint-disable-next-line @next/next/no-html-link-for-pages -- deliberate: this
                  component is shared with global-error.tsx, which can render when the root
                  layout itself has crashed. A plain <a> is the Next.js-documented-safe recovery
                  link there (no dependency on router/Link context); using it uniformly keeps
                  this one component correct in every boundary it backs.
                */}
                <a
                    href="/"
                    className="text-text flex items-center gap-2 rounded-2xl border-b-4 border-gray-300 bg-gray-200 px-8 py-4 text-lg font-black transition-all hover:-translate-y-1 hover:bg-gray-300 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 active:translate-y-[4px] active:border-b-0"
                >
                    {homeLabel}
                </a>
            </div>
        </div>
    );
}
