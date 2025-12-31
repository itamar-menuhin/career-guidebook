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

1. Add an entry to `public/content/data/focus-areas.json` with `id`, `name`, `overviewPath`, bucket metadata, curated card IDs, and prompts.
2. Reference card IDs from `public/content/data/cards.json` in `curatedCardIds` and the bucket `cardIds` arrays.
3. Create the overview Markdown at `public/content/md/focus-areas/<focusAreaId>/overview.md` (and optional per-bucket markdown in `public/content/md/focus-areas/<focusAreaId>/buckets/`).
3. The new focus area will appear automatically on the Focus Areas page.

### Adding New Cards

1. Add card entries to `public/content/data/cards.json` with tags (topic/type/commitment) for filtering.
2. Reference the new card IDs from focus areas or pathways as needed.
3. Cards automatically appear in the catalog, search, and command palette.

### Modifying Session Steps

1. Edit `public/content/data/flow.json` to add/update step metadata (id, titles, colors, and `contentPath`).
2. Add or edit the matching Markdown in `public/content/md/flow/<stepId>.md`.
3. The flow page and navbar jump menu update automatically.

### Updating Pathways or Templates

- Add or edit pathway entries in `public/content/data/pathways.json`.
- Add or edit templates/tools in `public/content/data/templates.json`, pointing each entry to a Markdown file under `public/content/md/templates/`.

### DOCX ingestion pipeline

The repository includes a Python-based ingestion script that converts DOCX source files into the Markdown and JSON consumed by the site.

1. Install the DOCX dependency once: `pip install -r requirements.txt` (requires Python 3).
2. Place the core guidebook DOCX in `source_docs/core/` and focus area DOCX files in `source_docs/focus_areas/`.
3. Run the ingestion step: `npm run ingest`
   - Clears `generated/` and rebuilds `generated/content/**/*` and `generated/data/*.json`
   - Copies generated JSON into `public/content/data/` and Markdown into `public/content/md/`
   - Adds a `# GENERATED FILE` header to every generated Markdown file
4. Optional: keep the pipeline running with `npm run ingest:watch` to re-run when DOCX files change.
5. Remove generated and public copies with `npm run ingest:clean`.

Notes:
- StartHere marketing copy remains hardcoded; ingestion does not overwrite it.
- Re-running ingestion keeps recommendation card IDs stable when titles match existing cards.

If content fails schema validation in development, detailed errors are printed to the console and a friendly error page is shown in the UI. Refresh after fixing the JSON files or re-running ingestion.

## License

MIT
