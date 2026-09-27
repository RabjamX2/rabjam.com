import { CPUPlayer } from "../CPUPlayer.js";
import { findThreats } from "../searcher.js";

// Plays a random valid column.
export class EasyCPU extends CPUPlayer {
	playTurn(game) {
		const available = [];
		for (let col = 0; col < game.BOARD_WIDTH; col++) {
			if (game.gameState[col].length < game.BOARD_HEIGHT) available.push(col);
		}
		game.dropPiece(available[Math.floor(Math.random() * available.length)], "random move");
	}
}

// Wins/blocks immediately, prevents forks, extends 2-in-a-row, prefers center.
export class MediumCPU extends CPUPlayer {
	playTurn(game) {
		const opponent = 1 - this.playingAs;

		// Priority 1: win immediately — CPU has 3 in a row with a valid 4th cell.
		const winMoves = findThreats(game, 3, [this.playingAs]);
		if (winMoves.length > 0) {
			game.dropPiece(winMoves[0].emptyCells[0].col, "winning move");
			return;
		}

		// Priority 2: block opponent from winning on their next move.
		// If multiple threats exist (fork), pick the column that covers the most of them.
		const blockMoves = findThreats(game, 3, [opponent]);
		if (blockMoves.length > 0) {
			game.dropPiece(this._bestCol(blockMoves), "blocking opponent's win");
			return;
		}

		// Priority 3: prevent the opponent from creating a fork.
		// A fork is a 2-in-a-row with BOTH ends open (the X--X template), meaning two
		// separate 4-in-a-row threats will exist on the opponent's next move and only one
		// can be blocked. emptyCells.length === 2 identifies this pattern across all
		// directions; vertical "--XX" matches are always discarded by the reachability
		// check in searchHelper, so this only fires for horizontal/diagonal double threats.
		const opponentTwoInARow = findThreats(game, 2, [opponent]);
		const forkSetups = opponentTwoInARow.filter((t) => t.emptyCells.length === 2);
		if (forkSetups.length > 0) {
			game.dropPiece(this._bestCol(forkSetups), "preventing fork");
			return;
		}

		// Priority 4: extend an existing 2-in-a-row.
		const extendMoves = findThreats(game, 2, [this.playingAs]);
		if (extendMoves.length > 0) {
			game.dropPiece(extendMoves[0].emptyCells[0].col, "extending 2-in-a-row");
			return;
		}

		// Priority 5: center column.
		const center = Math.floor(game.BOARD_WIDTH / 2);
		if (game.gameState[center].length < game.BOARD_HEIGHT) {
			game.dropPiece(center, "center column");
			return;
		}

		// Priority 6: first available column as fallback.
		for (let col = 0; col < game.BOARD_WIDTH; col++) {
			if (game.gameState[col].length < game.BOARD_HEIGHT) {
				game.dropPiece(col, "first available");
				return;
			}
		}
	}

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
