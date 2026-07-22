/**
 * @file ImportPreview
 * Staging UI for validating and correcting batch-imported flashcard data.
 * Used for CSV, Paste, and AI bulk generation flows.
 */

import { useTranslations } from "next-intl";
import { useState } from "react";

import { AlertCircle, CheckCircle2, Trash2 } from "lucide-react";

import { DEFAULT_DECK_THEME_COLOR } from "@/features/flashcard/types";
import { Button } from "@/shared/components/ui";
import { hexToThemeColor } from "@/shared/utils";

/**
 * Represents a single row of imported data in the staging area.
 * Contains original source text and validation error messages.
 */
export interface ImportRow {
    /** Unique temporary ID for list management */
    id: string;
    primary: string;
    alternatives: string[];
    meaning: string;
    example: string;
    /** Flag indicating if the row meets the minimum requirements for a valid card */
    isInvalid: boolean;
    /** Detailed error description for display in tooltips */
    errorMsg?: string;
    /** The original unparsed string (useful for debugging raw import failures) */
    originalText?: string;
    /** Flag indicating the primary field violates the Atomic Card principle */
    atomicViolation?: boolean;
}

interface ImportPreviewProps {
    /** The raw set of rows returned by a parser (CSV/Text) or AI generator */
    initialRows: ImportRow[];
    /** Triggered when the user commits only the valid subset of rows back to the builder */
    onConfirm: (validRows: ImportRow[]) => void;
    /** Reverts back to the main builder view */
    onCancel: () => void;
    /** Optional visual branding (hex) */
    themeColor?: string;
}

interface ImportCellInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    themeColor: string;
    /** Dims the field for secondary/optional data (Alternatives, Example). */
    muted?: boolean;
}

/** Dense, borderless text field for a single ImportPreview table cell. */
const ImportCellInput = ({
    value,
    onChange,
    placeholder,
    themeColor,
    muted = false,
}: ImportCellInputProps) => (
    <input
        className={`w-full rounded-lg border-2 border-transparent bg-transparent p-1.5 text-xs outline-none focus:border-[var(--theme-color)] focus:bg-white sm:p-2 sm:text-sm ${muted ? "text-muted font-medium" : ""}`}
        style={{ "--theme-color": themeColor } as React.CSSProperties}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
    />
);

/**
 * ImportPreview Component
 *
 * @remarks
 * Acts as a quality gate (guard) before data enters the main `LessonBuilder` list.
 * Users can edit fields inline to fix validation errors (missing primary/meaning).
 * Only "Clean" rows are passed through to `onConfirm`.
 *
 * @example
 * <ImportPreview initialRows={parsedData} onConfirm={handleAdd} onCancel={closePreview} />
 */
