/**
 * Pure, framework-agnostic Minesweeper game logic.
 * Shared between the Node.js server and the SvelteKit client.
 * No side effects — all functions return new values; callers apply results.
 */

export const NEIGHBORS = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
];

/**
 * Randomly places `numMines` mines on a `rows × cols` board,
 * guaranteeing that `safeId` (the first-click cell) and all its
 * neighbors are not mines, so the first click always opens a region.
 * Uses a partial Fisher-Yates shuffle for O(numMines) time.
 *
 * @param {number} rows
 * @param {number} cols
 * @param {number} numMines
 * @param {number} safeId - cell index that must not contain a mine
 * @returns {Set<number>} set of cell indices that contain mines
 */
export function placeMines(rows, cols, numMines, safeId) {
    const safeRow = Math.floor(safeId / cols);
    const safeCol = safeId % cols;
    const safeSet = new Set([safeId]);
    for (const [dr, dc] of NEIGHBORS) {
        const nr = safeRow + dr,
            nc = safeCol + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            safeSet.add(nr * cols + nc);
        }
    }
    const pool = Array.from({ length: rows * cols }, (_, i) => i).filter((i) => !safeSet.has(i));
    for (let i = 0; i < numMines && i < pool.length; i++) {
        const j = i + Math.floor(Math.random() * (pool.length - i));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return new Set(pool.slice(0, numMines));
}

/**
 * Computes the adjacent-mine count for every non-mine cell.
 * @param {number} rows
 * @param {number} cols
 * @param {Set<number>} mines
 * @returns {Map<number, number>} cellId → count
 */
export function computeCounts(rows, cols, mines) {
    const counts = new Map();
    for (const mineId of mines) {
        const mr = Math.floor(mineId / cols);
        const mc = mineId % cols;
        for (const [dr, dc] of NEIGHBORS) {
            const nr = mr + dr,
                nc = mc + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                const nid = nr * cols + nc;
                if (!mines.has(nid)) {
                    counts.set(nid, (counts.get(nid) || 0) + 1);
                }
            }
        }
    }
    return counts;
}

/**
 * Performs iterative BFS to reveal zero-count regions.
 * @param {number} startId
 * @param {number} rows
 * @param {number} cols
 * @param {Set<number>} mines
 * @param {Map<number, number>} counts
 * @param {boolean[]} revealed
 * @param {boolean[]} flagged
 * @returns {number[]} newly revealed cell indices
 */
export function floodFill(startId, rows, cols, mines, counts, revealed, flagged) {
    const newlyRevealed = [];
    const queue = [startId];
    const visited = new Set([startId]);

    while (queue.length > 0) {
        const curr = queue.shift();
        if (flagged[curr] || revealed[curr]) continue;

        newlyRevealed.push(curr);

        if ((counts.get(curr) || 0) === 0) {
            const cr = Math.floor(curr / cols);
            const cc = curr % cols;
            for (const [dr, dc] of NEIGHBORS) {
                const nr = cr + dr,
                    nc = cc + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                    const nid = nr * cols + nc;
                    if (!visited.has(nid) && !revealed[nid] && !flagged[nid] && !mines.has(nid)) {
                        visited.add(nid);
                        queue.push(nid);
                    }
                }
            }
        }
    }
    return newlyRevealed;
}
