const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const root = path.resolve(__dirname, '..');
const excluded = new Set(['node_modules', 'lib', '.git']);

function collect(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        if (excluded.has(entry.name)) return [];
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) return collect(fullPath);
        return entry.isFile() && entry.name.endsWith('.js') ? [fullPath] : [];
    });
}

const files = collect(root);
for (const file of files) {
    childProcess.execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
}
console.log(`Syntax valid: ${files.length} JavaScript files.`);
