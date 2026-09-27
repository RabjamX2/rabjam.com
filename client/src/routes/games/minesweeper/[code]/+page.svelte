<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { io } from "socket.io-client";
    import { takePendingRoom } from "../lib/roomState.js";
    import { getCookie, setCookie } from "$lib/utils/cookies.js";
    import { PUBLIC_API_URL } from "$lib/config";

    let { data } = $props();
    let roomCode = $derived(data.code);

    // ── Views: join | waiting | game | notfound ──────────────────────
    let view = $state("join");
    let playerName = $state("");
    let playerId = $state("");
    let errorMsg = $state("");
    let copied = $state(false);

    let socket = null;

    // ── Room / player info ────────────────────────────────────────────
    let myPlayerIndex = $state(-1);
    let mode = $state("pvp"); // pvp | coop

    // ── N-player support ──────────────────────────────────────────────
    let players = $state([]); // { playerIndex, name, color, connected }
    let isCreator = $state(false);
    let myColor = $state("#e94560");

    // ── Password (for password-protected rooms) ───────────────────────
    let hasPassword = $state(false);
    let roomPassword = $state("");

    // ── Board dimensions ──────────────────────────────────────────────
    let rows = $state(9);
    let cols = $state(9);
    let numMines = $state(10);

    // ── Board state ───────────────────────────────────────────────────
    let cells = $state([]);
    let currentTurn = $state(0); // pvp: whose turn
    let revealedCount = $state(0);
    let gameOver = $state(false);
    let won = $state(false);
    let loser = $state(null); // pvp: 0|1, coop: null (both lose)

    // ── Rematch state ─────────────────────────────────────────────────
    let rematchPending = $state(false);
    let rematchIncoming = $state(false);
    let rematchFrom = $state("");
    let playerLeftMsg = $state("");

    const SERVER_URL = PUBLIC_API_URL || undefined;
    const CELL = 30;

    // ── Board helpers ─────────────────────────────────────────────────
    function initCells(r, c) {
        cells = Array.from({ length: r * c }, (_, i) => ({
            id: i,
            row: Math.floor(i / c),
            col: i % c,
            mine: false,
            revealed: false,
            flagged: false,
            flagOwner: null, // 0 | 1
            count: 0,
            wrong: false,
        }));
    }

    function numColor(n) {
        return (
            ["", "#2563eb", "#16a34a", "#dc2626", "#7c3aed", "#b91c1c", "#0891b2", "#111827", "#6b7280"][n] ?? "#888"
        );
    }

    // ── Apply full game state received from server on rejoin ──────────
    function applyGameState(gs) {
        if (gs.revealed) {
            for (const { id, count, mine } of gs.revealed) {
                if (cells[id]) {
                    cells[id].revealed = true;
                    cells[id].count = count;
                    cells[id].mine = !!mine;
                }
            }
        }
        if (gs.flags) {
            for (const { id, playerIndex } of gs.flags) {
                if (cells[id]) {
                    cells[id].flagged = true;
                    cells[id].flagOwner = playerIndex;
                }
            }
        }
        revealedCount = gs.revealedCount ?? 0;
        currentTurn = gs.currentTurn ?? 0;
        gameOver = gs.gameOver ?? false;
        won = gs.won ?? false;
        loser = gs.loser ?? null;
    }

    // ── Register all game socket listeners ────────────────────────────
    function setupGameListeners() {
        socket.on("ms:reveal_result", (d) => {
            // Newly revealed cells (safe path or win path)
            if (d.revealedCells) {
                for (const rc of d.revealedCells) {
                    const c = cells[rc.id];
                    if (c) {
                        c.revealed = true;
                        c.count = rc.count;
                        revealedCount++;
                    }
                }
            }
            // Turn advancement (PvP only)
            if (d.nextTurn !== undefined && d.nextTurn !== null) {
                currentTurn = d.nextTurn;
            }
            // Mine hit
            if (d.mineCellId !== undefined) {
                const mc = cells[d.mineCellId];
                if (mc) {
                    mc.revealed = true;
                    mc.mine = true;
                }
                if (d.allMines) {
                    for (const mId of d.allMines) {
                        const c = cells[mId];
                        if (c && !c.revealed) {
                            c.revealed = true;
                            c.mine = true;
                        }
                    }
                }
                if (d.wrongFlags) {
                    for (const fId of d.wrongFlags) {
                        if (cells[fId]) cells[fId].wrong = true;
                    }
                }
                loser = d.loser; // pvp: 0|1; coop: null
                gameOver = true;
            }
            // Win
            if (d.win) {
                won = true;
                gameOver = true;
                if (d.allMines) {
                    for (const mId of d.allMines) {
                        if (cells[mId]) {
                            cells[mId].flagged = true;
                            cells[mId].flagOwner = myPlayerIndex;
                        }
                    }
                }
            }
        });

        socket.on("ms:flag_result", (d) => {
            const c = cells[d.id];
            if (c) {
                c.flagged = d.flagged;
                c.flagOwner = d.flagged ? d.playerIndex : null;
            }
        });

        socket.on("ms:player_disconnected", ({ playerIndex: pi }) => {
            const idx = players.findIndex((p) => p.playerIndex === pi);
            if (idx !== -1) players[idx].connected = false;
        });
        socket.on("ms:player_rejoined", ({ playerIndex: pi }) => {
            const idx = players.findIndex((p) => p.playerIndex === pi);
            if (idx !== -1) players[idx].connected = true;
        });
        socket.on("ms:player_left", ({ playerIndex: pi, name }) => {
            const idx = players.findIndex((p) => p.playerIndex === pi);
            if (idx !== -1) {
                if (mode === "coop") {
                    players.splice(idx, 1);
                } else {
                    players[idx].connected = false;
                    if (!gameOver) playerLeftMsg = `${name} left the game.`;
                }
            }
            rematchPending = false;
            rematchIncoming = false;
        });
        socket.on("ms:rematch_cancelled", () => {
            rematchPending = false;
            rematchIncoming = false;
        });
        socket.on("ms:rematch_reset", ({ rows: r, cols: c, numMines: nm, mode: m, players: pl }) => {
            rows = r;
            cols = c;
            numMines = nm;
            mode = m;
            if (pl) players = pl;
            initCells(r, c);
            revealedCount = 0;
            currentTurn = 0;
            gameOver = false;
            won = false;
            loser = null;
            rematchPending = false;
            rematchIncoming = false;
            rematchFrom = "";
            playerLeftMsg = "";
            view = "game";
        });

        socket.on("ms:rematch_request", ({ from }) => {
            rematchIncoming = true;
            rematchFrom = from;
        });
    }

    // ── Auto-reconnect ────────────────────────────────────────────────
    let socketWasDisconnected = false;

    function handleAutoReconnect() {
        if (!playerId || view === "join" || view === "notfound") return;
        socket.emit("ms:rejoin", { roomCode, playerId }, (res) => {
            if (res.status !== "success") {
                if (res.message === "Room not found") view = "notfound";
                return;
            }
            myPlayerIndex = res.playerIndex;
            myColor = res.color ?? myColor;
            players = res.players ?? players;
            mode = res.mode;
            rows = res.rows;
            cols = res.cols;
            numMines = res.numMines;

            if (res.started) {
                initCells(res.rows, res.cols);
                if (res.gameState) applyGameState(res.gameState);
                if (view !== "game") view = "game";
            } else {
                view = "waiting";
                waitForGameStart(res.playerIndex);
            }
        });
    }

    function attachAutoReconnect() {
        socket.on("disconnect", () => {
            socketWasDisconnected = true;
        });
        socket.on("connect", () => {
            if (socketWasDisconnected) {
                socketWasDisconnected = false;
                handleAutoReconnect();
            }
        });
    }

    function waitForGameStart(myIdx) {
        const onPlayerJoined = ({ allPlayers }) => {
            players = allPlayers;
        };
        const onPlayerLeft = ({ playerIndex: pi }) => {
            players = players.filter((p) => p.playerIndex !== pi);
        };
        socket.on("ms:player_joined", onPlayerJoined);
        socket.on("ms:player_left", onPlayerLeft);

        socket.once("ms:start", ({ rows: r, cols: c, numMines: nm, mode: m, players: pl }) => {
            socket.off("ms:player_joined", onPlayerJoined);
            socket.off("ms:player_left", onPlayerLeft);
            rows = r;
            cols = c;
            numMines = nm;
            mode = m;
            players = pl ?? [];
            const me = pl?.find((p) => p.playerIndex === myIdx);
            if (me) myColor = me.color;
            initCells(r, c);
            revealedCount = 0;
            currentTurn = 0;
            gameOver = false;
            won = false;
            loser = null;
            view = "game";
            setupGameListeners();
        });
    }

    onMount(() => {
        document.body.style.overflow = "hidden";
        const cookiePid = getCookie("mp_pid");
        const cookieName = getCookie("mp_name");
        if (cookieName) playerName = cookieName;

        // ── Creator path (navigated here from hub after ms:create) ───
        const pending = takePendingRoom();
        if (pending) {
            socket = pending.socket;
            playerName = pending.playerName || playerName;
            playerId = pending.playerId || cookiePid || "";
            myPlayerIndex = pending.playerIndex;
            mode = pending.mode || "pvp";
            myColor = pending.color ?? myColor;
            isCreator = true;
            players = [{ playerIndex: 0, name: playerName, color: myColor, connected: true }];
            if (playerId) setCookie("mp_pid", playerId);
            if (playerName) setCookie("mp_name", playerName);
            view = "waiting";
            attachAutoReconnect();
            waitForGameStart(pending.playerIndex);
            return;
        }

        // ── Joiner / rejoin path ──────────────────────────────────────
        socket = io(`${SERVER_URL}/minesweeper`, { transports: ["websocket"] });
        socket.on("connect_error", (err) => {
            errorMsg = `Connection failed: ${err.message}`;
        });
        attachAutoReconnect();

        // Check room info (password requirement) upfront
        socket.emit("ms:check_room", { roomCode }, (res) => {
            if (!res || res.status !== "success") {
                if (!cookiePid) view = "notfound";
                return;
            }
            hasPassword = res.hasPassword;
        });

        if (cookiePid) {
            playerId = cookiePid;
            socket.emit("ms:rejoin", { roomCode, playerId: cookiePid }, (res) => {
                if (res.status !== "success") {
                    if (res.message === "Room not found") view = "notfound";
                    return;
                }
                myPlayerIndex = res.playerIndex;
                isCreator = res.playerIndex === 0;
                myColor = res.color ?? myColor;
                players = res.players ?? [];
                if (res.name) {
                    playerName = res.name;
                    setCookie("mp_name", res.name);
                }
                mode = res.mode;
                rows = res.rows;
                cols = res.cols;
                numMines = res.numMines;

                if (res.started) {
                    initCells(res.rows, res.cols);
                    if (res.gameState) applyGameState(res.gameState);
                    view = "game";
                    setupGameListeners();
                } else {
                    view = "waiting";
                    waitForGameStart(res.playerIndex);
                }
            });
        }

        return () => {
            document.body.style.overflow = "";
            if (socket) {
                socket.disconnect();
                socket = null;
            }
        };
    });

    // ── Join button ───────────────────────────────────────────────────
    function joinRoom() {
        errorMsg = "";
        const name = playerName.trim() || "Player 2";
        if (!playerId) {
            playerId =
                typeof crypto !== "undefined" && crypto.randomUUID
                    ? crypto.randomUUID()
                    : Math.random().toString(36).slice(2) + Date.now().toString(36);
        }
        if (!socket) {
            socket = io(`${SERVER_URL}/minesweeper`, { transports: ["websocket"] });
            socket.on("connect_error", (err) => {
                errorMsg = `Connection failed: ${err.message}`;
            });
        }

        const onPlayerJoined = ({ allPlayers }) => {
            players = allPlayers;
        };
        const onStart = ({ rows: r, cols: c, numMines: nm, mode: m, players: pl }) => {
            socket.off("ms:player_joined", onPlayerJoined);
            rows = r;
            cols = c;
            numMines = nm;
            mode = m;
            players = pl ?? [];
            const me = pl?.find((p) => p.playerIndex === myPlayerIndex);
            if (me) myColor = me.color;
            initCells(r, c);
            revealedCount = 0;
            currentTurn = 0;
            gameOver = false;
            won = false;
            loser = null;
            view = "game";
            setupGameListeners();
        };
        socket.on("ms:player_joined", onPlayerJoined);
        socket.once("ms:start", onStart);

        socket.emit("ms:join", { name, roomCode, playerId, password: roomPassword || undefined }, (res) => {
            if (res.status !== "success") {
                socket.off("ms:start", onStart);
                socket.off("ms:player_joined", onPlayerJoined);
                errorMsg = res.message ?? "Failed to join room";
                return;
            }
            setCookie("mp_pid", playerId);
            setCookie("mp_name", name);
            playerName = name;
            myPlayerIndex = res.playerIndex;
            myColor = res.color ?? myColor;
            players = res.players ?? [];
            view = "waiting";
        });
    }

    // ── Start game (creator only) ───────────────────────────────────
    function startGame() {
        if (!socket || !isCreator) return;
        socket.emit("ms:start_game", {}, (res) => {
            if (res?.status !== "success") {
                errorMsg = res?.message ?? "Failed to start game";
            }
        });
    }

    // ── Game actions ──────────────────────────────────────────────────
    function handleReveal(row, col) {
        if (gameOver || !socket) return;
        if (mode === "pvp" && (!opponentConnected || currentTurn !== myPlayerIndex)) return;
        const c = cells[row * cols + col];
        if (!c || c.revealed || c.flagged) return;
        socket.emit("ms:reveal", { row, col });
    }

    function handleFlag(e, row, col) {
        e.preventDefault();
        if (gameOver || !socket) return;
        const c = cells[row * cols + col];
        if (!c || c.revealed) return;
        socket.emit("ms:flag", { row, col });
    }

    function requestRematch() {
        if (!socket) return;
        rematchPending = true;
        socket.emit("ms:rematch");
    }

    async function copyLink() {
        try {
            await navigator.clipboard.writeText(window.location.href);
            copied = true;
            setTimeout(() => (copied = false), 2000);
        } catch {
            /* clipboard not available */
        }
    }

    // ── Derived ───────────────────────────────────────────────────────
    let flagCount = $derived(
        cells.filter((c) => (mode === "pvp" ? c.flagged && c.flagOwner === myPlayerIndex : c.flagged)).length,
    );
    let remainingMines = $derived(numMines - flagCount);
    let myTurn = $derived(mode === "coop" || currentTurn === myPlayerIndex);
    let iLost = $derived(gameOver && !won && loser === myPlayerIndex);
    let oppLostPvp = $derived(gameOver && !won && loser !== null && loser !== myPlayerIndex && mode === "pvp");
    let coopLoss = $derived(gameOver && !won && mode === "coop");
    let safeCount = $derived(rows * cols - numMines);
    // N-player derived
    let opponentConnected = $derived(
        players.length === 0 ? true : players.filter((p) => p.playerIndex !== myPlayerIndex).every((p) => p.connected),
    );
    let opponentName = $derived(players.find((p) => p.playerIndex !== myPlayerIndex)?.name ?? "Opponent");
    let currentTurnPlayer = $derived(players.find((p) => p.playerIndex === currentTurn));
    let canRematch = $derived(players.filter((p) => p.connected).length >= 2);
