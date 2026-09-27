<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { MinesweeperGame, PRESETS } from "./lib/MinesweeperGame.svelte.js";

    // ── Views ─────────────────────────────────────────────────────────
    // "select" → "customize" → "game" (or "select" → "game" directly)
    let view = $state("select");

    // ── Difficulty (solo) ──────────────────────────────────────────────
    let preset = $state("intermediate");
    const Game = new MinesweeperGame();

    // Custom difficulty settings
    let customRows = $state(9);
    let customCols = $state(9);
    let customMines = $state(10);

    // Game mode settings
    let noGuessMode = $state(true);
    let floodFirstClick = $state(true);

    function startGame(p) {
        const { rows, cols, numMines } = PRESETS[p];
        Game.noGuessMode = noGuessMode;
        Game.floodFirstClick = floodFirstClick;
        Game.init(rows, cols, numMines);
        preset = p;
        view = "game";
    }

    function startCustomGame() {
        const rows = Math.min(Math.max(Math.floor(customRows), 5), 24);
        const cols = Math.min(Math.max(Math.floor(customCols), 5), 30);
        const maxMines = Math.floor(rows * cols * 0.8);
        const numMines = Math.min(Math.max(Math.floor(customMines), 1), maxMines);

        Game.noGuessMode = noGuessMode;
        Game.floodFirstClick = floodFirstClick;
        Game.init(rows, cols, numMines);
        preset = "custom";
        view = "game";
    }

    onMount(() => {
        document.body.style.overflow = "hidden";
        if (new URLSearchParams(location.search).get("solo") !== null) {
            startGame("intermediate");
        }
        return () => {
            document.body.style.overflow = "";
            Game._stopTimer();
        };
    });

    // ── Cell size: scale board to viewport ────────────────────────────
    const CELL = 32;

    function numColor(n) {
        return (
            ["", "#2563eb", "#16a34a", "#dc2626", "#7c3aed", "#b91c1c", "#0891b2", "#111827", "#6b7280"][n] ?? "#888"
        );
    }

    function fmtTime(ms) {
        const s = Math.floor(ms / 1000);
        return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
    }

    // ── Interactions ──────────────────────────────────────────────────
    function handleClick(row, col) {
        if (Game.gameOver) return;
        Game.reveal(row, col);
    }

    function handleRightClick(e, row, col) {
        e.preventDefault();
        if (!Game.firstClickDone || Game.gameOver) return;
        Game.toggleFlag(row, col, null);
    }
</script>

<svelte:head>
    <title>Minesweeper</title>
</svelte:head>

