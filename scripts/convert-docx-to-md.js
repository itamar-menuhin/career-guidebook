#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const [, , inputPath, outputPath] = process.argv;

if (!inputPath || !outputPath) {
  console.error('Usage: node scripts/convert-docx-to-md.js <input.docx> <output.md>');
  console.error(
    'Example: node scripts/convert-docx-to-md.js source_docs/flow.docx public/content/md/flow/opening.md'
  );
  process.exit(1);
}

if (!fs.existsSync(inputPath)) {
  console.error(`Input file not found: ${inputPath}`);
  process.exit(1);
}

const outputDir = path.dirname(outputPath);
fs.mkdirSync(outputDir, { recursive: true });

try {
  execSync(`pandoc "${inputPath}" -f docx -t gfm -o "${outputPath}"`, {
    stdio: 'inherit',
  });
  console.log(`Converted ${inputPath} -> ${outputPath}`);
} catch (error) {
  console.error('Failed to convert DOCX to Markdown. Ensure pandoc is installed.');
  process.exit(1);
}
