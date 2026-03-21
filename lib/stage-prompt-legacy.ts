type StyleIntensity = 'low' | 'medium' | 'high';
type PromptVersion = 'A' | 'B';

export interface StageLegacyPromptInput {
    roomType: string;
    style: string;
    customStylePrompt: string;
    styleIntensity: StyleIntensity;
    learnedDirectives: string[];
    watermarkSuspected: boolean;
    watermarkCropApplied: boolean;
    promptVersion: PromptVersion;
    cleanupBoost: boolean;
    antiGhostBoost: boolean;
}

const ROOM_LABELS: Record<string, string> = {
    salon: 'living room',
    living_room: 'living room',
    bedroom: 'bedroom',
    child_room: 'child bedroom',
    guest_room: 'guest bedroom',
    dressing_room: 'dressing room',
    office: 'home office',
    game_room: 'game room',
    kitchen: 'kitchen',
    bathroom: 'bathroom',
    entryway: 'entryway',
    balcony: 'balcony terrace',
};

const STYLE_GUIDELINES: Record<string, string> = {
    modern: 'modern, clean-lined furniture with neutral palette and subtle accents',
    scandinavian: 'scandinavian style with light wood, soft neutrals, minimal clutter',
    industrial: 'industrial style with matte textures, black accents, and practical furniture',
    bohemian: 'bohemian style with warm textiles and curated layered accessories',
    luxury: 'luxury style with premium materials, elegant lighting, and refined symmetry',
    minimalist: 'minimalist style with low-clutter layout and functional furniture only',
    classic: 'classic style with timeless furniture forms and balanced ornament',
    rustic: 'rustic style with natural wood tones and cozy textures',
};

const STYLE_ANCHORS: Record<string, string> = {
    modern: 'clean straight silhouettes, restrained accents, clear negative space.',
    scandinavian: 'light wood tones, soft textiles, daylight-friendly airy composition.',
    industrial: 'metal/wood mix, matte black details, practical task-oriented pieces.',
    bohemian: 'warm layered textiles, handcrafted accents, controlled natural texture richness.',
    luxury: 'premium finishes, curated symmetry, elegant statement lighting.',
    minimalist: 'very low clutter, essential pieces only, crisp geometry and breathing space.',
    classic: 'timeless forms, balanced ornament, soft traditional detailing.',
    rustic: 'natural grain emphasis, cozy warm palette, handcrafted feel.',
    default: 'cohesive, restrained, realistic style expression.',
};

const ROOM_LAYOUT_GUIDELINES: Record<string, string> = {
    salon: 'establish a social focal layout (sofa + table + media/storage) with balanced spacing and open circulation.',
    living_room: 'use comfortable seating-first layout with clear TV/view direction and practical side storage.',
    bedroom: 'center composition around bed wall; keep side clearances and use minimal supporting furniture.',
    child_room: 'create safe open play zone, compact storage, and soft-edged furniture placement.',
    guest_room: 'place bed and wardrobe compactly with a clean circulation path for temporary stay comfort.',
    dressing_room: 'prioritize wardrobe modules, full-length mirror, bench/ottoman, and organized accessory storage.',
    office: 'focus on desk ergonomics, task lighting area, and uncluttered movement path.',
    game_room: 'reserve central activity space, place gaming/media units on stable walls, keep wires/storage organized.',
    kitchen: 'preserve work triangle logic and keep movement lanes open around prep and storage zones.',
    bathroom: 'keep wet/dry zones visually separated with minimal compact storage and no blocked fixtures.',
    entryway: 'maintain entry clearance, add slim console/storage, and avoid deep furniture near circulation.',
    balcony: 'use lightweight compact seating/planter composition while preserving access and railing visibility.',
    default: 'apply a balanced layout with one clear focal point and uninterrupted walking circulation.',
};

const ROOM_MUST_HAVE: Record<string, string> = {
    salon: 'sofa-centered seating composition, support table(s), and media/storage anchor.',
    living_room: 'primary seating set with clear focal direction and practical side storage.',
    bedroom: 'bed-focused composition with at least one nightstand-side support.',
    child_room: 'sleep element + child-scale storage + safe open activity zone.',
    guest_room: 'compact sleep setup with simple luggage/storage utility.',
    dressing_room: 'wardrobe/storage modules + full mirror + dressing support element.',
    office: 'ergonomic desk setup + working chair + functional storage/task-lighting support.',
    game_room: 'gaming/media focal unit + seating + organized accessory/storage support.',
    kitchen: 'prep/storage continuity and unobstructed cooking workflow lanes.',
    bathroom: 'fixture-safe circulation and compact utility storage where appropriate.',
    entryway: 'entry clearance with slim console/storage and practical arrival function.',
    balcony: 'compact outdoor seating/plant composition while preserving walkway and railing.',
    default: 'clear primary function area with scale-appropriate supporting pieces.',
};

