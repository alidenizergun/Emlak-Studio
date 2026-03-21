type StyleIntensity = 'low' | 'medium' | 'high';
type PromptVersion = 'A' | 'B';

export interface StagePromptInput {
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

interface RoomPlan {
    label: string;
    useCase: string;
    focalPoint: string;
    mustHave: string;
    avoid: string;
    circulation: string;
    scale: string;
}

interface StylePlan {
    label: string;
    summary: string;
    palette: string;
    materials: string;
    textiles: string;
    accessories: string;
    lighting: string;
    silhouette: string;
    avoid: string;
}

interface IntensityPlan {
    label: string;
    furnitureDensity: string;
    accessoryDensity: string;
    wallDecor: string;
    contrast: string;
    lightingEmphasis: string;
}

const DEFAULT_ROOM_PLAN: RoomPlan = {
    label: 'room',
    useCase: 'Preserve the room as a credible real-estate interior with one clearly readable use.',
    focalPoint: 'Create one dominant focal zone and keep the rest visually quiet.',
    mustHave: 'Use scale-appropriate supporting pieces only.',
    avoid: 'Avoid ambiguous mixed-use staging or oversized furniture clusters.',
    circulation: 'Keep the main walking lane fully readable from the camera position.',
    scale: 'All furniture must fit the visible room depth and wall lengths naturally.',
};

const ROOM_PLANS: Record<string, RoomPlan> = {
    salon: {
        label: 'living room',
        useCase: 'Stage it as a social everyday living room suitable for listing photos and family use.',
        focalPoint: 'Build the scene around a sofa-led conversation area with a clear media or focal wall.',
        mustHave: 'Include a believable sofa-centered seating composition, one support table, and compact media/storage support.',
        avoid: 'Avoid formal hotel-lobby layouts, excessive armchair clutter, or dining furniture dominating the room.',
        circulation: 'Leave comfortable circulation between seating and window or doorway clearances.',
        scale: 'Use a sofa size that matches the wall length and keep tables modest so the room still feels open.',
    },
    living_room: {
        label: 'living room',
        useCase: 'Stage it as a comfortable main living area for daily use, not a showroom set.',
        focalPoint: 'Use a seating-first layout oriented to the strongest wall or view direction.',
        mustHave: 'Include primary seating, a compact coffee table, and one realistic side-storage or media element.',
        avoid: 'Avoid mixing office or bedroom functions into the room.',
        circulation: 'Preserve an intuitive path from entry side to the main seating zone.',
        scale: 'Keep furniture low-to-medium profile unless the room is visibly large.',
    },
    bedroom: {
        label: 'bedroom',
        useCase: 'Stage it as a calm primary sleeping space with hotel-like order but residential warmth.',
        focalPoint: 'Center the composition around the bed wall and keep secondary furniture understated.',
        mustHave: 'Include a bed, at least one bedside support, and restrained storage or bench support when space allows.',
        avoid: 'Avoid office setups, oversized lounge seating, or too many decorative objects.',
        circulation: 'Maintain bedside access and a clear path from entrance to the bed.',
        scale: 'Choose a bed size that fits the room width without compressing circulation.',
    },
    child_room: {
        label: 'child bedroom',
        useCase: 'Stage it as a warm, practical child room with sleep, storage, and open play logic.',
        focalPoint: 'Balance a child bed zone with one visible open play surface or activity pocket.',
        mustHave: 'Include a child-appropriate bed, compact storage, and one clear play/study support element.',
        avoid: 'Avoid overcrowding with toys, loud novelty props, or adult-scale luxury furniture.',
        circulation: 'Keep a safe open floor pocket and unobstructed walking path.',
        scale: 'All pieces should feel child-scaled or compact, never oversized.',
    },
    guest_room: {
        label: 'guest bedroom',
        useCase: 'Stage it as a simple and welcoming temporary stay room.',
        focalPoint: 'Use a compact bed-led layout with tidy supporting storage.',
        mustHave: 'Include a bed, light bedside support, and a modest luggage or wardrobe utility element.',
        avoid: 'Avoid heavy personalization, large desks, or child-room styling.',
        circulation: 'Keep entry movement straightforward and uncluttered.',
        scale: 'Use light, compact furnishings that do not overwhelm the room.',
    },
    dressing_room: {
        label: 'dressing room',
        useCase: 'Stage it as a highly organized dressing space with premium storage clarity.',
        focalPoint: 'Emphasize wardrobe organization, mirror function, and dressing support.',
        mustHave: 'Include wardrobe modules, a full-length mirror, and a bench, ottoman, or island support if space allows.',
        avoid: 'Avoid turning the space into a bedroom or lounge.',
        circulation: 'Preserve clear access between storage runs and the mirror zone.',
        scale: 'Storage should feel integrated and tailored, not bulky or blocking.',
    },
    office: {
        label: 'home office',
        useCase: 'Stage it as a focused work room optimized for productivity and listing clarity.',
        focalPoint: 'Anchor the room with a desk zone and one secondary storage or shelving support.',
        mustHave: 'Include an ergonomic desk setup, work chair, and restrained storage or task-lighting support.',
        avoid: 'Avoid decorative lounge staging overpowering the work function.',
        circulation: 'Keep approach to the desk clear and maintain readable floor space.',
        scale: 'Use slim, efficient furniture footprints to avoid crowding.',
    },
    game_room: {
        label: 'game room',
        useCase: 'Stage it as a clean entertainment room with controlled energy, not visual chaos.',
        focalPoint: 'Use a media or gaming wall anchor with supportive seating.',
        mustHave: 'Include a gaming/media focal unit, seating, and organized accessory storage.',
        avoid: 'Avoid cluttered toy-room chaos, tangled wires, or oversized arcade density.',
        circulation: 'Leave central usable floor area visible and open.',
        scale: 'Keep equipment and seating proportional to the visible wall spans.',
    },
    kitchen: {
        label: 'kitchen',
        useCase: 'Stage it as a premium, practical kitchen with everyday usability.',
        focalPoint: 'Support the work triangle and prep flow rather than decorative clutter.',
        mustHave: 'Keep prep and storage continuity visible with restrained styling accents only.',
        avoid: 'Avoid adding dining scenes that fight the kitchen workflow or block fixtures.',
        circulation: 'Preserve all movement lanes around counters and storage zones.',
        scale: 'Only use compact accent pieces that respect counter depth and floor clearances.',
    },
    bathroom: {
        label: 'bathroom',
        useCase: 'Stage it as a clean, spa-like bathroom with compact realism.',
        focalPoint: 'Emphasize cleanliness, mirror/vanity order, and wet-dry zone clarity.',
        mustHave: 'Use minimal utility storage and refined towel or accessory placement where appropriate.',
        avoid: 'Avoid bulky furniture, blocked fixtures, or bedroom-like decor.',
        circulation: 'Keep all fixtures fully usable with visible clearance around them.',
        scale: 'Every item must be very compact and fixture-aware.',
    },
    entryway: {
        label: 'entryway',
        useCase: 'Stage it as a functional arrival space with instant visual order.',
        focalPoint: 'Use a slim console or storage-led welcome composition.',
        mustHave: 'Include compact storage or console support plus one subtle welcoming decor accent.',
        avoid: 'Avoid deep furniture or anything that narrows the entry path.',
        circulation: 'Maintain direct movement from entry through the space.',
        scale: 'Everything should be shallow-depth and passage-friendly.',
    },
    balcony: {
        label: 'balcony terrace',
        useCase: 'Stage it as a compact outdoor living extension with airy realism.',
        focalPoint: 'Build around a lightweight seating or cafe set while keeping openness.',
        mustHave: 'Include compact outdoor seating and limited planters or table support.',
        avoid: 'Avoid heavy indoor furniture, dense jungle styling, or blocked railing views.',
        circulation: 'Preserve access to doors, railing visibility, and usable walkway width.',
        scale: 'Use lightweight low-mass pieces suited to balcony depth.',
    },
};

const DEFAULT_STYLE_PLAN: StylePlan = {
    label: 'balanced realistic staging',
    summary: 'Create a coherent real-estate staging look with restrained elegance.',
    palette: 'Use calm neutrals with one subtle warm accent family.',
    materials: 'Use believable residential materials with moderate texture contrast.',
    textiles: 'Keep textiles tidy and minimal.',
    accessories: 'Use only a few supportive accessories.',
    lighting: 'Use simple contemporary fixtures that feel naturally integrated.',
    silhouette: 'Favor clean, readable silhouettes with no exaggerated shapes.',
    avoid: 'Avoid theme-park styling, over-decoration, or visually noisy accents.',
};

const STYLE_PLANS: Record<string, StylePlan> = {
    modern: {
        label: 'modern',
        summary: 'Deliver a crisp contemporary interior with refined restraint.',
        palette: 'Use soft greige, warm white, charcoal, and muted stone accents.',
        materials: 'Favor matte lacquer, light-to-medium oak, stone, glass, and subtle brushed metal.',
        textiles: 'Use tailored textiles with low pattern noise and clean folds.',
        accessories: 'Keep accessories edited and sculptural, never busy.',
        lighting: 'Use simple pendant, linear, or flush fixtures with clean geometry.',
        silhouette: 'Prefer straight lines, slim profiles, and low visual clutter.',
        avoid: 'Avoid ornate classic detailing, heavy rustic mass, or bohemian layering.',
    },
    scandinavian: {
        label: 'scandinavian',
        summary: 'Create an airy, daylight-friendly interior with relaxed warmth.',
        palette: 'Use warm whites, pale beige, oatmeal, and light wood tones.',
        materials: 'Favor pale oak, natural fiber, matte painted surfaces, and soft ceramic accents.',
        textiles: 'Use cozy but light textiles such as woven throws and understated boucle or linen.',
        accessories: 'Use minimal handmade accents and a few natural elements only.',
        lighting: 'Use soft, simple fixtures in light finishes and gentle rounded forms.',
        silhouette: 'Prefer light visual weight, rounded edges, and breathable spacing.',
        avoid: 'Avoid dark industrial heaviness, glossy luxury finishes, or loud color blocking.',
    },
    industrial: {
        label: 'industrial',
        summary: 'Create a grounded urban interior with practical edge and restraint.',
        palette: 'Use charcoal, smoke gray, aged wood, concrete tones, and muted black.',
        materials: 'Favor matte black metal, weathered wood, concrete-like finishes, and durable upholstery.',
        textiles: 'Keep textiles minimal and functional, not plush or ornate.',
        accessories: 'Use only a few utilitarian accents with graphic clarity.',
        lighting: 'Use black or dark bronze utilitarian pendants, track-like fixtures, or simple task lights.',
        silhouette: 'Prefer angular, honest forms with visible structure.',
        avoid: 'Avoid soft bohemian abundance, glossy glam, or ornate classical decoration.',
    },
    bohemian: {
        label: 'bohemian',
        summary: 'Create a warm layered interior with curated personality and controlled softness.',
        palette: 'Use warm neutrals, sand, clay, muted terracotta, olive, and soft earth accents.',
        materials: 'Favor natural wood, rattan, woven textures, handmade ceramics, and organic fibers.',
        textiles: 'Use layered but controlled textiles with subtle pattern and tactile richness.',
        accessories: 'Use curated handcrafted accessories and greenery sparingly enough for listing realism.',
        lighting: 'Use woven, ceramic, or softly rounded fixtures that feel artisanal.',
        silhouette: 'Prefer softened silhouettes and natural irregularity without visual mess.',
        avoid: 'Avoid maximal clutter, festival-like color chaos, or too many small props.',
    },
    luxury: {
        label: 'luxury',
        summary: 'Create a premium staged interior with polished calm and elevated finishes.',
        palette: 'Use creamy neutrals, taupe, warm stone, cocoa, and restrained metallic accents.',
        materials: 'Favor marble-look stone, rich wood veneer, brushed brass, velvet-like texture, and premium upholstery.',
        textiles: 'Use richer textiles with refined layering and impeccable styling.',
        accessories: 'Use a few upscale statement accents with strict symmetry or composure.',
        lighting: 'Use elegant statement fixtures that feel premium but proportionate to the room.',
        silhouette: 'Prefer sculpted forms, tailored upholstery, and balanced symmetry.',
        avoid: 'Avoid cheap glam, over-shiny metallic excess, or crowded accessories.',
    },
    minimalist: {
        label: 'minimalist',
        summary: 'Create a pared-back interior where function and negative space lead.',
        palette: 'Use off-white, stone, taupe, and quiet monochrome transitions.',
        materials: 'Favor smooth matte finishes, clean wood, quiet stone, and low-texture upholstery.',
        textiles: 'Use only essential textiles, tightly controlled and visually calm.',
        accessories: 'Use extremely few accessories, only when they support scale and realism.',
        lighting: 'Use discreet flush, recessed-looking, or very clean pendant forms.',
        silhouette: 'Prefer crisp geometry, low profiles, and uninterrupted lines.',
        avoid: 'Avoid decorative excess, layered patterns, or bulky furniture grouping.',
    },
    classic: {
        label: 'classic',
        summary: 'Create a timeless residential interior with balanced tradition and elegance.',
        palette: 'Use warm neutrals, ivory, muted beige, walnut, and soft heritage tones.',
        materials: 'Favor fine wood, traditional upholstery, stone-like accents, and soft brushed metals.',
        textiles: 'Use tailored drapery and modestly elegant textiles with controlled refinement.',
        accessories: 'Use measured traditional accents and framed art in modest quantity.',
        lighting: 'Use timeless chandeliers, sconces, or table lamps with refined detail.',
        silhouette: 'Prefer graceful profiles, moderate ornament, and classic proportion.',
        avoid: 'Avoid ultra-modern starkness, industrial rawness, or theatrical ornament overload.',
    },
    rustic: {
        label: 'rustic',
        summary: 'Create a cozy natural interior with grounded material warmth.',
        palette: 'Use honey wood, sand, warm cream, camel, and muted earth tones.',
        materials: 'Favor natural timber, tactile woven pieces, stone-like texture, and matte metals.',
        textiles: 'Use cozy layered textiles with visible weave and warmth.',
        accessories: 'Use a few handmade or natural accents with warmth but not clutter.',
        lighting: 'Use warm-toned fixtures with simple rustic character and soft glow.',
        silhouette: 'Prefer sturdy forms with softened edges and crafted feel.',
        avoid: 'Avoid glossy glam, over-ornamented classic pieces, or urban industrial severity.',
    },
};

const INTENSITY_PLANS: Record<StyleIntensity, IntensityPlan> = {
    low: {
        label: 'restrained',
        furnitureDensity: 'Use the minimum furniture set needed to communicate the room function clearly.',
        accessoryDensity: 'Accessories should be sparse and secondary.',
        wallDecor: 'Use little to no wall decor unless the room would otherwise feel incomplete.',
        contrast: 'Keep contrast soft and calm with subtle styling differentiation.',
        lightingEmphasis: 'Restyle lighting quietly and avoid statement pieces unless truly necessary.',
    },
    medium: {
        label: 'balanced',
        furnitureDensity: 'Use a complete but edited furniture composition that reads clearly in listing photos.',
        accessoryDensity: 'Use a measured number of accessories with clean grouping logic.',
        wallDecor: 'Use selective wall decor only when it improves realism and scale balance.',
        contrast: 'Use clear but tasteful style contrast so the chosen style is readable without becoming loud.',
        lightingEmphasis: 'Restyle lighting enough to reinforce the chosen style while staying believable.',
    },
    high: {
        label: 'expressive but listing-safe',
        furnitureDensity: 'Use a richer staging set while preserving strong circulation and open sightlines.',
        accessoryDensity: 'Use more styling layers, but keep every cluster intentional and photo-clean.',
        wallDecor: 'Wall decor may be more visible, but never busy or gallery-wall heavy.',
        contrast: 'Let style cues read more strongly through palette, materials, and silhouettes.',
        lightingEmphasis: 'Allow lighting fixtures to become a visible style feature when scale supports it.',
    },
};

const ROOM_STYLE_COMBOS: Record<string, string> = {
    'salon:modern': 'Use a sofa-led living setup with one sculptural coffee table, clean media support, restrained art, and a premium yet uncluttered family-living feel.',
    'bedroom:luxury': 'Use an upholstered bed, elegant bedside symmetry, refined bench or chaise support when space allows, and polished layered lighting for a boutique-hotel feel.',
    'child_room:modern': 'Use a clean contemporary child room with playful warmth, compact toy/storage control, one defined play surface, and low visual clutter.',
    'office:minimalist': 'Use a sharply organized work zone with a disciplined desk composition, hidden-feeling storage, and almost no decorative distractions.',
    'kitchen:scandinavian': 'Keep the kitchen bright and airy with pale finishes, natural wood touches, and only a few warm styling accents that do not disrupt workflow.',
    'balcony:bohemian': 'Use compact woven outdoor seating, a light textured rug or cushion accent, and a few planters for a relaxed but still open balcony mood.',
    'living_room:modern': 'Use a contemporary everyday living room with clean seating geometry, practical side storage, and strong visual calm.',
    'guest_room:minimalist': 'Use a neat, welcoming guest setup with compact furnishings and hotel-like simplicity.',
    'dressing_room:luxury': 'Use tailored wardrobe elegance, a clean mirror axis, and premium seating support without cluttering circulation.',
    'office:industrial': 'Use a disciplined work room with dark metal accents, practical shelving, and a mature studio-office character.',
    'bathroom:luxury': 'Keep it spa-like, polished, and uncluttered with premium towel styling and compact elegant accessories only.',
    'entryway:modern': 'Use a slim, highly ordered entry composition with a console, mirror, and understated decor that frames arrival clearly.',
};

function resolveRoomPlan(roomType: string): RoomPlan {
    return ROOM_PLANS[roomType] || DEFAULT_ROOM_PLAN;
}

function resolveStylePlan(style: string, customStylePrompt: string): StylePlan {
    if (style === 'custom' && customStylePrompt.trim()) {
        const custom = customStylePrompt.trim();
        return {
            label: 'custom style',
            summary: `Follow this custom style direction while preserving listing realism: ${custom}`,
            palette: `Infer a cohesive palette from this brief: ${custom}`,
            materials: `Use materials and finish language suggested by this brief: ${custom}`,
            textiles: 'Translate the brief into textiles only where the room function supports it; avoid costume-like styling.',
            accessories: 'Use only the accessories needed to express the brief clearly without clutter.',
            lighting: 'Restyle visible fixtures so they support the brief while keeping mounting points fixed.',
            silhouette: 'Adopt the form language implied by the brief, but keep furniture practical, physically grounded, and scale-appropriate.',
            avoid: 'Do not interpret the custom brief in an exaggerated, theatrical, or impractical way.',
        };
    }
    return STYLE_PLANS[style] || DEFAULT_STYLE_PLAN;
}

function resolveComboPlan(roomType: string, style: string, roomPlan: RoomPlan, stylePlan: StylePlan): string {
    const combo = ROOM_STYLE_COMBOS[`${roomType}:${style}`];
    if (combo) return combo;
    return `Blend the ${roomPlan.label} function with ${stylePlan.label} styling so the room use is immediately readable first, then the style reads through palette, materials, lighting, and silhouette without over-decorating the space.`;
}

function formatBulletLines(lines: string[]): string {
    return lines.map((line) => `- ${line}`).join('\n');
}

function formatLearnedRules(directives: string[]): string {
    if (directives.length === 0) return '';
    return `Learned optimization rules from previous runs:\n${directives.map((line) => `- ${line}`).join('\n')}`;
}

function buildVersionPlan(version: PromptVersion): string {
    if (version === 'A') {
        return 'Version strategy A: architecture-first conservative staging. Preserve room geometry with maximum caution, use cleaner spacing, and allow style expression only after room logic is fully satisfied.';
    }
    return 'Version strategy B: architecture-safe but more style-expressive staging. Preserve all geometry equally strictly, but let palette, materials, fixture choices, and silhouette differences read more clearly.';
}

function buildConstraintBlock(
    roomPlan: RoomPlan,
    stylePlan: StylePlan,
    comboPlan: string,
    intensityPlan: IntensityPlan,
    input: StagePromptInput
): string {
    const watermarkRule = input.watermarkSuspected
        ? 'Input may contain watermark text. Keep text-zone geometry stable and avoid over-editing around watermark pixels.'
        : 'Keep any existing text regions stable and do not hallucinate new text.';
    const cropRule = input.watermarkCropApplied
        ? 'A safe crop was applied before staging. Preserve the new framing exactly.'
        : 'Preserve the input framing exactly.';
    const cleanupRule = input.cleanupBoost
        ? 'Run a stricter cleanup pass so floors and walls read fully clean and residue-free.'
        : 'Clean temporary dirt, dust, smudges, and construction residue while keeping original materials intact.';
    const ghostRule = input.antiGhostBoost
        ? 'Enforce zero ghosting. Omit any uncertain object instead of rendering a partial or transparent one.'
        : 'All placed objects must be fully opaque, fully rendered, and physically grounded.';

    return [
        'STRICT ARCHITECTURE RULES:',
        '- Never change room dimensions, wall positions, ceiling geometry, window or door locations, openings, structural contours, or camera perspective.',
        '- Never invent new walls, partitions, bulkheads, columns, vertical planes, or fake depth surfaces anywhere in the frame.',
        '- Keep floor pattern direction, wall termination lines, corner joins, and all architectural anchors identical to the input.',
        '',
        'ROOM FUNCTION PLAN:',
        formatBulletLines([
            roomPlan.useCase,
            `Focal-point rule: ${roomPlan.focalPoint}`,
            `Must-have rule: ${roomPlan.mustHave}`,
            `Avoid rule: ${roomPlan.avoid}`,
            `Circulation rule: ${roomPlan.circulation}`,
            `Scale rule: ${roomPlan.scale}`,
        ]),
        '',
        'STYLE PLAN:',
        formatBulletLines([
            stylePlan.summary,
            `Palette: ${stylePlan.palette}`,
            `Materials: ${stylePlan.materials}`,
            `Textiles: ${stylePlan.textiles}`,
            `Accessories: ${stylePlan.accessories}`,
            `Lighting language: ${stylePlan.lighting}`,
            `Silhouette language: ${stylePlan.silhouette}`,
            `Avoid: ${stylePlan.avoid}`,
        ]),
        '',
        'ROOM + STYLE COMPOSITION PLAN:',
        `- ${comboPlan}`,
        '',
        'STAGING INTENSITY:',
        formatBulletLines([
            `Intensity mode: ${intensityPlan.label}.`,
            intensityPlan.furnitureDensity,
            intensityPlan.accessoryDensity,
            intensityPlan.wallDecor,
            intensityPlan.contrast,
            intensityPlan.lightingEmphasis,
        ]),
        '',
        'NEGATIVE RULES:',
        formatBulletLines([
            'Do not overfill the room or make circulation ambiguous.',
            'Do not block doors, windows, radiators, built-ins, or key openings.',
            'Do not create collage, inset, split-scene, partial-room, or panel-like outputs.',
            'Do not leave semi-transparent objects, duplicate outlines, seam bands, or cut furniture.',
            'Do not add excessive gallery walls, too many small accessories, or visually noisy decor clusters.',
            'If a fixture is restyled, keep its mounting location fixed and make the new fixture style-appropriate.',
            'If the room function and style brief conflict, room function wins first and style expression adapts second.',
            watermarkRule,
            cropRule,
            cleanupRule,
            ghostRule,
            buildVersionPlan(input.promptVersion),
        ]),
    ].join('\n');
}

export function resolveStagePromptPlans(input: StagePromptInput): {
    roomPlan: RoomPlan;
    stylePlan: StylePlan;
    comboPlan: string;
    intensityPlan: IntensityPlan;
} {
    const roomPlan = resolveRoomPlan(input.roomType);
    const stylePlan = resolveStylePlan(input.style, input.customStylePrompt);
    const comboPlan = resolveComboPlan(input.roomType, input.style, roomPlan, stylePlan);
    const intensityPlan = INTENSITY_PLANS[input.styleIntensity] || INTENSITY_PLANS.medium;
    return { roomPlan, stylePlan, comboPlan, intensityPlan };
}

export function generateStagePrompt(input: StagePromptInput): string {
    const { roomPlan, stylePlan, comboPlan, intensityPlan } = resolveStagePromptPlans(input);
    const learnedRules = formatLearnedRules(input.learnedDirectives);
    const customGuard =
        input.style === 'custom' && input.customStylePrompt.trim()
            ? `CUSTOM STYLE GUARD:\n- Follow the custom brief faithfully, but do not let it override the ${roomPlan.label} function, circulation, or scale rules.\n- Translate the brief into realistic listing-ready staging rather than moodboard fantasy.`
            : '';

    return [
        `Task: Stage this ${roomPlan.label} as a single ultra-photorealistic real-estate photo.`,
        '',
        buildConstraintBlock(roomPlan, stylePlan, comboPlan, intensityPlan, input),
        customGuard,
        learnedRules,
        '',
        'FINAL OUTPUT RULE:',
        '- Return one unified, listing-ready furnished image with strong room-function clarity, readable style identity, premium cleanliness, and unchanged architecture.',
    ]
        .filter(Boolean)
        .join('\n');
}
