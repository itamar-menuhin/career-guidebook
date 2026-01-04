import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cardsPath = path.join(__dirname, '../public/content/data/cards.json');
const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));

let moveCount = 0;

cards.forEach(card => {
    const t = card.title.toLowerCase();

    // Fix Climate cards
    if (t.includes('climate') || t.includes('terra.do')) {
        if (!card.focusAreaIds.includes('climate')) {
            console.log(`Moving "${card.title}" to Climate`);
            card.focusAreaIds = ['climate'];
            moveCount++;
        }
        // Remove ai-x-animals if present (unless it's actually both, but these look like errors)
        if (card.focusAreaIds.includes('ai-x-animals')) {
            card.focusAreaIds = card.focusAreaIds.filter(id => id !== 'ai-x-animals');
            if (!card.focusAreaIds.includes('climate')) card.focusAreaIds.push('climate');
        }
    }

    // Fix Global Health cards
    if (t.includes('givewell') || t.includes('global health') || t.includes('life you can save') || t.includes('charity entrepreneurship')) {
        if (!card.focusAreaIds.includes('global-health-development')) {
            console.log(`Moving "${card.title}" to Global Health`);
            card.focusAreaIds = ['global-health-development'];
            moveCount++;
        }
        if (card.focusAreaIds.includes('ai-x-animals')) {
            card.focusAreaIds = card.focusAreaIds.filter(id => id !== 'ai-x-animals');
            if (!card.focusAreaIds.includes('global-health-development')) card.focusAreaIds.push('global-health-development');
        }
    }
});

fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2));
console.log(`Reclassified ${moveCount} cards.`);