export function generateLegacyStagePrompt(input: StageLegacyPromptInput): string {
    const roomLabel = ROOM_LABELS[input.roomType] || 'room';
    const hasCustomStyle = input.style === 'custom' && input.customStylePrompt.trim().length > 0;
    const styleGuideline = hasCustomStyle
        ? `a custom interior direction: ${input.customStylePrompt.trim()}`
        : STYLE_GUIDELINES[input.style] || 'balanced and realistic furnishing';
    const styleAnchor = hasCustomStyle
        ? `strictly follow this custom style brief: ${input.customStylePrompt.trim()}`
        : STYLE_ANCHORS[input.style] || STYLE_ANCHORS.default;
    const roomLayoutGuideline = ROOM_LAYOUT_GUIDELINES[input.roomType] || ROOM_LAYOUT_GUIDELINES.default;
    const roomMustHave = ROOM_MUST_HAVE[input.roomType] || ROOM_MUST_HAVE.default;
    const watermarkRule = input.watermarkSuspected
        ? '- Input may contain watermark text. Keep text zone geometry unchanged and avoid over-editing around those pixels.'
        : '- Keep any existing text regions stable; do not hallucinate new text.';
    const cropRule = input.watermarkCropApplied
        ? '- A safe crop was applied to reduce watermark artifacts; preserve new frame geometry exactly.'
        : '';
    const versionRule =
        input.promptVersion === 'A'
            ? '- Emphasize architectural fidelity over decoration richness.'
            : '- Emphasize realistic furnishing coherence while preserving all architecture.';
    const adaptiveCleanupRule = input.cleanupBoost
        ? '- Adaptive quality rule: run stricter cleanup pass so floor/walls are visibly clean and residue-free.'
        : '';
    const adaptiveGhostRule = input.antiGhostBoost
        ? '- Adaptive quality rule: enforce zero ghosting; reject semi-transparent or partially rendered furniture.'
        : '';
    const learnedRules = input.learnedDirectives.length > 0
        ? `- Learned rules from previous runs (apply strictly):\n${input.learnedDirectives.map((x) => `  - ${x}`).join('\n')}`
        : '';
    return `Task: Furnish this ${roomLabel} with ${styleGuideline}.
STRICT CONSTRAINTS:
- Never change architectural details under any condition: room dimensions, column positions, wall lines, ceiling geometry, window/door locations, openings, fixed structural contours must remain exactly unchanged.
- Never invent new architectural surfaces: no new wall, half-wall, divider, partition, niche, beam, column, bulkhead, or fake depth plane anywhere in frame.
- Do not create any new vertical plane on image edges (especially right side). Existing side geometry must remain identical.
- Keep original layout, perspective, camera angle, framing, and lens feel.
- Floor cleanup hard rule: if uploaded floor is dirty, clean it completely (no visible dirt/stain/smudges/dust remains) while preserving original floor material and tile/texture layout.
- Clean other visible surfaces (remove dirt, stains, smudges, dust) without changing geometry.
- Remove temporary renovation/construction clutter completely (tools, bags, loose items, debris) and leave no semi-visible traces.
- Improve lighting, exposure and sharpness to premium real-estate quality without geometric changes.
- Decoration density must be ${input.styleIntensity}. Do not overfill the room.
- Place furniture with realistic interior-design logic based on room geometry:
  - Keep clear walking paths and entry circulation.
  - Respect window and door clearance; do not block openings.
  - Match furniture scale to room size; avoid oversized pieces.
  - Avoid object collisions, clipping, floating, or impossible spacing.
  - Anchor large items to plausible walls and keep visual balance.
- Room-type layout blueprint:
  - ${roomLayoutGuideline}
- Required room function signature:
  - ${roomMustHave}
- Style signature cues:
  - ${styleAnchor}
- Furniture and decor must be fully opaque and physically grounded. No transparent, ghosted, floating, or double-exposure objects.
- Every placed object must be fully rendered and physically consistent with floor/wall contact and shadows.
- Never output semi-transparent overlay bands, stitched seams, scanline-like strips, or partial cut objects.
- Remove all residual imprints from replaced objects (no faded silhouettes, no duplicate outlines, no echo edges).
- Do not leave horizontal or vertical blending bands across walls, furniture, TV area, or floor.
- Never duplicate ceiling fixtures or leave double-contour traces around chandelier/pendant anchors.
- If any object is uncertain, omit it instead of rendering a partial/transparent version.
- For dressing room tasks, include a complete modern dressing setup (wardrobe modules, mirror, bench/ottoman, organized storage accents) while keeping architecture fixed.
- Curtains/blinds/tulle may be added on existing windows as decor, but window frame geometry and position must remain unchanged.
- Lighting fixtures can be restyled by design style (chandelier, pendant, sconces, floor/table lamps), but electrical anchor points and mounting locations must stay fixed.
- If fixtures are updated, keep physically coherent light behavior (no impossible glow directions, no detached lights).
- Wall decor is allowed in measured amount: style-matching framed artworks and a subtle wall clock can be added if they fit scale and do not clutter walls.
- Never place framed artworks on the TV/media focal wall.
- If other walls are empty, you may place limited artwork on those non-TV walls with balanced spacing.
- Keep wall accessories proportional and sparse; avoid excessive gallery-wall density.
- Preserve all existing wall termination lines and corner joins exactly; do not close open areas with added surfaces.
- Strict anti-haze rule: no fog, no dust veil, no milky low-contrast film over the image.
- Maintain crisp micro-contrast on furniture/edges while keeping natural realism.
${learnedRules}
${watermarkRule}
${cropRule}
${versionRule}
${adaptiveCleanupRule}
${adaptiveGhostRule}
Output: one ultra-photorealistic listing-ready image.`;
}
