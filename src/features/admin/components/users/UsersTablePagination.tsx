"use client";

import { Button } from "@/shared/components/ui";

interface UsersTablePaginationProps {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    onPrevPage?: () => void;
    onNextPage?: () => void;
    onGoToPage?: (page: number) => void;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    loading: boolean;
    maxDiscoveredPage: number;
}

/**
 * Pagination Controls for the Users Table.
 *
 * @remarks Implements intelligent page button rendering with '...' truncations
 * for large page counts, ensuring a clean UI regardless of user volume.
 */
const UsersTablePagination = ({
    currentPage,
    totalPages,
    totalUsers,
    onPrevPage,
    onNextPage,
    onGoToPage,
    hasPrevPage,
    hasNextPage,
    loading,
    maxDiscoveredPage,
}: UsersTablePaginationProps) => {
    return (
        <div className="flex flex-col gap-2 border-t-2 border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-bold text-[#afafaf]">
                Page {currentPage + 1} of {Math.max(1, totalPages)} · {totalUsers} total
            </span>
            <div className="flex flex-wrap gap-1">
                <Button
                    variant="secondary"
                    color="gray"
                    onClick={onPrevPage}
                    disabled={!hasPrevPage || loading || !onPrevPage}
                    className="mr-1 !h-8 !px-3 !py-1 !text-xs"
                >
                    Prev
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i).map((pageIdx) => {
                    if (totalPages > 7) {
                        if (
                            pageIdx !== 0 &&
                            pageIdx !== totalPages - 1 &&
                            Math.abs(pageIdx - currentPage) > 1
                        ) {
                            if (pageIdx === 1 || pageIdx === totalPages - 2)
                                return (
                                    <span key={pageIdx} className="self-center text-gray-300">
                                        ...
                                    </span>
                                );
                            return null;
                        }
                    }

                    const isActive = pageIdx === currentPage;
                    const isDiscovered = pageIdx < maxDiscoveredPage;
                    return (
                        <button
                            key={pageIdx}
                            onClick={() => onGoToPage?.(pageIdx)}
                            disabled={loading || isActive || !isDiscovered}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black transition-all ${
                                isActive
                                    ? "bg-[#1cb0f6] text-white shadow-md shadow-[#1cb0f6]/20"
                                    : isDiscovered
                                      ? "text-[#afafaf] hover:bg-gray-50 hover:text-[#3c3c3c]"
                                      : "cursor-not-allowed text-gray-200"
                            }`}
                        >
                            {pageIdx + 1}
                        </button>
                    );
                })}

                <Button
                    variant="secondary"
                    color="gray"
                    onClick={onNextPage}
                    disabled={!hasNextPage || loading || !onNextPage}
                    className="ml-1 !h-8 !px-3 !py-1 !text-xs"
                >
                    Next
                </Button>
            </div>
        </div>
    );
};

export default UsersTablePagination;
