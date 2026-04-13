import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';

function getConfiguredAdminEmails(): string[] {
    return String(process.env.ADMIN_EMAILS || '')
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
}

export function getOwnerAdminEmail(): string {
    const explicitOwner = String(
        process.env.OWNER_EMAIL ||
        process.env.SUPER_ADMIN_EMAIL ||
        ''
    ).trim().toLowerCase();

    if (explicitOwner) return explicitOwner;

    const configuredAdmins = getConfiguredAdminEmails();
    if (configuredAdmins[0]) return configuredAdmins[0];

    return '';
}

export function isAdminUser(userId: string | null | undefined): boolean {
    const normalized = String(userId || '').trim().toLowerCase();
    if (!normalized) return false;
    return normalized === getOwnerAdminEmail();
}

export function requireAdmin(request: NextRequest): { userId: string } | NextResponse {
    const userId = getSessionUser(request);
    if (!userId) {
        return NextResponse.json({ success: false, error: 'Oturum bulunamadı. Tekrar giriş yapın.' }, { status: 401 });
    }
    if (!isAdminUser(userId)) {
        return NextResponse.json({ success: false, error: 'Bu alan sadece yönetici hesabına açık.' }, { status: 403 });
    }
    return { userId };
}
