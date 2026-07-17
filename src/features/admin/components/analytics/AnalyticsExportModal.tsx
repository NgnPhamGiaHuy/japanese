"use client";

import { useTranslations } from "next-intl";

import { CheckCircle2, Download } from "lucide-react";

import { Button, LoadingSpinner, Modal } from "@/shared/components/ui";
import { useAnalyticsExport } from "../../hooks";

interface AnalyticsExportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Analytics & AI Dataset Export Configuration Modal.
 *
 * Allows administrators to select specific high-granularity datasets
 * for external analysis and AI model training.
 */
const AnalyticsExportModal = ({ isOpen, onClose }: AnalyticsExportModalProps) => {
    const t = useTranslations("AdminAnalytics");
    const {
        datasets,
        selectedDataset,
        setSelectedDataset,
        status,
        errorMessage,
        handleStartExport,
    } = useAnalyticsExport(onClose);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t("exportTitle")} maxWidth="xl">
            <div className="space-y-6">
                <div className="bg-katakana/5 rounded-2xl p-4">
                    <p className="text-katakana text-sm font-bold">{t("proTip")}</p>
                </div>

                {status === "processing" ? (
                    <div className="py-8">
                        <LoadingSpinner
                            fullScreen={false}
                            label={t("compilingDataset", { label: selectedDataset.label })}
                        />
                        <p className="text-katakana mt-4 animate-pulse text-center text-xs font-black tracking-widest uppercase">
                            {t("establishingConnection")}
                        </p>
                    </div>
                ) : status === "success" ? (
                    <div className="animate-in fade-in zoom-in flex flex-col items-center justify-center py-12 text-center duration-300">
                        <div className="bg-hiragana/10 mb-4 rounded-full p-5">
                            <CheckCircle2 size={56} className="text-hiragana" />
                        </div>
                        <h3 className="text-text text-xl font-black">{t("datasetGenerated")}</h3>
                        <p className="text-muted max-w-xs text-sm font-bold">
                            {t("authoritativeReport", { label: selectedDataset.label })}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            <label className="text-muted text-xs font-black tracking-widest uppercase">
                                {t("selectDataset")}
                            </label>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {datasets.map((dataset) => {
                                    const Icon = dataset.icon;
                                    const active = selectedDataset.id === dataset.id;
                                    return (
                                        <button
                                            key={dataset.id}
                                            onClick={() => setSelectedDataset(dataset)}
                                            className={`focus-visible:ring-katakana flex flex-col items-start gap-2 rounded-3xl border-2 p-5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                                                active
                                                    ? "bg-katakana/5 border-[#1cb0f6] ring-2 ring-[#1cb0f6]/10"
                                                    : "border-gray-100 hover:border-gray-200"
                                            }`}
                                        >
                                            <div
                                                className={`rounded-xl p-2.5 ${active ? "bg-katakana text-white shadow-md" : "text-muted bg-gray-100"}`}
                                            >
                                                <Icon size={20} />
                                            </div>
                                            <div>
                                                <div
                                                    className={`text-sm font-black ${active ? "text-text" : "text-muted"}`}
                                                >
                                                    {dataset.label}
                                                </div>
                                                <div className="text-muted mt-1 text-xs leading-tight font-bold">
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
                                {t("exportAuthoritativeDataset")}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default AnalyticsExportModal;