const ImportPreview = ({
    initialRows,
    onConfirm,
    onCancel,
    themeColor = DEFAULT_DECK_THEME_COLOR,
}: ImportPreviewProps) => {
    const t = useTranslations("LessonBuilder");
    const tCommon = useTranslations("Common");
    const themeColorStr = hexToThemeColor(themeColor);

    const [rows, setRows] = useState<ImportRow[]>(initialRows);

    /**
     * Inline row updates with real-time validation re-evaluation.
     *
     * @param id - Row ID to update
     * @param field - ImportRow property
     * @param value - New string value
     */
    const updateRow = <K extends keyof ImportRow>(id: string, field: K, value: ImportRow[K]) => {
        setRows((prev) =>
            prev.map((row) => {
                if (row.id === id) {
                    const newRow = { ...row, [field]: value };
                    const hasPrimary = newRow.primary.trim();
                    const hasMeaning = newRow.meaning.trim();
                    newRow.isInvalid = !(hasPrimary && hasMeaning);
                    newRow.errorMsg = newRow.isInvalid ? t("requiresPrimaryAndMeaning") : "";
                    return newRow;
                }
                return row;
            }),
        );
    };

    const removeRow = (id: string) => {
        setRows((prev) => prev.filter((r) => r.id !== id));
    };

    const validCount = rows.filter((r) => !r.isInvalid).length;
    const invalidCount = rows.length - validCount;

    return (
        <div className="space-y-4">
            {/* Header Summary & Actions */}
            <div className="flex items-center justify-between rounded-xl border-2 border-gray-200 bg-white p-4 shadow-sm">
                <div>
                    <h3 className="text-text text-lg font-black">{t("previewCards")}</h3>
                    <p className="text-muted text-sm font-bold">
                        {t("validInvalidCount", { valid: validCount, invalid: invalidCount })}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={onCancel} className="px-4 text-gray-500">
                        {tCommon("cancel")}
                    </Button>
                    <Button
                        variant="primary"
                        color={themeColorStr}
                        disabled={validCount === 0}
                        onClick={() => onConfirm(rows.filter((r) => !r.isInvalid))}
                    >
                        {t("importCards", { count: validCount })}
                    </Button>
                </div>
            </div>

            {/* Validation Table */}
            <div className="overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-sm sm:overflow-x-auto">
                <table className="text-text w-full table-fixed text-left font-bold">
                    <thead className="text-muted border-b-2 border-gray-200 bg-gray-50 text-xs tracking-widest uppercase sm:text-xs">
                        <tr>
                            <th className="w-[22%] p-2 sm:p-4">{t("colPrimary")}</th>
                            <th className="w-[20%] p-2 sm:p-4">{t("colAlternatives")}</th>
                            <th className="w-[18%] p-2 sm:p-4">{t("colMeaning")}</th>
                            <th className="w-[22%] p-2 sm:p-4">{t("colExample")}</th>
                            <th className="w-[8%] p-2 text-center sm:p-4">{t("colStatus")}</th>
                            <th className="w-[10%] p-2 text-center sm:p-4">{t("colActions")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-gray-100">
                        {rows.map((row) => (
                            <tr
                                key={row.id}
                                className={`transition-colors ${row.isInvalid ? "bg-red-50/50" : "hover:bg-gray-50"}`}
                            >
                                <td className="p-1 sm:p-2">
                                    <ImportCellInput
                                        themeColor={themeColor}
                                        value={row.primary}
                                        onChange={(v) => updateRow(row.id, "primary", v)}
                                        placeholder={t("colPrimary")}
                                    />
                                </td>
                                <td className="p-1 sm:p-2">
                                    <ImportCellInput
                                        themeColor={themeColor}
                                        muted
                                        value={(row.alternatives || []).join(" / ")}
                                        onChange={(v) =>
                                            updateRow(
                                                row.id,
                                                "alternatives",
                                                v
                                                    .split(/[,/]/)
                                                    .map((s) => s.trim())
                                                    .filter(Boolean),
                                            )
                                        }
                                        placeholder={t("altPlaceholder")}
                                    />
                                </td>
                                <td className="p-1 sm:p-2">
                                    <ImportCellInput
                                        themeColor={themeColor}
                                        value={row.meaning}
                                        onChange={(v) => updateRow(row.id, "meaning", v)}
                                        placeholder={t("colMeaning")}
                                    />
                                </td>
                                <td className="p-1 sm:p-2">
                                    <ImportCellInput
                                        themeColor={themeColor}
                                        muted
                                        value={row.example}
                                        onChange={(v) => updateRow(row.id, "example", v)}
                                        placeholder={t("exampleCellPlaceholder")}
                                    />
                                </td>
                                <td className="p-1 text-center sm:p-2">
                                    {row.isInvalid ? (
                                        <div
                                            className="flex items-center justify-center text-red-500"
                                            title={row.errorMsg || row.originalText}
                                        >
                                            <AlertCircle size={14} className="sm:size-5" />
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center text-green-500">
                                            <CheckCircle2 size={14} className="sm:size-5" />
                                        </div>
                                    )}
                                </td>
                                <td className="p-1 text-center sm:p-2">
                                    <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                                        <Button
                                            variant="ghost"
                                            onClick={() => removeRow(row.id)}
                                            className="!p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                                            icon={Trash2}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-muted p-8 text-center">
                                    {t("noRowsParsed")}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ImportPreview;
