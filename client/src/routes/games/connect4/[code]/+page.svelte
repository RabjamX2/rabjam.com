<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { io } from "socket.io-client";
    import Board from "../components/Board.svelte";
    import { takePendingRoom } from "../roomState.js";
    import { getCookie, setCookie } from "$lib/utils/cookies.js";
    import { PUBLIC_API_URL } from "$lib/config";

    let { data } = $props();
    let roomCode = $derived(data.code);

    // ── Page state ───────────────────────────────────────────────────
    // "join"     — joiner needs to enter their name
    // "waiting"  — waiting for an opponent
    // "game"     — game in progress
    // "notfound" — room expired or never existed
    let view = $state("join");
    let playerName = $state("");
    let playerId = $state("");
    let editingName = $state(false);
    let tempName = $state("");
    let errorMsg = $state("");
    let multiplayerState = $state(null);
    let myPlayerIndex = $state(-1);
    let copied = $state(false);

    // ── Player list + colors ─────────────────────────────────────────
    let players = $state([]); // { playerIndex, name, color, connected }
    let myColor = $state("#e94560");

    // ── Password (for password-protected rooms) ──────────────────────
    let hasPassword = $state(false);
    let roomPassword = $state("");

    let socket = null;

    const SERVER_URL = PUBLIC_API_URL || undefined;

    // ── Attach room-lifecycle listeners ──────────────────────────────
    function setupRoomListeners(_myIdx) {
        socket.on("c4:opponent_disconnected", () => {
            if (multiplayerState) multiplayerState.opponentConnected = false;
            const opp = players.find((p) => p.playerIndex !== myPlayerIndex);
            if (opp) opp.connected = false;
        });
        socket.on("c4:opponent_rejoined", () => {
            if (multiplayerState) multiplayerState.opponentConnected = true;
            const opp = players.find((p) => p.playerIndex !== myPlayerIndex);
            if (opp) opp.connected = true;
        });
    }

    // ── Re-register with the server after socket.io auto-reconnect ───
    // When the transport drops briefly, socket.io reconnects automatically but
    // the server-side closure loses currentRoom. c4:drop fails silently until
    // we re-join the room via c4:rejoin.
    let socketWasDisconnected = false;

    function handleAutoReconnect() {
        if (!playerId || view === "join" || view === "notfound") return;
        socket.emit("c4:rejoin", { roomCode, playerId }, (res) => {
            if (res.status !== "success") {
                if (res.message === "Room not found") view = "notfound";
                return;
            }
            if (view === "game") {
                // Restore full game state — replays any moves missed during the drop
                const opp = res.players.find((p) => p.playerIndex !== res.playerIndex);
                multiplayerState = {
                    socket,
                    myPlayerIndex: res.playerIndex,
                    opponentName: opp?.name ?? multiplayerState?.opponentName ?? "Opponent",
                    roomCode,
                    opponentConnected: res.opponentConnected,
                    initialMoves: res.moves ?? [],
                };
            } else if (view === "waiting" && res.hasOpponent) {
                // Opponent joined while we were briefly gone
                const opp = res.players.find((p) => p.playerIndex !== res.playerIndex);
                multiplayerState = {
                    socket,
                    myPlayerIndex: res.playerIndex,
                    opponentName: opp?.name ?? "Opponent",
                    roomCode,
                    opponentConnected: res.opponentConnected,
                    initialMoves: res.moves ?? [],
                };
                view = "game";
            }
            // "waiting" + no opponent: slot restored on server; c4:start will arrive when someone joins
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

    // ── Register a one-shot listener for the next c4:start ──────────
    function waitForGameStart(myIdx) {
        socket.once("c4:start", ({ players: pl, moves }) => {
            players = pl ?? [];
            const opp = pl?.find((p) => p.playerIndex !== myIdx);
            const me = pl?.find((p) => p.playerIndex === myIdx);
            if (me) myColor = me.color;
            multiplayerState = {
                socket,
                myPlayerIndex: myIdx,
                opponentName: opp?.name ?? "Opponent",
                opponentColor: opp?.color,
                myColor: me?.color,
                roomCode,
                opponentConnected: true,
                initialMoves: moves ?? [],
            };
            view = "game";
        });
    }

    onMount(() => {
        document.body.style.overflow = "hidden";

        const cookiePid = getCookie("mp_pid");
        const cookieName = getCookie("mp_name");
        if (cookieName) playerName = cookieName;

        // Creator path: socket already alive from hub page
        const pending = takePendingRoom();
        if (pending) {
            socket = pending.socket;
            playerName = pending.playerName || playerName;
            playerId = pending.playerId || cookiePid || "";
            myPlayerIndex = pending.playerIndex;
            if (pending.color) myColor = pending.color;
            players = [{ playerIndex: 0, name: playerName, color: pending.color ?? myColor, connected: true }];
            if (playerId) setCookie("mp_pid", playerId);
            if (playerName) setCookie("mp_name", playerName);
            view = "waiting";
            attachAutoReconnect();
            setupRoomListeners(pending.playerIndex);
            waitForGameStart(pending.playerIndex);
        } else {
            // Joiner / rejoin path — always create socket immediately
            socket = io(`${SERVER_URL}/connect4`, { transports: ["websocket"] });
            socket.on("connect_error", (err) => {
                errorMsg = `Connection failed: ${err.message}`;
            });
            attachAutoReconnect();

            // Check room info for password requirement (and existence)
            socket.emit("c4:check_room", { roomCode }, (res) => {
                if (!res || res.status !== "success") {
                    if (!cookiePid) view = "notfound";
                    return;
                }
                hasPassword = res.hasPassword;
            });

            if (cookiePid) {
                playerId = cookiePid;
                socket.emit("c4:rejoin", { roomCode, playerId: cookiePid }, (res) => {
                    if (res.status !== "success") {
                        if (res.message === "Room not found") view = "notfound";
                        // else stay on "join" view with existing socket
                        return;
                    }
                    myPlayerIndex = res.playerIndex;
                    players = res.players ?? [];
                    const me = players.find((p) => p.playerIndex === res.playerIndex);
                    if (me) myColor = me.color;
                    if (res.name) {
                        playerName = res.name;
                        setCookie("mp_name", res.name);
                    }

                    if (res.hasOpponent) {
                        const opp = res.players.find((p) => p.playerIndex !== res.playerIndex);
                        multiplayerState = {
                            socket,
                            myPlayerIndex: res.playerIndex,
                            opponentName: opp?.name ?? "Opponent",
                            opponentColor: opp?.color,
                            myColor: me?.color,
                            roomCode,
                            opponentConnected: res.opponentConnected,
                            initialMoves: res.moves ?? [],
                        };
                        view = "game";
                    } else {
                        view = "waiting";
                        waitForGameStart(res.playerIndex);
                    }
                    setupRoomListeners(res.playerIndex);
                });
            }
            // else: stays on "join" view
        }

        return () => {
            document.body.style.overflow = "";
            if (socket) {
                socket.disconnect();
                socket = null;
            }
        };
    });

    function joinRoom() {
        errorMsg = "";
        const name = playerName.trim() || "Player 2";

        if (!playerId) {
            playerId =
                typeof crypto !== "undefined" && crypto.randomUUID
                    ? crypto.randomUUID()
                    : Math.random().toString(36).substring(2) + Date.now().toString(36);
        }

        // Socket was created in onMount for the joiner path
        if (!socket) {
            socket = io(`${SERVER_URL}/connect4`, { transports: ["websocket"] });
            socket.on("connect_error", (err) => {
                errorMsg = `Connection failed: ${err.message}`;
            });
        }

        // Register BEFORE emitting join to avoid race where c4:start fires before our callback
        const onStart = ({ players: pl, moves }) => {
            players = pl ?? [];
            const opp = pl?.find((p) => p.playerIndex !== 1);
            const me = pl?.find((p) => p.playerIndex === 1);
            if (me) myColor = me.color;
            multiplayerState = {
                socket,
                myPlayerIndex: 1,
                opponentName: opp?.name ?? "Opponent",
                opponentColor: opp?.color,
                myColor: me?.color,
                roomCode,
                opponentConnected: true,
                initialMoves: moves ?? [],
            };
            myPlayerIndex = 1;
            view = "game";
        };
        socket.once("c4:start", onStart);

        socket.emit("c4:join", { name, roomCode, playerId, password: roomPassword || undefined }, (res) => {
            if (res.status !== "success") {
                socket.off("c4:start", onStart);
                errorMsg = res.message ?? "Failed to join room";
                return;
            }
            setCookie("mp_pid", playerId);
            setCookie("mp_name", name);
            playerName = name;
            myPlayerIndex = 1;
            setupRoomListeners(1);
        });
    }

    function leaveRoom() {
        socket?.emit("c4:leave");
        goto("/multiplayer");
    }

    function saveName() {
        const name = tempName.trim();
        if (name) {
            playerName = name;
            setCookie("mp_name", name);
        }
        editingName = false;
    }

    async function copyLink() {
        try {
            await navigator.clipboard.writeText(window.location.href);
            copied = true;
            setTimeout(() => (copied = false), 2000);
        } catch {
            // clipboard not available — ignore
        }
    }
</script>

<svelte:head>
    <title>Connect 4 — Room {roomCode}</title>
</svelte:head>

<div class="shell">
    <header class="bar">
        <button class="back-btn" onclick={leaveRoom}>← Back</button>
        <span class="title">Connect 4</span>
        <span></span>
    </header>

    <main class="content">
        <!-- ── Join view (joiner enters their name) ──────────────────── -->
        {#if view === "join"}
            <div class="lobby-card">
                <h2 class="lobby-heading">Join Room</h2>
                <p class="room-code-label">Room</p>
                <span class="room-code-big">{roomCode}</span>

                {#if hasPassword}
                    <label class="field-label" for="rpass">Room password</label>
                    <input
                        id="rpass"
                        class="text-input"
                        type="password"
                        placeholder="Enter password"
                        maxlength="32"
                        bind:value={roomPassword}
                        onkeydown={(e) => e.key === "Enter" && joinRoom()}
                    />
                {/if}

                <label class="field-label" for="pname">Your name</label>
                <input
                    id="pname"
                    class="text-input"
                    type="text"
                    placeholder="Player 2"
                    maxlength="20"
                    autofocus={!hasPassword}
                    bind:value={playerName}
                    onkeydown={(e) => e.key === "Enter" && joinRoom()}
                />

                {#if errorMsg}
                    <p class="error-msg">{errorMsg}</p>
                {/if}

                <button class="primary-btn" onclick={joinRoom}>Join Game</button>
            </div>

            <!-- ── Waiting view (creator waiting for opponent) ─────────────── -->
        {:else if view === "waiting"}
            <div class="lobby-card waiting-card">
                <h2 class="lobby-heading">Waiting for opponent…</h2>
                <div class="spinner"></div>

                <p class="room-code-label">Room code</p>
                <span class="room-code-big">{roomCode}</span>

                <div class="link-row">
                    <span class="link-text">{typeof window !== "undefined" ? window.location.href : ""}</span>
                    <button class="copy-btn" onclick={copyLink}>
                        {copied ? "Copied!" : "Copy link"}
                    </button>
                </div>

                <p class="share-hint">Send this link to a friend — they can join directly</p>

                {#if players.length > 0}
                    <div class="player-list">
                        {#each players as p (p.playerIndex)}
                            <div class="player-row">
                                <span class="p-color-dot" style="background: {p.color}"></span>
                                <span class="p-name">{p.name}{p.playerIndex === myPlayerIndex ? " (you)" : ""}</span>
                            </div>
                        {/each}
                    </div>
                {/if}

                <div class="name-row">
                    <span class="name-label">Playing as</span>
                    {#if editingName}
                        <input
                            class="name-input"
                            type="text"
                            maxlength="20"
                            bind:value={tempName}
                            onkeydown={(e) => {
                                if (e.key === "Enter") saveName();
                                if (e.key === "Escape") editingName = false;
                            }}
                            autofocus
                        />
                        <button class="name-confirm-btn" onclick={saveName}>✓</button>
                        <button class="name-cancel-btn" onclick={() => (editingName = false)}>✕</button>
                    {:else}
                        <span class="name-display">{playerName}</span>
                        <button
                            class="edit-name-btn"
                            onclick={() => {
                                tempName = playerName;
                                editingName = true;
                            }}>✎</button
                        >
                    {/if}
                </div>
            </div>

            <!-- ── Room not found ───────────────────────────────────────── -->
        {:else if view === "notfound"}
            <div class="lobby-card">
                <h2 class="lobby-heading" style="color: var(--accent)">Room Not Found</h2>
                <p class="info-msg">This room has expired or doesn't exist.</p>
                <button class="primary-btn" onclick={() => goto("/multiplayer")}>Back to Hub</button>
            </div>

            <!-- ── Game view ──────────────────────────────────────────────── -->
        {:else if view === "game"}
            <div class="c4-game-layout">
                {#if players.length > 0}
                    <div class="c4-player-strip">
                        {#each players as p (p.playerIndex)}
                            <div class="c4-player-chip" class:is-you={p.playerIndex === myPlayerIndex}>
                                <span class="c4-color-dot" style="background: {p.color}"></span>
                                <span class="c4-chip-name"
                                    >{p.name}{p.playerIndex === myPlayerIndex ? " (you)" : ""}</span
                                >
                                {#if !p.connected}<span class="c4-disc-tag">disconnected</span>{/if}
                            </div>
                        {/each}
                    </div>
                {/if}
                <Board {multiplayerState} />
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

    /* ── Header bar ──────────────────────────────────── */
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
        white-space: nowrap;
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
        white-space: nowrap;
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

    /* ── Content area ────────────────────────────────── */
    .content {
        overflow: auto;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding: 3rem 1rem;
        background: radial-gradient(ellipse at 50% 0%, rgba(233, 69, 96, 0.07) 0%, transparent 60%), var(--bg);
    }

    /* ── Lobby card ──────────────────────────────────── */
    .lobby-card {
        background: var(--surface);
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 16px;
        padding: 2.25rem 2.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
        max-width: 400px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
    }
    .lobby-heading {
        margin: 0;
        font-size: 1.3rem;
        font-weight: 800;
        color: var(--text);
        text-align: center;
    }
    .room-code-label {
        margin: 0;
        font-size: 0.72rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        text-align: center;
    }
    .room-code-big {
        font-size: 2.75rem;
        font-weight: 900;
        letter-spacing: 0.3em;
        color: var(--accent2);
        text-shadow: 0 0 24px rgba(245, 166, 35, 0.45);
        text-align: center;
        line-height: 1;
    }

    /* ── Waiting card extras ─────────────────────────── */
    .waiting-card {
        text-align: center;
    }
    .link-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: var(--surface2);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: var(--radius);
        padding: 0.4rem 0.6rem;
        overflow: hidden;
    }
    .link-text {
        flex: 1;
        font-size: 0.72rem;
        color: var(--text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-align: left;
    }
    .copy-btn {
        flex-shrink: 0;
        padding: 0.22rem 0.7rem;
        background: var(--accent2);
        border: none;
        border-radius: 5px;
        font-size: 0.72rem;
        font-weight: 700;
        color: #111;
        cursor: pointer;
        transition:
            opacity 0.15s,
            transform 0.1s;
        white-space: nowrap;
    }
    .copy-btn:hover {
        opacity: 0.85;
        transform: translateY(-1px);
    }
    .share-hint {
        margin: 0;
        font-size: 0.78rem;
        color: var(--text-muted);
        opacity: 0.7;
    }

    /* ── Spinner (waiting animation) ────────────────── */
    .spinner {
        width: 28px;
        height: 28px;
        border: 3px solid rgba(255, 255, 255, 0.08);
        border-top-color: var(--accent);
        border-radius: 50%;
        animation: spin 0.9s linear infinite;
        align-self: center;
        margin-top: 0.25rem;
    }
    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    /* ── Form ────────────────────────────────────────── */
    .field-label {
        font-size: 0.75rem;
        color: var(--text-muted);
        margin-bottom: -0.5rem;
        font-weight: 500;
        letter-spacing: 0.02em;
    }
    .text-input {
        padding: 0.6rem 0.85rem;
        background: var(--surface2);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: var(--radius);
        color: var(--text);
        font-size: 0.9rem;
        outline: none;
        transition:
            border-color 0.18s,
            box-shadow 0.18s;
        width: 100%;
    }
    .text-input:focus {
        border-color: var(--accent);
        box-shadow: 0 0 0 3px rgba(233, 69, 96, 0.15);
    }
    .error-msg {
        margin: 0;
        font-size: 0.8rem;
        color: #ff6b6b;
        text-align: center;
    }
    .info-msg {
        margin: 0;
        font-size: 0.875rem;
        color: var(--text-muted);
        text-align: center;
        line-height: 1.55;
    }
    .primary-btn {
        padding: 0.7rem;
        background: var(--accent);
        border: none;
        border-radius: var(--radius);
        color: #fff;
        font-size: 0.95rem;
        font-weight: 700;
        cursor: pointer;
        transition:
            opacity 0.15s,
            transform 0.1s,
            box-shadow 0.18s;
        box-shadow: 0 4px 14px rgba(233, 69, 96, 0.3);
    }
    .primary-btn:hover {
        opacity: 0.9;
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(233, 69, 96, 0.4);
    }
    .primary-btn:active {
        transform: translateY(0);
    }

    /* ── Waiting: name display + inline edit ─────────── */
    .name-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        justify-content: center;
        font-size: 0.82rem;
        padding: 0.6rem 0.8rem;
        background: var(--surface2);
        border-radius: var(--radius);
        border: 1px solid rgba(255, 255, 255, 0.06);
    }
    .name-label {
        color: var(--text-muted);
    }
    .name-display {
        color: var(--accent2);
        font-weight: 700;
    }
    .edit-name-btn {
        background: transparent;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        font-size: 0.9rem;
        padding: 0 3px;
        line-height: 1;
        opacity: 0.6;
        transition: opacity 0.15s;
    }
    .edit-name-btn:hover {
        opacity: 1;
    }
    .name-input {
        padding: 0.22rem 0.55rem;
        background: var(--surface);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 5px;
        color: var(--text);
        font-size: 0.82rem;
        outline: none;
        width: 7rem;
        transition: border-color 0.15s;
    }
    .name-input:focus {
        border-color: var(--accent2);
    }
    .name-confirm-btn,
    .name-cancel-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 0.9rem;
        padding: 0 2px;
        line-height: 1;
        transition: opacity 0.15s;
    }
    .name-confirm-btn {
        color: #4caf7a;
    }
    .name-cancel-btn {
        color: #ff6b6b;
    }
    .name-confirm-btn:hover,
    .name-cancel-btn:hover {
        opacity: 0.75;
    }

    /* ── Player list (waiting view) ──────────────────── */
    .player-list {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        width: 100%;
    }
    .player-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.4rem 0.7rem;
        background: var(--surface2);
        border-radius: 6px;
        font-size: 0.85rem;
        color: var(--text);
    }
    .p-color-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
    }
    .p-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    /* ── Game view player strip ───────────────────────── */
    .c4-game-layout {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
    }
    .c4-player-strip {
        display: flex;
        gap: 0.6rem;
        flex-wrap: wrap;
        justify-content: center;
    }
    .c4-player-chip {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.3rem 0.7rem;
        background: var(--surface);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 999px;
        font-size: 0.8rem;
        color: var(--text-muted);
        transition: border-color 0.15s;
    }
    .c4-player-chip.is-you {
        border-color: rgba(255, 255, 255, 0.2);
        color: var(--text);
    }
    .c4-color-dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        flex-shrink: 0;
    }
    .c4-chip-name {
        max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .c4-disc-tag {
        font-size: 0.68rem;
        color: #ff6b6b;
        opacity: 0.8;
    }
</style>
