import search from "./searcher.js";

export class Connect4 {
	// Board dimensions
	BOARD_WIDTH = 7;
	BOARD_HEIGHT = 6;

	// Reactive state (Svelte runes)
	gameState = $state([]); // column-major: gameState[col] = array of pieces, 0=bottom
	moveHistory = $state([]); // ordered list of every move made
	winner = $state(""); // "red" | "blue" | "" | null
	currentPlayer = $state(0); // 0 = red, 1 = blue
	lastDrop = $state(null); // { col, row, color, id } — drives the fall animation
	logs = $state([]); // debug log entries: { message, highlight }
	dropCount = 0; // monotonically increasing, used as animation key and log prefix

	// Delete later, just for testing
	exampleGameState = [[0, 1, 0, 1], [0, 1], [1, 0], [1, 0], [1], [0], []];

	constructor() {
		this.reset();
		// Load the test board and immediately check if it already contains a winner.
		// this.gameState = this.exampleGameState;
		// const { winner, direction, winningPieces } = search(this, 4);
		// if (winner) {
		// 	this.winner = winner;
		// 	this.log(`Game started — ${winner} already wins ${direction}!`, {
		// 		type: "win",
		// 		pieces: winningPieces,
		// 		winner
		// 	});
		// }
	}

	reset() {
		this.winner = null;
		this.currentPlayer = 0;
		this.gameState = [];
		this.moveHistory = [];
		this.logs = [];

		// Initialise each column as an empty array.
		for (let col = 0; col < this.BOARD_WIDTH; col++) {
			this.gameState.push([]);
		}
	}

	// Returns a copy of gameState where every column is padded to BOARD_HEIGHT with "X".
	// Used by searcher.js, which relies on uniform column length and X as the empty sentinel.
	getFilledGameState() {
		return this.gameState.map((col) => {
			const filled = [...col];
			while (filled.length < this.BOARD_HEIGHT) filled.push("X");
			return filled;
		});
	}

	getGameState() {
		return this.gameState;
	}

	// Appends an entry to the debug log.
	// highlight describes what to show on the board when the entry is hovered:
	//   { type: "move", col, row, color }  — ring around a single piece
	//   { type: "win",  pieces, winner }   — line through the 4 winning pieces
	//   { type: "full", col }              — (no board overlay; column is full)
	log(message, highlight = null) {
		this.logs.push({ message: `[${this.dropCount}] ${message}`, highlight });
	}

	checkForWinner() {
		const { winner, direction, winningPieces } = search(this, 4);
		if (winner) {
			const winnerLabel = winner[0].toUpperCase() + winner.slice(1);
			this.log(`${winnerLabel} wins ${direction}!`, { type: "win", pieces: winningPieces, winner });
		}
		return winner;
	}

	dropPiece(col, reason = null) {
		if (this.winner) return; // game already over

		const columnArray = this.gameState[col];

		if (columnArray.length < this.BOARD_HEIGHT) {
			const droppingColor = this.currentPlayer ? "blue" : "red";
			// landingRow is the visual row (0 = top) where the piece will settle.
			const landingRow = this.BOARD_HEIGHT - 1 - columnArray.length;
			columnArray.push(this.currentPlayer);
			this.moveHistory.push({ player: droppingColor, column: col, row: columnArray.length - 1 });
			this.lastDrop = { col, row: landingRow, color: droppingColor, id: ++this.dropCount };
			const colorLabel = droppingColor[0].toUpperCase() + droppingColor.slice(1);
			this.log(`Column ${col + 1}${reason ? ` — ${reason}` : ""}`, {
				type: "move",
				col,
				row: landingRow,
				color: droppingColor
			});
			this.currentPlayer = droppingColor === "red" ? 1 : 0;
		} else {
			this.log(`Column ${col + 1} is full`, { type: "full", col });
		}

		this.winner = this.checkForWinner();
	}
}
