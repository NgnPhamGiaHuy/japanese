import { ArrowLeft, Ghost } from "lucide-react";

import { Link } from "@/i18n/navigation";

export default function NotFoundPage() {
    return (
        <div className="bg-bg flex min-h-dvh flex-col items-center justify-center p-6 text-center">
            <div className="rounded-6xl text-muted mb-8 flex h-32 w-32 -rotate-6 transform items-center justify-center border-b-8 border-gray-300 bg-gray-200 shadow-sm">
                <Ghost size={64} strokeWidth={2.5} />
            </div>

            <h1 className="text-text mb-4 text-4xl font-black">You&apos;re Lost!</h1>
            <p className="text-muted mb-12 text-lg font-bold">
                The page you are looking for has vanished into thin air.
            </p>

            <Link
                href="/"
                className="border-katakana-strong bg-katakana hover:bg-katakana-hover focus-visible:ring-katakana flex items-center gap-2 rounded-2xl border-b-4 px-8 py-4 text-lg font-black text-white transition-all hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-[4px] active:border-b-0"
            >
                <ArrowLeft size={24} strokeWidth={3} />
                Go Back Home
            </Link>
        </div>
    );
}
