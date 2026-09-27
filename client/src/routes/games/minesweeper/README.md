# Minesweeper Game Architecture

## Overview

The Minesweeper game exists in two modes:

- **Solo**: Pure client-side game with no server interaction
- **Multiplayer**: Client-server architecture with real-time synchronization via Socket.io

This document explains the move processing pipeline for both modes, using the **flag action** as a detailed example.

---

## Game Logic Layers

### 1. **Shared Pure Logic** (`shared/minesweeperLogic.js`)

Framework-agnostic functions used by both server and client:

- `placeMines(rows, cols, numMines, safeId)` → returns `Set<number>` of mine IDs
- `computeCounts(rows, cols, mines)` → returns `number[]` of adjacent mine counts
- `floodFill(rows, cols, mines, counts, alreadyRevealed, startId)` → returns `Array` of cells to reveal

**Why stored here:** Pure functions with no side effects can be shared. Both server and client need to generate identical board states. Centralizing reduces code duplication and ensures logic consistency.

### 2. **Solo Game Class** (`client/src/lib/games/minesweeper/MinesweeperGame.svelte.js`)

Reactive Svelte 5 class managing single-player game state:

- `cells`: array of cell objects (mine, revealed, flagged, count, etc.)
- `gameOver`, `won`, `revealedCount`: game status
- Methods: `init()`, `reveal()`, `toggleFlag()`, `_flood()`

**Why stored here:** Solo games are client-only; no server needed. Svelte runes (`$state`, `$derived`) provide reactive updates to the UI without external sync.

### 3. **Server Game Logic** (`server/src/events/games/minesweeper.js`)

Node.js namespace handler managing multiplayer rooms:

- Room state: `mines`, `counts`, `revealed` (Set), `flags` (Map for CO-OP, Sets for PvP)
- Event handlers: `ms:create`, `ms:join`, `ms:reveal`, `ms:flag`, `ms:rematch`
- Imports shared functions for board generation

**Why stored here:** Server is the single source of truth for multiplayer games. It validates moves, prevents cheating, and broadcasts state changes to all connected clients.

### 4. **Client Multiplayer Page** (`client/src/routes/games/minesweeper/[code]/+page.svelte`)

UI and socket event handlers for multiplayer gameplay:

- Socket connection to `/minesweeper` namespace
- Local state mirrors: `cells`, `currentTurn`, `revealedCount`, `gameOver`
- Event listeners: `ms:reveal_result`, `ms:flag_result`, `ms:opponent_disconnected`
- Event emitters: `ms:reveal`, `ms:flag`

**Why stored here:** Page-level route handles UI display, user input capture, and socket communication. It receives server broadcasts and applies them to local state.

---

## Move Processing: Flag Action

### **SOLO MODE**

```
User right-clicks cell (flag action)
  ↓
handleFlag(row, col) triggered
  ↓
Validate: gameOver? firstClickDone? revealed? (all must be false)
  ↓
Call: MinesweeperGame.toggleFlag(row, col)
  ↓
[IN MinesweeperGame.svelte.js]
  cell.flagged = !cell.flagged
  cell.flagOwner = cell.flagged ? null : null (always null in solo)
  (No network call; no broadcast)
  ↓
Svelte reactivity: cells array update triggers re-render
  ↓
UI updates: cell shows 🚩 or clears flag
```

**Key characteristics:**

- Instant feedback (no latency)
- No server validation
- Single player, single perspective
- State mutation is local only

---

### **MULTIPLAYER MODE: PvP (Player vs Player)**

```
User right-clicks cell
  ↓
handleFlag(e, row, col) triggered
  ↓
Validate client-side: gameOver? firstClickDone? revealed?
  ↓
emit('ms:flag', { row, col }) to server
  ↓
[ON SERVER: ms:flag event handler]
  │
  ├─ Get room state for currentRoom
  ├─ Validate: room exists? gameOver? firstClickDone?
  ├─ Validate cell: in bounds? revealed? already flagged?
  │
  ├─ Fetch: room.pvpFlags[playerIndex] (Set of this player's flagged cells)
  │
  ├─ IF cell.flagged:
  │    myFlags.delete(id)
  │    flagged = false
  │  ELSE:
  │    myFlags.add(id)
  │    flagged = true
  │
  ├─ Broadcast: emit('ms:flag_result', { id, row, col, flagged, playerIndex })
  │    to current player ONLY (not the room)
  │
  [ON CLIENT: ms:flag_result listener]
  │
  ├─ Get cell object from cells array
  ├─ cell.flagged = flagged (from server response)
  ├─ cell.flagOwner = flagged ? playerIndex : null
  │
  └─ Svelte reactivity triggers re-render

UI updates: cell shows my flag (🚩 in red) or clears
```

