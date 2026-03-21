const CASES = [
  { roomType: 'salon', style: 'modern', label: 'salon x modern' },
  { roomType: 'bedroom', style: 'luxury', label: 'bedroom x luxury' },
  { roomType: 'child_room', style: 'modern', label: 'child_room x modern' },
  { roomType: 'office', style: 'minimalist', label: 'office x minimalist' },
  { roomType: 'kitchen', style: 'scandinavian', label: 'kitchen x scandinavian' },
  { roomType: 'balcony', style: 'bohemian', label: 'balcony x bohemian' },
];

const { generateStagePrompt, resolveStagePromptPlans } = await import('../lib/stage-prompt.ts');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

for (const c of CASES) {
  const input = {
    roomType: c.roomType,
    style: c.style,
    customStylePrompt: '',
    styleIntensity: 'medium',
    learnedDirectives: [],
    watermarkSuspected: false,
    watermarkCropApplied: false,
    promptVersion: 'A',
    cleanupBoost: false,
    antiGhostBoost: false,
  };
  const prompt = generateStagePrompt(input);
  const plans = resolveStagePromptPlans(input);
  assert(prompt.includes('STRICT ARCHITECTURE RULES:'), `${c.label}: missing architecture block`);
  assert(prompt.includes('ROOM FUNCTION PLAN:'), `${c.label}: missing room function block`);
  assert(prompt.includes('STYLE PLAN:'), `${c.label}: missing style block`);
  assert(prompt.includes('ROOM + STYLE COMPOSITION PLAN:'), `${c.label}: missing combo block`);
  assert(prompt.includes(plans.roomPlan.label), `${c.label}: room label not reflected`);
  assert(prompt.includes(plans.stylePlan.summary), `${c.label}: style summary not reflected`);
  console.log(`PASS ${c.label}`);
  console.log(`  room=${plans.roomPlan.label}`);
  console.log(`  style=${plans.stylePlan.label}`);
  console.log(`  combo=${plans.comboPlan}`);
}
