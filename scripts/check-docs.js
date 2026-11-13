const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const required = [
    'DOCUMENTATION.md',
    'ROADMAP.md',
    'DELIVERY_PLAN.md',
    'TEST_PLAN.md',
    'THIRD_PARTY_NOTICES.md',
    'docs/CHAT_DECISION_LOG.md',
    'docs/playtest/PLAYTEST_FEEDBACK_LOG.md',
    'docs/playtest/RC1_PLAYTEST_PACK.md'
];
const forbiddenAuthorityClaims = [
    /\bPrimary implementation authority\b/i,
    /\bhandoff takes precedence\b/i,
    /\bactive implementation authority\b/i
];
const activeProductDocs = [
    'README.md',
    'DOCUMENTATION.md',
    'ROADMAP.md',
    'DELIVERY_PLAN.md',
    'TEST_PLAN.md',
    'Lift-Operator_GDD.md',
    'Game Play Map.md',
    'Automation_Workshop_Spec.md',
    'Game Economy.md',
    'BALANCE_WORKFLOW.md',
    'docs/playtest/RC1_PLAYTEST_PACK.md'
];
const forbiddenCurrentStatusClaims = [
    /Counterweights and Open Plan are removed completely/i,
    /retired paired[- ](?:car|lift)/i,
    /not backlog items/i
];

function markdownFiles(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        if (entry.name === '.git' || entry.name === 'node_modules') return [];
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) return markdownFiles(fullPath);
        return entry.isFile() && entry.name.endsWith('.md') ? [fullPath] : [];
    });
}

const failures = [];
for (const file of required) {
    if (!fs.existsSync(path.join(root, file))) failures.push(`Missing required live document: ${file}`);
}

for (const file of activeProductDocs) {
    const filePath = path.join(root, file);
    if (!fs.existsSync(filePath)) {
        failures.push(`Missing active product document: ${file}`);
        continue;
    }
    const documentText = fs.readFileSync(filePath, 'utf8');
    for (const pattern of forbiddenCurrentStatusClaims) {
        if (pattern.test(documentText)) failures.push(`${file}: obsolete mechanic-status claim matching ${pattern}`);
    }
}

const roadmap = fs.readFileSync(path.join(root, 'ROADMAP.md'), 'utf8');
const deliveryPlan = fs.readFileSync(path.join(root, 'DELIVERY_PLAN.md'), 'utf8');
const gdd = fs.readFileSync(path.join(root, 'Lift-Operator_GDD.md'), 'utf8');
const workshopSpec = fs.readFileSync(path.join(root, 'Automation_Workshop_Spec.md'), 'utf8');
const gameMap = fs.readFileSync(path.join(root, 'Game Play Map.md'), 'utf8');
const chatDecisions = fs.readFileSync(path.join(root, 'docs/CHAT_DECISION_LOG.md'), 'utf8');
if (!roadmap.includes('suspended, not retired')) failures.push('ROADMAP.md: missing approved suspended/not-retired status');
if (!deliveryPlan.includes('temporarily suspended')) failures.push('DELIVERY_PLAN.md: missing temporary-suspension status');
if (!gdd.includes('suspended, not retired')) failures.push('Lift-Operator_GDD.md: missing suspended/not-retired status');
if (!workshopSpec.includes('From R15')) failures.push('Automation_Workshop_Spec.md: transfer availability must begin at R15');
if (!gameMap.includes('Transfers begin in R15')) failures.push('Game Play Map.md: transfer introduction must remain R15');
if (!chatDecisions.includes('DEC-058')) failures.push('docs/CHAT_DECISION_LOG.md: missing superseding DEC-058');

const balance = JSON.parse(fs.readFileSync(path.join(root, 'design/game-balance.v1.json'), 'utf8'));
const releaseConfig = fs.readFileSync(path.join(root, 'release-config.js'), 'utf8');
const buildMatch = releaseConfig.match(/buildVersion:\s*'([^']+)'/);
if (!buildMatch) {
    failures.push('release-config.js: buildVersion not found');
} else {
    for (const file of ['Game Play Map.md', 'docs/playtest/RC1_PLAYTEST_PACK.md']) {
        const documentText = fs.readFileSync(path.join(root, file), 'utf8');
        if (!documentText.includes(buildMatch[1])) failures.push(`${file}: build version does not match release-config.js`);
    }
}
if (!gameMap.includes(balance.balanceVersion)) failures.push('Game Play Map.md: balance version does not match canonical JSON');

for (const filePath of markdownFiles(root)) {
    const text = fs.readFileSync(filePath, 'utf8');
    const displayName = path.relative(root, filePath);
    for (const pattern of forbiddenAuthorityClaims) {
        if (pattern.test(text)) failures.push(`${displayName}: obsolete authority claim matching ${pattern}`);
    }
    for (const match of text.matchAll(/\]\(([^)#]+)(?:#[^)]+)?\)/g)) {
        const target = decodeURIComponent(match[1].trim().replace(/^<|>$/g, ''));
        if (!target || /^(https?:|mailto:)/i.test(target)) continue;
        const resolved = path.resolve(path.dirname(filePath), target);
        if (!resolved.startsWith(root + path.sep) && resolved !== root) {
            failures.push(`${displayName}: link escapes repository: ${target}`);
        } else if (!fs.existsSync(resolved)) {
            failures.push(`${displayName}: missing local link target: ${target}`);
        }
    }
}

if (failures.length) {
    console.error(`Documentation check failed:\n- ${failures.join('\n- ')}`);
    process.exit(1);
}

console.log(`Documentation valid: ${markdownFiles(root).length} Markdown files checked.`);
