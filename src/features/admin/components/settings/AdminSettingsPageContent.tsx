"use client";

import { useState } from "react";

import { Settings } from "lucide-react";

import { useAlert } from "@/shared/providers";
import AdminSettingsForm from "./AdminSettingsForm";
import { AdminPageHeader, AdminPageLayout } from "../shared";

import type { AdminSettingsValues } from "./AdminSettingsForm";

/**
 * Admin System Settings Page.
 *
 * @remarks Facilitates global platform configuration. Uses a central form
 * and state-driven submissions to manage operational toggles and limits.
 */
const AdminSettingsPageContent = () => {
    const { showAlert } = useAlert();
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (_values: AdminSettingsValues) => {
        setSaving(true);
        await new Promise((resolve) => setTimeout(resolve, 400));
        setSaving(false);
        showAlert("success", "Settings saved");
    };

    return (
        <AdminPageLayout>
            <AdminPageHeader
                title="Settings"
                description="Admin configuration only."
                icon={Settings}
            />
            <AdminSettingsForm onSubmit={handleSubmit} saving={saving} />
        </AdminPageLayout>
    );
};

export default AdminSettingsPageContent;
