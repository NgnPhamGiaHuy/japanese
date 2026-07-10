"use client";

import { useSyncExternalStore } from "react";

import { getAudioStatus, subscribeAudioStatus } from "./status";

import type { AudioStatus } from "./status";

/** Server render has no audio, so it can only ever be healthy. */
const getServerSnapshot = (): AudioStatus => "ok";

/** Subscribes a component to pronunciation health. */
export function useAudioStatus(): AudioStatus {
    return useSyncExternalStore(subscribeAudioStatus, getAudioStatus, getServerSnapshot);
}