<div class="shell">
    <header class="bar">
        {#if view === "select"}
            <button class="back-btn" onclick={() => goto("/portfolio")}>← Portfolio</button>
        {:else}
            <button class="back-btn" onclick={() => (view = "select")}>← Back</button>
        {/if}
        <span class="title">Minesweeper</span>
        <span></span>
    </header>

    <main class="content">
        <!-- ── Mode selection ─────────────────────────────────────────── -->
        {#if view === "select"}
            <div class="lobby-card">
                <h2 class="lobby-heading">Choose Mode</h2>
                <div class="mode-grid">
                    <div class="mode-section">
                        <p class="mode-section-label">Solo</p>
                        <div class="preset-row">
                            {#each Object.entries(PRESETS) as [key, p]}
                                <button class="preset-btn" onclick={() => startGame(key)}>
                                    <span class="preset-name">{p.label}</span>
                                    <span class="preset-info">{p.rows}×{p.cols} · {p.numMines} 💣</span>
                                </button>
                            {/each}
                            <button class="preset-btn custom" onclick={() => (view = "customize")}>
                                <span class="preset-name">Custom</span>
                                <span class="preset-info">Choose your own settings</span>
                            </button>
                        </div>
                    </div>
                    <div class="mode-divider"></div>
                    <div class="mode-section">
                        <p class="mode-section-label">Multiplayer</p>
                        <button class="mode-btn-big" onclick={() => goto("/multiplayer")}>
                            <span class="mode-icon">🌐</span>
                            <span class="mode-label">Play Online</span>
                            <span class="mode-sub">PvP or CO-OP with a friend</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- ── Custom difficulty selector ──────────────────────────── -->
        {:else if view === "customize"}
            <div class="lobby-card">
                <h2 class="lobby-heading">Custom Difficulty</h2>
                <p class="field-label">Rows (5–24)</p>
                <input class="number-input" type="number" min="5" max="24" bind:value={customRows} />
                <p class="field-label">Columns (5–30)</p>
                <input class="number-input" type="number" min="5" max="30" bind:value={customCols} />
                <p class="field-label">Mines (1–80% of board)</p>
                <input class="number-input" type="number" min="1" max="576" bind:value={customMines} />
                <p class="info-text">
                    Max mines for this board: {Math.floor(
                        Math.min(Math.max(Math.floor(customRows), 5), 24) *
                            Math.min(Math.max(Math.floor(customCols), 5), 30) *
                            0.8,
                    )}
                </p>

                <div class="settings-section">
                    <p class="field-label">Game Mode Settings</p>
                    <label class="toggle-label">
                        <input type="checkbox" bind:checked={noGuessMode} />
                        <span class="toggle-text">No-Guess Mode</span>
                        <span class="toggle-desc">Generate board after first click (first click always safe)</span>
                    </label>
                    <label class="toggle-label">
                        <input type="checkbox" bind:checked={floodFirstClick} />
                        <span class="toggle-text">Flood First Click</span>
                        <span class="toggle-desc">First click reveals an empty area (no adjacent mines)</span>
                    </label>
                </div>

                <div class="button-group">
                    <button class="primary-btn" onclick={startCustomGame}>Start Game</button>
                    <button class="secondary-btn" onclick={() => (view = "select")}>Back</button>
                </div>
            </div>

            <!-- ── Solo game ──────────────────────────────────────────────── -->
        {:else if view === "game"}
            <div class="game-wrap">
                <!-- Controls bar -->
                <div class="controls-bar" style="width: {Game.cols * CELL}px">
                    <div class="stat">
                        <span class="stat-icon">💣</span>
                        <span class="stat-val">{Game.remainingMines}</span>
                    </div>

                    {#if Game.gameOver}
                        <button class="restart-btn" onclick={() => startGame(preset)}>
                            {Game.won ? "🎉 Play Again" : "💥 Try Again"}
                        </button>
                    {:else}
                        <div class="difficulty-group">
                            {#each Object.keys(PRESETS) as p}
                                <button
                                    class="diff-btn"
                                    class:active={preset === p}
                                    onclick={() => startGame(p)}
                                    title={PRESETS[p].label}>{PRESETS[p].label[0]}</button
                                >
                            {/each}
                            <button
                                class="diff-btn"
                                class:active={preset === "custom"}
                                onclick={() => (view = "customize")}
                                title="Custom">⚙️</button
                            >
                        </div>
                    {/if}

                    <div class="stat">
                        <span class="stat-icon">⏱</span>
                        <span class="stat-val">{fmtTime(Game.elapsedMs)}</span>
                    </div>
                </div>

                <!-- Board -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                    class="board"
                    style="
                        grid-template-columns: repeat({Game.cols}, {CELL}px);
                        width: {Game.cols * CELL}px;
                    "
                    oncontextmenu={(e) => e.preventDefault()}
                >
                    {#each Game.cells as c (c.id)}
                        {@const isExploded = c.mine && c.revealed && !c.flagged && !Game.won}
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <div
                            class="cell"
                            class:hidden={!c.revealed && !c.flagged && !c.wrong}
                            class:flagged={c.flagged && !c.wrong}
                            class:wrong={c.wrong}
                            class:mine={c.mine && c.revealed && !Game.won}
                            class:exploded={isExploded &&
                                c.row * Game.cols + c.col ===
                                    (Game.cells.find((x) => x.mine && x.revealed) ?? { id: -1 }).id}
                            class:revealed-safe={c.revealed && !c.mine}
                            style={c.revealed && !c.mine && c.count > 0 ? `color:${numColor(c.count)}` : ""}
                            onclick={() => handleClick(c.row, c.col)}
                            oncontextmenu={(e) => handleRightClick(e, c.row, c.col)}
                        >
                            {#if c.flagged && !c.wrong}🚩
                            {:else if c.wrong}❌
                            {:else if c.mine && c.revealed}💣
                            {:else if c.revealed && c.count > 0}{c.count}
                            {/if}
                        </div>
                    {/each}
                </div>

                {#if Game.gameOver}
                    <div class="result-banner" class:win={Game.won} class:lose={!Game.won}>
                        {Game.won ? "🎉 You cleared the board!" : "💥 Boom! Better luck next time."}
                    </div>
                {/if}
            </div>
        {/if}
    </main>
</div>

<style>
    .shell {
        display: grid;
        grid-template-rows: 52px 1fr;
        height: 100dvh;
        background: var(--bg);
        overflow: hidden;
        font-family: "Segoe UI", system-ui, sans-serif;
    }

    /* ── Header ──────────────────────────────────────── */
    .bar {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        padding: 0 1rem;
        background: var(--surface);
        border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        box-shadow: 0 1px 12px rgba(0, 0, 0, 0.3);
    }
    .title {
        font-size: 0.95rem;
        font-weight: 700;
        color: var(--accent2);
        letter-spacing: 0.04em;
    }
    .back-btn {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 999px;
        color: var(--text-muted);
        padding: 5px 14px;
        font-size: 0.82rem;
        font-weight: 500;
        cursor: pointer;
        transition:
            border-color 0.18s,
            color 0.18s,
            background 0.18s;
        justify-self: start;
    }
    .back-btn:hover {
        border-color: var(--accent);
        color: var(--text);
        background: rgba(233, 69, 96, 0.08);
    }

    /* ── Content ─────────────────────────────────────── */
    .content {
        overflow: auto;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding: 2.5rem 1rem 3rem;
        background: radial-gradient(ellipse at 50% 0%, rgba(233, 69, 96, 0.06) 0%, transparent 55%), var(--bg);
    }

    /* ── Mode selection card ─────────────────────────── */
    .lobby-card {
        background: var(--surface);
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 16px;
        padding: 2rem 2.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        width: 100%;
        max-width: 480px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
    }
    .lobby-heading {
        font-size: 1.3rem;
        font-weight: 800;
        color: var(--text);
        text-align: center;
        margin: 0;
    }
    .mode-grid {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }
    .mode-section {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
    }
    .mode-section-label {
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--text-muted);
        margin: 0;
    }
    .preset-row {
        display: flex;
        gap: 0.6rem;
    }
    .preset-btn {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.2rem;
        padding: 0.75rem 0.5rem;
        background: var(--surface2);
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: var(--radius);
        cursor: pointer;
        transition:
            border-color 0.18s,
            background 0.18s,
            transform 0.1s;
    }
    .preset-btn:hover {
        border-color: var(--accent);
        background: rgba(233, 69, 96, 0.08);
        transform: translateY(-1px);
    }
    .preset-btn.custom {
        border-color: rgba(245, 166, 35, 0.3);
        border-style: dashed;
    }
    .preset-btn.custom:hover {
        border-color: var(--accent2);
        background: rgba(245, 166, 35, 0.08);
    }
    .preset-name {
        font-size: 0.82rem;
        font-weight: 700;
        color: var(--text);
    }
    .preset-info {
        font-size: 0.72rem;
        color: var(--text-muted);
    }
    .mode-divider {
        height: 1px;
        background: rgba(255, 255, 255, 0.06);
    }
    .mode-btn-big {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.85rem 1rem;
        background: var(--surface2);
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: var(--radius);
        cursor: pointer;
        text-align: left;
        transition:
            border-color 0.18s,
            background 0.18s,
            transform 0.1s;
        width: 100%;
    }
    .mode-btn-big:hover {
        border-color: var(--accent);
        background: rgba(233, 69, 96, 0.08);
        transform: translateY(-1px);
    }
    .mode-icon {
        font-size: 1.5rem;
        flex-shrink: 0;
    }
    .mode-label {
        font-size: 0.9rem;
        font-weight: 700;
        color: var(--text);
    }
    .mode-sub {
        font-size: 0.75rem;
        color: var(--text-muted);
        margin-left: auto;
    }

    /* ── Solo game ───────────────────────────────────── */
    .game-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }

    .controls-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.45rem 0.65rem;
        background: var(--surface);
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-bottom: none;
        border-radius: 10px 10px 0 0;
        gap: 0.5rem;
    }
    .stat {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        min-width: 3rem;
    }
    .stat-icon {
        font-size: 0.9rem;
    }
    .stat-val {
        font-size: 0.88rem;
        font-weight: 700;
        color: var(--text);
        font-variant-numeric: tabular-nums;
        min-width: 2rem;
    }
    .difficulty-group {
        display: flex;
        gap: 2px;
        background: var(--surface2);
        border-radius: 6px;
        padding: 2px;
    }
    .diff-btn {
        padding: 0.2rem 0.55rem;
        border: none;
        border-radius: 4px;
        background: transparent;
        color: var(--text-muted);
        font-size: 0.72rem;
        font-weight: 700;
        cursor: pointer;
        transition:
            background 0.12s,
            color 0.12s;
    }
    .diff-btn.active {
        background: var(--accent);
        color: #fff;
    }
    .diff-btn:hover:not(.active) {
        color: var(--text);
    }

    /* ── Custom difficulty form ──────────────────────────────────────────── */
    .number-input {
        width: 100%;
        padding: 0.6rem 0.85rem;
        background: var(--surface2);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        color: var(--text);
        font-size: 0.95rem;
        outline: none;
        transition: border-color 0.18s;
        box-sizing: border-box;
        margin-bottom: 1rem;
    }
    .number-input:focus {
        border-color: var(--accent);
    }
    .info-text {
        font-size: 0.78rem;
        color: var(--text-muted);
        margin: -0.8rem 0 1rem 0;
    }
    .button-group {
        display: flex;
        gap: 0.6rem;
        margin-top: 1rem;
    }
    .button-group .primary-btn,
    .button-group .secondary-btn {
        flex: 1;
    }
    .secondary-btn {
        padding: 0.6rem 1.2rem;
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 6px;
        color: var(--text-muted);
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s;
    }
    .secondary-btn:hover {
        border-color: var(--text-muted);
        color: var(--text);
    }
    .field-label {
        font-size: 0.78rem;
        color: var(--text-muted);
        font-weight: 500;
        margin-bottom: 0.4rem;
    }
    .restart-btn {
        padding: 0.3rem 0.9rem;
        background: var(--accent);
        border: none;
        border-radius: 6px;
        color: #fff;
        font-size: 0.8rem;
        font-weight: 700;
        cursor: pointer;
        transition: opacity 0.15s;
    }
    .restart-btn:hover {
        opacity: 0.85;
    }

    /* ── Board ───────────────────────────────────────── */
    .board {
        display: grid;
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 0 0 10px 10px;
        overflow: hidden;
        user-select: none;
    }
    .cell {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
        font-weight: 800;
        cursor: pointer;
        border: 1px solid rgba(255, 255, 255, 0.04);
        background: var(--surface2);
        transition:
            background 0.08s,
            filter 0.08s;
        box-sizing: border-box;
    }
    .cell.hidden {
        background: var(--surface2);
        box-shadow:
            inset 2px 2px 3px rgba(255, 255, 255, 0.06),
            inset -2px -2px 3px rgba(0, 0, 0, 0.3);
    }
    .cell.hidden:hover {
        filter: brightness(1.2);
    }
    .cell.revealed-safe {
        background: var(--surface);
        cursor: default;
    }
    .cell.flagged {
        background: var(--surface2);
        cursor: pointer;
    }
    .cell.mine {
        background: rgba(220, 38, 38, 0.35);
        cursor: default;
    }
    .cell.exploded {
        background: rgba(220, 38, 38, 0.65);
    }
    .cell.wrong {
        background: rgba(220, 38, 38, 0.25);
        cursor: default;
    }

    /* ── Result banner ───────────────────────────────── */
    .result-banner {
        padding: 0.6rem 1.5rem;
        border-radius: var(--radius);
        font-size: 0.9rem;
        font-weight: 700;
        text-align: center;
    }
    .result-banner.win {
        background: rgba(34, 197, 94, 0.15);
        border: 1px solid rgba(34, 197, 94, 0.3);
        color: #4ade80;
    }
    .result-banner.lose {
        background: rgba(220, 38, 38, 0.15);
        border: 1px solid rgba(220, 38, 38, 0.3);
        color: #f87171;
    }

    /* ── Game Mode Settings ──────────────────────────────────────────── */
    .settings-section {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        padding: 0.8rem;
        margin: 1rem 0;
    }

    .toggle-label {
        display: flex;
        align-items: flex-start;
        gap: 0.6rem;
        margin-bottom: 0.8rem;
        cursor: pointer;
        transition: opacity 0.15s;
    }

    .toggle-label:last-child {
        margin-bottom: 0;
    }

    .toggle-label:hover {
        opacity: 0.8;
    }

    .toggle-label input[type="checkbox"] {
        width: 18px;
        height: 18px;
        margin-top: 2px;
        cursor: pointer;
        flex-shrink: 0;
    }

    .toggle-text {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text);
    }

    .toggle-desc {
        font-size: 0.72rem;
        color: var(--text-muted);
        display: block;
    }
</style>
