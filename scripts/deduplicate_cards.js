import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cardsPath = path.join(__dirname, '../public/content/data/cards.json');
const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));

const seenIds = new Set();
let fixedCount = 0;

cards.forEach(card => {
    let originalId = card.id;
    let uniqueId = originalId;
    let counter = 1;

    while (seenIds.has(uniqueId)) {
        // ID collision found
        uniqueId = `${originalId}-dedup-${counter}`;
        counter++;
    }

    if (uniqueId !== originalId) {
        console.log(`Renaming duplicate ID: ${originalId} -> ${uniqueId} ("${card.title}")`);
        card.id = uniqueId;
        fixedCount++;
    }

    seenIds.add(uniqueId);
});

fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2));
console.log(`Fixed ${fixedCount} ID collisions. All content preserved.`);
