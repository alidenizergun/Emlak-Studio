import { NextResponse } from 'next/server';

export async function POST() {
    return NextResponse.json(
        { success: false, code: 'AUTH_METHOD_CHANGED', error: 'SMS ile dogrulama kaldirildi. Lutfen e-posta ve sifre ile giris yapin.' },
        { status: 410 }
    );
}
