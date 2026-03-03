export function getImageGenerationPolicy(allowArchitecturalChanges: boolean): string {
    const architectureRules = allowArchitecturalChanges
        ? `
- Architectural changes are allowed only when the user explicitly requests them.
- Do not change any architectural element unless explicitly requested by the user (room size perception, walls, columns, ceiling, windows, doors, geometry).
`.trim()
        : `
- Never modify architecture: preserve room size perception, wall positions, column positions, ceiling height/shape, window/door positions, and all structural geometry.
- Do not add, remove, move, or reshape structural elements.
`.trim();

    return `
GLOBAL IMAGE POLICY (MANDATORY):
${architectureRules}
- These rules are mandatory for all visual tools, including Photo Enhancement, Decoration, Smart Object Removal, Renovation, and AI Tour visuals.
- Preserve camera angle, perspective, framing, and lens character.
- Architectural stability is mandatory: keep columns, beams, walls, windows, doors, ceiling lines, and room proportions exactly the same.
- Decorative curtains/tulle/blinds may be added to existing windows, but window frame geometry, size, and position must never change.
- Wall decor may include style-matching framed artworks and a subtle wall clock in measured quantity.
- Keep wall decor balanced and proportional to room scale; avoid visual clutter.
- Floor cleaning is mandatory (HARD RULE): if the uploaded floor is dirty, clean it completely (no visible dirt, stains, smudges, dust, or mud residue). Preserve floor material, grout/seam structure, pattern, perspective, and geometry.
- Output quality is mandatory (HARD RULE): final image must be crisp, clean, and premium real-estate quality; no blurry, hazy, washed-out, or low-resolution look.
- Lighting improvement is mandatory (HARD RULE): if input lighting is insufficient, improve exposure/shadows/white balance naturally without altering architecture.
- During cleanup and quality enhancement, do not distort geometry, create wide-angle warping, or change perceived room size.
- Output must remain photorealistic; no cartoon, illustration, or AI-art look.
- Do not add people, new text, new logos, or new watermarks.
- If a logo/watermark exists in the input, do not over-distort those pixel regions; prioritize architectural fidelity and quality cleanup.
- If any rule conflicts, architectural preservation has highest priority.
`.trim();
}
