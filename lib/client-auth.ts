'use client';

const AUTH_FLAG_KEY = 'emlak_authed';
const USER_EMAIL_KEY = 'emlak_user_email';
const LEGACY_USER_KEY = 'emlak_user_phone';

export function getStoredUserId(): string {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(USER_EMAIL_KEY) || window.localStorage.getItem(LEGACY_USER_KEY) || '';
}

export function persistStoredUserId(userId: string): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(AUTH_FLAG_KEY, '1');
    window.localStorage.setItem(USER_EMAIL_KEY, userId);
    // Legacy compatibility for flows not yet fully renamed.
    window.localStorage.setItem(LEGACY_USER_KEY, userId);
}

export function clearStoredAuth(): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(AUTH_FLAG_KEY);
    window.localStorage.removeItem(USER_EMAIL_KEY);
    window.localStorage.removeItem(LEGACY_USER_KEY);
    window.localStorage.removeItem('emlak_credits');
}

export function isStoredAuthed(): boolean {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(AUTH_FLAG_KEY) === '1';
}

export type AuthSessionState = 'valid' | 'invalid' | 'unknown';

export async function reconcileAuthSessionWithServer(): Promise<AuthSessionState> {
    if (typeof window === 'undefined') return 'unknown';

    try {
        const response = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
        });
        const payload = await response.json().catch(() => ({}));

        if (response.ok && payload?.success && typeof payload?.email === 'string' && payload.email) {
            persistStoredUserId(payload.email);
            return 'valid';
        }

        if (response.status === 401 || response.status === 403) {
            clearStoredAuth();
            return 'invalid';
        }

        return 'unknown';
    } catch {
        return 'unknown';
    }
}
