"use client";

import { useTranslations } from "next-intl";
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
        icon: BarChart2,
        action: exportAnalyticsAction,
    },
    {
        id: "users",
        icon: Users,
        action: exportUsersDatasetAction,
    },
    {
        id: "content",
        icon: BookOpen,
        action: exportContentDatasetAction,
    },
    {
        id: "logs",
        icon: Activity,
        action: exportLogsDatasetAction,
    },
];

/**
 * Owns AnalyticsExportModal's dataset selection and CSV export orchestration,
 * so the component stays UI-only.
 */
export function useAnalyticsExport(onClose: () => void) {
    const t = useTranslations("AdminAnalytics");
    const datasets = EXPORT_DATASETS.map((dataset) => ({
        ...dataset,
        label: t(`datasets.${dataset.id}.label`),
        description: t(`datasets.${dataset.id}.description`),
    }));
    const [selectedDataset, setSelectedDataset] = useState(datasets[0]);
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
                // result.data's shape varies per dataset action (analytics/users/content/logs
                // each return differently-shaped Firestore records) — no sound static type here.
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                setErrorMessage(t("noRecordsError"));
                setStatus("error");
            }
        } catch (err) {
            console.error("Export failed:", err);
            setErrorMessage((err instanceof Error && err.message) || t("unexpectedError"));
            setStatus("error");
        }
    };

    return {
        datasets,
        selectedDataset,
        setSelectedDataset,
        status,
        errorMessage,
        handleStartExport,
    };
}
