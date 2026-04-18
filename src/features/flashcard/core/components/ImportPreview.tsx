/**
 * @file ImportPreview
 * Staging UI for validating and correcting batch-imported flashcard data.
 * Used for CSV, Paste, and AI bulk generation flows.
 */

import { useState } from "react";

import { AlertCircle, AlertTriangle, CheckCircle2, Scissors, Trash2 } from "lucide-react";

import { Button } from "@/shared/components/ui";
import { hexToThemeColor } from "@/shared/utils";
import { splitAtomicPrimary } from "../utils/card.validator";

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
    themeColor = "#1cb0f6",
}: ImportPreviewProps) => {
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
                    newRow.errorMsg = newRow.isInvalid ? "Requires primary and meaning" : "";
                    return newRow;
                }
                return row;
            }),
        );
    };

    const removeRow = (id: string) => {
        setRows((prev) => prev.filter((r) => r.id !== id));
    };

    /**
     * Splits a flagged atomic-violation row into multiple atomic rows,
     * one per detected primary form.
     */
    const splitRow = (id: string) => {
        setRows((prev) => {
            const idx = prev.findIndex((r) => r.id === id);
            if (idx === -1) return prev;
            const row = prev[idx];
            const atomicPrimaries = splitAtomicPrimary(row.primary);
            if (atomicPrimaries.length === 0) return prev;
            const newRows = atomicPrimaries.map((p, i) => ({
                ...row,
                id: `split_${Date.now()}_${i}`,
                primary: p,
                atomicViolation: false,
            }));
            return [...prev.slice(0, idx), ...newRows, ...prev.slice(idx + 1)];
        });
    };

    const validCount = rows.filter((r) => !r.isInvalid).length;
    const invalidCount = rows.length - validCount;

    return (
        <div className="space-y-4">
            {/* Header Summary & Actions */}
            <div className="flex items-center justify-between rounded-xl border-2 border-gray-200 bg-white p-4 shadow-sm">
                <div>
                    <h3 className="text-lg font-black text-[#3c3c3c]">Preview Cards</h3>
                    <p className="text-sm font-bold text-[#afafaf]">
                        {validCount} valid, {invalidCount} invalid
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={onCancel} className="px-4 text-gray-500">
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        color={themeColorStr}
                        disabled={validCount === 0}
                        onClick={() => onConfirm(rows.filter((r) => !r.isInvalid))}
                    >
                        Import {validCount} Cards
                    </Button>
                </div>
            </div>

            {/* Validation Table */}
            <div className="overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-sm sm:overflow-x-auto">
                <table className="w-full table-fixed text-left font-bold text-[#3c3c3c]">
                    <thead className="border-b-2 border-gray-200 bg-gray-50 text-[10px] tracking-widest text-[#afafaf] uppercase sm:text-xs">
                        <tr>
                            <th className="w-[22%] p-2 sm:p-4">Primary</th>
                            <th className="w-[20%] p-2 sm:p-4">Alternatives</th>
                            <th className="w-[18%] p-2 sm:p-4">Meaning</th>
                            <th className="w-[22%] p-2 sm:p-4">Example</th>
                            <th className="w-[8%] p-2 text-center sm:p-4">Status</th>
                            <th className="w-[10%] p-2 text-center sm:p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-gray-100">
                        {rows.map((row) => (
                            <tr
                                key={row.id}
                                className={`transition-colors ${row.isInvalid ? "bg-red-50/50" : "hover:bg-gray-50"}`}
                            >
                                <td className="p-1 sm:p-2">
                                    <input
                                        className="w-full rounded-lg border-2 border-transparent bg-transparent p-1.5 text-xs outline-none focus:border-[var(--theme-color)] focus:bg-white sm:p-2 sm:text-sm"
                                        style={
                                            { "--theme-color": themeColor } as React.CSSProperties
                                        }
                                        value={row.primary}
                                        onChange={(e) =>
                                            updateRow(row.id, "primary", e.target.value)
                                        }
                                        placeholder="Primary"
                                    />
                                </td>
                                <td className="p-1 sm:p-2">
                                    <input
                                        className="w-full rounded-lg border-2 border-transparent bg-transparent p-1.5 text-xs font-medium text-[#afafaf] outline-none focus:border-[var(--theme-color)] focus:bg-white sm:p-2 sm:text-sm"
                                        style={
                                            { "--theme-color": themeColor } as React.CSSProperties
                                        }
                                        value={(row.alternatives || []).join(" / ")}
                                        onChange={(e) =>
                                            updateRow(
                                                row.id,
                                                "alternatives",
                                                e.target.value
                                                    .split(/[,/]/)
                                                    .map((s) => s.trim())
                                                    .filter(Boolean),
                                            )
                                        }
                                        placeholder="Alt..."
                                    />
                                </td>
                                <td className="p-1 sm:p-2">
                                    <input
                                        className="w-full rounded-lg border-2 border-transparent bg-transparent p-1.5 text-xs outline-none focus:border-[var(--theme-color)] focus:bg-white sm:p-2 sm:text-sm"
                                        style={
                                            { "--theme-color": themeColor } as React.CSSProperties
                                        }
                                        value={row.meaning}
                                        onChange={(e) =>
                                            updateRow(row.id, "meaning", e.target.value)
                                        }
                                        placeholder="Meaning"
                                    />
                                </td>
                                <td className="p-1 sm:p-2">
                                    <input
                                        className="w-full rounded-lg border-2 border-transparent bg-transparent p-1.5 text-[10px] font-medium text-[#afafaf] outline-none focus:border-[var(--theme-color)] focus:bg-white sm:p-2 sm:text-xs"
                                        style={
                                            { "--theme-color": themeColor } as React.CSSProperties
                                        }
                                        value={row.example}
                                        onChange={(e) =>
                                            updateRow(row.id, "example", e.target.value)
                                        }
                                        placeholder="Optional example"
                                    />
                                </td>
                                <td className="p-1 text-center sm:p-2">
                                    {row.isInvalid ? (
                                        <div
                                            className="flex items-center justify-center text-red-500"
                                            title={row.errorMsg || row.originalText}
                                        >
                                            <AlertCircle size={14} className="sm:size-[18px]" />
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center text-green-500">
                                            <CheckCircle2 size={14} className="sm:size-[18px]" />
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
                                <td colSpan={6} className="p-8 text-center text-[#afafaf]">
                                    No rows parsed. Try a different format.
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
