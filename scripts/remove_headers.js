import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const focusAreasDir = path.join(__dirname, '../vault/02_Focus-Areas');

// Get all focus area directories
const dirs = fs.readdirSync(focusAreasDir).filter(f => fs.statSync(path.join(focusAreasDir, f)).isDirectory());

let formattedCount = 0;

dirs.forEach(dir => {
    const filePath = path.join(focusAreasDir, dir, 'overview.md');
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');

        // Look for the header "## What it's trying to achieve (plain language)"
        // and remove it, along with following newlines
        const regex = /##\s*What it's trying to achieve \(plain language\)\s*\n+/g;

        if (regex.test(content)) {
            content = content.replace(regex, '');
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Cleaned ${dir}/overview.md`);
            formattedCount++;
        }
    }
});

console.log(`Removed headers from ${formattedCount} files.`);
