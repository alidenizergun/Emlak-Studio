/**
 * Fotoğraf Geliştirme: Her seçenek için AI/vision modeline verilecek prompt metinleri.
 * Tek kaynak; API ve ileride UI tooltip vb. buradan kullanabilir.
 */

export const BASE_RULES = `
Photorealistic premium real-estate photo only.
Keep architecture, perspective, framing, and furniture layout unchanged.
Do not add or remove major objects.
If the floor is dirty, clean it fully while preserving material, seams, and geometry.
Reduce noise, JPEG artifacts, haze, and chromatic aberration.
Result must be bright enough, crisp, natural, and listing-ready.`;

/** Her seçenek (option id) için tam prompt metni */
export const ENHANCE_PROMPTS: Record<string, string> = {
    auto: `Apply a premium real-estate enhancement in one pass: improve exposure, white balance, color balance, sharpness, and cleanup while keeping the scene realistic. Recover shadow detail, protect highlights, keep materials natural, and avoid HDR, halos, haze, oversharpening, or plastic textures.

${BASE_RULES}`,

    lighting: `Improve exposure and shadow detail naturally. Keep windows controlled, preserve realistic light direction, and avoid HDR or fake brightness.

${BASE_RULES}`,

    color: `Correct white balance and color cast. Make the image richer and cleaner while keeping walls, wood, fabrics, and other materials realistic.

${BASE_RULES}`,

    sharpness: `Increase detail and edge clarity without halos, ringing, or artificial oversharpening. Keep textures natural and clean.

${BASE_RULES}`,

    clean: `Remove minor dirt, stains, scuffs, haze, and small distractions while preserving real surface textures and the room layout.

${BASE_RULES}`,

    privacy: `Blur only sensitive personal information such as faces, private photos, documents, plates, or readable screens. Keep all other areas sharp and unchanged.

${BASE_RULES}`,

    sky: `If visible sky exists, improve it into a clean blue or lightly cloudy sky that matches the scene naturally. Keep buildings and lighting physically consistent.

${BASE_RULES}`,

    twilight: `Add a believable warm golden-hour feel with slightly warmer highlights and readable shadows. Keep the result natural and never turn day into night.

${BASE_RULES}`,
};

/** Seçilen option'lara göre tek bir prompt metni üretir (birden fazla seçiliyse birleştirilir). */
export function buildEnhancePrompt(options: Record<string, boolean>): string {
    if (options.auto) {
        return ENHANCE_PROMPTS.auto;
    }

    const selected = Object.keys(ENHANCE_OPTION_DIRECTIVES).filter((id) => options[id]);
    if (selected.length === 0) {
        return `Apply a subtle 4K professional enhancement to this real estate photo.${BASE_RULES}`;
    }
    const selectedInstructions = selected
        .map((id) => `- ${ENHANCE_OPTION_DIRECTIVES[id]}`)
        .join('\n');
    return `Apply only the selected enhancements below in one coherent, photorealistic result.

SELECTED ENHANCEMENTS:
${selectedInstructions}

Rules:
- Keep camera perspective, architecture, and furniture layout identical.
- Improvements must be visible but natural.
- If one instruction cannot be applied safely, continue with the rest.
- Never return an empty or black output.

${BASE_RULES}`;
}

const ENHANCE_OPTION_DIRECTIVES: Record<string, string> = {
    lighting: 'Rebalance exposure, lift dark regions, and protect highlights for a naturally brighter image.',
    color: 'Correct white balance and boost color richness moderately while keeping material tones realistic.',
    sharpness: 'Increase micro-contrast and edge clarity without halos, ringing, or oversharpen artifacts.',
    clean: 'Remove minor dirt/stain/noise distractions and preserve real textures (tile joints, wood grain, fabric).',
    privacy: 'Blur only sensitive personal data regions (faces/documents/screens), keep all other areas sharp.',
    sky: 'If visible sky exists, improve only upper/outdoor sky tone subtly; do not affect indoor walls/ceilings.',
    twilight: 'Add a warm golden-hour ambience with controlled contrast and believable light balance.',
};
