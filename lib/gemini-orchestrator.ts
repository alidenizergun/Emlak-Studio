import { generateEditedImageWithNanoBanana, type NanoBananaAttemptLog } from '@/lib/nano-banana';
import { verifyArchitectureIntegrity } from '@/lib/architecture-guard';
import { verifyOutputImageQuality } from '@/lib/image-quality-guard';
import { verifyStageArtifacts } from '@/lib/stage-artifact-guard';
import { postprocessListingImage } from '@/lib/output-postprocess';

export type VisualTool = 'stage' | 'enhance' | 'remove-object' | 'virtual-renovation';
export type OrchestratorRejectReason = 'timeout' | 'provider' | 'architecture' | 'quality';
export type AcceptanceReason = 'accepted' | 'soft_quality_accept' | 'local_fallback';

export interface GeminiExecutionTelemetry {
    selectedModel: string;
    selectedPolicyClass: 'easy' | 'medium' | 'hard';
    selectedModelRationale?: string[];
    retryCount: number;
    fallbackUsed: boolean;
    attemptedModels: string[];
    attemptLog?: NanoBananaAttemptLog[];
    timing: {
        totalMs: number;
        generationMs: number;
        evaluationMs: number;
    };
    acceptanceReason?: AcceptanceReason;
    timeoutRecovered: boolean;
}

export interface VisualAttemptEvaluation {
    ok: boolean;
    reason?: Exclude<OrchestratorRejectReason, 'timeout' | 'provider'>;
    finalizedImageUrl: string;
    architectureScore?: number;
    qualityScore?: number;
    artifactScore?: number;
    acceptanceReason?: AcceptanceReason;
}

interface AttemptInput {
    image: File;
    prompt: string;
    preferredModels: string[];
    tool: VisualTool;
    allowArchitecturalChanges?: boolean;
    prepareForEvaluation?: (imageUrl: string) => Promise<string>;
    architectureThreshold?: number;
    skipArchitectureGuard?: boolean;
    enableArtifactGuard?: boolean;
    softQualityMinScore?: number;
}

export interface OrchestratedVisualGenerationInput {
    image: File;
    prompt: string;
    preferredModels: string[];
    tool: VisualTool;
    policyClass: 'easy' | 'medium' | 'hard';
    policyRationale?: string[];
    allowArchitecturalChanges?: boolean;
    architectureThreshold?: number;
    skipArchitectureGuard?: boolean;
    enableArtifactGuard?: boolean;
    softQualityMinScore?: number;
    retryPrompt?: (basePrompt: string, reason: 'architecture' | 'quality') => string;
    fastRetryPrompt?: (basePrompt: string) => string;
    prepareForEvaluation?: (imageUrl: string) => Promise<string>;
}

export interface OrchestratedVisualGenerationResult {
    ok: boolean;
    reason?: OrchestratorRejectReason;
    error?: string;
    imageUrl?: string;
    architectureScore?: number;
    qualityScore?: number;
    artifactScore?: number;
    generation?: Awaited<ReturnType<typeof generateEditedImageWithNanoBanana>>;
    telemetry: GeminiExecutionTelemetry;
}

function isTimeoutError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error || '');
    return message.toLowerCase().includes('timeout') || message.toLowerCase().includes('zaman aşımı');
}

export async function generateGeminiWithRecovery(input: {
    image: File;
    prompt: string;
    preferredModels: string[];
    allowArchitecturalChanges?: boolean;
    fastRetryPrompt?: (basePrompt: string) => string;
}): Promise<{
    ok: boolean;
    generation?: Awaited<ReturnType<typeof generateEditedImageWithNanoBanana>>;
    retryCount: number;
    timeoutRecovered: boolean;
    error?: string;
}> {
    try {
        const generation = await generateEditedImageWithNanoBanana({
            image: input.image,
            prompt: input.prompt,
            preferredModels: input.preferredModels,
            allowArchitecturalChanges: input.allowArchitecturalChanges,
        });
        return { ok: true, generation, retryCount: 0, timeoutRecovered: false };
    } catch (error) {
        if (!isTimeoutError(error) || !input.fastRetryPrompt) {
            return {
                ok: false,
                retryCount: 0,
                timeoutRecovered: false,
                error: error instanceof Error ? error.message : 'Gemini istegi basarisiz oldu',
            };
        }
        try {
            const generation = await generateEditedImageWithNanoBanana({
                image: input.image,
                prompt: input.fastRetryPrompt(input.prompt),
                preferredModels: input.preferredModels,
                allowArchitecturalChanges: input.allowArchitecturalChanges,
            });
            return { ok: true, generation, retryCount: 1, timeoutRecovered: true };
        } catch (retryError) {
            return {
                ok: false,
                retryCount: 1,
                timeoutRecovered: true,
                error: retryError instanceof Error ? retryError.message : 'Gemini istegi basarisiz oldu',
            };
        }
    }
}

