import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cardsPath = path.join(__dirname, '../public/content/data/cards.json');
const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));

const idMap = {};
const titleMap = {};

cards.forEach(card => {
    // Check ID duplication
    if (!idMap[card.id]) {
        idMap[card.id] = [];
    }
    idMap[card.id].push(card);

    // Check Title duplication
    if (!titleMap[card.title]) {
        titleMap[card.title] = [];
    }
    titleMap[card.title].push(card);
});

console.log("--- Duplicate IDs analysis ---");
Object.keys(idMap).forEach(id => {
    if (idMap[id].length > 1) {
        console.log(`ID '${id}' is used ${idMap[id].length} times:`);
        idMap[id].forEach(c => console.log(`  - Title: ${c.title}`));
    }
});

console.log("\n--- Duplicate Titles analysis ---");
Object.keys(titleMap).forEach(title => {
    if (titleMap[title].length > 1) {
        console.log(`Title '${title}' appears ${titleMap[title].length} times:`);
        titleMap[title].forEach(c => console.log(`  - ID: ${c.id}`));
    }
});
