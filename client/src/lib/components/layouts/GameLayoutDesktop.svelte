<script>
    import Seats from "$lib/components/Seats.svelte";
    import PlayerActions from "$lib/components/PlayerActions.svelte";
    import Pot from "$lib/components/Pot.svelte";
    import Chat from "$lib/components/Chat.svelte";
    import TurnTimer from "$lib/components/TurnTimer.svelte";
    import SpectatorList from "$lib/components/SpectatorList.svelte";
    import Card from "$lib/components/Card.svelte";
    import LayoutSwitcher from "$lib/components/LayoutSwitcher.svelte";

    let {
        data,
        gameState,
        ownHand,
        handSeen,
        mySeat,
        seated,
        chatMessages,
        roundResult,
        isMyTurn,
        sitDown,
        startGame,
        sendAction,
        sendChat,
        leaveTable,
    } = $props();

    let me = $derived(data.user);
    const myPlayer = $derived(gameState?.seatList?.find(([s]) => s === mySeat)?.[1]);

    let chatOpen = $state(false);
</script>

<div class="game-root">
    <!-- ── TOP HUD ─────────────────────────────────────────── -->
    <header class="hud-top">
        <button class="leave-btn" onclick={leaveTable}>← Leave</button>
        <h2 class="table-name">{data.table.name}</h2>
        <div class="hud-center">
            {#if gameState}
                <Pot
                    pot={gameState.pot}
                    blind={gameState.currentBlindBetAmount}
                    seenBet={gameState.currentSeenBetAmount}
                />
            {/if}
        </div>
        <div class="hud-right">
            <SpectatorList table={data.table} />
            <button class="chat-toggle" onclick={() => (chatOpen = !chatOpen)} title="Toggle chat">💬</button>
            <LayoutSwitcher />
        </div>
    </header>

    <!-- ── TABLE ──────────────────────────────────────────── -->
    <main class="table-area">
        {#if roundResult}
            <div class="round-result">
                <h3>🏆 {roundResult.winners.join(", ")} won {roundResult.pot} chips!</h3>
                {#each roundResult.reveals as r}
                    <p>{r.username}: {r.handType}</p>
                {/each}
            </div>
        {/if}

        {#if gameState}
            <Seats
                seatList={gameState.seatList}
                {mySeat}
                gameInProgress={gameState.gameInProgress}
                currentPlayerSeat={gameState.currentPlayer?.seatNumber ?? null}
                onSitDown={sitDown}
            />
        {:else}
            <p class="loading">Connecting…</p>
        {/if}
    </main>

    <!-- ── BOTTOM HUD: my cards + actions ─────────────────── -->
    {#if mySeat !== null}
        <footer class="hud-bottom">
            <!-- My cards (larger, real view) -->
            <div class="my-hand">
                {#if ownHand.length}
                    {#each ownHand as card}
                        <Card rank={card.rank} suit={card.suit} faceDown={!handSeen} size="normal" />
                    {/each}
                {:else if gameState?.gameInProgress}
                    <Card faceDown size="normal" />
                    <Card faceDown size="normal" />
                    <Card faceDown size="normal" />
                {:else}
                    <span class="no-cards-msg">Waiting for game…</span>
                {/if}
            </div>

            <!-- Timer + Actions -->
            <div class="bottom-mid">
                {#if !gameState?.gameInProgress}
                    <button class="start-game-btn" onclick={startGame}>▶ Start Game</button>
                {:else if isMyTurn}
                    <TurnTimer duration={60} key={gameState?.currentPlayer?.seatNumber} />
                {/if}
                {#if gameState?.gameInProgress}
                    <PlayerActions
                        {isMyTurn}
                        {handSeen}
                        folded={myPlayer?.handFolded ?? false}
                        seenThisTurn={myPlayer?.handSeenThisTurn ?? false}
                        isEveryoneSeen={gameState?.seatList
                            ?.filter(([, p]) => p && !p.handFolded)
                            .every(([, p]) => p.handSeen) ?? false}
                        currentBlind={gameState?.currentBlindBetAmount ?? 2}
                        myChips={myPlayer?.chips ?? 0}
                        maxBet={gameState?.maxBet ?? 0}
                        onAction={sendAction}
                    />
                {/if}
            </div>

            <!-- My info -->
            <div class="my-info">
                <span class="my-name">{me.username}</span>
                <span class="my-chips">💰 {myPlayer?.chips ?? 0}</span>
                <span class="my-seat-label">Seat {mySeat}</span>
            </div>
        </footer>
    {/if}

    <!-- ── CHAT SLIDE-IN PANEL ─────────────────────────────── -->
    {#if chatOpen}
        <div class="chat-panel">
            <div class="chat-panel-header">
                <span>💬 Chat</span>
                <button onclick={() => (chatOpen = false)}>✕</button>
            </div>
            <Chat messages={chatMessages} onSend={sendChat} username={me.username} />
        </div>
    {/if}
</div>

<style>
    .game-root {
        display: grid;
        grid-template-rows: 48px 1fr auto;
        height: 100vh;
        overflow: hidden;
        position: relative;
    }

    /* ── TOP BAR ── */
    .hud-top {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0 1rem;
        background: var(--surface);
        border-bottom: 1px solid #2a2a2a;
        z-index: 10;
    }
    .leave-btn {
        background: transparent;
        border: 1px solid #444;
        border-radius: var(--radius);
        color: var(--text-muted);
        cursor: pointer;
        padding: 4px 10px;
        font-size: 0.82rem;
        white-space: nowrap;
        transition:
            border-color 0.2s,
            color 0.2s;
    }
    .leave-btn:hover {
        border-color: var(--accent);
        color: var(--accent);
    }
    .table-name {
        font-size: 0.95rem;
        font-weight: 700;
        color: var(--accent2);
        white-space: nowrap;
    }
    .hud-center {
        flex: 1;
        display: flex;
        justify-content: center;
    }
    .hud-right {
        display: flex;
        align-items: center;
        gap: 0.6rem;
    }
    .chat-toggle {
        background: transparent;
        border: 1px solid #444;
        border-radius: var(--radius);
        color: var(--text-muted);
        cursor: pointer;
        padding: 4px 10px;
        font-size: 1rem;
        transition:
            border-color 0.2s,
            color 0.2s;
    }
    .chat-toggle:hover {
        border-color: var(--accent2);
        color: var(--accent2);
    }

    /* ── TABLE ── */
    .table-area {
        position: relative;
        background: var(--green-felt, #1a3d25);
        overflow: hidden;
    }
    .loading {
        color: var(--text-muted);
        text-align: center;
        margin-top: 3rem;
    }
    .start-game-btn {
        padding: 0.55rem 2rem;
        background: var(--accent2);
        color: #000;
        border: none;
        border-radius: var(--radius);
        font-weight: 700;
        font-size: 0.95rem;
        cursor: pointer;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
        align-self: center;
    }
    .start-game-btn:hover {
        background: color-mix(in srgb, var(--accent2) 85%, white);
    }

    /* ── ROUND RESULT OVERLAY ── */
    .round-result {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.92);
        border: 2px solid var(--accent2);
        border-radius: var(--radius);
        padding: 1.5rem 2rem;
        text-align: center;
        z-index: 50;
        min-width: 280px;
    }
    .round-result h3 {
        color: var(--accent2);
        margin-bottom: 0.75rem;
        font-size: 1.1rem;
    }
    .round-result p {
        color: var(--text-muted);
        font-size: 0.88rem;
    }

    /* ── BOTTOM HUD ── */
    .hud-bottom {
        background: rgba(8, 18, 12, 0.97);
        border-top: 1px solid #1e1e1e;
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 1.25rem;
        padding: 0.75rem 1.5rem;
        min-height: 96px;
    }
    .my-hand {
        display: flex;
        gap: 8px;
        align-items: center;
    }
    .no-cards-msg {
        font-size: 0.8rem;
        color: var(--text-muted);
        font-style: italic;
    }
    .bottom-mid {
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
        min-width: 0;
    }
    .my-info {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 3px;
    }
    .my-name {
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--accent2);
    }
    .my-chips {
        font-size: 0.82rem;
        color: #c8a84b;
    }
    .my-seat-label {
        font-size: 0.65rem;
        color: var(--text-muted);
        opacity: 0.5;
    }

    /* ── CHAT PANEL ── */
    .chat-panel {
        position: fixed;
        right: 0;
        top: 48px;
        bottom: 0;
        width: 300px;
        background: var(--surface);
        border-left: 1px solid #2a2a2a;
        display: flex;
        flex-direction: column;
        z-index: 100;
        box-shadow: -4px 0 20px rgba(0, 0, 0, 0.5);
    }
    .chat-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #2a2a2a;
        font-size: 0.88rem;
        color: var(--text-muted);
    }
    .chat-panel-header button {
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        font-size: 1rem;
        line-height: 1;
    }
    .chat-panel-header button:hover {
        color: var(--text);
    }
</style>
