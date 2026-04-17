/**
 * DashboardLoading — Loading skeleton for dashboard
 */

const DashboardLoading = () => {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="animate-pulse rounded-[2rem] border-2 border-b-4 border-gray-200 bg-white p-6 shadow-sm"
                >
                    <div className="mb-4 flex items-start justify-between">
                        <div className="flex-1 space-y-2 pr-4">
                            <div className="h-5 w-48 rounded-lg bg-gray-200" />
                            <div className="h-3 w-64 rounded-lg bg-gray-100" />
                            <div className="flex gap-2 pt-1">
                                <div className="h-5 w-12 rounded-lg bg-gray-100" />
                                <div className="h-5 w-16 rounded-lg bg-gray-100" />
                            </div>
                        </div>
                        <div className="h-14 w-14 rounded-2xl bg-gray-100" />
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
                        <div className="flex flex-1 gap-2">
                            <div className="h-10 flex-1 rounded-xl bg-gray-100" />
                            <div className="h-10 flex-1 rounded-xl bg-gray-100" />
                            <div className="h-10 flex-1 rounded-xl bg-gray-100" />
                        </div>
                        <div className="flex justify-around gap-2 border-t-2 border-gray-50 pt-3 sm:justify-end sm:border-t-0 sm:pt-0">
                            <div className="h-10 w-10 flex-1 rounded-xl bg-gray-100 sm:flex-none" />
                            <div className="h-10 w-10 flex-1 rounded-xl bg-gray-100 sm:flex-none" />
                            <div className="h-10 w-10 flex-1 rounded-xl bg-gray-100 sm:flex-none" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DashboardLoading;
