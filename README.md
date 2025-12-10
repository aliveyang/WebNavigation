# NavHub - Personal Navigation Dashboard

A lightweight, mobile-first navigation app (start page) that allows you to manage your favorite bookmarks as a grid of buttons.

![Preview](https://via.placeholder.com/800x400?text=NavHub+Preview)

## Features

- **Mobile First Design:** Optimized for touch interactions with large buttons.
- **Local Persistence:** Data is saved in your browser's local storage. No login required.
- **Easy Management:** Add, edit, and delete shortcuts easily.
- **Visuals:** Auto-generated gradient backgrounds for a modern look.
- **Dark Mode:** Easy on the eyes.

## Usage

1. **Add Bookmark:** Click the **+** button in the top right.
2. **Edit/Delete:** Click the **Edit** button. Red delete icons will appear on your bookmarks. Tap the red icon to remove a bookmark.
3. **Navigate:** Just tap a card to open the link.

## Deployment

This project is built with React and Vite (or standard ES modules). It is ready to be deployed to Vercel instantly.

### One-Click Deploy

You can deploy this directly to Vercel by importing the repository.

1. Push this code to a GitHub repository.
2. Go to [Vercel](https://vercel.com) and add a "New Project".
3. Import your GitHub repository.
4. Framework Preset: **Create React App** or **Vite** (depending on your bundler, usually mostly automatic).
5. Click **Deploy**.

### Manual Build

If you want to run it locally:

```bash
npm install
npm run dev
```

(Note: Ensure you have a `package.json` with appropriate scripts if running locally, or use a simple HTTP server if using the ES module structure provided).
