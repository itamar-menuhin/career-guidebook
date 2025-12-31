# 1:1 Career Counseling Guidebook

A web-based guidebook for running live 1:1 career counseling sessions. Features a Session Workspace for guided calls with notes, plus a browseable Library of focus areas, recommendation cards, and templates.

## Features

- **Session Workspace**: Interactive guided flow for 60-90 min sessions with live note-taking
- **Focus Areas**: Quick-start pages for different career tracks (AI Safety, etc.)
- **Recommendation Cards**: Filterable database of resources, programs, and next steps
- **Templates & Tools**: Session wrap summaries and focus area templates
- **Session Sharing**: Share sessions via short links that work across devices

## Session Sharing

Sessions can be shared via short links (`/s/<slug>`):

- **Share**: Click the Share button in Session Notes to create a shareable link
- **View**: Anyone with the link can view the session in read-only mode
- **Fork**: Viewers can fork to create their own editable copy
- **Privacy**: Sessions are unlisted (not publicly discoverable) and expire after 30 days
- **Warning**: A privacy banner reminds users not to share sensitive personal details

### How it works

1. Session data is stored remotely in Lovable Cloud (PostgreSQL database)
2. Each shared session gets a unique 10-character slug
3. Links work across browsers/devices without localStorage dependency
4. Expired sessions show a clear message with instructions to re-share

### Security Notes (MVP)

- **No authentication required**: Anyone can create and view shared sessions
- **Unlisted by default**: Sessions are only accessible by direct link
- **30-day expiry**: Sessions automatically expire to limit exposure
- **No PII safeguards**: Users are warned via banner, but no content filtering is applied
- **Public table with RLS**: The `shared_sessions` table allows public read/write for anonymous access

For production use, consider:
- Adding rate limiting to prevent abuse
- Implementing session deletion by owners
- Adding optional password protection
- Content moderation for shared sessions

## Tech Stack

- **Frontend**: Vite, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Lovable Cloud (PostgreSQL, Edge Functions)
- **State**: React Context for sessions, localStorage for local sessions

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
├── contexts/       # React contexts (Session, Search)
├── data/          # Content data (cards, focus areas, pathways)
├── hooks/         # Custom React hooks
├── lib/           # Utilities (sessionStore, utils)
├── pages/         # Route pages
└── integrations/  # Supabase client (auto-generated)
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

## Database Schema

The `shared_sessions` table:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| slug | TEXT | Unique short link identifier |
| session_json | JSONB | Full session data |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |
| expires_at | TIMESTAMP | Expiry (default 30 days) |
| version | INTEGER | Schema version |

## License

MIT
