// Converts a column-major matrix (array of columns) into a row-major one (array of rows),
// then reverses the row order so row 0 = visual top of the board.
// rowLength = number of columns, colLength = number of rows.
function transpose(matrix, rowLength = matrix.length, colLength = matrix[0].length) {
	const grid = [];

	for (let j = 0; j < colLength; j++) {
		grid[j] = Array(rowLength);
		for (let i = 0; i < rowLength; i++) {
			grid[j][i] = matrix[i][j];
		}
	}
	grid.reverse();
	return grid;
}

// Pads each column with X's to create a staircase effect, aligning diagonals into
// the same row after a subsequent transpose.
// direction "down" (\) shifts column i right by i positions;
// direction "up" (/) shifts column i right by (rows-1-i) positions.
// After transpose, each row of the result contains exactly one diagonal of the board.
// Padding uses "." (not "X") so it never matches any template and can be safely ignored.
function staircaseMatrix(matrix, direction) {
	const shifted = [];
	const rows = matrix.length; // = BOARD_WIDTH (iterating over columns)

	for (let i = 0; i < rows; i++) {
		// Each row needs (rows-1) padding total so every shifted row is the same width.
		// For "down": column i is shifted right by i (left pad = i, right pad = rows-1-i).
		// For "up":  column i is shifted right by rows-1-i (left pad = rows-1-i, right pad = i).
		const leftPadCount = direction === "down" ? i : rows - 1 - i;
		const rightPadCount = direction === "down" ? rows - 1 - i : i;

		shifted.push([
			...Array(leftPadCount).fill("."),
			...matrix[i],
			...Array(rightPadCount).fill(".")
		]);
	}

	return shifted;
}

// Generalized pattern search across any set of "lines" (columns, rows, or diagonal rows).
// coordMapper(lineIdx, posInLine) translates a match position back to board { col, row }.
// rawGameState (unfilled, no X) is used to verify that X positions in threat patterns
// correspond to the column's actual next-playable row (not a floating unreachable gap).
// Returns an array of { player, pieces: [{col,row}], emptyCells: [{col,row}] } objects.
// pieces = all 4 positions in the match; emptyCells = only the X positions (drop targets).
function searchHelper(lines, template, coordMapper, rawGameState, boardHeight, players = [0, 1]) {
	const foundSpots = [];

	for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
		const lineString = lines[lineIdx].join("");

		for (const originalKey of template) {
			for (const player of players) {
				// Replace "-" wildcards with this player's digit (0 or 1).
				const searchKey = originalKey.replace(/-/g, player.toString());
				let searchFrom = 0;

				while (true) {
					const matchIndex = lineString.indexOf(searchKey, searchFrom);
					if (matchIndex === -1) break;

					const pieces = [];
					const emptyCells = []; // actionable X positions (valid drop targets)
					let allReachable = true;

					for (let k = 0; k < searchKey.length; k++) {
						const coord = coordMapper(lineIdx, matchIndex + k);
						pieces.push(coord);

						if (searchKey[k] === "X") {
							// Padding cells use "." so they never appear in templates and never reach here.
							// The empty cell is only actionable if it is the column's current next-drop row.
							const nextDropRow = boardHeight - 1 - rawGameState[coord.col].length;
							if (coord.row !== nextDropRow) {
								allReachable = false;
								break;
							}
							emptyCells.push(coord);
						}
					}

					if (allReachable) foundSpots.push({ player, pieces, emptyCells });
					searchFrom = matchIndex + 1;
				}
			}
		}
	}
	return foundSpots;
}

// Finds all pattern matches for the given players across all four directions.
// howManyInARow selects the template set (1-4); players filters by player digit.
// Returns all { player, pieces, emptyCells, direction } spots, in priority order:
// vertical → horizontal → stairdown diagonal → stairup diagonal.
function findThreats(game, howManyInARow = 4, players = [0, 1]) {
	const filledGameState = game.getFilledGameState(); // column-major, X = empty

	// Row-major view used for horizontal checks.
	const transposedGameState = transpose(filledGameState, game.BOARD_WIDTH, game.BOARD_HEIGHT);

	const diagonalWidth = game.BOARD_WIDTH + game.BOARD_HEIGHT - 1;
	// Staircase + transpose turns \ diagonals into horizontal rows.
	const offsetDownGameState = staircaseMatrix(filledGameState, "down");
	const transposedOffsetDownGameState = transpose(
		offsetDownGameState,
		game.BOARD_WIDTH,
		diagonalWidth
	);

	// Staircase + transpose turns / diagonals into horizontal rows.
	const offsetUpGameState = staircaseMatrix(filledGameState, "up");
	const transposedOffsetUpGameState = transpose(offsetUpGameState, game.BOARD_WIDTH, diagonalWidth);

	const BH = game.BOARD_HEIGHT;
	const BW = game.BOARD_WIDTH;

	// Templates keyed by number of player pieces in a row.
	// "-" = player wildcard, "X" = required empty cell (drop target).
	// Vertical only allows a trailing X (gravity makes gaps impossible).
	// Horizontal/diagonal allow the empty at any position within the window.
	const verticalTemplates = { 1: ["-XXX"], 2: ["--XX"], 3: ["---X"], 4: ["----"] };
	const nonVerticalTemplates = {
		1: ["-XXX", "X-XX", "XX-X", "XXX-"],
		2: ["--XX", "X--X", "XX--"],
		3: ["---X", "X---"],
		4: ["----"]
	};

	// Coordinate mappers: (lineIndex, posInLine) → { col, row } in visual board space.
	// Vertical:      line = column (filled),    pos = stack index (0 = bottom)
	// Horizontal:    line = visual row,          pos = col
	// Stairdown (\): row = r + col − (BW−1)     (derived from left-shift staircase offset)
	// Stairup   (/): row = r − col              (derived from right-shift staircase offset)
	const verticalMapper = (col, stackIdx) => ({ col, row: BH - 1 - stackIdx });
	const horizontalMapper = (row, col) => ({ col, row });
	const downDiagMapper = (r, pos) => ({ col: pos, row: r + pos - (BW - 1) });
	const upDiagMapper = (r, pos) => ({ col: pos, row: r - pos });

	const passes = [
		{
			lines: filledGameState,
			mapper: verticalMapper,
			template: verticalTemplates[howManyInARow],
			direction: "vertical"
		},
		{
			lines: transposedGameState,
			mapper: horizontalMapper,
			template: nonVerticalTemplates[howManyInARow],
			direction: "horizontal"
		},
		{
			lines: transposedOffsetDownGameState,
			mapper: downDiagMapper,
			template: nonVerticalTemplates[howManyInARow],
			direction: "diagonal"
		},
		{
			lines: transposedOffsetUpGameState,
			mapper: upDiagMapper,
			template: nonVerticalTemplates[howManyInARow],
			direction: "diagonal"
		}
	];

	const allSpots = [];
	for (const { lines, mapper, template, direction } of passes) {
		const spots = searchHelper(lines, template, mapper, game.gameState, BH, players);
		for (const spot of spots) {
			allSpots.push({ ...spot, direction });
		}
	}
	return allSpots;
}

// Winner check: returns the first 4-in-a-row found across all directions.
// Returns { winner: "red"|"blue"|"", direction, winningPieces: [{col,row}] }.
function search(game) {
	const threats = findThreats(game, 4);
	if (threats.length === 0) return { winner: "", direction: null, winningPieces: [] };
	const { player, pieces, direction } = threats[0];
	return { winner: player === 0 ? "red" : "blue", direction, winningPieces: pieces };
}

export { findThreats };
export default search;
