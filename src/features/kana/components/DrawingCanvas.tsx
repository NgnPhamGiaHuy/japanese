"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

import KanaStrokeAnimation from "./KanaStrokeAnimation";

interface DrawingCanvasProps {
    char: string;
    activeFont: string;
    showGuide?: boolean;
    stepKey?: number;
    strokeColor?: string;
}

const DrawingCanvas = ({
    char,
    activeFont,
    showGuide = true,
    stepKey = 1,
    strokeColor = "#58cc02",
}: DrawingCanvasProps) => {
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
        <div className="relative mx-auto flex aspect-square w-full max-w-[200px] shrink-0 items-center justify-center overflow-hidden rounded-3xl border-2 border-gray-200 bg-white shadow-sm md:max-w-[280px]">
            {showGuide && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-25">
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
                className="relative z-10 h-full w-full cursor-crosshair touch-none"
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
                className="absolute right-2 bottom-2 z-20 rounded-lg border border-gray-100 bg-white p-2 text-gray-500 shadow-md transition-transform hover:bg-gray-50 active:scale-95 md:right-3 md:bottom-3 md:rounded-xl"
            >
                <RotateCcw size={16} strokeWidth={2.5} className="md:h-5 md:w-5" />
            </button>
        </div>
    );
};

export default DrawingCanvas;
