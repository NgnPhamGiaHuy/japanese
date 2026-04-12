import Link from "next/link";
import { Ghost, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
    return (
        <div className="min-h-[100dvh] bg-[#F7F7F8] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-32 h-32 bg-gray-200 text-[#afafaf] rounded-[3rem] flex items-center justify-center mb-8 shadow-sm border-b-8 border-gray-300 transform -rotate-6">
                <Ghost size={64} strokeWidth={2.5} />
            </div>

            <h1 className="text-4xl font-black text-[#3c3c3c] mb-4">
                You&apos;re Lost!
            </h1>
            <p className="text-[#afafaf] font-bold text-lg mb-12">
                The page you are looking for has vanished into thin air.
            </p>

            <Link
                href="/"
                className="flex items-center gap-2 bg-[#1cb0f6] text-white px-8 py-4 rounded-2xl font-black text-lg border-b-4 border-[#1899d6] hover:bg-[#149fdf] hover:-translate-y-1 hover:shadow-lg active:border-b-0 active:translate-y-[4px] transition-all"
            >
                <ArrowLeft size={24} strokeWidth={3} />
                Go Back Home
            </Link>
        </div>
    );
}
