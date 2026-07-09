"use client";

import { Server, Smartphone } from "lucide-react";

import { Badge } from "@/shared/components/ui";

/** Displays the architectural source of the log event. */
const LogSourceBadge = ({ source }: { source?: string }) => {
    if (!source) return null;
    const isClient = source === "client";
    return (
        <Badge
            variant="default"
            size="sm"
            icon={isClient ? Smartphone : Server}
            className="text-muted border-gray-100 bg-gray-50 tracking-wider uppercase"
        >
            {source.replace("_", " ")}
        </Badge>
    );
};

export default LogSourceBadge;
