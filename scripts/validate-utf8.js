#!/usr/bin/env node
/* Validate authored text without rewriting historical or vendored assets. */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const excludedDirectories = new Set(['.git', 'node_modules', 'lib', 'test-results', 'playwright-report']);
const textExtensions = new Set(['.js', '.json', '.md', '.html', '.css', '.ps1']);
const failures = [];
let checked = 0;

function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (!excludedDirectories.has(entry.name)) visit(path.join(directory, entry.name));
            continue;
        }
        if (!textExtensions.has(path.extname(entry.name).toLowerCase())) continue;
        const file = path.join(directory, entry.name);
        const bytes = fs.readFileSync(file);
        const decoded = new TextDecoder('utf-8', { fatal: true });
        try {
            decoded.decode(bytes);
            checked++;
        } catch (error) {
            failures.push(`${path.relative(root, file)}: ${error.message}`);
        }
    }
}

visit(root);
if (failures.length) {
    console.error(`UTF-8 validation failed for ${failures.length} first-party file(s):`);
    failures.forEach(failure => console.error(`- ${failure}`));
    process.exit(1);
}
console.log(`UTF-8 valid: ${checked} first-party text files (pinned lib/ excluded).`);
