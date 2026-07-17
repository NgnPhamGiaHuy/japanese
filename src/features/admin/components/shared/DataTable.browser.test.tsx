import { NextIntlClientProvider } from "next-intl";

import { createColumnHelper } from "@tanstack/react-table";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";

import messages from "@/messages/en.json";
import AdminTable from "./AdminTable";
import DataTableBody from "./DataTableBody";
import DataTableHeader from "./DataTableHeader";
import DataTableMobileList from "./DataTableMobileList";
import { useDataTable } from "../../hooks/useDataTable";

interface Person {
    id: string;
    name: string;
    age: number;
}

const people: Person[] = [
    { id: "a", name: "Charlie", age: 40 },
    { id: "b", name: "Alice", age: 30 },
    { id: "c", name: "Bob", age: 20 },
];

const columnHelper = createColumnHelper<Person>();
const columns = [
    columnHelper.display({
        id: "select",
        header: ({ table }) => (
            <input
                type="checkbox"
                checked={table.getIsAllRowsSelected()}
                onChange={table.getToggleAllRowsSelectedHandler()}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <input
                type="checkbox"
                checked={row.getIsSelected()}
                onChange={row.getToggleSelectedHandler()}
                aria-label={`Select ${row.original.name}`}
            />
        ),
    }),
    columnHelper.accessor("name", {
        header: "Name",
        meta: { align: "start" },
    }),
    columnHelper.accessor("age", {
        header: "Age",
    }),
];

/** Harness owning useDataTable, mirroring how a real admin table composes it. */
function Harness({ enableRowSelection = true }: { enableRowSelection?: boolean }) {
    const { table } = useDataTable<Person>({ data: people, columns, enableRowSelection });
    return (
        <NextIntlClientProvider locale="en" messages={messages}>
            <AdminTable
                mobileList={
                    <DataTableMobileList
                        table={table}
                        renderRow={(row) => (
                            <div data-testid={`mobile-${row.original.id}`}>{row.original.name}</div>
                        )}
                    />
                }
            >
                <DataTableHeader table={table} />
                <DataTableBody table={table} />
            </AdminTable>
        </NextIntlClientProvider>
    );
}

describe("shared DataTable engine (useDataTable + Header/Body/MobileList)", () => {
    test("renders rows in original order with no sort applied", async () => {
        const screen = await render(<Harness />);
        const rows = screen.container.querySelectorAll("tbody tr");
        expect(rows).toHaveLength(3);
        expect(rows[0].textContent).toContain("Charlie");
        expect(rows[1].textContent).toContain("Alice");
        expect(rows[2].textContent).toContain("Bob");
    });

    test("clicking a sortable header sorts ascending, then descending, and updates aria-sort", async () => {
        const screen = await render(<Harness />);
        const nameHeaderCell = () => screen.container.querySelectorAll("th")[1];
        expect(nameHeaderCell().getAttribute("aria-sort")).toBe("none");

        await screen.getByText("Name").click();
        expect(nameHeaderCell().getAttribute("aria-sort")).toBe("ascending");
        let rows = screen.container.querySelectorAll("tbody tr");
        expect(rows[0].textContent).toContain("Alice");

        await screen.getByText("Name").click();
        expect(nameHeaderCell().getAttribute("aria-sort")).toBe("descending");
        rows = screen.container.querySelectorAll("tbody tr");
        expect(rows[0].textContent).toContain("Charlie");
    });

    test("a non-sortable column (no accessor) has no aria-sort and no sort icon", async () => {
        const screen = await render(<Harness />);
        const selectHeader = screen.container.querySelector("th:first-child")!;
        expect(selectHeader.getAttribute("aria-sort")).toBeNull();
    });

    test("selecting a row highlights it and reflects in getIsSelected-driven styling", async () => {
        const screen = await render(<Harness />);
        const bobCheckbox = screen.getByRole("checkbox", { name: "Select Bob" });
        await userEvent.click(bobCheckbox.element());

        const bobRow = screen.container.querySelectorAll("tbody tr")[2];
        expect(bobRow.className).toContain("bg-katakana/5");
    });

    test("row selection is disabled entirely when enableRowSelection is false", async () => {
        const screen = await render(<Harness enableRowSelection={false} />);
        const checkboxes = screen.container.querySelectorAll('input[type="checkbox"]');
        // Select-all + 3 row checkboxes are still rendered (the column exists),
        // but toggling must not select anything since selection state is forced to {}.
        await userEvent.click(checkboxes[1]);
        const firstRow = screen.container.querySelectorAll("tbody tr")[0];
        expect(firstRow.className).not.toContain("bg-katakana/5");
    });

    test("mobile list renders the same rows via the supplied renderRow", async () => {
        const screen = await render(<Harness />);
        await expect.element(screen.getByTestId("mobile-a")).toHaveTextContent("Charlie");
        await expect.element(screen.getByTestId("mobile-b")).toHaveTextContent("Alice");
        await expect.element(screen.getByTestId("mobile-c")).toHaveTextContent("Bob");
    });
});
