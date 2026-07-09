"use client";

import { useState } from "react";

import { Activity, BarChart2, BookOpen, Users } from "lucide-react";

import { useAdminToken } from "./useAdminToken";
import {
    exportAnalyticsAction,
    exportContentDatasetAction,
    exportLogsDatasetAction,
    exportUsersDatasetAction,
} from "../actions/admin.actions";
import { exportToCSV } from "../utils/export.utils";

export const EXPORT_DATASETS = [
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
 * Owns AnalyticsExportModal's dataset selection and CSV export orchestration,
 * so the component stays UI-only.
 */
export function useAnalyticsExport(onClose: () => void) {
    const [selectedDataset, setSelectedDataset] = useState(EXPORT_DATASETS[0]);
    const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const getAdminIdToken = useAdminToken();

    const handleStartExport = async () => {
        setStatus("processing");
        setErrorMessage("");

        try {
            await getAdminIdToken();
            const result = await selectedDataset.action();

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

    return {
        datasets: EXPORT_DATASETS,
        selectedDataset,
        setSelectedDataset,
        status,
        errorMessage,
        handleStartExport,
    };
}
