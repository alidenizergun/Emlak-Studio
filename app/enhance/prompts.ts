/**
 * Fotoğraf Geliştirme: Her seçenek için AI/vision modeline verilecek prompt metinleri.
 * Tek kaynak; API ve ileride UI tooltip vb. buradan kullanabilir.
 */

export const BASE_RULES = `
CRITICAL QUALITY STANDARDS:
- OUTPUT RESOLUTION: All processing must target a crystal-clear 4K (Ultra HD) quality.
- REAL ESTATE PHOTOGRAPHY: Result must be museum-quality, high-end real estate photography.
- PHOTOREALISM: Absolutely no artistic, cartoonish, or AI-generated look.
- ARCHITECTURAL INTEGRITY: Do not change walls, windows, or structural elements.
- PRESERVATION: Do not add or remove furniture or major decor.
- NOISE & ARTIFACTS: Completely eliminate digital noise, JPEG artifacts, and chromatic aberration.`;

/** Her seçenek (option id) için tam prompt metni */
export const ENHANCE_PROMPTS: Record<string, string> = {
    auto: `AUTO MODE:
Analyze this real estate photograph and automatically apply the best combination of:
- 4K lighting and exposure balancing
- Color vibrancy and white balance correction
- Sharpening and fine detail enhancement
- Gentle cleaning of noise and minor artifacts

CRITICAL RULES:
- Keep the image fully photorealistic; no cartoon or AI-art style.
- Do NOT change walls, windows, or architectural structure.
- Do NOT add or remove furniture or major objects.
- Preserve the original room layout and perspective.${BASE_RULES}`,

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

    const selected = Object.keys(ENHANCE_PROMPTS).filter((id) => id !== 'auto' && options[id]);
    if (selected.length === 0) {
        return `Apply a subtle 4K professional enhancement to this real estate photo.${BASE_RULES}`;
    }
    if (selected.length === 1) {
        return ENHANCE_PROMPTS[selected[0]];
    }

    const parts = selected.map((id) => ENHANCE_PROMPTS[id]);
    return `Enhancement Task: Apply the following enhancements to this real estate photo in a single, coherent result:\n\n${parts.join('\n\n---\n\n')}`;
}