</script>

<svelte:head>
    <title>Minesweeper — Room {roomCode}</title>
</svelte:head>

<div class="shell">
    <header class="bar">
        <button
            class="back-btn"
            onclick={() => {
                socket?.emit("ms:leave");
                goto("/multiplayer");
            }}>← Hub</button
        >
        <span class="title">Minesweeper · <span class="room-badge">{roomCode}</span></span>
        <span class="mode-tag">{mode === "pvp" ? "⚔️ PvP" : "🤝 CO-OP"}</span>
    </header>

    <main class="content">
        <!-- ── Join view ─────────────────────────────────────────────── -->
        {#if view === "join"}
            <div class="lobby-card">
                <h2 class="lobby-heading">Join Room</h2>
                <p class="room-code-label">Room</p>
                <span class="room-code-big">{roomCode}</span>

                <label class="field-label" for="pname">Your name</label>
                <!-- svelte-ignore a11y_autofocus -->
                <input
                    id="pname"
                    class="text-input"
                    type="text"
                    placeholder="Player 2"
                    maxlength="20"
                    autofocus
                    bind:value={playerName}
                    onkeydown={(e) => e.key === "Enter" && joinRoom()}
                />

                {#if errorMsg}
                    <p class="error-msg">{errorMsg}</p>
                {/if}

                <button class="primary-btn" onclick={joinRoom}>Join Game</button>
            </div>

            <!-- ── Waiting view ──────────────────────────────────────────── -->
        {:else if view === "waiting"}
            <div class="lobby-card waiting-card">
                <h2 class="lobby-heading">
                    {isCreator ? "Waiting for players…" : "Waiting for host to start…"}
                </h2>
                {#if isCreator}<div class="spinner"></div>{/if}

                <p class="room-code-label">Room code</p>
                <span class="room-code-big">{roomCode}</span>

                <div class="link-row">
                    <span class="link-text">{typeof window !== "undefined" ? window.location.href : ""}</span>
                    <button class="copy-btn" onclick={copyLink}>
                        {copied ? "✓ Copied" : "Copy Link"}
                    </button>
                </div>

                <!-- Player list -->
                {#if players.length > 0}
                    <div class="ms-player-list">
                        {#each players as p (p.playerIndex)}
                            <div class="ms-player-row">
                                <span class="ms-p-dot" style="background: {p.color}"></span>
                                <span class="ms-p-name">{p.name}{p.playerIndex === myPlayerIndex ? " (you)" : ""}</span>
                                <span class="ms-p-conn" class:offline={!p.connected}>{p.connected ? "●" : "○"}</span>
                            </div>
                        {/each}
                    </div>
                {/if}

                <!-- Start button (creator) or waiting hint (joiner) -->
                {#if isCreator}
                    <button class="primary-btn ms-start-btn" disabled={players.length < 2} onclick={startGame}>
                        {players.length < 2 ? "Waiting for players…" : "▶ Start Game"}
                    </button>
                    {#if errorMsg}<p class="error-msg">{errorMsg}</p>{/if}
                {:else}
                    <p class="waiting-hint">The host will start the game when ready.</p>
                {/if}
            </div>

            <!-- ── Game view ─────────────────────────────────────────────── -->
        {:else if view === "game"}
            <div class="game-wrap">
                <!-- Player strip -->
                {#if players.length > 0}
                    <div class="ms-player-strip" style="max-width: {cols * CELL + 40}px">
                        {#each players as p (p.playerIndex)}
                            <div
                                class="ms-player-chip"
                                class:is-me={p.playerIndex === myPlayerIndex}
                                class:is-turn={mode === "pvp" && currentTurn === p.playerIndex && !gameOver}
                                class:is-disconnected={!p.connected}
                            >
                                <span class="ms-chip-dot" style="background: {p.color}"></span>
                                <span class="ms-chip-name"
                                    >{p.name}{p.playerIndex === myPlayerIndex ? " (you)" : ""}</span
                                >
                                {#if mode === "pvp" && currentTurn === p.playerIndex && !gameOver}
                                    <span class="ms-chip-arrow">▲</span>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}

                <!-- Info bar -->
                <div class="info-bar" style="width: {cols * CELL}px">
                    <!-- Left: mine counter -->
                    <div class="mine-counter">
                        💣 <span class="counter-val">{remainingMines}</span>
                    </div>

                    <!-- Center: turn/status -->
                    <div class="status-center">
                        {#if gameOver}
                            {#if won}🎉 You won!
                            {:else if iLost}💥 You hit a mine!
                            {:else if oppLostPvp}🎉 {players.find((p) => p.playerIndex === loser)?.name ?? opponentName}
                                hit a mine!
                            {:else if coopLoss}💥 A mine was hit!
                            {/if}
                        {:else if !opponentConnected}
                            ⏸ A player disconnected
                        {:else if mode === "pvp"}
                            {myTurn ? "Your turn" : `${currentTurnPlayer?.name ?? opponentName}'s turn`}
                        {:else}
                            {revealedCount}/{safeCount} cleared
                        {/if}
                    </div>

                    <!-- Right: opponent indicator -->
                    <div class="opp-indicator" class:disconnected={!opponentConnected}>
                        <span class="opp-dot"></span>
                        <span class="opp-name">{opponentName}</span>
                    </div>
                </div>

                <!-- Board -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                    class="board"
                    style="grid-template-columns: repeat({cols}, {CELL}px); width: {cols * CELL}px;"
                    oncontextmenu={(e) => e.preventDefault()}
                >
                    {#each cells as c (c.id)}
                        {@const isMyFlag = c.flagged && (mode === "coop" || c.flagOwner === myPlayerIndex)}
                        {@const isOppFlag = c.flagged && mode === "coop" && c.flagOwner !== myPlayerIndex}
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                        <div
                            class="cell"
                            class:hidden={!c.revealed && !c.flagged && !c.wrong}
                            class:my-flag={isMyFlag && !c.wrong}
                            class:opp-flag={isOppFlag}
                            class:wrong={c.wrong}
                            class:mine={c.mine && c.revealed && !won}
                            class:revealed-safe={c.revealed && !c.mine}
                            class:no-click={!myTurn && mode === "pvp" && !gameOver}
                            style={c.revealed && !c.mine && c.count > 0 ? `color:${numColor(c.count)}` : ""}
                            onclick={() => handleReveal(c.row, c.col)}
                            oncontextmenu={(e) => handleFlag(e, c.row, c.col)}
                        >
                            {#if c.wrong}❌
                            {:else if isMyFlag}🚩
                            {:else if isOppFlag}🏁
                            {:else if c.mine && c.revealed}💣
                            {:else if c.revealed && c.count > 0}{c.count}
                            {/if}
                        </div>
                    {/each}
                </div>

                <!-- Paused overlay (PvP only — co-op continues with remaining players) -->
                {#if playerLeftMsg && !gameOver && mode === "pvp"}
                    <div class="overlay-banner paused">🚪 {playerLeftMsg}</div>
                {:else if !opponentConnected && !gameOver && mode === "pvp"}
                    <div class="overlay-banner paused">⏸ Waiting for disconnected player(s) to reconnect…</div>
                {/if}

                <!-- Game-over actions -->
                {#if gameOver}
                    <div class="gameover-bar">
                        {#if playerLeftMsg}
                            <span class="rematch-msg">{playerLeftMsg}</span>
                        {:else if !canRematch}
                            <span class="rematch-msg">Not enough players to rematch</span>
                        {:else if rematchIncoming && !rematchPending}
                            <span class="rematch-msg">{rematchFrom} wants a rematch</span>
                            <button class="primary-btn small" onclick={requestRematch}>Accept</button>
                        {:else if rematchPending}
                            <span class="rematch-msg">Waiting for others…</span>
                        {:else}
                            <button class="primary-btn small" onclick={requestRematch}>🔄 Rematch</button>
                        {/if}
                        <button
                            class="secondary-btn small"
                            onclick={() => {
                                socket?.emit("ms:leave");
                                goto("/multiplayer");
                            }}>← Hub</button
                        >
                    </div>
                {/if}
            </div>

            <!-- ── Not found ─────────────────────────────────────────────── -->
        {:else if view === "notfound"}
            <div class="lobby-card">
                <h2 class="lobby-heading">Room not found</h2>
                <p class="not-found-msg">
                    This room has expired or never existed.<br />
                    Check the code or create a new room.
                </p>
                <button class="primary-btn" onclick={() => goto("/multiplayer")}>← Back to Hub</button>
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
    }
    .title {
        font-size: 0.88rem;
        font-weight: 700;
        color: var(--text);
        letter-spacing: 0.02em;
    }
    .room-badge {
        color: var(--accent2);
        font-variant: small-caps;
        letter-spacing: 0.08em;
    }
    .mode-tag {
        font-size: 0.78rem;
        color: var(--text-muted);
        justify-self: end;
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
        padding: 2rem 1rem 3rem;
        background: radial-gradient(ellipse at 50% 0%, rgba(233, 69, 96, 0.05) 0%, transparent 55%), var(--bg);
    }

    /* ── Lobby cards (join / waiting / notfound) ─────── */
    .lobby-card {
        background: var(--surface);
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 16px;
        padding: 2rem 2.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
        width: 100%;
        max-width: 400px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
    }
    .lobby-heading {
        font-size: 1.25rem;
        font-weight: 800;
        color: var(--text);
        text-align: center;
        margin: 0;
    }
    .room-code-label {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--text-muted);
        text-align: center;
        margin: 0;
    }
    .room-code-big {
        font-size: 2.2rem;
        font-weight: 900;
        letter-spacing: 0.2em;
        color: var(--accent2);
        text-align: center;
        font-variant: small-caps;
    }
    .field-label {
        font-size: 0.78rem;
        color: var(--text-muted);
        font-weight: 500;
    }
    .text-input {
        padding: 0.55rem 0.85rem;
        background: var(--surface2);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: var(--radius);
        color: var(--text);
        font-size: 0.92rem;
        outline: none;
        transition: border-color 0.18s;
    }
    .text-input:focus {
        border-color: var(--accent);
    }
    .error-msg {
        color: var(--accent);
        font-size: 0.8rem;
        margin: 0;
    }
    .primary-btn {
        padding: 0.6rem 1.2rem;
        background: var(--accent);
        border: none;
        border-radius: var(--radius);
        color: #fff;
        font-size: 0.9rem;
        font-weight: 700;
        cursor: pointer;
        transition:
            opacity 0.15s,
            transform 0.1s;
    }
    .primary-btn:hover {
        opacity: 0.88;
    }
    .primary-btn.small {
        font-size: 0.82rem;
        padding: 0.45rem 0.9rem;
    }
    .secondary-btn {
        padding: 0.6rem 1.2rem;
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: var(--radius);
        color: var(--text-muted);
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition:
            border-color 0.15s,
            color 0.15s;
    }
    .secondary-btn:hover {
        border-color: var(--text-muted);
        color: var(--text);
    }
    .secondary-btn.small {
        font-size: 0.82rem;
        padding: 0.45rem 0.9rem;
    }
    .not-found-msg {
        font-size: 0.88rem;
        color: var(--text-muted);
        text-align: center;
        line-height: 1.5;
        margin: 0;
    }

    /* ── Waiting card ────────────────────────────────── */
    .waiting-card {
        align-items: center;
    }
    .spinner {
        width: 36px;
        height: 36px;
        border: 3px solid rgba(255, 255, 255, 0.1);
        border-top-color: var(--accent);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
    .link-row {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        width: 100%;
        background: var(--surface2);
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: var(--radius);
        padding: 0.4rem 0.6rem;
    }
    .link-text {
        font-size: 0.72rem;
        color: var(--text-muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
    }
    .copy-btn {
        flex-shrink: 0;
        padding: 0.25rem 0.7rem;
        background: var(--surface2);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 6px;
        color: var(--text-muted);
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        transition:
            border-color 0.15s,
            color 0.15s;
    }
    .copy-btn:hover {
        border-color: var(--accent2);
        color: var(--accent2);
    }

    /* ── Game view ───────────────────────────────────── */
    .game-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0;
    }

    /* ── Info bar ────────────────────────────────────── */
    .info-bar {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        align-items: center;
        padding: 0.4rem 0.7rem;
        background: var(--surface);
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-bottom: none;
        border-radius: 10px 10px 0 0;
        font-size: 0.8rem;
    }
    .mine-counter {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.85rem;
    }
    .counter-val {
        font-weight: 800;
        color: var(--text);
        font-variant-numeric: tabular-nums;
        min-width: 2ch;
    }
    .status-center {
        text-align: center;
        font-weight: 600;
        font-size: 0.8rem;
        color: var(--text-muted);
    }
    .opp-indicator {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        justify-content: flex-end;
        font-size: 0.78rem;
        color: var(--text-muted);
    }
    .opp-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #4caf50;
        box-shadow: 0 0 6px rgba(76, 175, 80, 0.5);
        flex-shrink: 0;
        transition: background 0.3s;
    }
    .opp-indicator.disconnected .opp-dot {
        background: #555;
        box-shadow: none;
    }
    .opp-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 80px;
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
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
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
        box-shadow:
            inset 2px 2px 3px rgba(255, 255, 255, 0.06),
            inset -2px -2px 3px rgba(0, 0, 0, 0.3);
    }
    .cell.hidden:hover:not(.no-click) {
        filter: brightness(1.2);
    }
    .cell.no-click {
        cursor: not-allowed;
    }
    .cell.revealed-safe {
        background: var(--surface);
        cursor: default;
    }
    .cell.my-flag {
        background: rgba(233, 69, 96, 0.15);
    }
    .cell.opp-flag {
        background: rgba(37, 99, 235, 0.15);
    }
    .cell.mine {
        background: rgba(220, 38, 38, 0.35);
        cursor: default;
    }
    .cell.wrong {
        background: rgba(220, 38, 38, 0.25);
        cursor: default;
    }

    /* ── Overlays / banners ──────────────────────────── */
    .overlay-banner {
        margin-top: 0.5rem;
        padding: 0.5rem 1.25rem;
        border-radius: var(--radius);
        font-size: 0.85rem;
        font-weight: 600;
        text-align: center;
    }
    .overlay-banner.paused {
        background: rgba(245, 166, 35, 0.12);
        border: 1px solid rgba(245, 166, 35, 0.3);
        color: var(--accent2);
    }
    .gameover-bar {
        margin-top: 0.75rem;
        display: flex;
        gap: 0.6rem;
        align-items: center;
    }
    .rematch-msg {
        font-size: 0.82rem;
        color: var(--text-muted);
    }

    /* ── Waiting view: player list ───────────────────── */
    .ms-player-list {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        width: 100%;
    }
    .ms-player-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.4rem 0.7rem;
        background: var(--surface2);
        border-radius: 6px;
        font-size: 0.84rem;
    }
    .ms-p-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
    }
    .ms-p-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--text);
    }
    .ms-p-conn {
        font-size: 0.75rem;
        color: #4caf50;
    }
    .ms-p-conn.offline {
        color: var(--text-muted);
    }
    .ms-start-btn {
        margin-top: 0.25rem;
    }
    .waiting-hint {
        font-size: 0.8rem;
        color: var(--text-muted);
        text-align: center;
        margin: 0;
    }

    /* ── Game view: player strip ─────────────────────── */
    .ms-player-strip {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        justify-content: center;
        margin-bottom: 0.4rem;
        width: 100%;
    }
    .ms-player-chip {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.25rem 0.6rem;
        background: var(--surface);
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 999px;
        font-size: 0.76rem;
        color: var(--text-muted);
        transition:
            border-color 0.15s,
            box-shadow 0.15s;
    }
    .ms-player-chip.is-me {
        color: var(--text);
        border-color: rgba(255, 255, 255, 0.18);
    }
    .ms-player-chip.is-turn {
        border-color: var(--accent2);
        box-shadow: 0 0 8px rgba(245, 166, 35, 0.25);
        color: var(--accent2);
    }
    .ms-player-chip.is-disconnected {
        opacity: 0.45;
    }
    .ms-chip-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
    }
    .ms-chip-name {
        max-width: 100px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .ms-chip-arrow {
        font-size: 0.6rem;
        color: var(--accent2);
    }
</style>
