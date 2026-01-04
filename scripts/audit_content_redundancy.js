import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const focusAreasDir = path.join(__dirname, '../vault/02_Focus-Areas');
const dirs = fs.readdirSync(focusAreasDir).filter(f => fs.statSync(path.join(focusAreasDir, f)).isDirectory());

let foundDocs = [];

dirs.forEach(dir => {
    const filePath = path.join(focusAreasDir, dir, 'overview.md');
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');

        // Check for "What kinds of work" or "fit often looks like"
        if (content.includes('What kinds of work') || content.includes('good fit often looks like')) {
            foundDocs.push(dir);
        }
    }
});

if (foundDocs.length > 0) {
    console.log("Redundant content found in:");
    foundDocs.forEach(d => console.log(` - ${d}`));
    console.log("Recommend automatic cleanup.");
} else {
    console.log("No redundant redundant sections found.");
}
