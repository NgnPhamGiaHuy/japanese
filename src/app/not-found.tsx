import Link from "next/link";

import { ArrowLeft, Ghost } from "lucide-react";

export default function NotFoundPage() {
    return (
        <div className="flex min-h-dvh flex-col items-center justify-center bg-bg p-6 text-center">
            <div className="rounded-6xl mb-8 flex h-32 w-32 -rotate-6 transform items-center justify-center border-b-8 border-gray-300 bg-gray-200 text-muted shadow-sm">
                <Ghost size={64} strokeWidth={2.5} />
            </div>

            <h1 className="mb-4 text-4xl font-black text-text">You&apos;re Lost!</h1>
            <p className="mb-12 text-lg font-bold text-muted">
                The page you are looking for has vanished into thin air.
            </p>

            <Link
                href="/"
                className="flex items-center gap-2 rounded-2xl border-b-4 border-katakana-strong bg-katakana px-8 py-4 text-lg font-black text-white transition-all hover:-translate-y-1 hover:bg-katakana-hover hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-katakana focus-visible:ring-offset-2 active:translate-y-[4px] active:border-b-0"
            >
                <ArrowLeft size={24} strokeWidth={3} />
                Go Back Home
            </Link>
        </div>
    );
}
