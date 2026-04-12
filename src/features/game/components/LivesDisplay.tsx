"use client";

import { Heart } from "lucide-react";

interface LivesDisplayProps {
    lives: number;
    total?: number;
}

export default function LivesDisplay({ lives, total = 3 }: LivesDisplayProps) {
    return (
        <div className="flex justify-center gap-1 md:gap-2">
            {Array.from({ length: total }).map((_, i) => (
                <Heart
                    key={i}
                    fill={i < lives ? "#ea2b2b" : "transparent"}
                    color={i < lives ? "#ea2b2b" : "#d1d5db"}
                    className="w-5 h-5 md:w-8 md:h-8 transition-colors duration-300"
                />
            ))}
        </div>
    );
}
