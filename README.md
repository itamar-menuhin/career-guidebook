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
├── contexts/       # React contexts (Search, Content loading)
├── hooks/         # Custom React hooks
├── lib/           # Utilities and content schemas/loaders
└── pages/         # Route pages
public/
└── content/       # JSON content files loaded at runtime
```

## Adding Content

All guidebook content lives in `public/content` as JSON files validated at startup. Update these files to change or extend the guidebook—no UI code changes required.

### Adding a New Focus Area

1. Add an entry to `public/content/focus-areas.json` with `id`, `name`, `overview`, buckets, curated card IDs, and prompts.
2. Reference card IDs from `public/content/cards.json` in `curatedCardIds` and the bucket `cardIds` arrays.
3. The new focus area will appear automatically on the Focus Areas page.

### Adding New Cards

1. Add card entries to `public/content/cards.json` with tags (topic/type/commitment) for filtering.
2. Reference the new card IDs from focus areas or pathways as needed.
3. Cards automatically appear in the catalog, search, and command palette.

### Modifying Session Steps

Edit `public/content/flow.json` to change prompts, titles, or add new steps. The flow page and navbar jump menu update automatically.

### Updating Pathways or Templates

- Add or edit pathway entries in `public/content/pathways.json`.
- Add or edit templates/tools in `public/content/templates.json` to update the Templates page and copy-to-clipboard content.

If content fails schema validation in development, detailed errors are printed to the console and a friendly error page is shown in the UI. Refresh after fixing the JSON files.

## License

MIT
