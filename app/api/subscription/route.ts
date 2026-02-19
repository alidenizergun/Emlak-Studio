import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

type PlanId = 'danisman' | 'ofis' | 'kurumsal';

interface SubscriptionInfo {
    planId: PlanId;
    planName: string;
    monthlyCredits: number;
    monthlyPrice: number;
    status: 'active' | 'cancelled';
    startDate: string;
    nextBillingDate: string;
    cancelledAt?: string;
    lastUsedCredits?: number;
}

const CREDITS_FILE = path.join(process.cwd(), 'data', 'credits.json');
const SUBSCRIPTIONS_FILE = path.join(process.cwd(), 'data', 'subscriptions.json');

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
    try {
        const raw = await readFile(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return (parsed ?? fallback) as T;
    } catch {
        return fallback;
    }
}

async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
    await writeFile(filePath, JSON.stringify(value, null, 2), 'utf-8');
}

function normalizePhone(phoneRaw: string | null): string {
    return String(phoneRaw || '').replace(/\D/g, '');
}

function addOneMonthIso(date: Date): string {
    const next = new Date(date);
    next.setMonth(next.getMonth() + 1);
    return next.toISOString();
}

function defaultPlanFromCredits(currentCredits: number): Omit<SubscriptionInfo, 'status' | 'startDate' | 'nextBillingDate'> {
    if (currentCredits >= 1000) {
        return {
            planId: 'kurumsal',
            planName: 'Kurumsal',
            monthlyCredits: 1000,
            monthlyPrice: 4999
        };
    }
    if (currentCredits >= 400) {
        return {
            planId: 'ofis',
            planName: 'Ofis',
            monthlyCredits: 400,
            monthlyPrice: 2499
        };
    }
    return {
        planId: 'danisman',
        planName: 'Danışman',
        monthlyCredits: 200,
        monthlyPrice: 1999
    };
}

function getOrCreateSubscription(phone: string, currentCredits: number, all: Record<string, SubscriptionInfo>): SubscriptionInfo {
    const existing = all[phone];
    if (existing) return existing;

    const now = new Date();
    const plan = defaultPlanFromCredits(currentCredits);
    const created: SubscriptionInfo = {
        ...plan,
        status: 'active',
        startDate: now.toISOString(),
        nextBillingDate: addOneMonthIso(now)
    };
    all[phone] = created;
    return created;
}

export async function GET(request: NextRequest) {
    try {
        const phone = normalizePhone(request.nextUrl.searchParams.get('phone'));
        if (!phone) {
            return NextResponse.json({ success: false, error: 'Telefon numarası gerekli' }, { status: 400 });
        }

        const creditsData = await readJsonFile<Record<string, number>>(CREDITS_FILE, {});
        const subscriptionsData = await readJsonFile<Record<string, SubscriptionInfo>>(SUBSCRIPTIONS_FILE, {});
        const currentCredits = Math.max(0, creditsData[phone] ?? 0);
        const subscription = getOrCreateSubscription(phone, currentCredits, subscriptionsData);
        const usedCredits = Math.max(0, subscription.monthlyCredits - Math.min(currentCredits, subscription.monthlyCredits));

        await writeJsonFile(SUBSCRIPTIONS_FILE, subscriptionsData);

        return NextResponse.json({
            success: true,
            subscription,
            credits: currentCredits,
            usedCredits
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Sunucu hatası';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const phone = normalizePhone(body.phone ?? null);
        const action = String(body.action || '');

        if (!phone) {
            return NextResponse.json({ success: false, error: 'Telefon numarası gerekli' }, { status: 400 });
        }
        if (action !== 'cancel') {
            return NextResponse.json({ success: false, error: 'Geçersiz işlem' }, { status: 400 });
        }

        const creditsData = await readJsonFile<Record<string, number>>(CREDITS_FILE, {});
        const subscriptionsData = await readJsonFile<Record<string, SubscriptionInfo>>(SUBSCRIPTIONS_FILE, {});
        const currentCredits = Math.max(0, creditsData[phone] ?? 0);
        const subscription = getOrCreateSubscription(phone, currentCredits, subscriptionsData);

        if (subscription.status === 'cancelled') {
            return NextResponse.json({
                success: true,
                alreadyCancelled: true,
                subscription,
                credits: currentCredits
            });
        }

        const usedCredits = Math.max(0, subscription.monthlyCredits - Math.min(currentCredits, subscription.monthlyCredits));
        const remainingCredits = currentCredits;

        subscriptionsData[phone] = {
            ...subscription,
            status: 'cancelled',
            cancelledAt: new Date().toISOString(),
            lastUsedCredits: usedCredits
        };

        // İptalde kullanılmamış kredileri sıfırla.
        creditsData[phone] = 0;

        await Promise.all([
            writeJsonFile(SUBSCRIPTIONS_FILE, subscriptionsData),
            writeJsonFile(CREDITS_FILE, creditsData)
        ]);

        return NextResponse.json({
            success: true,
            message: 'Abonelik iptal edildi',
            subscription: subscriptionsData[phone],
            credits: 0,
            usedCredits,
            removedCredits: remainingCredits
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Sunucu hatası';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

