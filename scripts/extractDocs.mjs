import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

async function extract(filePath) {
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        const outDir = 'temp_extracted';
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
        const outPath = path.join(outDir, path.basename(filePath).replace('.docx', '.txt'));
        fs.writeFileSync(outPath, result.value);
        console.log(`Saved: ${outPath}`);
    } catch (error) {
        console.error(`Error extracting ${filePath}:`, error);
    }
}

const docsDir = 'source_docs/focus_areas';
const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.docx'));

async function run() {
    for (const file of files) {
        await extract(path.join(docsDir, file));
    }
}

run();
