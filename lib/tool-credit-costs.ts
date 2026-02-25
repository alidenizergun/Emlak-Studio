export const TOOL_CREDIT_COSTS = {
    stage: 2,
    removeObjectAll: 2,
    removeObjectPrompt: 2,
    listingText: 1,
    virtualRenovation: 2,
    aiTourGuide: 10,
    enhanceAuto: 5,
    enhanceManualOption: 1,
} as const;

export function getEnhanceCreditCost(options: Record<string, boolean>): number {
    if (options?.auto) return TOOL_CREDIT_COSTS.enhanceAuto;

    const manualOptionIds = ['lighting', 'color', 'sharpness', 'clean', 'privacy', 'sky', 'twilight'];
    const selectedCount = manualOptionIds.reduce((acc, key) => acc + (options?.[key] ? 1 : 0), 0);
    return selectedCount * TOOL_CREDIT_COSTS.enhanceManualOption;
}
