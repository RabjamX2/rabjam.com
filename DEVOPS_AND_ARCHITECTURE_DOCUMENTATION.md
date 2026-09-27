# Clean Repository & Architecture Reference

This document outlines the dual-repository structure and deployment architecture for `rabjam.com` and `poker.rabjam.com`.

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
| **Portfolio & Games** | [`RabjamX2/rabjam.com`](https://github.com/RabjamX2/rabjam.com) | Portfolio homepage, bio, interactive cards, Connect 4, Minesweeper, PokèGuesser | `3000` |
| **Poker Platform** | [`RabjamX2/tibPoker`](https://github.com/RabjamX2/tibPoker) | Full-stack MERN/SvelteKit multiplayer poker app, Express, Socket.IO, Prisma | `3002` (Client) & `3001` (Server) |
| **Connect 4** | [`RabjamX2/connect4`](https://github.com/RabjamX2/connect4) | Standalone mirror of Connect 4 (Synced from `rabjam.com`) | Standalone Vite |
| **Minesweeper** | [`RabjamX2/minesweeper`](https://github.com/RabjamX2/minesweeper) | Standalone mirror of Minesweeper (Synced from `rabjam.com`) | Standalone Vite |
| **PokeGuesser** | [`RabjamX2/PokeGuesser`](https://github.com/RabjamX2/PokeGuesser) | Standalone mirror of PokèGuesser (Synced from `rabjam.com`) | Static HTML/JS |

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
