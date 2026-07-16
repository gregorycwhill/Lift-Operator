const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'design', 'game-balance.v1.json');
const outputDir = path.join(root, 'generated');
const outputPath = path.join(outputDir, 'game-balance.js');
const balance = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const checkOnly = process.argv.includes('--check');

const source = [
    '// GENERATED FILE - DO NOT EDIT.',
    '// Source: design/game-balance.v1.json',
    `// Balance version: ${balance.balanceVersion}`,
    'window.GameBalanceData = ' + JSON.stringify(balance, null, 2) + ';',
    ''
].join('\n');

if (checkOnly) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
    if (existing !== source) {
        console.error('Generated balance artifact is stale. Run npm run balance:generate.');
        process.exit(1);
    }
    console.log(`Generated balance artifact is current (${balance.balanceVersion}).`);
} else {
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputPath, source, 'utf8');
    console.log(`Generated ${path.relative(root, outputPath)} from balance ${balance.balanceVersion}.`);
}
