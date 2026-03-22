'use client';

import { createBrowserClient } from '@supabase/ssr';

let browserClient:
    | ReturnType<typeof createBrowserClient>
    | null = null;

function getSupabaseUrl(): string {
    return String(process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
}

function getSupabaseAnonKey(): string {
    return String(
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        ''
    ).trim();
}

export function isSupabaseBrowserConfigured(): boolean {
    return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export function getSupabaseBrowserClient() {
    const url = getSupabaseUrl();
    const anonKey = getSupabaseAnonKey();
    if (!url || !anonKey) {
        throw new Error('Supabase OAuth ayarları eksik.');
    }
    if (!browserClient) {
        browserClient = createBrowserClient(url, anonKey);
    }
    return browserClient;
}
