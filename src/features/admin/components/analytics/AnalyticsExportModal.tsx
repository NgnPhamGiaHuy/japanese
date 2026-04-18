"use client";

import { useState } from "react";

import {
    Activity,
    BarChart2,
    BookOpen,
    CheckCircle2,
    Download,
    FileText,
    Users,
} from "lucide-react";

import { Button, LoadingSpinner, Modal } from "@/shared/components/ui";
import {
    exportAnalyticsAction,
    exportContentDatasetAction,
    exportLogsDatasetAction,
    exportUsersDatasetAction,
} from "../../actions/admin.actions";
import { useAdminToken } from "../../hooks";
import { exportToCSV } from "../../utils/export.utils";

interface AnalyticsExportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DATASETS = [
    {
        id: "analytics",
        label: "Daily Metrics",
        description: "Aggregated growth and activity snapshots",
        icon: BarChart2,
        action: exportAnalyticsAction,
    },
    {
        id: "users",
        label: "User Progress",
        description: "Detailed learner profiles, XP, and streaks",
        icon: Users,
        action: exportUsersDatasetAction,
    },
    {
        id: "content",
        label: "Content Audit",
        description: "Global deck metadata and categorization",
        icon: BookOpen,
        action: exportContentDatasetAction,
    },
    {
        id: "logs",
        label: "Behavioral Logs",
        description: "Raw event timeline for behavioral AI training",
        icon: Activity,
        action: exportLogsDatasetAction,
    },
];

/**
 * Analytics & AI Dataset Export Configuration Modal.
 *
 * Allows administrators to select specific high-granularity datasets
 * for external analysis and AI model training.
 */
const AnalyticsExportModal = ({ isOpen, onClose }: AnalyticsExportModalProps) => {
    const [selectedDataset, setSelectedDataset] = useState(DATASETS[0]);
    const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const getAdminIdToken = useAdminToken();

    const handleStartExport = async () => {
        setStatus("processing");
        setErrorMessage("");

        try {
            const token = await getAdminIdToken();
            const result = await selectedDataset.action(token);

            if (!result.ok) throw new Error(result.error);

            // Simulation for UX
            await new Promise((r) => setTimeout(r, 700));

            let processedData = result.data;

            // Specialized processing for Daily Metrics (flattening)
            if (selectedDataset.id === "analytics") {
                processedData = result.data.map((d: any) => {
                    const { featureUsage, ...rest } = d;
                    return {
                        ...rest,
                        ...Object.fromEntries(
                            Object.entries(featureUsage || {}).map(([k, v]) => [`feature_${k}`, v]),
                        ),
                    };
                });
            }

            const filename = `japanese_${selectedDataset.id}_dataset`;
            const success = exportToCSV(processedData, filename);

            if (success) {
                setStatus("success");
                setTimeout(() => {
                    onClose();
                    setStatus("idle");
                }, 1500);
            } else {
                setErrorMessage("The retrieved dataset contains no records.");
                setStatus("error");
            }
        } catch (err: any) {
            console.error("Export failed:", err);
            setErrorMessage(err.message || "An unexpected error occurred during export.");
            setStatus("error");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Advanced Data Export" maxWidth="xl">
            <div className="space-y-6">
                <div className="rounded-2xl bg-[#1cb0f6]/5 p-4">
                    <p className="text-sm font-bold text-[#1cb0f6]">
                        Pro Tip: For training AI models, choose high-granularity datasets like 'User
                        Progress' or 'Behavioral Logs' to provide the model with record-level
                        evidence.
                    </p>
                </div>

                {status === "processing" ? (
                    <div className="py-8">
                        <LoadingSpinner
                            fullScreen={false}
                            label={`Compiling ${selectedDataset.label} Dataset...`}
                        />
                        <p className="mt-4 animate-pulse text-center text-xs font-black tracking-widest text-[#1cb0f6] uppercase">
                            Establishing authoritative connection to Firebase...
                        </p>
                    </div>
                ) : status === "success" ? (
                    <div className="animate-in fade-in zoom-in flex flex-col items-center justify-center py-12 text-center duration-300">
                        <div className="mb-4 rounded-full bg-[#58cc02]/10 p-5">
                            <CheckCircle2 size={56} className="text-[#58cc02]" />
                        </div>
                        <h3 className="text-xl font-black text-[#3c3c3c]">Dataset Generated</h3>
                        <p className="max-w-xs text-sm font-bold text-[#afafaf]">
                            Your authoritative report for {selectedDataset.label} is being handed to
                            your browser.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                                Select AI-Ready Dataset
                            </label>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {DATASETS.map((dataset) => {
                                    const Icon = dataset.icon;
                                    const active = selectedDataset.id === dataset.id;
                                    return (
                                        <button
                                            key={dataset.id}
                                            onClick={() => setSelectedDataset(dataset)}
                                            className={`flex flex-col items-start gap-2 rounded-3xl border-2 p-5 text-left transition-all ${
                                                active
                                                    ? "border-[#1cb0f6] bg-[#1cb0f6]/5 ring-2 ring-[#1cb0f6]/10"
                                                    : "border-gray-100 hover:border-gray-200"
                                            }`}
                                        >
                                            <div
                                                className={`rounded-xl p-2.5 ${active ? "bg-[#1cb0f6] text-white shadow-md" : "bg-gray-100 text-[#afafaf]"}`}
                                            >
                                                <Icon size={20} />
                                            </div>
                                            <div>
                                                <div
                                                    className={`text-sm font-black ${active ? "text-[#3c3c3c]" : "text-[#afafaf]"}`}
                                                >
                                                    {dataset.label}
                                                </div>
                                                <div className="mt-1 text-[10px] leading-tight font-bold text-[#afafaf]">
                                                    {dataset.description}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {status === "error" && (
                            <div className="rounded-2xl bg-red-50 p-4 text-xs font-bold text-red-500">
                                {errorMessage}
                            </div>
                        )}

                        <div className="pt-4">
                            <Button
                                variant="primary"
                                className="w-full gap-2 !py-5 text-base shadow-lg transition-transform active:scale-95"
                                onClick={handleStartExport}
                            >
                                <Download size={20} />
                                Export Authoritative Dataset
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default AnalyticsExportModal;
