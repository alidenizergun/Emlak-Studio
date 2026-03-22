import { NextResponse } from 'next/server';
import path from 'path';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { generateEditedImageWithNanoBanana } from '@/lib/nano-banana';
import { normalizeImageForStage } from '@/lib/image-normalization';
import { validateInputImageForProcessing, verifyOutputImageQuality } from '@/lib/image-quality-guard';
import { applyArchitectureStructureLock } from '@/lib/structure-lock';
import { postprocessListingImage } from '@/lib/output-postprocess';
import { verifyArchitectureIntegrity } from '@/lib/architecture-guard';
import { verifyStageArtifacts } from '@/lib/stage-artifact-guard';
import { parseDataUrl } from '@/lib/data-url';
import { generateStagePrompt } from '@/lib/stage-prompt';
import { generateLegacyStagePrompt } from '@/lib/stage-prompt-legacy';

const CASES = [
    {
        id: 'salon-modern',
        imagePath: 'public/images/examples/living-empty.png',
        roomType: 'salon',
        style: 'modern',
        customStylePrompt: '',
        label: 'Salon x Modern',
    },
    {
        id: 'bedroom-luxury',
        imagePath: 'public/images/examples/bedroom-empty.png',
        roomType: 'bedroom',
        style: 'luxury',
        customStylePrompt: '',
        label: 'Bedroom x Luxury',
    },
    {
        id: 'child-modern',
        imagePath: 'public/images/examples/kids-empty.png',
        roomType: 'child_room',
        style: 'modern',
        customStylePrompt: '',
        label: 'Child Room x Modern',
    },
    {
        id: 'office-minimalist',
        imagePath: 'public/images/examples/office-empty.png',
        roomType: 'office',
        style: 'minimalist',
        customStylePrompt: '',
        label: 'Office x Minimalist',
    },
    {
        id: 'kitchen-scandinavian',
        imagePath: 'public/images/examples/kitchen-empty.png',
        roomType: 'kitchen',
        style: 'scandinavian',
        customStylePrompt: '',
        label: 'Kitchen x Scandinavian',
    },
    {
        id: 'balcony-bohemian',
        imagePath: 'public/images/examples/balcony-empty.png',
        roomType: 'balcony',
        style: 'bohemian',
        customStylePrompt: '',
        label: 'Balcony x Bohemian',
    },
];

function toFile(buffer: Buffer, name: string): File {
    return new File([new Uint8Array(buffer)], name, { type: 'image/png' });
}

async function saveDataUrlToFile(dataUrl: string, targetPath: string): Promise<void> {
    const parsed = parseDataUrl(dataUrl);
    await writeFile(targetPath, Buffer.from(parsed.base64, 'base64'));
}

async function saveBuffer(buffer: Buffer, targetPath: string): Promise<void> {
    await writeFile(targetPath, buffer);
}

async function runPromptVariant(image: File, prompt: string, watermarkSuspected: boolean) {
    const generated = await generateEditedImageWithNanoBanana({ image, prompt });
    const lockStrength = watermarkSuspected ? 0.76 : 0.8;
    const locked = await applyArchitectureStructureLock(image, generated.imageUrl, lockStrength);
    const postprocessed = await postprocessListingImage(locked, { tool: 'stage' });
    const architecture = await verifyArchitectureIntegrity(
        image,
        postprocessed,
        Number(process.env.ARCH_GUARD_THRESHOLD || 0.6)
    );
    const quality = await verifyOutputImageQuality(image, postprocessed, 'stage');
    const artifact = await verifyStageArtifacts(image, postprocessed);
    return {
        imageUrl: postprocessed,
        model: generated.model,
        attemptedModels: generated.attemptedModels,
        fallbackUsed: generated.fallbackUsed,
        architectureScore: Number(architecture.score ?? 0),
        qualityScore: Number(quality.score ?? 0),
        artifactScore: Number(artifact.score ?? 0),
        architectureOk: Boolean(architecture.ok),
        qualityOk: Boolean(quality.ok),
        artifactOk: Boolean(artifact.ok),
    };
}

