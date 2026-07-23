const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const required = ['DOCUMENTATION.md', 'ROADMAP.md', 'DELIVERY_PLAN.md', 'TEST_PLAN.md'];
const forbiddenAuthorityClaims = [
    /\bPrimary implementation authority\b/i,
    /\bhandoff takes precedence\b/i,
    /\bactive implementation authority\b/i
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
