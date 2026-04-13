import { useState } from "react";

import { AlertCircle, CheckCircle2, Trash2 } from "lucide-react";

import { Button } from "@/shared/components/ui";
import { hexToThemeColor } from "@/shared/utils/colors";

export interface ImportRow {
    id: string;
    kanji: string;
    furigana: string;
    meaning: string;
    example: string;
    isInvalid: boolean;
    errorMsg?: string;
    originalText?: string;
}

interface ImportPreviewProps {
    initialRows: ImportRow[];
    onConfirm: (validRows: ImportRow[]) => void;
    onCancel: () => void;
    themeColor?: string;
}

export const ImportPreview = ({
    initialRows,
    onConfirm,
    onCancel,
    themeColor = "#1cb0f6",
}: ImportPreviewProps) => {
    const themeColorStr = hexToThemeColor(themeColor);

    const [rows, setRows] = useState<ImportRow[]>(initialRows);

    const updateRow = (id: string, field: keyof ImportRow, value: string) => {
        setRows((prev) =>
            prev.map((row) => {
                if (row.id === id) {
                    const newRow = { ...row, [field]: value };
                    const hasKanji = newRow.kanji.trim() || newRow.furigana.trim();
                    const hasMeaning = newRow.meaning.trim();
                    newRow.isInvalid = !(hasKanji && hasMeaning);
                    newRow.errorMsg = newRow.isInvalid ? "Requires Kanji/Furigana and Meaning" : "";
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

            <div className="overflow-x-auto rounded-2xl border-2 border-gray-200 bg-white shadow-sm">
                <table className="w-full text-left font-bold text-[#3c3c3c]">
                    <thead className="border-b-2 border-gray-200 bg-gray-50 text-xs tracking-widest text-[#afafaf] uppercase">
                        <tr>
                            <th className="p-4">Kanji</th>
                            <th className="p-4">Furigana</th>
                            <th className="p-4">Meaning</th>
                            <th className="p-4">Example</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-gray-100">
                        {rows.map((row) => (
                            <tr
                                key={row.id}
                                className={`transition-colors ${row.isInvalid ? "bg-red-50/50" : "hover:bg-gray-50"}`}
                            >
                                <td className="p-2">
                                    <input
                                        className="w-full rounded-lg border-2 border-transparent bg-transparent p-2 outline-none focus:border-[var(--theme-color)] focus:bg-white"
                                        style={
                                            { "--theme-color": themeColor } as React.CSSProperties
                                        }
                                        value={row.kanji}
                                        onChange={(e) => updateRow(row.id, "kanji", e.target.value)}
                                        placeholder="Kanji/Word"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        className="w-full rounded-lg border-2 border-transparent bg-transparent p-2 outline-none focus:border-[var(--theme-color)] focus:bg-white"
                                        style={
                                            { "--theme-color": themeColor } as React.CSSProperties
                                        }
                                        value={row.furigana}
                                        onChange={(e) =>
                                            updateRow(row.id, "furigana", e.target.value)
                                        }
                                        placeholder="Furigana"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        className="w-full rounded-lg border-2 border-transparent bg-transparent p-2 outline-none focus:border-[var(--theme-color)] focus:bg-white"
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
                                <td className="p-2">
                                    <input
                                        className="w-full rounded-lg border-2 border-transparent bg-transparent p-2 text-sm text-gray-500 outline-none focus:border-[var(--theme-color)] focus:bg-white focus:text-[#3c3c3c]"
                                        style={
                                            { "--theme-color": themeColor } as React.CSSProperties
                                        }
                                        value={row.example}
                                        onChange={(e) =>
                                            updateRow(row.id, "example", e.target.value)
                                        }
                                        placeholder="Optional"
                                    />
                                </td>
                                <td className="p-4 text-center">
                                    {row.isInvalid ? (
                                        <div
                                            className="flex items-center justify-center text-red-500"
                                            title={row.errorMsg || row.originalText}
                                        >
                                            <AlertCircle size={20} />
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center text-green-500">
                                            <CheckCircle2 size={20} />
                                        </div>
                                    )}
                                </td>
                                <td className="p-4 text-center">
                                    <button
                                        onClick={() => removeRow(row.id)}
                                        className="text-gray-300 transition-colors hover:text-red-500"
                                    >
                                        <Trash2 size={20} />
                                    </button>
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
