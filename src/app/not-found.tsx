import Link from "next/link";
import { ArrowLeft, Ghost } from "lucide-react";

export default function NotFoundPage() {
    return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#F7F7F8] p-6 text-center">
            <div className="mb-8 flex h-32 w-32 -rotate-6 transform items-center justify-center rounded-[3rem] border-b-8 border-gray-300 bg-gray-200 text-[#afafaf] shadow-sm">
                <Ghost size={64} strokeWidth={2.5} />
            </div>

            <h1 className="mb-4 text-4xl font-black text-[#3c3c3c]">You&apos;re Lost!</h1>
            <p className="mb-12 text-lg font-bold text-[#afafaf]">
                The page you are looking for has vanished into thin air.
            </p>

            <Link
                href="/"
                className="flex items-center gap-2 rounded-2xl border-b-4 border-[#1899d6] bg-[#1cb0f6] px-8 py-4 text-lg font-black text-white transition-all hover:-translate-y-1 hover:bg-[#149fdf] hover:shadow-lg active:translate-y-[4px] active:border-b-0"
            >
                <ArrowLeft size={24} strokeWidth={3} />
                Go Back Home
            </Link>
        </div>
    );
}
