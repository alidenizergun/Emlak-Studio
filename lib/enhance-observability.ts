export type EnhanceProcessingMode = 'ai' | 'ai_cached' | 'fallback_local' | 'failed';

export interface EnhanceDiagnosticRecord {
    at: number;
    requestKey?: string;
    model?: string;
    processingMode: EnhanceProcessingMode;
    fallbackReason?: string;
    appliedOptionsResolved?: string[];
    architectureScore?: number;
    contractScore?: number;
    outputQualityScore?: number;
    isBlackOutput?: boolean;
    usedCredits: number;
    creditCharged: boolean;
    latencyMs: number;
    aiLatencyMs?: number;
    totalLatencyMs?: number;
}

const MAX_RECORDS = 50;
const recentEnhanceRecords: EnhanceDiagnosticRecord[] = [];

export function recordEnhanceDiagnostic(record: EnhanceDiagnosticRecord): {
    fallbackRateLast50: number;
    failedRateLast50: number;
    total: number;
} {
    recentEnhanceRecords.push(record);
    if (recentEnhanceRecords.length > MAX_RECORDS) {
        recentEnhanceRecords.splice(0, recentEnhanceRecords.length - MAX_RECORDS);
    }

    const total = recentEnhanceRecords.length || 1;
    const fallbackCount = recentEnhanceRecords.filter((x) => x.processingMode === 'fallback_local').length;
    const failedCount = recentEnhanceRecords.filter((x) => x.processingMode === 'failed').length;

    return {
        fallbackRateLast50: fallbackCount / total,
        failedRateLast50: failedCount / total,
        total,
    };
}

export function getEnhanceDiagnosticsLast50(): EnhanceDiagnosticRecord[] {
    return recentEnhanceRecords.slice();
}
