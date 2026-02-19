import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const CREDITS_FILE = path.join(process.cwd(), 'data', 'credits.json');
let creditsWriteQueue: Promise<void> = Promise.resolve();

function normalizePhone(phone: string): string {
    return String(phone || '').replace(/\D/g, '');
}

async function getCreditsData(): Promise<Record<string, number>> {
    try {
        const raw = await readFile(CREDITS_FILE, 'utf-8');
        const data = JSON.parse(raw);
        return typeof data === 'object' && data !== null ? data : {};
    } catch {
        return {};
    }
}

async function setCreditsData(data: Record<string, number>): Promise<void> {
    await writeFile(CREDITS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

async function withCreditsWriteLock<T>(action: () => Promise<T>): Promise<T> {
    const previous = creditsWriteQueue;
    let release: () => void = () => {};
    creditsWriteQueue = new Promise<void>((resolve) => {
        release = resolve;
    });

    await previous;
    try {
        return await action();
    } finally {
        release();
    }
}

export async function deductCredits(phoneRaw: string, amountRaw: number): Promise<{
    ok: boolean;
    credits: number;
}> {
    const phone = normalizePhone(phoneRaw);
    const amount = Math.max(0, Math.ceil(Number(amountRaw) || 0));

    if (!phone || amount <= 0) {
        return { ok: false, credits: 0 };
    }

    return withCreditsWriteLock(async () => {
        const data = await getCreditsData();
        const current = data[phone] ?? 0;
        if (current < amount) {
            return { ok: false, credits: current };
        }
        data[phone] = current - amount;
        await setCreditsData(data);
        return { ok: true, credits: data[phone] };
    });
}

