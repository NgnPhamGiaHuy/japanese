/**
 * CSV Export Utility
 *
 * Provides a lightweight, dependency-free way to convert JSON data to CSV
 * and trigger a browser download.
 */

export const exportToCSV = (data: any[], filename: string): boolean => {
    if (!data || data.length === 0) {
        console.warn("Export attempted with empty data");
        return false;
    }

    try {
        // Extract headers from the first object
        const headers = Object.keys(data[0]);

        // Build CSV content
        const csvRows = [
            headers.join(","), // Header row
            ...data.map((row) =>
                headers
                    .map((header) => {
                        const val = row[header];
                        // Handle strings with commas by wrapping in quotes
                        const escaped = String(val ?? "").replace(/"/g, '""');
                        return `"${escaped}"`;
                    })
                    .join(","),
            ),
        ];

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        // Trigger download
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;

        // Use document.body.appendChild for some browsers
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);

        return true;
    } catch (err) {
        console.error("CSV Generation failed:", err);
        return false;
    }
};
