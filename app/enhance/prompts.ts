/**
 * Fotoğraf Geliştirme: Her seçenek için AI/vision modeline verilecek prompt metinleri.
 * Tek kaynak; API ve ileride UI tooltip vb. buradan kullanabilir.
 */

export const BASE_RULES = `
CRITICAL QUALITY STANDARDS:
- OUTPUT RESOLUTION: All processing must target a crystal-clear 4K (Ultra HD) quality.
- REAL ESTATE PHOTOGRAPHY: Result must be museum-quality, high-end real estate photography.
- PHOTOREALISM: Absolutely no artistic, cartoonish, or AI-generated look.
- ARCHITECTURAL INTEGRITY: Do not change room size perception, walls, columns, ceilings, windows, doors, or structural elements.
- PRESERVATION: Do not add or remove furniture or major decor.
- FLOOR CLEANUP HARD RULE: If the uploaded image floor looks dirty, clean it completely (remove dirt/stains/dust/mud marks) while preserving floor material, tile/joint pattern, and geometry.
- TEXT OVERLAY HANDLING: If a distracting listing overlay can be safely reduced without violating policy, reduce it naturally; otherwise keep it unchanged.
- NOISE & ARTIFACTS: Completely eliminate digital noise, JPEG artifacts, and chromatic aberration.`;

/** Her seçenek (option id) için tam prompt metni */
export const ENHANCE_PROMPTS: Record<string, string> = {
    auto: `AUTO MODE:
You are running Emlak Stüdyosu premium enhancement mode.
Analyze this real-estate photo and apply the strongest high-end enhancement pipeline that still preserves reality.

PRIMARY OBJECTIVE:
- Produce a premium, listing-ready result with very high perceived quality at first glance.
- The image must look exceptionally clear, naturally lit, and color-balanced with professional consistency.

AUTO ENHANCEMENT STACK (apply together, in one coherent pass):
- 4K-grade lighting and exposure balancing with natural shadow recovery
- Precise white-balance normalization and color cast correction
- Controlled vibrancy and micro-contrast improvement (rich but realistic colors)
- High-fidelity sharpening and texture clarity (walls, floors, furniture edges, fabrics)
- Noise/artifact cleanup (JPEG blocks, chromatic aberration, haze, mild blur)
- Surface cleanup for small distractions (dust, tiny stains, minor scuffs) without texture loss

LIGHTING & COLOR EXCELLENCE REQUIREMENTS:
- If the photo is dark/flat, rebalance exposure aggressively but naturally.
- Window areas must retain detail; avoid clipped highlights and crushed shadows.
- Maintain neutral whites and realistic material tones (wood, paint, textiles, skin where present).
- Avoid over-HDR, neon saturation, gray haze, or plastic/waxy textures.

SHARPNESS REQUIREMENTS:
- Result must be very crisp and clean without halos or edge ringing.
- Fine details should be visibly improved while preserving natural grain/texture.
- No softness, ghosting, or smeared regions.

CRITICAL RULES:
- Keep the image fully photorealistic; no cartoon or AI-art style.
- Do NOT change walls, windows, or architectural structure.
- Do NOT add or remove furniture or major objects.
- Preserve the original room layout and perspective.

FINAL SELF-CHECK BEFORE OUTPUT:
- Is the image clearly sharper than input while still natural?
- Are light and color balance excellent and believable across the full frame?
- Is there any haze, blur, halo, clipping, or artifact left?
- Is architecture fully preserved with no geometry drift?
If any answer is "no", fix it before returning output.${BASE_RULES}`,

    lighting: `LIGHTING & EXPOSURE:
Brighten dark areas of the room, recover detail in shadows, and gently compress highlights so windows and bright spots are not blown out.
Balance the exposure so the entire room is clearly visible, while keeping a natural contrast curve and avoiding an over-HDR or fake look.

RULES:
- Do NOT change the time of day or the direction of light.
- Keep window views and exterior brightness realistic.
- Preserve the room's original mood; only improve clarity and balance.${BASE_RULES}`,

    color: `COLOR VIBRANCY:
Increase overall color richness and contrast slightly so the photo looks more vivid and attractive but still realistic.
Correct any strong color casts (too yellow, too blue, too green) so whites look neutral and wall colors match realistic paint tones.

RULES:
- Keep skin tones and natural materials (wood, plants, stone) believable.
- Do NOT shift colors so much that the property looks different from reality.
- Maintain a clean, modern real estate photography style.${BASE_RULES}`,

    sharpness: `SHARPNESS & DETAIL:
Increase local contrast and fine detail so furniture, textures, and architectural lines look crisp and high-resolution.
Reduce softness and mild blur without creating halos, ringing, or an over-sharpened artificial look.

RULES:
- Keep edges clean and natural; no glowing outlines.
- Preserve texture in walls, floors, and fabrics without adding noise.
- Maintain a 4K, magazine-quality real estate aesthetic.${BASE_RULES}`,

    clean: `CLEANING:
Remove small visual distractions such as dirt spots, wall scuffs, tiny stains, lens dust, and minor blemishes on floors, walls, and furniture.
Smooth out very subtle imperfections while keeping real textures (wood grain, fabric weave, tile patterns) visible and realistic.

RULES:
- Do NOT remove furniture, decor, or any major objects from the room.
- Do NOT change the layout of the space.
- Focus only on minor cleaning so the property looks freshly maintained.${BASE_RULES}`,

    privacy: `PRIVACY / MOSAIC:
Detect and blur or pixelate all sensitive personal information in the photo, including:
- Human faces
- Family photos on walls or shelves
- License plates
- Documents or screens with readable text

RULES:
- Apply blur only to sensitive areas; keep the rest of the image fully sharp and detailed.
- Do NOT hide or alter architectural features or furniture.
- Preserve the overall composition and usability of the listing photo.${BASE_RULES}`,

    sky: `BLUE SKY ENHANCEMENT:
If the sky is dull, gray, or overcast, replace or enhance it with a clear or lightly cloudy blue sky that feels bright and inviting.
Match the new sky's brightness and color temperature to the scene so lighting and shadows remain physically consistent.

RULES:
- Do NOT change the building shapes, rooflines, or any architectural elements.
- Do NOT add unrealistic clouds, sunsets, or dramatic effects.
- Keep the result subtle, clean, and appropriate for professional real estate listings.${BASE_RULES}`,

    twilight: `TWILIGHT MODE:
Rebalance colors, contrast, and white balance to give the photo a warm, late-afternoon or early-evening "golden hour" feel:
- Slightly warmer highlights
- Deeper but still readable shadows
- Subtle golden tones in light sources and reflections

RULES:
- Keep all lighting physically plausible; do NOT create impossible light directions.
- Do NOT turn day into night; it should feel like a warm, inviting sunset, not full darkness.
- Maintain photorealism and architectural accuracy at all times.${BASE_RULES}`,
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
    return `You are Emlak Stüdyosu enhancement engine. Apply ONLY the selected enhancements below in one coherent, photorealistic result.

SELECTED ENHANCEMENTS:
${selectedInstructions}

QUALITY CONTRACT:
${BASE_RULES}

IMPORTANT EXECUTION RULES:
- Keep camera perspective and architecture identical.
- Apply visible improvements for selected options (no negligible/no-op output).
- If any single instruction conflicts with policy, continue with all remaining safe instructions and still return an image.
- Never return an empty or black output.`;
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
