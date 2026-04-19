export type NativePlatform = 'ios' | 'android' | 'web' | 'unknown';

interface CapacitorLike {
    getPlatform?: () => string;
    platform?: string;
    isNativePlatform?: () => boolean;
}

interface BrowserWindowLike {
    Capacitor?: CapacitorLike;
}

export interface RuntimeSnapshot {
    isBrowser: boolean;
    hasCapacitor: boolean;
    isNativeApp: boolean;
    nativePlatform: NativePlatform;
    isIOSNative: boolean;
}

export interface RuntimeFeatureGates {
    useIOSNativeAuth: boolean;
    useIOSNativePurchases: boolean;
    hideGoogleAuthOnIOSNative: boolean;
}

const WEB_RUNTIME_SNAPSHOT: RuntimeSnapshot = {
    isBrowser: false,
    hasCapacitor: false,
    isNativeApp: false,
    nativePlatform: 'web',
    isIOSNative: false,
};

export function getWebRuntimeSnapshot(): RuntimeSnapshot {
    return WEB_RUNTIME_SNAPSHOT;
}

function normalizePlatform(value: string | undefined): NativePlatform {
    if (!value) return 'unknown';
    const normalized = value.toLowerCase();
    if (normalized === 'ios') return 'ios';
    if (normalized === 'android') return 'android';
    if (normalized === 'web') return 'web';
    return 'unknown';
}

export function detectRuntime(windowOverride?: BrowserWindowLike): RuntimeSnapshot {
    const currentWindow = windowOverride ?? (typeof window !== 'undefined' ? (window as BrowserWindowLike) : undefined);
    const capacitor = currentWindow?.Capacitor;

    const platform = normalizePlatform(capacitor?.getPlatform?.() ?? capacitor?.platform);
    const nativeFromAPI = Boolean(capacitor?.isNativePlatform?.());
    const nativeFromPlatform = platform !== 'web' && platform !== 'unknown';
    const isNativeApp = nativeFromAPI || nativeFromPlatform;

    return {
        isBrowser: typeof window !== 'undefined' || Boolean(windowOverride),
        hasCapacitor: Boolean(capacitor),
        isNativeApp,
        nativePlatform: isNativeApp ? platform : 'web',
        isIOSNative: isNativeApp && platform === 'ios',
    };
}

export function getRuntimeFeatureGates(runtime: RuntimeSnapshot): RuntimeFeatureGates {
    const useIOSNativeFlows = runtime.isIOSNative;
    return {
        useIOSNativeAuth: useIOSNativeFlows,
        useIOSNativePurchases: useIOSNativeFlows,
        hideGoogleAuthOnIOSNative: useIOSNativeFlows,
    };
}

export function getPricingCtaHref(runtime: RuntimeSnapshot, planId: string): string {
    if (getRuntimeFeatureGates(runtime).useIOSNativePurchases) {
        return `/checkout?native=ios&plan=${encodeURIComponent(planId)}`;
    }

    return `/contact?plan=${encodeURIComponent(planId)}`;
}
