import { placeMines as _placeMines, computeCounts, floodFill, NEIGHBORS } from "./minesweeperLogic.js";

export const PRESETS = {
    beginner: { rows: 9, cols: 9, numMines: 10, label: "Beginner" },
    intermediate: { rows: 16, cols: 16, numMines: 40, label: "Intermediate" },
    expert: { rows: 16, cols: 30, numMines: 99, label: "Expert" },
};

export class MinesweeperGame {
    rows = $state(9);
    cols = $state(9);
    numMines = $state(10);
    cells = $state([]);

    gameOver = $state(false);
    won = $state(false);
    firstClickDone = $state(false);
    revealedCount = $state(0);
    elapsedMs = $state(0);

    // ── Game mode settings ────────────────────────────────────────────
    noGuessMode = $state(true); // Generate board after first click (safe first click)
    floodFirstClick = $state(true); // Ensure first click opens a flood area (no adjacent mines)

    _timerHandle = null;

    get flagCount() {
        return this.cells.filter((c) => c.flagged).length;
    }
    get safeCount() {
        return this.rows * this.cols - this.numMines;
    }
    get remainingMines() {
        return this.numMines - this.flagCount;
    }

    init(rows, cols, numMines) {
        if (rows !== undefined) this.rows = rows;
        if (cols !== undefined) this.cols = cols;
        if (numMines !== undefined) this.numMines = numMines;

        this.gameOver = false;
        this.won = false;
        this.firstClickDone = false;
        this.revealedCount = 0;
        this.elapsedMs = 0;
        this._stopTimer();

        this.cells = Array.from({ length: this.rows * this.cols }, (_, i) => ({
            id: i,
            row: Math.floor(i / this.cols),
            col: i % this.cols,
            mine: false,
            revealed: false,
            flagged: false,
            flagOwner: null, // null | 0 | 1
            count: 0,
            wrong: false, // wrong flag shown on loss
        }));

        // If noGuessMode is OFF, generate random mines immediately
        if (!this.noGuessMode) {
            this.generateRandomMines();
        }
    }

    generateRandomMines() {
        const mines = new Set(
            Array.from({ length: this.rows * this.cols }, (_, i) => i)
                .sort(() => Math.random() - 0.5)
                .slice(0, this.numMines),
        );
        const counts = computeCounts(this.rows, this.cols, mines);

        for (const c of this.cells) {
            c.mine = mines.has(c.id);
            c.count = counts[c.id];
        }
    }

    idx(row, col) {
        return row * this.cols + col;
    }
    cell(row, col) {
        return this.cells[this.idx(row, col)];
    }

    // ── Mine placement ────────────────────────────────────────────────────
    placeMines(safeRow, safeCol) {
        let safeId = this.idx(safeRow, safeCol);
        let excludeIds = new Set([safeId]);

        // If floodFirstClick is enabled, exclude all neighbors of the first click
        if (this.floodFirstClick) {
            for (const [dr, dc] of NEIGHBORS) {
                const nr = safeRow + dr,
                    nc = safeCol + dc;
                if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                    excludeIds.add(this.idx(nr, nc));
                }
            }
        }

        // Generate mines excluding the safe cells
        const pool = Array.from({ length: this.rows * this.cols }, (_, i) => i).filter((i) => !excludeIds.has(i));
        const shuffled = [...pool];
        for (let i = 0; i < this.numMines && i < shuffled.length; i++) {
            const j = i + Math.floor(Math.random() * (shuffled.length - i));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const mines = new Set(shuffled.slice(0, this.numMines));
        const counts = computeCounts(this.rows, this.cols, mines);

        for (const c of this.cells) {
            c.mine = mines.has(c.id);
            c.count = counts[c.id];
        }
    }

    // ── Reveal ───────────────────────────────────────────────────────────
    // Returns 'mine' | 'safe' | 'win' | 'blocked'
    reveal(row, col) {
        if (this.gameOver) return "blocked";
        const c = this.cell(row, col);
        if (c.revealed || c.flagged) return "blocked";

        if (!this.firstClickDone) {
            // Only generate mines on first click if noGuessMode is enabled
            if (this.noGuessMode) {
                this.placeMines(row, col);
            }
            this.firstClickDone = true;
            this._startTimer();
        }

        if (c.mine) {
            c.revealed = true;
            this._explode();
            return "mine";
        }

        this._flood(row, col);

        if (this.revealedCount >= this.safeCount) {
            this._win();
            return "win";
        }
        return "safe";
    }

    _flood(row, col) {
        const mines = new Set(this.cells.filter((c) => c.mine).map((c) => c.id));
        const counts = this.cells.map((c) => c.count);
        const alreadyRevealed = new Set(this.cells.filter((c) => c.revealed).map((c) => c.id));
        const startId = this.idx(row, col);
        const toReveal = floodFill(this.rows, this.cols, mines, counts, alreadyRevealed, startId);
        for (const { id } of toReveal) {
            this.cells[id].revealed = true;
            this.revealedCount++;
        }
    }

    _explode() {
        this.gameOver = true;
        this._stopTimer();
        for (const c of this.cells) {
            if (c.mine && !c.flagged) c.revealed = true;
            if (c.flagged && !c.mine) c.wrong = true;
        }
    }

    _win() {
        this.won = true;
        this.gameOver = true;
        this._stopTimer();
        for (const c of this.cells) {
            if (c.mine && !c.flagged) c.flagged = true;
        }
    }

    // ── Flag ─────────────────────────────────────────────────────────────
    toggleFlag(row, col, owner = null) {
        if (this.gameOver || !this.firstClickDone) return;
        const c = this.cell(row, col);
        if (c.revealed) return;
        c.flagged = !c.flagged;
        c.flagOwner = c.flagged ? owner : null;
    }

    // ── Timer helpers ─────────────────────────────────────────────────────
    _startTimer() {
        this._timerHandle = setInterval(() => {
            this.elapsedMs += 1000;
        }, 1000);
    }

    _stopTimer() {
        if (this._timerHandle) {
            clearInterval(this._timerHandle);
            this._timerHandle = null;
        }
    }
}
