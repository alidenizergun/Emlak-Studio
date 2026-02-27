export type RemoveMode = 'all' | 'prompt';

const BASE_RULES = `
Preserve original perspective, camera angle, lens characteristics, and composition.
Do not crop, rotate, warp, or change framing.
Do not alter room dimensions, walls, floor, ceiling, windows, doors, columns, fixed architectural elements, or room layout.
Keep photorealistic lighting, shadows, and reflections consistent with the original scene.
Generate natural inpainting where removed regions blend seamlessly with nearby textures.
Do not add new objects, furniture, people, logos, text, or watermarks.
If visible, remove existing logos/watermarks/branding text naturally.
Improve lighting and sharpness to a premium real-estate quality without changing architecture.
Output a clean, high-quality real-estate photo.
`.trim();

export function buildRemoveObjectPrompt(mode: RemoveMode, userPrompt?: string): string {
    if (mode === 'all') {
        return `
Task: Remove all removable movable items from this interior photo to make the space look empty and clean.

Scope to remove:
- Furniture (sofa, chair, table, bed, TV unit, cabinet, shelf, etc.)
- Decorative items (carpet, curtains if removable-looking, lamps, frames, plants, accessories)
- Small clutter and personal belongings

Scope to preserve:
- Architectural elements and structural fixtures
- Built-in or fixed components that are part of the property

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

${BASE_RULES}
`.trim();
}