async function evaluateAttempt({
    image,
    prompt,
    preferredModels,
    tool,
    allowArchitecturalChanges = false,
    prepareForEvaluation,
    architectureThreshold,
    skipArchitectureGuard = false,
    enableArtifactGuard = false,
    softQualityMinScore,
}: AttemptInput): Promise<{
    generation: Awaited<ReturnType<typeof generateEditedImageWithNanoBanana>>;
    evaluation: VisualAttemptEvaluation;
    generationMs: number;
    evaluationMs: number;
}> {
    const generationStartedAt = Date.now();
    const generation = await generateEditedImageWithNanoBanana({
        image,
        prompt,
        allowArchitecturalChanges,
        preferredModels,
    });
    const generationMs = Date.now() - generationStartedAt;

    const evaluationStartedAt = Date.now();
    const preparedImageUrl = prepareForEvaluation
        ? await prepareForEvaluation(generation.imageUrl)
        : generation.imageUrl;
    const finalizedImageUrl = await postprocessListingImage(preparedImageUrl, { tool });

    const quality = await verifyOutputImageQuality(image, finalizedImageUrl, tool);
    if (!quality.ok) {
        const score = Number(quality.score ?? 0);
        if (typeof softQualityMinScore === 'number' && score >= softQualityMinScore) {
            return {
                generation: { ...generation, imageUrl: finalizedImageUrl },
                evaluation: {
                    ok: true,
                    finalizedImageUrl,
                    qualityScore: score,
                    acceptanceReason: 'soft_quality_accept',
                },
                generationMs,
                evaluationMs: Date.now() - evaluationStartedAt,
            };
        }
        return {
            generation: { ...generation, imageUrl: finalizedImageUrl },
            evaluation: {
                ok: false,
                reason: 'quality',
                finalizedImageUrl,
                qualityScore: score,
            },
            generationMs,
            evaluationMs: Date.now() - evaluationStartedAt,
        };
    }

    if (!skipArchitectureGuard) {
        const integrity = await verifyArchitectureIntegrity(image, finalizedImageUrl, architectureThreshold);
        if (!integrity.ok) {
            return {
                generation: { ...generation, imageUrl: finalizedImageUrl },
                evaluation: {
                    ok: false,
                    reason: 'architecture',
                    finalizedImageUrl,
                    architectureScore: integrity.score,
                    qualityScore: quality.score,
                },
                generationMs,
                evaluationMs: Date.now() - evaluationStartedAt,
            };
        }
        if (enableArtifactGuard) {
            const artifact = await verifyStageArtifacts(image, finalizedImageUrl);
            if (!artifact.ok) {
                return {
                    generation: { ...generation, imageUrl: finalizedImageUrl },
                    evaluation: {
                        ok: false,
                        reason: 'quality',
                        finalizedImageUrl,
                        architectureScore: integrity.score,
                        qualityScore: quality.score,
                        artifactScore: artifact.score,
                    },
                    generationMs,
                    evaluationMs: Date.now() - evaluationStartedAt,
                };
            }
            return {
                generation: { ...generation, imageUrl: finalizedImageUrl },
                evaluation: {
                    ok: true,
                    finalizedImageUrl,
                    architectureScore: integrity.score,
                    qualityScore: quality.score,
                    artifactScore: artifact.score,
                    acceptanceReason: 'accepted',
                },
                generationMs,
                evaluationMs: Date.now() - evaluationStartedAt,
            };
        }
        return {
            generation: { ...generation, imageUrl: finalizedImageUrl },
            evaluation: {
                ok: true,
                finalizedImageUrl,
                architectureScore: integrity.score,
                qualityScore: quality.score,
                acceptanceReason: 'accepted',
            },
            generationMs,
            evaluationMs: Date.now() - evaluationStartedAt,
        };
    }

    return {
        generation: { ...generation, imageUrl: finalizedImageUrl },
        evaluation: {
            ok: true,
            finalizedImageUrl,
            qualityScore: quality.score,
            acceptanceReason: 'accepted',
        },
        generationMs,
        evaluationMs: Date.now() - evaluationStartedAt,
    };
}

