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
Output a clean, high-quality real-estate photo.
`.trim();

export function buildRemoveObjectPrompt(mode: RemoveMode, userPrompt?: string): string {
    if (mode === 'all') {
        return `
Task: Remove all movable items so the room reads as an empty, clean, listing-ready interior.

Remove:
- furniture
- decor
- clutter and personal items
- removable-looking decorative lighting fixtures

Preserve:
- all architecture and built-in fixtures
- floor, wall, and ceiling materials
- ceiling exit point / rosette location around removed lights

Success criteria:
- first glance should read as an empty room
- no leftover silhouettes, contact shadows, dark patches, or texture breaks
- removed regions must be rebuilt naturally with matching lighting and material continuity
- result must look like one real photo, not an edit

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

${BASE_RULES}
`.trim();
}
