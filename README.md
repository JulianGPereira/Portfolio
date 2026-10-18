# 3D Driving Portfolio

An interactive low-poly world built with **React Three Fiber**, **Rapier physics** and **Vite**.
Visitors drive a car around and pull into zones to see your work.

| Zone | Where | What it shows |
|---|---|---|
| 1 · Projects | straight ahead (north) | popup with all projects |
| 2 · Live Websites | east | popup with deployed sites + links |
| 3 · Certifications | south-east | popup with certifications |
| 4 · Education | south-west | popup with education |
| 5 · Play Area | north-west | crates, bowling pins, dominoes, cones, barrels, balls to smash |

**Controls:** `W A S D` / arrow keys to drive · `Shift` boost · `R` reset everything (car + play area) · `Esc` close popup.
Touch devices get on-screen buttons. The top-right buttons open each section directly, for visitors who'd rather not drive.

## Run it

Requires Node.js 18+.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in /dist
npm run preview  # preview the production build
```

## Edit your content

All text lives in **`src/data/portfolio.js`** — name, title, links, projects, websites, certifications, education.
To add a resume download, put `resume.pdf` in `/public` and set `resumeUrl: './resume.pdf'`.

## Customise the world

- Zone positions / colours / trigger radius: `ZONES` in `src/store.js`
- Car handling (speed, acceleration, turning): constants at the top of `src/components/Car.jsx`
- Trees, roads, signs, lighting: `src/components/World.jsx`
- Play-area objects: `src/components/Playground.jsx`
- Popup layouts: `src/ui/Popup.jsx` · styles: `src/styles.css`

## Deploy

The build is a static site (`dist/`), so any static host works:

- **Vercel / Netlify:** import the repo, build command `npm run build`, output `dist`.
- **GitHub Pages:** `npm run build`, then publish the `dist` folder (the config uses relative paths, so sub-paths work).

## Debug helper

Open the site with `?debug` in the URL to get `window.__teleport(x, z, yaw)` in the browser console.