export async function orchestrateVisualGeneration(input: OrchestratedVisualGenerationInput): Promise<OrchestratedVisualGenerationResult> {
    const startedAt = Date.now();
    let retryCount = 0;
    let timeoutRecovered = false;

    const baseTelemetry: GeminiExecutionTelemetry = {
        selectedModel: input.preferredModels[0],
        selectedPolicyClass: input.policyClass,
        selectedModelRationale: input.policyRationale,
        retryCount: 0,
        fallbackUsed: false,
        attemptedModels: [],
        attemptLog: undefined,
        timing: {
            totalMs: 0,
            generationMs: 0,
            evaluationMs: 0,
        },
        timeoutRecovered: false,
    };

    const run = async (prompt: string) => evaluateAttempt({
        image: input.image,
        prompt,
        preferredModels: input.preferredModels,
        tool: input.tool,
        allowArchitecturalChanges: input.allowArchitecturalChanges,
        prepareForEvaluation: input.prepareForEvaluation,
        architectureThreshold: input.architectureThreshold,
        skipArchitectureGuard: input.skipArchitectureGuard,
        enableArtifactGuard: input.enableArtifactGuard,
        softQualityMinScore: input.softQualityMinScore,
    });

    try {
        let first;
        try {
            first = await run(input.prompt);
        } catch (error) {
            if (!isTimeoutError(error) || !input.fastRetryPrompt) {
                throw error;
            }
            retryCount += 1;
            timeoutRecovered = true;
            first = await run(input.fastRetryPrompt(input.prompt));
        }

        let chosen = first;
        if (!chosen.evaluation.ok && input.retryPrompt && chosen.evaluation.reason) {
            retryCount += 1;
            const retried = await run(input.retryPrompt(input.prompt, chosen.evaluation.reason));
            if (retried.evaluation.ok || (Number(retried.evaluation.qualityScore ?? 0) > Number(chosen.evaluation.qualityScore ?? 0))) {
                chosen = retried;
            }
        }

        const telemetry: GeminiExecutionTelemetry = {
            ...baseTelemetry,
            selectedModel: chosen.generation.model,
            retryCount,
            fallbackUsed: chosen.generation.fallbackUsed,
            attemptedModels: chosen.generation.attemptedModels,
            attemptLog: chosen.generation.attemptLog,
            timing: {
                totalMs: Date.now() - startedAt,
                generationMs: chosen.generationMs,
                evaluationMs: chosen.evaluationMs,
            },
            acceptanceReason: chosen.evaluation.acceptanceReason,
            timeoutRecovered,
        };

        if (!chosen.evaluation.ok) {
            return {
                ok: false,
                reason: chosen.evaluation.reason,
                error:
                    chosen.evaluation.reason === 'architecture'
                        ? `Mimari detaylar korunamadi (skor: ${Number(chosen.evaluation.architectureScore ?? 0).toFixed(2)}).`
                        : `Cikti kalite kontrolden gecemedi (skor: ${Number(chosen.evaluation.qualityScore ?? 0).toFixed(2)}).`,
                imageUrl: chosen.evaluation.finalizedImageUrl,
                generation: chosen.generation,
                architectureScore: chosen.evaluation.architectureScore,
                qualityScore: chosen.evaluation.qualityScore,
                artifactScore: chosen.evaluation.artifactScore,
                telemetry,
            };
        }

        return {
            ok: true,
            imageUrl: chosen.evaluation.finalizedImageUrl,
            generation: { ...chosen.generation, imageUrl: chosen.evaluation.finalizedImageUrl },
            architectureScore: chosen.evaluation.architectureScore,
            qualityScore: chosen.evaluation.qualityScore,
            artifactScore: chosen.evaluation.artifactScore,
            telemetry,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Gemini istegi basarisiz oldu';
        return {
            ok: false,
            reason: isTimeoutError(error) ? 'timeout' : 'provider',
            error: message,
            telemetry: {
                ...baseTelemetry,
                retryCount,
                timing: {
                    totalMs: Date.now() - startedAt,
                    generationMs: 0,
                    evaluationMs: 0,
                },
                timeoutRecovered,
            },
        };
    }
}
