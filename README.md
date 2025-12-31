# 1:1 Career Counseling Guidebook

A web-based read-only guidebook for running live 1:1 career counseling sessions. Features a structured Session Flow guide for mentors to use during calls, plus a browseable Library of focus areas, recommendation cards, and templates.

## Features

- **Session Flow Guide**: Read-only interactive flow for 60-90 min sessions with prompts and guidance
- **Focus Areas**: Quick-start pages for different career tracks (AI Safety, etc.)
- **Recommendation Cards**: Filterable database of resources, programs, and next steps
- **Common Pathways**: Focus-area-agnostic career transition patterns
- **Templates & Tools**: Session wrap summaries and focus area templates

## Using the Guidebook

### Session Flow (`/flow`)

The Session Flow is a read-only guide with deep links to each step:

- `/flow#opening` - Opening & Goals
- `/flow#background` - What They Bring
- `/flow#happiness` - What Makes Them Happy
- `/flow#constraints` - Constraints & Non-Negotiables
- `/flow#directions` - Iterative Direction Testing
- `/flow#wrap` - Wrap & Export

Each step provides suggested prompts and contextual tips. Use this during live calls to stay on track.

### Library

Browse the library sections to find relevant resources:

- **Focus Areas**: Deep dives into specific career tracks
- **Cards**: Searchable database of recommendations with filters
- **Pathways**: Common career transition patterns
- **Templates**: Summary formats and planning tools

## Tech Stack

- **Frontend**: Vite, React, TypeScript, Tailwind CSS, shadcn/ui
- **State**: React Context for search, URL hash for flow navigation

## Development

```sh
# Install dependencies
npm install

# Start development server
npm run dev
```

## Project Structure

```
src/
├── components/     # UI components
├── contexts/       # React contexts (Search)
├── data/          # Content data (cards, focus areas, pathways, steps)
├── hooks/         # Custom React hooks
├── lib/           # Utilities
└── pages/         # Route pages
```

## Adding Content

The system is designed for easy content extension:

### Adding a New Focus Area

1. Add a new `FocusArea` object in `src/data/focusAreas.ts`
2. Reference existing or new card IDs in the `curatedCardIds` array
3. No UI code changes needed

### Adding New Cards

1. Add `RecommendationCard` objects in `src/data/cards.ts`
2. Use consistent tags for filtering (topic, type, commitment)
3. Cards automatically appear in the catalog and search

### Modifying Session Steps

Edit `src/data/sessionSteps.ts` to change prompts, titles, or add new steps.

## License

MIT
