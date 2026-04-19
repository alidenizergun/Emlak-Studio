'use client';

import { useSyncExternalStore } from 'react';
import { detectRuntime, getWebRuntimeSnapshot, type RuntimeSnapshot } from '@/lib/runtime-env';

let cachedRuntime: RuntimeSnapshot | undefined;

function subscribeRuntime() {
    return () => {};
}

function snapshotsMatch(a: RuntimeSnapshot, b: RuntimeSnapshot): boolean {
    return (
        a.isBrowser === b.isBrowser &&
        a.hasCapacitor === b.hasCapacitor &&
        a.isNativeApp === b.isNativeApp &&
        a.nativePlatform === b.nativePlatform &&
        a.isIOSNative === b.isIOSNative
    );
}

function getClientRuntimeSnapshot(): RuntimeSnapshot {
    const runtime = detectRuntime();

    if (cachedRuntime && snapshotsMatch(cachedRuntime, runtime)) {
        return cachedRuntime;
    }

    cachedRuntime = runtime;
    return runtime;
}

export function useRuntimeSnapshot(): RuntimeSnapshot {
    return useSyncExternalStore(subscribeRuntime, getClientRuntimeSnapshot, getWebRuntimeSnapshot);
}
