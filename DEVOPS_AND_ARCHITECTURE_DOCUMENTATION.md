# Clean Repository & Architecture Reference

This document outlines the dual-repository structure, deployment architecture, and project addition workflow for `rabjam.com` and `poker.rabjam.com`.

---

## 1. Multi-Repository Architecture

```
                       ┌────────────────────────┐
                       │     Cloudflare Edge    │
                       │ (SSL Full Strict + WSS)│
                       └───────────┬────────────┘
                                   │
           ┌───────────────────────┴───────────────────────┐
    HTTPS (Port 443)                                HTTPS (Port 443)
    rabjam.com                                      poker.rabjam.com
 ┌──▼───────────────────┐                         ┌─▼───────────────────┐
 │ Portfolio & Games    │                         │ Dedicated Poker Hub │
 │ (RabjamX2/rabjam.com)│                         │ (RabjamX2/tibPoker) │
 └──────────┬───────────┘                         └─────────┬───────────┘
            │                                               │
   ┌────────▼─────────┐                          ┌──────────▼──────────┐
   │ SvelteKit SSR    │                          │ SvelteKit SSR       │
   │ Port 3000        │                          │ Port 3002           │
   └──────────────────┘                          └──────────┬──────────┘
                                                            │ /api & /socket.io
                                                 ┌──────────▼──────────┐
                                                 │ Express Server      │
                                                 │ Port 3001           │
                                                 └──────────┬──────────┘
                                                            │
                                                 ┌──────────▼──────────┐
                                                 │ Supabase PostgreSQL │
                                                 │ Port 5432           │
                                                 └─────────────────────┘
```

---

## 2. Repositories & Responsibilities

| Repository | GitHub Target | Primary Function | Server Port |
| :--- | :--- | :--- | :--- |
| **Portfolio & Games** | [`RabjamX2/rabjam.com`](https://github.com/RabjamX2/rabjam.com) | Portfolio homepage, bio, interactive cards, Connect 4, Minesweeper, PokèGuesser, Tibetan Keyboard | `3000` |
| **Poker Platform** | [`RabjamX2/tibPoker`](https://github.com/RabjamX2/tibPoker) | Full-stack MERN/SvelteKit multiplayer poker app, Express, Socket.IO, Prisma | `3002` (Client) & `3001` (Server) |
| **Connect 4** | [`RabjamX2/connect4`](https://github.com/RabjamX2/connect4) | Standalone mirror of Connect 4 (Synced from `rabjam.com`) | Standalone Vite |
| **Minesweeper** | [`RabjamX2/minesweeper`](https://github.com/RabjamX2/minesweeper) | Standalone mirror of Minesweeper (Synced from `rabjam.com`) | Standalone Vite |
| **PokeGuesser** | [`RabjamX2/PokeGuesser`](https://github.com/RabjamX2/PokeGuesser) | Standalone mirror of PokèGuesser (Synced from `rabjam.com`) | Static HTML/JS |
| **Rabjam Keyboard** | [`RabjamX2/rabjam-keyboard`](https://github.com/RabjamX2/rabjam-keyboard) | Standalone mirror of Tibetan Grammar Keyboard (Synced from `rabjam.com`) | Static HTML/JS |

---

## 3. GitHub Secrets Checklist

### Secrets for `RabjamX2/rabjam.com`:
- `DEPLOY_HOST`: `82.29.155.146`
- `DEPLOY_USER`: `deployer`
- `DEPLOY_KEY`: SSH Private Key
- `SYNC_PAT`: GitHub Personal Access Token

### Secrets for `RabjamX2/tibPoker`:
- `DEPLOY_HOST`: `82.29.155.146`
- `DEPLOY_USER`: `deployer`
- `DEPLOY_KEY`: SSH Private Key

---

## 4. Developer & AI Agent Protocol: Adding New Projects & Subtree Syncs

When adding a new project or tool to `rabjam.com`, follow these standard steps:

### Step 1: Copy/Place Project Files in Workspace
Depending on the project type:
* **Static Web Apps / HTML Tools**: Place under `client/static/<project-slug>/` (e.g., `client/static/keyboard/`). Accessible at `rabjam.com/<project-slug>/`.
* **Integrated SvelteKit Routes**: Place under `client/src/routes/<category>/<project-slug>/` (e.g., `client/src/routes/games/connect4/`).

### Step 2: Configure Standalone Subtree Sync Workflow
If the project has a standalone GitHub repository mirror (e.g. `RabjamX2/<repo-name>`):
1. Open `.github/workflows/subtree-sync.yml`.
2. Add the path pattern to `on.push.paths`:
   ```yaml
   paths:
     - 'client/static/<project-slug>/**' # or 'client/src/routes/.../**'
   ```
3. Add a new sync step under `jobs.sync-subtrees.steps`:
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

### Step 3: Add Project Card to Showcase Pages
1. **Landing Page (`client/src/routes/+page.svelte`)**:
   Add an entry to `const projects`:
   ```javascript
   {
       title: "Project Title",
       desc: "Description of the project features and architecture.",
       tags: ["Tech1", "Tech2"],
       link: "/<project-slug>/", // or live link
       linkLabel: "Open Project →",
       github: "https://github.com/RabjamX2/<repo-name>",
       emoji: "🚀",
   }
   ```
2. **Business Consulting Page (`client/src/routes/portfolio/+page.svelte`)**:
   If applicable to consulting or case studies, add to `const caseStudies` or `services`.

### Step 4: Local Build Verification
Before committing:
```bash
cd client
npm run build
```
Verify that SvelteKit SSR and static assets build with exit code 0.

---

## 5. Directory Placement Rules: `client/src/routes/` vs `client/static/`

| Directory | Type of Project | Examples | How SvelteKit Handles It |
| :--- | :--- | :--- | :--- |
| **`client/src/routes/`** | **Native SvelteKit Pages & Games** | `connect4`, `minesweeper` | **Processed & Compiled** by SvelteKit/Vite. Uses Svelte 5 components (`.svelte`), SvelteKit routing (`+page.svelte`), runes (`$state`), and shared layout/auth contexts. |
| **`client/static/`** | **Standalone Vanilla Web Apps** | `guesser-games` (*PokèGuesser*), `keyboard` (*Tibetan Keyboard*) | **Bypassed completely**. Served directly as raw static assets (`index.html`, `checker.html`, `app.js`, `styles.css`) at `rabjam.com/<slug>/`. No Svelte build step required. |

### Decision Rule for Developers & AI Assistants:
- Place in **`client/src/routes/<slug>/`** if building a new app using Svelte 5 components, shared layout navigation, or SvelteKit SSR/server endpoints.
- Place in **`client/static/<slug>/`** if bringing in a standalone vanilla HTML/JS/CSS tool, legacy web app, or pre-built static bundle.
