# Liquid Glass Navbar — integration notes

## Current repository status

SinauuEnglish currently runs as a static HTML/CSS/JavaScript site. It has no root `package.json`, React entry point, TypeScript configuration, Tailwind setup, or shadcn `components.json`. Its existing page styles are `/styles.css` and `/belajar.css`.

The React component is saved at `/components/ui/liquid-glass-navbar.tsx` as requested. It is source code only at this stage; the existing static pages do not compile or render TSX. No root build configuration has been changed, so the production site remains on its current static deployment.

## Recommended folder paths

For a new Vite + React + TypeScript app using the usual shadcn alias:

- Component: `src/components/ui/liquid-glass-navbar.tsx`
- Global styles / Tailwind entry: `src/index.css`
- Import alias: `@/* -> ./src/*`

In this current repository, the requested component is stored at root `components/ui/liquid-glass-navbar.tsx`. The UI folder matters because shadcn's `components.json` `aliases.ui` tells the CLI where UI components belong. A consistent location also makes imports such as `@/components/ui/liquid-glass-navbar` predictable. In a Vite app that uses `src/`, the actual path normally lives under `src/components/ui`, not at the repository root.

## Safest setup path

Do not run a scaffold command over the current live static site unless you intend to migrate it. To create a separate React environment for this component:

```bash
npm create vite@latest sinauu-react -- --template react-ts
cd sinauu-react
npm install
npm install tailwindcss @tailwindcss/vite
npx shadcn@latest init
```

Then copy `components/ui/liquid-glass-navbar.tsx` into `sinauu-react/src/components/ui/liquid-glass-navbar.tsx`. The Vite Tailwind entry in `src/index.css` should include:

```css
@import "tailwindcss";
```

For Vite, configure the `@/*` alias in `tsconfig.json` and `tsconfig.app.json` to map to `./src/*`, and add the matching alias in `vite.config.ts`. The shadcn CLI will create `components.json`; check that its `aliases.ui` points to `@/components/ui`. Run `npm run dev` to preview the app.

## Minimal usage

```tsx
import { LiquidNavbar, NimbusIcons } from "@/components/ui/liquid-glass-navbar"

export function SiteNavigation() {
  return (
    <LiquidNavbar
      tone="light"
      defaultActive={0}
      sound={false}
      items={[
        { label: "Home", href: "/", icon: NimbusIcons.home, fx: "glow" },
        { label: "Explore", href: "/explore", icon: NimbusIcons.globe, fx: "spin" },
        { label: "Profile", href: "/profile", icon: NimbusIcons.user, fx: "wave" },
      ]}
    />
  )
}
```

The component uses inline component CSS and WebGL with a CSS fallback; it does not require Tailwind classes itself. React and TypeScript are required to compile the TSX, while Tailwind/shadcn are recommended for the surrounding React project and consistent component paths.
