# rabjam.com — Personal Portfolio & Showcase Platform

The official personal portfolio website and interactive games showcase for [Rabjam](https://rabjam.com).

## Features & Architecture

- **Master Portfolio**: Responsive showcase featuring bio, technical skills, interactive project cards, and direct links to live application platforms.
- **Co-Located Showcase Projects & Tools**:
  - **Connect 4**: Single-player AI engines (Easy, Medium, Hard) & interactive board.
  - **Minesweeper**: Multi-mode solo minesweeper engine.
  - **PokèGuesser**: Interactive Pokémon & R6 Siege guessing games.
  - **Tibetan Grammar Keyboard**: Wylie, Sambhota & QWERTY virtual keyboard with real-time 8-slot syllable parsing and document grammar validator.
- **Automated Standalone Repo Syncing**: GitHub Actions workflow (`.github/workflows/subtree-sync.yml`) automatically splits and mirrors standalone repositories to:
  - [RabjamX2/connect4](https://github.com/RabjamX2/connect4)
  - [RabjamX2/minesweeper](https://github.com/RabjamX2/minesweeper)
  - [RabjamX2/PokeGuesser](https://github.com/RabjamX2/PokeGuesser)
  - [RabjamX2/rabjam-keyboard](https://github.com/RabjamX2/rabjam-keyboard)

## Adding New Projects

For developers and AI coding agents adding new projects to `rabjam.com` or setting up standalone repository syncing, see the step-by-step guide in [DEVOPS_AND_ARCHITECTURE_DOCUMENTATION.md](file:///c:/Users/rabja/Documents/GitHub/rabjam.com/DEVOPS_AND_ARCHITECTURE_DOCUMENTATION.md#4-developer--ai-agent-protocol-adding-new-projects--subtree-syncs).

## Tech Stack

- **Frontend**: SvelteKit 5 (Runes `$state`, `$derived`, `$props`), Vite, HTML5 / CSS3
- **DevOps**: GitHub Actions CI/CD, Hostinger VPS (Ubuntu 24.04), Nginx, Cloudflare CDN, Let's Encrypt SSL

## Local Development

```bash
# Move into client directory
cd client

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.
