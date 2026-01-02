# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NavHub is a mobile-first personal navigation dashboard (start page) built as a Progressive Web App. Users can manage bookmarks as a grid of interactive cards with customizable appearances. All data is stored locally in the browser's localStorage - there is no backend.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build for production
npm run preview      # Preview production build
```

The dev server runs on port 3000 and binds to 0.0.0.0 for network access.

## Architecture

### Single-File Application Structure

The entire React application lives in `index.tsx` (~930 lines). This is intentional for simplicity. The file contains:

- **Type Definitions** (lines 4-25): `Bookmark`, `AppSettings`, background types
- **Constants** (lines 27-73): `PRESET_ICONS`, `GRADIENTS`, `SEARCH_ENGINES`, storage keys
- **Helper Functions** (lines 75-105): URL formatting, favicon fetching, file conversion
- **Components** (lines 107-769):
  - `Header`: App branding and add button
  - `SearchWidget`: Search bar with configurable engine
  - `BookmarkCard`: Individual bookmark with long-press interaction
  - `ActionSheet`: Mobile bottom sheet for bookmark actions
  - `EditModal`: Dual-purpose modal for editing bookmarks and app settings
  - `App`: Main component with state management

### Data Persistence

Two localStorage keys are used:
- `navhub_bookmarks`: Array of bookmark objects
- `navhub_settings`: App settings (grid columns, search engine, global background)

Data is automatically saved on every state change via `useEffect` hooks (lines 810-816).

### PWA Configuration

PWA is configured in `vite.config.ts` with:
- Service worker auto-registration
- Offline caching for static assets
- CDN caching for Tailwind CSS and React
- **Development mode enabled** (devOptions.enabled: true)
- Manifest with app metadata and icons

### Styling Approach

- **Tailwind CSS** loaded via CDN in `index.html` (not npm package)
- Inline Tailwind classes throughout components
- Custom scrollbar hiding in `index.html`
- Gradient backgrounds using Tailwind's gradient utilities
- Dark theme by default (slate color palette)

### React Loading Strategy

React is loaded via **importmap** in `index.html` (lines 32-40), pulling from `aistudiocdn.com` CDN rather than npm. This is an unconventional approach but works for this project.

## Key Behavioral Details

### URL Handling
- Default protocol is **http://** (not https) - see `formatUrl()` at line 80
- URLs without protocol get `http://` prepended automatically
- Bookmarks open in the **current tab** (not new tab)

### Bookmark Interactions
- **Long press** (1.5 seconds) on bookmark cards triggers the action sheet
- Long press includes visual feedback: scale animation + progress bar
- Haptic feedback on supported devices (`navigator.vibrate`)
- Click during long press is prevented to avoid accidental navigation

### Bookmark Background Types
Four background modes available:
1. **gradient**: Tailwind gradient with first letter of title
2. **library**: Preset SVG icons from `PRESET_ICONS` with gradient background
3. **icon**: Website favicon fetched from Google's favicon service
4. **image**: Custom image (URL or base64 uploaded file)

### Grid Layout
- Configurable from 2-6 columns via settings
- Dense mode (>4 columns) reduces icon/text sizes
- Responsive grid using Tailwind's `grid-cols-{n}` classes

### Settings Modal
The `EditModal` component serves dual purposes:
- **Bookmark editing**: When `initialData` is provided
- **App settings**: When settings toggle is clicked (gear icon)
- Toggle between modes without closing modal

## Important Files

- `index.tsx`: Entire application (components, logic, state)
- `index.html`: HTML shell with Tailwind CDN and React importmap
- `vite.config.ts`: Vite + PWA configuration
- `package.json`: Dependencies and scripts
- `public/`: App icons (icon-192.png, icon-512.png)

## Common Modifications

### Adding New Preset Icons
Add to `PRESET_ICONS` object (line 28) with SVG path data. Icons should use 24x24 viewBox.

### Changing Default Bookmarks
Modify the `defaults` array in the first `useEffect` (lines 791-796).

### Adding Search Engines
Add to `SEARCH_ENGINES` object (line 68) with name and URL template.

### Adjusting Grid Columns
Update `getGridColsClass()` function (lines 857-865) and settings range input (lines 520-530).

## Deployment Notes

- Project is designed for static hosting (Vercel, Netlify, etc.)
- No environment variables required for basic functionality
- Build output goes to `dist/` directory
- PWA requires HTTPS in production for service worker registration
- Icons must be in `public/` directory for PWA manifest

## Git Workflow

Recent commits show:
- Bookmarks now open in current tab (not new tab)
- Default protocol changed from https to http
- PWA enabled in development mode
- Initial PWA implementation with offline support

When committing, follow the existing pattern: `feat:`, `fix:` prefixes with descriptive messages.
