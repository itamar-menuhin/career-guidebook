import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cardsPath = path.join(__dirname, '../public/content/data/cards.json');
const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));

const missingAreas = [
    {
        id: 'biosecurity',
        cards: [
            { title: "80,000 Hours: Biosecurity & Pandemic Preparedness", type: "quick-taste", topic: "reading" },
            { title: "BlueDot Impact: Biosecurity Fundamentals", type: "deeper-dive", topic: "course" },
            { title: "Johns Hopkins ELBI Fellowship", type: "hands-on", topic: "program" },
            { title: "80,000 Hours Job Board (Biosecurity)", type: "job-board", topic: "job-board" }
        ]
    },
    {
        id: 'climate',
        cards: [
            { title: "Probable Good: Climate Careers Guide", type: "quick-taste", topic: "reading" },
            { title: "Terra.do Climate Bootcamp", type: "deeper-dive", topic: "course" },
            { title: "Work on Climate Community", type: "hands-on", topic: "community" },
            { title: "Climatebase Job Board", type: "job-board", topic: "job-board" }
        ]
    },
    {
        id: 'global-health-development',
        cards: [
            { title: "GiveWell: Top Charities Analysis", type: "quick-taste", topic: "reading" },
            { title: "Charity Entrepreneurship Incubation Program", type: "deeper-dive", topic: "program" },
            { title: "The Life You Can Save: Impact Calculator", type: "hands-on", topic: "tool" },
            { title: "Idealist.org (Global Health)", type: "job-board", topic: "job-board" }
        ]
    },
    {
        id: 'animal-welfare',
        cards: [
            { title: "Animal Charity Evaluators: Recommended Charities", type: "quick-taste", topic: "reading" },
            { title: "Animal Advocacy Careers: Intro Course", type: "deeper-dive", topic: "course" },
            { title: "Wild Animal Initiative: Research Proposal", type: "hands-on", topic: "project" },
            { title: "Animal Advocacy Careers Job Board", type: "job-board", topic: "job-board" }
        ]
    }
];

let newCardsCount = 0;

missingAreas.forEach(area => {
    area.cards.forEach((t, i) => {
        // Check if card already exists for this area to avoid dupes
        const exists = cards.some(c => c.focusAreaIds.includes(area.id) && c.title === t.title);
        if (!exists) {
            const newCard = {
                id: `${area.id}-card-gen-${i}`,
                title: t.title,
                oneLiner: `Resource for ${t.title} - generic placeholder for layout preview.`,
                whenToSuggest: "Aligns with user interest in this area.",
                whenNotToSuggest: "N/A",
                tags: {
                    topic: t.topic,
                    type: t.type, // This maps to the buckets: quick-taste, deeper-dive, hands-on, job-board
                    commitment: "low",
                    goodFitIf: ["Interested in this specific resource"]
                },
                firstSmallStep: "Open the link and review.",
                nextStep: "Decide if this path is right for you.",
                links: [{ label: "Link", url: "#" }],
                peopleToTalkTo: [],
                focusAreaIds: [area.id]
            };
            cards.push(newCard);
            newCardsCount++;
        }
    });
});

fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2));
console.log(`Added ${newCardsCount} new cards to cards.json`);
