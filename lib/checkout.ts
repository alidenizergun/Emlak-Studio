export type BillingCycle = 'monthly' | 'yearly';

export interface PendingCheckoutSelection {
    planId: string;
    billing: BillingCycle;
}

export type CheckoutSource = 'pricing' | 'topup';

const PENDING_CHECKOUT_KEY = 'emlak_pending_checkout';
const POST_AUTH_REDIRECT_KEY = 'emlak_post_auth_redirect';
const CHECKOUT_SOURCE_KEY = 'emlak_checkout_source';

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

export function setCheckoutSource(source: CheckoutSource): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(CHECKOUT_SOURCE_KEY, source);
}

export function readCheckoutSource(): CheckoutSource | null {
    if (typeof window === 'undefined') return null;
    const source = window.localStorage.getItem(CHECKOUT_SOURCE_KEY);
    if (source === 'pricing' || source === 'topup') return source;
    return null;
}

export function clearCheckoutSource(): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(CHECKOUT_SOURCE_KEY);
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
