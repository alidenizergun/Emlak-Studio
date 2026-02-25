export type PlanId = 'danisman' | 'ofis' | 'kurumsal';
export type BillingCycle = 'monthly' | 'yearly';

export interface PlanDefinition {
    id: PlanId;
    name: string;
    monthlyPrice: number;
    monthlyCredits: number;
}

export const PLAN_DEFINITIONS: Record<PlanId, PlanDefinition> = {
    danisman: { id: 'danisman', name: 'Danışman', monthlyPrice: 1999, monthlyCredits: 200 },
    ofis: { id: 'ofis', name: 'Ofis', monthlyPrice: 2499, monthlyCredits: 400 },
    kurumsal: { id: 'kurumsal', name: 'Kurumsal', monthlyPrice: 4999, monthlyCredits: 1000 },
};

const YEARLY_DISCOUNT_MULTIPLIER = 0.8;

export function parsePlanId(value: string | null | undefined): PlanId | null {
    if (value === 'danisman' || value === 'ofis' || value === 'kurumsal') return value;
    return null;
}

export function parseBillingCycle(value: string | null | undefined): BillingCycle {
    return value === 'yearly' ? 'yearly' : 'monthly';
}

export function isBillingCycle(value: string | null | undefined): value is BillingCycle {
    return value === 'monthly' || value === 'yearly';
}

export function getPlanDefinition(planId: PlanId): PlanDefinition {
    return PLAN_DEFINITIONS[planId];
}

export function getSubscriptionCharge(planId: PlanId, billing: BillingCycle): number {
    const plan = getPlanDefinition(planId);
    if (billing === 'yearly') {
        return Math.round(plan.monthlyPrice * YEARLY_DISCOUNT_MULTIPLIER * 12);
    }
    return plan.monthlyPrice;
}

export function getTopupTotal(planId: PlanId, credits: number): number {
    const safeCredits = Math.max(0, Math.floor(Number(credits) || 0));
    const plan = getPlanDefinition(planId);
    const perCreditPrice = plan.monthlyPrice / Math.max(plan.monthlyCredits, 1);
    return Math.round(perCreditPrice * safeCredits);
}

export function getPerCreditPrice(planId: PlanId): number {
    const plan = getPlanDefinition(planId);
    return plan.monthlyPrice / Math.max(plan.monthlyCredits, 1);
}
