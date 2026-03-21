export type RemoveMode = 'all' | 'prompt';

const BASE_RULES = `
Preserve original perspective, camera angle, lens characteristics, and composition.
Do not crop, rotate, warp, or change framing.
Do not alter room dimensions, walls, floor, ceiling, windows, doors, columns, fixed architectural elements, or room layout.
Keep photorealistic lighting, shadows, and reflections consistent with the original scene.
Generate natural inpainting where removed regions blend seamlessly with nearby textures.
If floor appears dirty in the uploaded image, clean it completely; remove all visible dirt/stain/dust traces while preserving floor material, seams, texture layout, and geometry.
Never leave deletion artifacts: no ghosting, no semi-transparent remnants, no duplicated edges, no smears, no black patches, and no unfinished masks.
Do not add new objects, furniture, people, logos, text, or watermarks.
If logos/watermarks/branding are visible, clean them naturally only when safe and policy-compliant; never damage geometry while doing so.
Output quality hard rule: result must be crisp, bright enough, and listing-ready (no hazy, muddy, dark, or low-contrast look).
If the generated result is underexposed, automatically improve lighting/exposure while preserving natural color and architecture.
Improve lighting and sharpness to a premium real-estate quality without changing architecture.
Output a clean, high-quality real-estate photo.
`.trim();

export function buildRemoveObjectPrompt(mode: RemoveMode, userPrompt?: string): string {
    if (mode === 'all') {
        return `
Task: Remove all removable movable items from this interior photo so the room looks empty, clean, and listing-ready.

Core objective:
- Produce a believable empty-room result while preserving architecture 1:1.
- Keep original surface materials (floor, wall paint, tiles, grout, texture direction) physically coherent.

Scope to remove:
- Furniture (sofa, chair, table, bed, TV unit, cabinet, shelf, etc.)
- Decorative items (carpet, curtains if removable-looking, lamps, frames, plants, accessories)
- Visible lighting fixtures that function as removable decor in the photo (chandeliers, pendant lights, hanging lamps, wall sconces, decorative ceiling fixtures)
- Small clutter and personal belongings

Scope to preserve:
- Architectural elements and structural fixtures
- Built-in or fixed components that are part of the property
- Ceiling, wiring exit point, rosette/base location, and architecture around removed lighting must remain geometrically identical

All-remove success criteria (strict):
- The room must read as an empty room at first glance.
- Remove all movable furniture/decor/clutter visible in the frame.
- If decorative lighting fixtures are visible, remove them too and reconstruct the surrounding ceiling naturally while keeping ceiling geometry unchanged.
- Do not leave partial objects, shadows of removed furniture, or material mismatches.
- Removed zones must be fully reconstructed with realistic texture continuity and lighting continuity.
- Final image must look like a single natural photograph, not edited/inpainted.

Quality checklist before final output:
- Any leftover silhouette/trace? If yes, fix.
- Any dark patch or blur from inpainting? If yes, fix.
- Any architecture drift or perspective shift? If yes, fix.
- Any floor dirt still visible? If yes, clean fully.

${BASE_RULES}
`.trim();
    }

    const target = (userPrompt || '').trim();
    return `
Task: Remove only the user-requested items from this interior photo.

User request:
${target}

Important constraints:
- Remove only the specified items.
- Keep all other furniture and scene elements unchanged.
- If target items appear multiple times, remove all matching instances unless user request implies otherwise.
- For removed targets, leave zero visible traces (no ghosting, no partial silhouettes, no mask artifacts).
- Preserve context around removed items (contact shadows, wall/floor texture continuity, perspective).

Selective-remove success criteria:
- Requested targets are fully removed.
- Non-target objects remain untouched.
- Architecture remains identical.
- Output remains bright, sharp, photorealistic, and listing-ready.

${BASE_RULES}
`.trim();
}
