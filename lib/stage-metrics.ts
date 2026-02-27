type FailReason = 'input_quality' | 'room_type' | 'architecture' | 'output_quality' | 'provider' | 'hard_block' | 'other';

interface StageMetrics {
    total: number;
    firstPassSuccess: number;
    retryUsed: number;
    success: number;
    failed: number;
    failReasons: Record<FailReason, number>;
    totalLatencyMs: number;
}

const metrics: StageMetrics = {
    total: 0,
    firstPassSuccess: 0,
    retryUsed: 0,
    success: 0,
    failed: 0,
    failReasons: {
        input_quality: 0,
        room_type: 0,
        architecture: 0,
        output_quality: 0,
        provider: 0,
        hard_block: 0,
        other: 0,
    },
    totalLatencyMs: 0,
};

export function trackStageStart(): number {
    metrics.total += 1;
    return Date.now();
}

export function trackStageFirstPassSuccess(): void {
    metrics.firstPassSuccess += 1;
}

export function trackStageRetry(): void {
    metrics.retryUsed += 1;
}

export function trackStageSuccess(startedAt: number): void {
    metrics.success += 1;
    metrics.totalLatencyMs += Date.now() - startedAt;
}

export function trackStageFailure(reason: FailReason, startedAt: number): void {
    metrics.failed += 1;
    metrics.failReasons[reason] += 1;
    metrics.totalLatencyMs += Date.now() - startedAt;
}

export function snapshotStageMetrics(): {
    total: number;
    successRate: number;
    firstPassSuccessRate: number;
    retryRate: number;
    avgLatencyMs: number;
    failReasons: Record<FailReason, number>;
} {
    const total = Math.max(metrics.total, 1);
    return {
        total: metrics.total,
        successRate: metrics.success / total,
        firstPassSuccessRate: metrics.firstPassSuccess / total,
        retryRate: metrics.retryUsed / total,
        avgLatencyMs: metrics.totalLatencyMs / total,
        failReasons: metrics.failReasons,
    };
}
