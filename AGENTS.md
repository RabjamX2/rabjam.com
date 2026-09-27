# AGENTS.md — Developer & AI Assistant Guide for rabjam.com

Welcome! This repository hosts the official personal portfolio, business consulting showcase, and interactive web tools platform for [Rabjam](https://rabjam.com).

This guide provides instructions and architectural rules for developers and AI coding assistants working in this repository.

---

## 1. Project Overview & Architecture

- **Framework**: SvelteKit 5 (with Runes `$state`, `$derived`, `$props`), Vite, HTML5 / CSS3.
- **Server Platform**: CloudPanel VPS (Ubuntu 24.04), Nginx, Cloudflare CDN.
- **Root Page (`/`)**: Main Software Engineering & Interactive Games Showcase (`client/src/routes/+page.svelte`).
- **Consulting Page (`/portfolio`)**: Business Strategy, Digital Transformation & Tech Advisory Showcase (`client/src/routes/portfolio/+page.svelte`).

---

## 2. Key Commands

Always run build commands from inside the `client/` directory:

```bash
cd client
npm install       # Install dependencies
npm run dev       # Start local development server (http://localhost:5173)
npm run build     # Verify SvelteKit production build (MUST pass before finishing tasks)
```

---

## 3. Protocol for Adding New Projects & Standalone Tools

Follow these exact steps when adding a new project, game, or tool to `rabjam.com`:

### Step 1: Place Project Source Files
- **Static Web Apps / HTML Tools**: Place under `client/static/<project-slug>/` (e.g. `client/static/keyboard/`). Accessible live at `https://rabjam.com/<project-slug>/`.
- **SvelteKit Routes**: Place under `client/src/routes/<category>/<project-slug>/` (e.g. `client/src/routes/games/connect4/`).

### Step 2: Update Standalone Subtree Sync Workflow
If the project has a standalone GitHub repository mirror (e.g. `RabjamX2/<repo-name>`):
1. Open `.github/workflows/subtree-sync.yml`.
2. Add the path pattern under `on.push.paths`:
   ```yaml
   paths:
     - 'client/static/<project-slug>/**' # or 'client/src/routes/.../**'
   ```
3. Add a subtree sync step:
   ```yaml
   - name: Sync <Project Name> Subtree
     run: |
       TOKEN="${{ secrets.SYNC_PAT }}"
       if [ -z "$TOKEN" ]; then exit 0; fi
       echo "Splitting <Project Name>..."
       COMMIT_ID=$(git subtree split --prefix=client/static/<project-slug> main)
       echo "Pushing <Project Name> commit $COMMIT_ID to RabjamX2/<repo-name>..."
       git push "https://x-access-token:${TOKEN}@github.com/RabjamX2/<repo-name>.git" "${COMMIT_ID}:refs/heads/main" --force
   ```

### Step 3: Update Portfolio Showcase Cards
1. **Landing Page (`client/src/routes/+page.svelte`)**: Add entry to `const projects`:
   ```javascript
   {
       title: "Project Title",
       desc: "Concise description of the project.",
       tags: ["Tech1", "Tech2"],
       link: "/<project-slug>/", // Live link
       linkLabel: "Open Project →",
       github: "https://github.com/RabjamX2/<repo-name>",
       emoji: "⌨️",
   }
   ```
2. **Consulting Page (`client/src/routes/portfolio/+page.svelte`)**: If applicable to business strategy or technical advisory, update `caseStudies` or `services`.

### Step 4: Verification
Before completing any task, run:
```bash
cd client && npm run build
```
Confirm the build completes cleanly with exit code 0.

---

## 4. Standalone Repository Mirror Mapping

| Local Path in `rabjam.com` | Standalone Mirror Repo | Branch |
| :--- | :--- | :--- |
| `client/src/routes/games/connect4` | [`RabjamX2/connect4`](https://github.com/RabjamX2/connect4) | `main` |
| `client/src/routes/games/minesweeper` | [`RabjamX2/minesweeper`](https://github.com/RabjamX2/minesweeper) | `main` |
| `client/static/games/guesser-games` | [`RabjamX2/PokeGuesser`](https://github.com/RabjamX2/PokeGuesser) | `javascript` |
| `client/static/keyboard` | [`RabjamX2/rabjam-keyboard`](https://github.com/RabjamX2/rabjam-keyboard) | `main` |

---

## 5. Directory Placement Rules: `client/src/routes/` vs `client/static/`

Why projects live in different directories:

| Directory | Type of Project | Examples | How SvelteKit Handles It |
| :--- | :--- | :--- | :--- |
| **`client/src/routes/`** | **Native SvelteKit Pages & Games** | `connect4`, `minesweeper` | **Processed & Compiled** by SvelteKit/Vite. Uses Svelte 5 components (`.svelte`), SvelteKit routing (`+page.svelte`), runes (`$state`), and shared layout/auth contexts. |
| **`client/static/`** | **Standalone Vanilla Web Apps** | `guesser-games` (*PokèGuesser*), `keyboard` (*Tibetan Keyboard*) | **Bypassed completely**. Served directly as raw static assets (`index.html`, `checker.html`, `app.js`, `styles.css`) at `rabjam.com/<slug>/`. No Svelte build step required. |

### Decision Rule for Developers & AI Assistants:
- Place in **`client/src/routes/<slug>/`** if building a new app using Svelte 5 components, shared layout navigation, or SvelteKit SSR/server endpoints.
- Place in **`client/static/<slug>/`** if bringing in a standalone vanilla HTML/JS/CSS tool, legacy web app, or pre-built static bundle.
