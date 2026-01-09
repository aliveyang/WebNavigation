# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NavHub is a mobile-first personal navigation dashboard (start page) built as a Progressive Web App (PWA). Users can manage bookmarks as a grid of interactive cards with customizable appearances. It supports local storage and optional cloud synchronization via Vercel KV.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build for production
npm run preview      # Preview production build
```

The dev server runs on port 3000 and binds to 0.0.0.0 for network access.

## Architecture

### Modular Structure

The project has been refactored from a single-file application into a modular architecture:

- `src/components/`: UI components (`Header`, `BookmarkCard`, `SearchWidget`, etc.)
- `src/constants/`: Static data (icons, gradients, search engines)
- `src/hooks/`: Custom React hooks
- `src/utils/`: core utilities (security, performance, crypto, etc.)
- `src/types/`: TypeScript definitions
- `src/i18n.ts`: Internationalization logic
- `src/syncManager.ts`: Cloud synchronization logic
- `src/App.tsx`: Main application state and logical layout

### Key Modules

#### 1. Cloud Synchronization (`syncManager.ts`)
- Uses Vercel KV (Redis) for storage.
- Authentication via **PIN code** (hashed with SHA-256).
- Supports conflict resolution and debounced updates.
- API endpoints: `GET /api/sync/get` and `POST /api/sync/save`.

#### 2. Internationalization (`i18n.ts`)
- Lightweight custom i18n solution.
- Supported languages: **English (`en`)** and **Chinese (`zh`)**.
- Stores language preference in `AppSettings`.

#### 3. Security (`utils/security.ts`, `crypto.ts`)
- **XSS Protection**: Inputs are sanitized before use.
- **Rate Limiting**: API calls are rate-limited to prevent abuse.
- **PIN Encryption**: Sync PINs are hashed using SHA-256 before storage.

### Data Persistence

- **Local**:
  - `navhub_bookmarks`: Array of bookmark objects.
  - `navhub_settings`: App configuration (grid cols, theme, language).
  - `navhub_sync_pin_hash`: Hashed PIN for sync.
- **Cloud**:
  - Stored in Vercel KV with key `navhub_data_<HASHED_PIN>`.

### Styling Approach
- **Tailwind CSS** via CDN for styling utility classes.
- Customizable **Card Appearance**: Icon size, text size, and margins can be adjusted by the user.

## Common Modifications

### Adding New Search Engine
Update `src/constants/searchEngines.ts`.

### Adding New Icon
Update `src/constants/icons.ts`.

### Modifying Translations
Update `src/i18n.ts`. Ensure to add keys for both `en` and `zh` objects.

### Changing Defaults
Modify default state in `src/App.tsx` or `src/types/index.ts`.

## Deployment

- **Platform**: Vercel (recommended) or any static host.
- **Environment Variables** (for Sync):
  - `KV_REST_API_URL`
  - `KV_REST_API_TOKEN`

## Git Workflow
- Commits should use semantic prefixes: `feat:`, `fix:`, `chore:`, `docs:`, `style:`.
