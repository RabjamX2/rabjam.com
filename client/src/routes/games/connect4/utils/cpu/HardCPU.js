import { CPUPlayer } from "../CPUPlayer.js";
import { findThreats } from "../searcher.js";

export class HardCPU extends CPUPlayer {
	playTurn(game) {
		const opponent = 1 - this.playingAs;

		// Priority 1: win immediately — CPU has 3 in a row with a valid 4th cell.
		const winMoves = findThreats(game, 3, [this.playingAs]);
		if (winMoves.length > 0) {
			game.dropPiece(winMoves[0].emptyCells[0].col, "winning move");
			return;
		}

		// Priority 2: block opponent from winning.
		// Prefer blocks that don't create a winning square directly above our piece.
		const blockMoves = findThreats(game, 3, [opponent]);
		if (blockMoves.length > 0) {
			const safeBlocks = blockMoves.filter(
				(m) => !this._createsWinAbove(game, m.emptyCells[0].col, opponent)
			);
			game.dropPiece(
				this._bestCol(safeBlocks.length > 0 ? safeBlocks : blockMoves),
				"blocking opponent's win"
			);
			return;
		}

		// From here on there are no current opponent winning threats.
		// Classify available columns as safe (don't create a new opponent win) vs dangerous.
		const available = [];
		for (let col = 0; col < game.BOARD_WIDTH; col++) {
			if (game.gameState[col].length < game.BOARD_HEIGHT) available.push(col);
		}
		const safe = available.filter((col) => !this._givesOpponentWin(game, col, opponent));
		const candidates = safe.length > 0 ? safe : available;

		// Priority 3: prevent fork — prefer safe moves, fall back to all if none safe.
		const forkSetups = findThreats(game, 2, [opponent]).filter((t) => t.emptyCells.length === 2);
		if (forkSetups.length > 0) {
			const allForkCols = forkSetups
				.flatMap((t) => t.emptyCells.map((c) => c.col))
				.filter((col) => available.includes(col));
			const safeForkCols = allForkCols.filter((col) => safe.includes(col));
			const pool = safeForkCols.length > 0 ? safeForkCols : allForkCols;
			if (pool.length > 0) {
				const counts = new Map();
				for (const col of pool) counts.set(col, (counts.get(col) || 0) + 1);
				const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
				game.dropPiece(best, "preventing fork");
				return;
			}
		}

		// Priority 4: extend an existing 2-in-a-row (safe only).
		const extendMoves = findThreats(game, 2, [this.playingAs]).filter((m) =>
			candidates.includes(m.emptyCells[0].col)
		);
		if (extendMoves.length > 0) {
			const best = extendMoves.reduce((a, b) =>
				this._scoreCol(game, a.emptyCells[0].col) >= this._scoreCol(game, b.emptyCells[0].col)
					? a
					: b
			);
			game.dropPiece(best.emptyCells[0].col, "extending 2-in-a-row");
			return;
		}

		// Priority 5: highest-scored safe column (or least dangerous if all unsafe).
		const scored = candidates
			.map((col) => ({ col, score: this._scoreCol(game, col) }))
			.sort((a, b) => b.score - a.score);
		game.dropPiece(scored[0].col, safe.length > 0 ? "best position" : "least dangerous");
	}

	// Returns true if placing at col makes the square directly above a winning cell for opponent.
	// Used for block-move filtering where opponent threats already exist.
	_createsWinAbove(game, col, opponent) {
		const newLen = game.gameState[col].length + 1;
		if (newLen >= game.BOARD_HEIGHT) return false; // column will be full — no square above
		const sim = this._simulate(game, col, this.playingAs);
		const nextRow = game.BOARD_HEIGHT - 1 - newLen;
		return findThreats(sim, 3, [opponent]).some((t) =>
			t.emptyCells.some((c) => c.col === col && c.row === nextRow)
		);
	}

	// Returns true if placing at col creates any winning threat for opponent.
	// Only valid to call when no opponent winning threats currently exist (after priority 2).
	_givesOpponentWin(game, col, opponent) {
		const sim = this._simulate(game, col, this.playingAs);
		return findThreats(sim, 3, [opponent]).length > 0;
	}

	// Returns a minimal game-like object with player's piece placed at col.
	_simulate(game, col, player) {
		const simState = game.gameState.map((c) => [...c]);
		simState[col] = [...simState[col], player];
		const BH = game.BOARD_HEIGHT;
		return {
			BOARD_WIDTH: game.BOARD_WIDTH,
			BOARD_HEIGHT: BH,
			gameState: simState,
			getFilledGameState() {
				return simState.map((c) => {
					const f = [...c];
					while (f.length < BH) f.push("X");
					return f;
				});
			}
		};
	}

	// Scores a column by counting open 4-windows through the landing cell,
	// weighted by existing friendly pieces in each window. Also biases toward center.
	_scoreCol(game, col) {
		const landingRow = game.BOARD_HEIGHT - 1 - game.gameState[col].length;
		const opponent = 1 - this.playingAs;
		let score = 0;

		// [colDelta, rowDelta] — all four directions
		const dirs = [
			[1, 0],
			[0, 1],
			[1, 1],
			[1, -1]
		];
		for (const [dc, dr] of dirs) {
			for (let offset = 0; offset < 4; offset++) {
				let valid = true;
				let friendly = 0;
				for (let k = 0; k < 4; k++) {
					const c = col + (k - offset) * dc;
					const r = landingRow + (k - offset) * dr;
					if (c < 0 || c >= game.BOARD_WIDTH || r < 0 || r >= game.BOARD_HEIGHT) {
						valid = false;
						break;
					}
					// stackIdx converts visual row to column-array index (0 = bottom piece)
					const stackIdx = game.BOARD_HEIGHT - 1 - r;
					const colArr = game.gameState[c];
					if (stackIdx < colArr.length) {
						if (colArr[stackIdx] === opponent) {
							valid = false;
							break;
						}
						friendly++;
					}
				}
				if (valid) score += 1 + friendly * 2;
			}
		}

		// Bias toward center columns (stronger positional control)
		const center = Math.floor(game.BOARD_WIDTH / 2);
		score += Math.max(0, 3 - Math.abs(col - center));
		return score;
	}

	// Returns the column appearing most often across all empty cells of the given threats.
	_bestCol(threats) {
		const colCount = new Map();
		for (const move of threats) {
			for (const cell of move.emptyCells) {
				colCount.set(cell.col, (colCount.get(cell.col) || 0) + 1);
			}
		}
		return [...colCount.entries()].sort((a, b) => b[1] - a[1])[0][0];
	}
}

// Re-export everything from one place for convenience.
export { CPUPlayer } from "../CPUPlayer.js";
export { EasyCPU, MediumCPU } from "./EasyMediumCPU.js";
