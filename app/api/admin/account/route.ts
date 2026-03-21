import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { addCredits, deductCredits, setCredits } from '@/lib/credits';
import { normalizeEmail } from '@/lib/auth-users';
import { getAdminUserDetail, getAdminUserList } from '@/lib/admin-ops';
import { cancelSubscription, getOrCreateSubscription, setSubscriptionPlan } from '@/lib/subscriptions';
import { getPlanDefinition, parsePlanId } from '@/lib/pricing-policy';

function resolveUserId(value: unknown): string {
  return normalizeEmail(String(value || ''));
}

function makeReason(base: string, note: unknown): string {
  const normalizedNote = String(note || '').trim().replace(/\s+/g, ' ').slice(0, 160);
  return normalizedNote ? `${base}:${normalizedNote}` : base;
}

function requireReason(note: unknown): string | null {
  const normalized = String(note || '').trim();
  return normalized ? normalized : null;
}

export async function GET(request: NextRequest) {
  const admin = requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  try {
    const searchParams = request.nextUrl.searchParams;
    const view = String(searchParams.get('view') || 'list').trim().toLowerCase();

    if (view === 'detail') {
      const userId = resolveUserId(searchParams.get('userId') || searchParams.get('email'));
      if (!userId) {
        return NextResponse.json({ success: false, error: 'Geçerli bir kullanıcı seçin.' }, { status: 400 });
      }

      const detail = await getAdminUserDetail(userId);
      if (!detail) {
        return NextResponse.json({ success: false, error: 'Kullanıcı bulunamadı.' }, { status: 404 });
      }

      return NextResponse.json({ success: true, adminUserId: admin.userId, detail });
    }

    const query = String(searchParams.get('q') || '');
    const subscriptionStatus = String(searchParams.get('subscriptionStatus') || 'all') as 'all' | 'active' | 'cancelled' | 'none';
    const creditFilter = String(searchParams.get('creditFilter') || 'all') as 'all' | 'positive' | 'zero';
    const limit = Number(searchParams.get('limit') || 30);
    const offset = Number(searchParams.get('offset') || 0);

    const payload = await getAdminUserList({
      query,
      subscriptionStatus,
      creditFilter,
      limit,
      offset,
    });

    return NextResponse.json({ success: true, adminUserId: admin.userId, ...payload });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Yönetim verisi alınamadı.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  try {
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || '').trim();
    const userId = resolveUserId(body.userId || body.email);

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Geçerli bir kullanıcı seçin.' }, { status: 400 });
    }

    const currentDetail = await getAdminUserDetail(userId);
    if (!currentDetail) {
      return NextResponse.json({ success: false, error: 'Kullanıcı bulunamadı.' }, { status: 404 });
    }

    if (action === 'set_credits') {
      const amount = Number(body.amount);
      const reasonNote = requireReason(body.reason);
      if (!Number.isFinite(amount) || amount < 0) {
        return NextResponse.json({ success: false, error: 'Geçerli bir kredi değeri girin.' }, { status: 400 });
      }
      if (!reasonNote) {
        return NextResponse.json({ success: false, error: 'Kredi ayarlama işlemi için açıklama girin.' }, { status: 400 });
      }
      await setCredits(userId, amount, makeReason('super_admin_set', reasonNote));
    } else if (action === 'add_credits') {
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return NextResponse.json({ success: false, error: 'Eklenecek kredi 0’dan büyük olmalı.' }, { status: 400 });
      }
      await addCredits(userId, amount, makeReason('super_admin_add', body.reason));
    } else if (action === 'deduct_credits') {
      const amount = Number(body.amount);
      const reasonNote = requireReason(body.reason);
      if (!Number.isFinite(amount) || amount <= 0) {
        return NextResponse.json({ success: false, error: 'Düşülecek kredi 0’dan büyük olmalı.' }, { status: 400 });
      }
      if (!reasonNote) {
        return NextResponse.json({ success: false, error: 'Kredi düşme işlemi için açıklama girin.' }, { status: 400 });
      }
      const result = await deductCredits(userId, amount, makeReason('super_admin_deduct', reasonNote));
      if (!result.ok) {
        return NextResponse.json({ success: false, error: 'Kullanıcının bakiyesi bu işlem için yetersiz.' }, { status: 400 });
      }
    } else if (action === 'set_plan') {
      const planId = parsePlanId(body.planId);
      const resetCredits = body.resetCredits === true;
      if (!planId) {
        return NextResponse.json({ success: false, error: 'Geçerli bir paket seçin.' }, { status: 400 });
      }
      await setSubscriptionPlan(userId, planId);
      if (resetCredits) {
        const plan = getPlanDefinition(planId);
        await setCredits(userId, plan.monthlyCredits, makeReason(`super_admin_plan_change_${planId}`, body.reason));
      } else if (body.reason) {
        await addCredits(userId, 0, makeReason(`super_admin_plan_change_${planId}`, body.reason));
      }
    } else if (action === 'cancel_subscription') {
      const reasonNote = requireReason(body.reason);
      if (!reasonNote) {
        return NextResponse.json({ success: false, error: 'Abonelik iptali için açıklama girin.' }, { status: 400 });
      }
      const result = await cancelSubscription(userId);
      if (result.removedCredits === 0) {
        await addCredits(userId, 0, makeReason('super_admin_cancel_subscription', reasonNote));
      }
    } else if (action === 'reactivate_subscription') {
      const subscription = await getOrCreateSubscription(userId);
      await setSubscriptionPlan(userId, subscription.planId);
      if (body.resetCredits === true) {
        await setCredits(userId, subscription.monthlyCredits, makeReason(`super_admin_reactivate_${subscription.planId}`, body.reason));
      }
    } else {
      return NextResponse.json({ success: false, error: 'Geçersiz yönetim işlemi.' }, { status: 400 });
    }

    const detail = await getAdminUserDetail(userId);
    return NextResponse.json({ success: true, adminUserId: admin.userId, detail });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Yönetim işlemi başarısız oldu.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
