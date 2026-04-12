"use client";

import { useRef, useState, useEffect } from "react";
import { RotateCcw } from "lucide-react";
import KanaStrokeAnimation from "./KanaStrokeAnimation";

interface DrawingCanvasProps {
    char: string;
    activeFont: string;
    showGuide?: boolean;
    stepKey?: number;
    strokeColor?: string;
}

export default function DrawingCanvas({
    char,
    activeFont,
    showGuide = true,
    stepKey = 1,
    strokeColor = "#58cc02",
}: DrawingCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const { x, y } = getCoords(e);
        const ctx = canvasRef.current!.getContext("2d")!;
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const { x, y } = getCoords(e);
        const ctx = canvasRef.current!.getContext("2d")!;
        ctx.lineTo(x, y);
        ctx.strokeStyle = "#3c3c3c";
        ctx.lineWidth = 32;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const clear = () => {
        const canvas = canvasRef.current!;
        canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    };

    useEffect(clear, [char, stepKey]);

    return (
        <div className="relative w-full max-w-[200px] md:max-w-[280px] aspect-square mx-auto bg-white border-2 border-gray-200 rounded-3xl overflow-hidden shadow-sm flex items-center justify-center shrink-0">
            {showGuide && (
                <div className="absolute inset-0 pointer-events-none opacity-25 flex items-center justify-center">
                    <KanaStrokeAnimation
                        charStr={char}
                        activeFont={activeFont}
                        svgClassName="w-[80%] h-[80%]"
                        strokeColor={strokeColor}
                    />
                </div>
            )}
            <canvas
                ref={canvasRef}
                width={512}
                height={512}
                className="w-full h-full touch-none cursor-crosshair relative z-10"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={() => setIsDrawing(false)}
                onMouseLeave={() => setIsDrawing(false)}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={() => setIsDrawing(false)}
                onTouchCancel={() => setIsDrawing(false)}
            />
            <button
                onClick={clear}
                className="absolute bottom-2 right-2 md:bottom-3 md:right-3 z-20 p-2 bg-white rounded-lg md:rounded-xl shadow-md border border-gray-100 hover:bg-gray-50 text-gray-500 active:scale-95 transition-transform"
            >
                <RotateCcw
                    size={16}
                    strokeWidth={2.5}
                    className="md:w-5 md:h-5"
                />
            </button>
        </div>
    );
}
