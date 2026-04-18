"use client";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button, Card } from "@/shared/components/ui";

const settingsSchema = z.object({
    maintenanceMode: z.boolean(),
    globalDiscovery: z.boolean(),
    maxCardsPerDeck: z.number().int().min(10).max(5000),
    maxCollaborators: z.number().int().min(1).max(100),
});

export type AdminSettingsValues = z.infer<typeof settingsSchema>;

interface AdminSettingsFormProps {
    defaultValues?: AdminSettingsValues;
    onSubmit: (values: AdminSettingsValues) => Promise<void>;
    saving: boolean;
}

/**
 * System Settings Configuration Form.
 *
 * @remarks Uses React Hook Form with Zod validation to ensure data integrity
 * for high-impact system configuration changes.
 */
const AdminSettingsForm = ({
    defaultValues = {
        maintenanceMode: false,
        globalDiscovery: true,
        maxCardsPerDeck: 1000,
        maxCollaborators: 10,
    },
    onSubmit,
    saving,
}: AdminSettingsFormProps) => {
    const form = useForm<AdminSettingsValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues,
    });

    return (
        <Card className="space-y-6">
            <label className="flex items-center justify-between">
                <span className="font-black text-[#3c3c3c]">Maintenance Mode</span>
                <input type="checkbox" {...form.register("maintenanceMode")} />
            </label>
            <label className="flex items-center justify-between">
                <span className="font-black text-[#3c3c3c]">Global Discovery</span>
                <input type="checkbox" {...form.register("globalDiscovery")} />
            </label>
            <label className="block space-y-2">
                <span className="text-xs font-black tracking-wider text-[#afafaf] uppercase">
                    Max cards per deck
                </span>
                <input
                    type="number"
                    {...form.register("maxCardsPerDeck", { valueAsNumber: true })}
                    className="h-10 w-full rounded-xl border-2 border-gray-100 px-3"
                />
            </label>
            <label className="block space-y-2">
                <span className="text-xs font-black tracking-wider text-[#afafaf] uppercase">
                    Max collaborators
                </span>
                <input
                    type="number"
                    {...form.register("maxCollaborators", { valueAsNumber: true })}
                    className="h-10 w-full rounded-xl border-2 border-gray-100 px-3"
                />
            </label>
            <Button
                onClick={form.handleSubmit((values) => onSubmit(values))}
                loading={saving}
                className="w-full"
            >
                Save Configuration
            </Button>
        </Card>
    );
};

export default AdminSettingsForm;
