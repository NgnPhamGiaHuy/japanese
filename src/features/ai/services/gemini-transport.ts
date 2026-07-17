/**
 * @file gemini-transport
 * Raw Firebase AI Logic call primitives — split out of gemini.service.ts
 * (E11-T3) so the transport concern (how a prompt reaches Gemini) is
 * separate from response parsing/validation and the public generate*
 * orchestration functions.
 *
 * All Gemini calls are proxied through Firebase AI Logic — no API key is
 * ever present in client code or the client bundle. App Check (once
 * enabled, see the App Check hardening work) attests the caller to Firebase
 * before the request is forwarded to the Gemini provider.
 *
 * A prior direct-REST path with a client-exposed API key existed here and
 * has been removed entirely — do not reintroduce a client-side Gemini key
 * (any env var prefixed NEXT_PUBLIC_ is inlined into the browser bundle).
 */
import { getGenerativeModel } from "firebase/ai";

import { firebaseAI } from "@/lib/firebase";
import { AI_CONFIG } from "../config";

function getFirebaseModel(modelName: string) {
    return getGenerativeModel(firebaseAI, {
        model: modelName,
        generationConfig: {
            responseMimeType: AI_CONFIG.generation.responseMimeType,
            temperature: AI_CONFIG.generation.temperature,
            topP: AI_CONFIG.generation.topP,
            maxOutputTokens: AI_CONFIG.generation.maxOutputTokens,
        },
    });
}

async function callFirebaseAI(modelName: string, prompt: string): Promise<string> {
    const model = getFirebaseModel(modelName);
    const result = await model.generateContent(prompt);
    return result.response.text();
}

async function fileToBase64(file: File): Promise<{ mimeType: string; data: string }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const data = result.split(",")[1];
            resolve({ mimeType: file.type, data });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/** Generates content via Firebase AI Logic — see the module header for why. */
export async function generateContent(modelName: string, prompt: string): Promise<string> {
    return callFirebaseAI(modelName, prompt);
}

export async function generateMultimodalContent(
    modelName: string,
    prompt: string,
    files: File[],
): Promise<string> {
    const base64Files = await Promise.all(files.map(fileToBase64));
    const model = getFirebaseModel(modelName);
    const parts = [
        prompt,
        ...base64Files.map((f) => ({
            inlineData: { mimeType: f.mimeType, data: f.data },
        })),
    ];
    const result = await model.generateContent(parts);
    return result.response.text();
}

/**
 * Strips markdown code fences and extracts raw JSON from AI responses.
 * Handles patterns like:
 *   ```json\n{...}\n```
 *   ```\n{...}\n```
 *   plain JSON
 */
export function extractJSON(raw: string): string {
    const trimmed = raw.trim();
    // Strip ```json ... ``` or ``` ... ``` wrappers
    const fenceMatch = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/);
    if (fenceMatch) return fenceMatch[1].trim();
    return trimmed;
}
