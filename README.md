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

Markdown rendering uses a light in-repo renderer wired through the `react-markdown`/`remark-gfm` aliases (see `src/vendor/`) so the app stays buildable even in offline or proxied environments.

## Project Structure

```
src/
├── components/     # UI components (incl. MarkdownPage renderer)
├── contexts/       # React contexts (Search, Content loading)
├── hooks/          # Custom React hooks
├── lib/            # Utilities and content schemas/loaders
└── pages/          # Route pages
content/
├── flow/           # Markdown for each flow step
├── templates/      # Markdown templates rendered in the UI
└── focus-areas/    # Markdown overviews and optional bucket notes per focus area
public/content/     # JSON manifests and structured metadata (cards, focus areas, flow manifest, templates manifest, pathways)
source_docs/        # Optional DOCX source files for authoring
scripts/            # Utility scripts (e.g., DOCX → Markdown)
```

## Adding Content

Guidebook content is split between structured JSON and Markdown:

- **JSON (public/content)**: structured metadata for cards, focus areas, pathways, and manifests pointing to Markdown files.
- **Markdown (content/)**: all narrative copy for flow steps, templates, and focus area overviews (plus optional bucket guidance).

Update these files to change or extend the guidebook—no UI code changes required.

### Adding a New Focus Area

1. Add an entry to `public/content/focus-areas.json` with `id`, `name`, `overviewPath`, bucket metadata, curated card IDs, and prompts.
2. Reference card IDs from `public/content/cards.json` in `curatedCardIds` and the bucket `cardIds` arrays.
3. Create the overview Markdown at `content/focus-areas/<focusAreaId>/overview.md` (and optional per-bucket markdown in `content/focus-areas/<focusAreaId>/buckets/`).
3. The new focus area will appear automatically on the Focus Areas page.

### Adding New Cards

1. Add card entries to `public/content/cards.json` with tags (topic/type/commitment) for filtering.
2. Reference the new card IDs from focus areas or pathways as needed.
3. Cards automatically appear in the catalog, search, and command palette.

### Modifying Session Steps

1. Edit `public/content/flow.json` to add/update step metadata (id, titles, colors, and `contentPath`).
2. Add or edit the matching Markdown in `content/flow/<stepId>.md`.
3. The flow page and navbar jump menu update automatically.

### Updating Pathways or Templates

- Add or edit pathway entries in `public/content/pathways.json`.
- Add or edit templates/tools in `public/content/templates.json`, pointing each entry to a Markdown file under `content/templates/`.

### DOCX to Markdown authoring loop

1. Edit or drop DOCX drafts in `source_docs/`.
2. Run the converter: `node scripts/convert-docx-to-md.js source_docs/<file>.docx content/<destination>.md` (requires `pandoc`).
3. Review the generated Markdown in `content/`, commit, and ship.

If content fails schema validation in development, detailed errors are printed to the console and a friendly error page is shown in the UI. Refresh after fixing the JSON files.

## License

MIT
