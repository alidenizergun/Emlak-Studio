export type BillingCycle = 'monthly' | 'yearly';

export interface PendingCheckoutSelection {
    planId: string;
    billing: BillingCycle;
}

const PENDING_CHECKOUT_KEY = 'emlak_pending_checkout';
const POST_AUTH_REDIRECT_KEY = 'emlak_post_auth_redirect';

export function savePendingCheckoutSelection(selection: PendingCheckoutSelection): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(selection));
}

export function readPendingCheckoutSelection(): PendingCheckoutSelection | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(PENDING_CHECKOUT_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as PendingCheckoutSelection;
        if (!parsed?.planId || (parsed.billing !== 'monthly' && parsed.billing !== 'yearly')) return null;
        return parsed;
    } catch {
        return null;
    }
}

export function clearPendingCheckoutSelection(): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(PENDING_CHECKOUT_KEY);
}

export function setPostAuthRedirect(path: string): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(POST_AUTH_REDIRECT_KEY, path);
}

export function readPostAuthRedirect(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(POST_AUTH_REDIRECT_KEY);
}

export function clearPostAuthRedirect(): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(POST_AUTH_REDIRECT_KEY);
}

