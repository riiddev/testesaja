# Liquid Glass Navbar — SinauuEnglish

The component is now integrated into this repository's build instead of requiring a separate Vite project.

## What is wired up

- `components/ui/liquid-glass-navbar.tsx`: the reusable React + TypeScript component.
- `index.html`: the landing page mounts the liquid navbar in the existing primary-navigation area.
- `liquid-navbar.html`: an isolated demo route that uses the same component.
- `src/navbar-mount.tsx`: React mount for the existing HTML landing page.
- `src/main.tsx`: the standalone React demo entry.
- `src/index.css`: Tailwind CSS v4 entry for React UI.
- `vite.config.ts`: React and Tailwind plugins, `@` alias, and multi-page production build.
- `components.json`: shadcn/ui aliases point UI components to `@/components/ui`.
- `public/data` and `public/*.js`: copies of static datasets and classic scripts so the learning workspace keeps its original URLs after a Vite build.

## Run locally

Requires Node.js 22.12 or newer.

```bash
npm install
npm run dev
```

Open the Vite local URL. The landing page is at `/`, the learning workspace remains at `/belajar.html`, and the standalone navbar preview is at `/liquid-navbar.html`.

Run the TypeScript check and production build with:

```bash
npm run build
```

## Component path and alias

The component is at the requested path, `/components/ui/liquid-glass-navbar.tsx`. The `@` alias maps to the repository root, so this import resolves correctly:

```tsx
import { LiquidNavbar, NimbusIcons } from "@/components/ui/liquid-glass-navbar";
```

The `components/ui` directory matters because the `aliases.ui` field in `components.json` points the shadcn CLI to this location. Keeping reusable UI in one predictable directory makes generated components and imports consistent.

## Notes

The navbar uses its own glass/water CSS and WebGL shader with a CSS fallback. Tailwind is configured for the React demo and future UI components; the existing editorial CSS and vanilla-JavaScript learning modules remain in place. Learning progress storage and vocabulary/grammar data paths are preserved.
