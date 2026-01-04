import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const focusAreasDir = path.join(__dirname, '../vault/02_Focus-Areas');

if (!fs.existsSync(focusAreasDir)) {
    console.error(`Directory not found: ${focusAreasDir}`);
    process.exit(1);
}

const dirs = fs.readdirSync(focusAreasDir).filter(f => fs.statSync(path.join(focusAreasDir, f)).isDirectory());

let totalReplacements = 0;

dirs.forEach(dir => {
    const filePath = path.join(focusAreasDir, dir, 'overview.md');
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');

        // Pattern: 
        // \s+           : At least one space
        // \(            : Open paren
        // [A-Z0-9]      : Starts with Capital or Digit (Sources usually do, plain text usually doesn't)
        // [^()]*?       : Non-greedy match of anything not parens
        // \)            : Close paren
        // (?=("|\s*$))  : Positive lookahead for Quote (YAML ending) or End of Line (Markdown text)
        const regex = /\s+\([A-Z0-9][^()]*?\)(?=("|\s*$\n?))/gm;

        const matches = content.match(regex);
        if (matches) {
            console.log(`\nCleaning ${dir}/overview.md:`);
            matches.forEach(m => console.log(`  Removing: "${m}"`));

            const newContent = content.replace(regex, '');
            fs.writeFileSync(filePath, newContent, 'utf8');
            totalReplacements += matches.length;
        }
    }
});

console.log(`\nTotal citations removed: ${totalReplacements}`);
