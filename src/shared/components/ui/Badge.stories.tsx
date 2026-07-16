import { Check, ShieldAlert } from "lucide-react";

import Badge from "./Badge";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
    title: "Shared/UI/Badge",
    component: Badge,
    tags: ["autodocs"],
    args: {
        children: "Badge",
    },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
    render: () => (
        <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="info">Info</Badge>
        </div>
    ),
};

export const Sizes: Story = {
    render: () => (
        <div className="flex flex-wrap items-center gap-2">
            <Badge size="sm">Small</Badge>
            <Badge size="md">Medium</Badge>
            <Badge size="lg">Large</Badge>
        </div>
    ),
};

export const WithIcon: Story = {
    args: { variant: "success", icon: Check, children: "Verified" },
};

export const WithDot: Story = {
    args: { variant: "danger", dot: true, icon: ShieldAlert, children: "Alert" },
};