**Key characteristics:**

- **Latency**: Socket round-trip (~50-200ms typical)
- **Per-player flags**: Each player has their own flag Set on server
- **No broadcast to opponent**: Only the acting player receives the result
- **Server validation**: Prevents invalid moves (flagging revealed cells, etc.)
- **UI shows only own flags**: Player sees only their own flags (and opponent's during loss)

---

### **MULTIPLAYER MODE: CO-OP (Cooperative)**

```
User right-clicks cell
  ↓
handleFlag(e, row, col) triggered
  ↓
Validate client-side: gameOver? firstClickDone? revealed?
  ↓
emit('ms:flag', { row, col }) to server
  ↓
[ON SERVER: ms:flag event handler]
  │
  ├─ Get room state
  ├─ Validate as above
  │
  ├─ Fetch: room.flags (Map: cellId → playerIndex who flagged it)
  │
  ├─ IF cell flagged by someone:
  │    room.flags.delete(id)
  │    flagged = false
  │  ELSE:
  │    room.flags.set(id, playerIndex)  // Remember who flagged it
  │    flagged = true
  │
  ├─ Broadcast: emit('ms:flag_result', { id, row, col, flagged, playerIndex })
  │    to ENTIRE ROOM (both players see all flags)
  │
  [ON CLIENT: ms:flag_result listener]
  │
  ├─ Get cell object
  ├─ cell.flagged = flagged
  ├─ cell.flagOwner = flagged ? playerIndex : null
  │
  └─ Svelte reactivity triggers re-render

UI updates:
  - My flag: 🚩 (red, if playerIndex === myPlayerIndex)
  - Opponent's flag: 🏁 (blue, if playerIndex !== myPlayerIndex)
```

**Key characteristics:**

- **Latency**: Same socket round-trip
- **Shared flags**: One flag per cell; server remembers who placed it
- **Broadcast to room**: Both players see the flag action immediately
- **UI shows all flags**: Both players see both sets of flags
- **Collaboration**: Players can see each other's flagging strategy

---

## Move Processing: Reveal Action (Bonus)

For completeness, here's how **reveal** differs from flag:

### **SOLO**

```
User clicks cell
  ↓
handleReveal(row, col)
  ↓
Call: MinesweeperGame.reveal(row, col)
  ├─ If first click: placeMines(row, col)
  ├─ If mine: explode (mark all mines revealed, game over)
  ├─ If safe: _flood(row, col) — recursive reveal of all connected safe cells
  ├─ If win: gameOver = true, won = true
  │
  └─ Return: 'mine' | 'safe' | 'win' | 'blocked'

UI updates: cell reveals, adjacent counts show, game-over state
```

### **MULTIPLAYER**

```
User clicks cell
  ↓
handleReveal(row, col)
  ↓
Validate: myTurn? (only in PvP; always true in CO-OP)
  ↓
emit('ms:reveal', { row, col }) to server
  ↓
[ON SERVER: ms:reveal handler]
  │
  ├─ Validate: room exists? gameOver? cell valid?
  ├─ Check PvP turn: if (currentTurn !== playerIndex) return
  │
  ├─ IF first click:
  │    room.mines = placeMines(rows, cols, numMines, id)  [shared function]
  │    room.counts = computeCounts(rows, cols, mines)    [shared function]
  │    room.firstClickDone = true
  │
  ├─ IF mine hit:
  │    room.gameOver = true
  │    room.loser = playerIndex (PvP) or null (CO-OP)
  │    Emit: 'ms:reveal_result' with all mines and wrong flags
  │
  ├─ IF safe (no mine):
  │    toReveal = floodFill(rows, cols, mines, counts, revealed, id) [shared]
  │    For each cell in toReveal:
  │      room.revealed.add(cell.id)
  │      room.revealedCount++
  │
  │    Check win: revealedCount >= (rows*cols - numMines)?
  │    If yes: room.gameOver = true, room.won = true
  │
  │    Update turn (PvP): currentTurn = 1 - playerIndex
  │    Emit: 'ms:reveal_result' with revealedCells, nextTurn, win status
  │
  └─ Broadcast to ENTIRE ROOM

[ON CLIENT: ms:reveal_result listener]
  ├─ If revealedCells: update each cell, increment revealedCount
  ├─ If nextTurn: update currentTurn (triggers PvP UI "Your turn" / "Opp's turn")
  ├─ If mine hit: mark all mines, show loser, game over
  ├─ If win: mark all remaining mines auto-flagged
  │
  └─ UI reflects all changes
```

**Why server-side flood fill?** The shared `floodFill()` function returns a list of cells to reveal. The server applies these to its room state, then broadcasts the list to clients. Clients apply them locally. This ensures:

- **Consistency**: Same algorithm on server and client
- **Cheating prevention**: Client can't reveal more cells than the algorithm allows
- **Bandwidth efficiency**: Only send the flood-fill result, not recalculate on client

---

## State Management Summary

| Aspect               | Solo                  | PvP Multiplayer                       | CO-OP Multiplayer                     |
| -------------------- | --------------------- | ------------------------------------- | ------------------------------------- |
| **Logic location**   | Client class          | Server + Client                       | Server + Client                       |
| **Source of truth**  | Local MinesweeperGame | Server room state                     | Server room state                     |
| **Flag storage**     | `cell.flagged`        | `room.pvpFlags[0/1]` (Sets)           | `room.flags` (Map)                    |
| **Broadcast scope**  | None (local)          | Self only                             | Entire room                           |
| **Reveal algorithm** | Client `_flood()`     | Server `floodFill()` + client display | Server `floodFill()` + client display |
| **Turn enforcement** | N/A                   | Server validates `currentTurn`        | N/A (always both)                     |
| **Latency**          | None                  | ~50-200ms                             | ~50-200ms                             |

---

## Why This Architecture?

1. **Shared logic module** (`shared/minesweeperLogic.js`)
    - Pure functions with no I/O
    - Can be used by both Node.js server and SvelteKit client
    - Reduces duplication
    - Easier to test and audit

2. **Solo class** (`MinesweeperGame.svelte.js`)
    - Svelte 5 runes for reactive state
    - Self-contained, no dependencies on Socket.io
    - Fast feedback (no network)
    - Good for offline play and prototyping

3. **Server namespace** (`socketServer.js/games/minesweeper.js`)
    - Single source of truth for multiplayer
    - Validates all moves before accepting
    - Prevents client-side cheating (revealing flagged cells, playing out of turn, etc.)
    - Maintains per-room state and player tracking

4. **Client page** (`+page.svelte`)
    - Handles UI rendering and user input
    - Bridges local game state with socket communication
    - Listens to server broadcasts and applies to local state
    - Manages view transitions (join → waiting → game → game-over)

---

## Example: Complete Flag Flow (PvP)

### Initial State

- Player 0 and Player 1 are in a game
- Cell at (2, 3) is unrevealed, unflagged
- `room.pvpFlags[0] = new Set()`, `room.pvpFlags[1] = new Set()`

### Player 0 flags cell (2, 3)

**Client side:**

```js
// +page.svelte
handleFlag(e, 2, 3);
socket.emit("ms:flag", { row: 2, col: 3 });
```

**Server side:**

```js
// minesweeper.js
socket.on("ms:flag", ({ row, col }) => {
    const id = row * cols + col; // id = 2 * 9 + 3 = 21
    const myFlags = room.pvpFlags[0]; // Player 0's flags

    if (!myFlags.has(id)) {
        myFlags.add(id);
        flagged = true;
    }

    socket.emit("ms:flag_result", { id: 21, row: 2, col: 3, flagged: true, playerIndex: 0 });
    // Note: Only Player 0 receives this (socket, not socket.to() or io.to())
});
```

**Client side (Player 0):**

```js
// +page.svelte
socket.on("ms:flag_result", (d) => {
    const c = cells[d.id]; // cells[21]
    c.flagged = true;
    c.flagOwner = 0;
    // UI: cell shows 🚩 in red
});
```

**Player 1's view:**

- Sees no change (server didn't broadcast to room)
- Player 1's local `cells[21]` remains unflagged
- If Player 1 clicks that cell, they can flag or reveal it independently

---

## Common Pitfalls & Solutions

**Problem:** "Why doesn't my opponent see my flag?"

- **Answer:** In PvP, flags are per-player. Each player's flags are private. Only on game loss do all flags show.
- **Solution:** Use CO-OP mode if you want shared flags.

**Problem:** "Why is there latency in multiplayer but not solo?"

- **Answer:** Solo uses local state only. Multiplayer requires server round-trip.
- **Solution:** This is expected behavior. Network latency is ~50-200ms depending on server distance.

**Problem:** "Can I cheat by sending fake socket events?"

- **Answer:** No. The server validates all moves before accepting. Fake events are ignored.
- **Example:** Sending `ms:flag` for an already-revealed cell is rejected.

**Problem:** "Why do I see two different flood-fill algorithms?"

- **Answer:** Solo uses recursive `_flood()`. Multiplayer uses iterative `floodFill()` on server, then client displays results.
- **Reason:** Server-side algorithm is pure (returns list), client uses iterative to avoid stack overflow on huge boards. Both produce identical results.
