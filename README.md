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

# Build content from the Obsidian vault, then start the dev server + vault watcher
npm run dev

# Production build (rebuilds vault index, then Vite build)
npm run build
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
vault/              # Obsidian vault (source of truth)
public/content/     # Generated JSON + Markdown mirrors, built from the vault
scripts/            # Utility scripts (vault migration/build/watch)
```

## Adding Content

All content is authored in the **Obsidian vault** (`/vault`). The `scripts/buildVaultIndex.mjs` script parses YAML frontmatter + Markdown, validates required fields, and emits JSON + copied Markdown into `public/content/` for the web app.

### Adding a New Focus Area

1. In Obsidian, use `_Templates/FocusArea.template.md` and `_Templates/Pathway.template.md` as needed.
2. Create `vault/02_Focus-Areas/<id>/overview.md` with frontmatter:
   ```yaml
   kind: focus_area
   id: ai-safety
   title: AI Safety
   summary: Short summary for the cards page
   role_shapes: [...]
   fit_signals: [...]
   people_to_talk_to: [...]
   common_confusions: [...]
   ```
3. Add four bucket notes under `vault/02_Focus-Areas/<id>/buckets/` named `quick-taste.md`, `deeper-dive.md`, `hands-on.md`, and `job-board.md` using the `focus_area_bucket` schema in the frontmatter. Reference curated `card` IDs in `curated_cards`.
4. Add the corresponding cards under `vault/03_Cards/<focus-area-id>/<card-id>.md` (see next section).
5. Run `npm run build:vault` (or rely on `npm run dev` watcher) to regenerate the site.

### Adding New Cards

1. In Obsidian, start from `_Templates/Card.template.md`.
2. Save to `vault/03_Cards/<focus-area-id>/<card-id>.md` with frontmatter:
   ```yaml
   kind: card
   id: aisf-fundamentals
   title: AI Safety Fundamentals Course
   focus_area_id: ai-safety
   bucket: deeper-dive
   topic: course
   commitment: medium
   good_fit_if: [...]
   one_liner: ...
   first_small_step: ...
   next_step: ...
   links: [...]
   when_to_suggest: ...
   when_not_to_suggest: ...
   ```
3. The build script will pull `id`, tags, and steps into `public/content/data/cards.json` for filtering/search.

### Modifying Session Steps

1. Create/edit notes in `vault/01_Flow/` with `kind: flow_step` frontmatter and `order`.
2. Rebuild (`npm run build:vault`) to refresh `public/content/data/flow.json` and the copied Markdown.

### Updating Pathways or Templates

- Add/edit pathway notes in `vault/04_Common-Pathways/` using the `pathway` frontmatter schema; rebuild to update `public/content/data/pathways.json`.
- Add/edit template notes in `vault/05_Templates/` with `kind: template`; rebuild to update `public/content/data/templates.json`.

### Obsidian Templates

The vault includes `_Templates/*.template.md` files for Cards, Focus Areas, Flow Steps, Pathways, and general template pages. Obsidian is configured to use this folder via `vault/.obsidian/templates.json`.

## License

MIT