export async function POST() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ success: false, error: 'Only available outside production.' }, { status: 403 });
    }

    const startedAt = Date.now();
    const root = process.cwd();
    const runId = `compare-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const outputDir = path.join(root, 'public', 'test-runs', 'stage-prompt-compare', runId);
    await mkdir(outputDir, { recursive: true });

    const results: Array<Record<string, unknown>> = [];

    for (const testCase of CASES) {
        const absoluteImagePath = path.join(root, testCase.imagePath);
        const inputBuffer = await readFile(absoluteImagePath);
        const sourceFile = toFile(inputBuffer, `${testCase.id}.png`);
        const normalized = await normalizeImageForStage(sourceFile);
        const inputQuality = await validateInputImageForProcessing(normalized.image, 'stage');

        const caseDir = path.join(outputDir, testCase.id);
        await mkdir(caseDir, { recursive: true });
        await saveBuffer(Buffer.from(await normalized.image.arrayBuffer()), path.join(caseDir, 'before.jpg'));

        if (!inputQuality.ok) {
            results.push({
                id: testCase.id,
                label: testCase.label,
                skipped: true,
                reason: inputQuality.error,
            });
            continue;
        }

        const promptInput = {
            roomType: testCase.roomType,
            style: testCase.style,
            customStylePrompt: testCase.customStylePrompt,
            styleIntensity: 'medium' as const,
            learnedDirectives: [],
            watermarkSuspected: normalized.watermarkSuspected,
            watermarkCropApplied: normalized.watermarkCropApplied,
            promptVersion: 'A' as const,
            cleanupBoost: false,
            antiGhostBoost: false,
        };

        const legacyPrompt = generateLegacyStagePrompt(promptInput);
        const optimizedPrompt = generateStagePrompt(promptInput);

        const legacy = await runPromptVariant(normalized.image, legacyPrompt, normalized.watermarkSuspected);
        const optimized = await runPromptVariant(normalized.image, optimizedPrompt, normalized.watermarkSuspected);

        await saveDataUrlToFile(legacy.imageUrl, path.join(caseDir, 'legacy.jpg'));
        await saveDataUrlToFile(optimized.imageUrl, path.join(caseDir, 'optimized.jpg'));
        await writeFile(path.join(caseDir, 'legacy-prompt.txt'), legacyPrompt, 'utf8');
        await writeFile(path.join(caseDir, 'optimized-prompt.txt'), optimizedPrompt, 'utf8');

        results.push({
            id: testCase.id,
            label: testCase.label,
            imagePath: `/${path.posix.join('test-runs', 'stage-prompt-compare', runId, testCase.id, 'before.jpg')}`,
            legacyImagePath: `/${path.posix.join('test-runs', 'stage-prompt-compare', runId, testCase.id, 'legacy.jpg')}`,
            optimizedImagePath: `/${path.posix.join('test-runs', 'stage-prompt-compare', runId, testCase.id, 'optimized.jpg')}`,
            legacyPromptPath: `/${path.posix.join('test-runs', 'stage-prompt-compare', runId, testCase.id, 'legacy-prompt.txt')}`,
            optimizedPromptPath: `/${path.posix.join('test-runs', 'stage-prompt-compare', runId, testCase.id, 'optimized-prompt.txt')}`,
            legacy,
            optimized,
            deltas: {
                architectureScore: Number((optimized.architectureScore - legacy.architectureScore).toFixed(4)),
                qualityScore: Number((optimized.qualityScore - legacy.qualityScore).toFixed(4)),
                artifactScore: Number((optimized.artifactScore - legacy.artifactScore).toFixed(4)),
            },
        });
    }

    const summary = {
        success: true,
        runId,
        startedAt,
        finishedAt: Date.now(),
        durationMs: Date.now() - startedAt,
        cases: results,
    };

    await writeFile(path.join(outputDir, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8');

    return NextResponse.json(summary);
}
