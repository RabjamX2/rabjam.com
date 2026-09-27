<script>
    import Card from "$lib/components/Card.svelte";
    import TurnTimer from "$lib/components/TurnTimer.svelte";
    import Chat from "$lib/components/Chat.svelte";
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
    const isEveryoneSeen = $derived(
        gameState?.seatList?.filter(([, p]) => p && !p.handFolded).every(([, p]) => p.handSeen) ?? false,
    );

    let chatOpen = $state(false);

    const opponents = $derived(
        (gameState?.seatList ?? []).filter(([s, p]) => {
            if (s === mySeat) return false;
            if (gameState?.gameInProgress) return p !== null;
            return true;
        }),
    );

    // Raise slider state
    const minRaise = $derived((gameState?.currentBlindBetAmount ?? 2) * 2);
    const maxRaise = $derived(
        gameState?.maxBet > 0 ? Math.min(gameState.maxBet, myPlayer?.chips ?? 0) : (myPlayer?.chips ?? 0),
    );
    let raiseAmount = $state(0);
    $effect(() => {
        raiseAmount = minRaise;
    });
    const clampedRaise = $derived(Math.min(Math.max(raiseAmount, minRaise), maxRaise));

    const callAmount = $derived(
        handSeen ? (gameState?.currentBlindBetAmount ?? 2) * 2 : (gameState?.currentBlindBetAmount ?? 2),
    );
</script>

<div class="mobile-root">
    <!-- ── TOP BAR ── -->
    <header class="m-top">
        <button class="m-leave" onclick={leaveTable}>←</button>
        <span class="m-title">{data.table.name}</span>
        <div class="m-top-right">
            <button class="m-icon-btn" onclick={() => (chatOpen = !chatOpen)}>💬</button>
            <LayoutSwitcher />
        </div>
    </header>

    <!-- ── POT + BLINDS (centred) ── -->
    <div class="m-pot-strip">
        {#if gameState}
            <div class="m-pot-main">
                <span class="m-pot-label">POT</span>
                <span class="m-pot-value">{gameState.pot}</span>
            </div>
            <div class="m-bet-info">
                <span>Blind <strong>{gameState.currentBlindBetAmount}</strong></span>
                <span class="m-div">·</span>
                <span>Seen <strong>{gameState.currentSeenBetAmount}</strong></span>
                {#if gameState.maxBet > 0}
                    <span class="m-div">·</span>
                    <span>Max <strong>{gameState.maxBet}</strong></span>
                {/if}
            </div>
            {#if isMyTurn}
                <div class="m-timer-inline">
                    <TurnTimer duration={60} key={gameState?.currentPlayer?.seatNumber} />
                </div>
            {/if}
        {:else}
            <span class="m-connecting">Connecting…</span>
        {/if}
    </div>

    <!-- ── TABLE AREA (opponents, takes all spare vertical space) ── -->
    <div class="m-table-area">
        {#if roundResult}
            <div class="m-round-result">
                <strong>🏆 {roundResult.winners.join(", ")} won {roundResult.pot}!</strong>
                <span>{roundResult.reveals.map((r) => `${r.username}: ${r.handType}`).join(" · ")}</span>
            </div>
        {:else}
            <div class="m-opponents">
                {#each opponents as [seatNum, player]}
                    <div
                        class="opp"
                        class:opp-turn={seatNum === gameState?.currentPlayer?.seatNumber && !player?.handFolded}
                        class:opp-folded={player?.handFolded}
                    >
                        {#if player}
                            <span class="opp-name">{player.username}</span>
                            <div class="opp-cards">
                                {#if player.handFolded}
                                    <span class="opp-fold">FOLD</span>
                                {:else}
                                    {#each Array(player.handLength ?? 0) as _}
                                        <div class="mini-stub"></div>
                                    {/each}
                                {/if}
                            </div>
                            <div class="opp-bottom">
                                <span class="opp-chips">💰{player.chips}</span>
                                {#if player.handSeen && !player.handFolded}
                                    <span class="opp-seen">👁</span>
                                {/if}
                            </div>
                        {:else if !gameState?.gameInProgress}
                            <button class="opp-sit" onclick={() => sitDown(seatNum)}>
                                <span class="opp-sit-plus">+</span>
                                <span class="opp-sit-num">{seatNum}</span>
                            </button>
                        {/if}
                    </div>
                {/each}
                {#if opponents.length === 0}
                    <p class="m-empty">Waiting for players…</p>
                {/if}
            </div>
        {/if}
    </div>

    <!-- ── MY CARDS + INFO ── -->
    <div class="m-my-row">
        <div class="m-my-cards">
            {#if ownHand.length}
                {#each ownHand as card}
                    <Card rank={card.rank} suit={card.suit} faceDown={!handSeen} size="normal" />
                {/each}
            {:else if gameState?.gameInProgress && mySeat !== null}
                <Card faceDown size="normal" />
                <Card faceDown size="normal" />
                <Card faceDown size="normal" />
            {:else}
                <span class="m-no-cards">{mySeat !== null ? "Waiting for game…" : "Sit down to play"}</span>
            {/if}
        </div>
        {#if mySeat !== null}
            <div class="m-my-info">
                <span class="m-my-name">{me.username}</span>
                <span class="m-my-chips">💰 {myPlayer?.chips ?? 0}</span>
                <span class="m-my-seat">Seat {mySeat}</span>
            </div>
        {/if}
    </div>

    <!-- ── ACTION AREA ── -->
    <div class="m-action-area">
        {#if mySeat === null}
            <p class="m-status">Tap a seat on the table to join</p>
        {:else if !gameState?.gameInProgress}
            <button class="m-start-btn" onclick={startGame}>▶ Start Game</button>
        {:else if myPlayer?.handFolded}
            <p class="m-status">You folded this round.</p>
        {:else if !isMyTurn}
            <p class="m-status">Waiting for your turn…</p>
        {:else}
            <!-- Primary buttons -->
            <div class="m-btn-row">
                <button class="m-btn m-fold" onclick={() => sendAction("fold")}>Fold</button>
                <button
                    class="m-btn m-call"
                    disabled={(myPlayer?.chips ?? 0) < callAmount}
                    onclick={() => sendAction("call")}
                >
                    <span>{handSeen ? "Call (Seen)" : "Call (Blind)"}</span>
                    <strong>{callAmount}</strong>
                </button>
                {#if !handSeen}
                    <button class="m-btn m-see" disabled={myPlayer?.handSeenThisTurn} onclick={() => sendAction("see")}
                        >See 👁</button
                    >
                {/if}
                {#if isEveryoneSeen}
                    <button class="m-btn m-show" onclick={() => sendAction("endRound")}>Showdown 🃏</button>
                {/if}
            </div>
            <!-- Raise -->
            <div class="m-raise-row">
                <span class="m-raise-label">Raise</span>
                <input
                    type="range"
                    min={minRaise}
                    max={Math.max(minRaise, maxRaise)}
                    step={minRaise}
                    bind:value={raiseAmount}
                />
                <span class="m-raise-val">{clampedRaise}</span>
                <button
                    class="m-btn m-raise-btn"
                    disabled={(myPlayer?.chips ?? 0) < (handSeen ? clampedRaise * 2 : clampedRaise)}
                    onclick={() => sendAction("raise", clampedRaise)}>Raise</button
                >
            </div>
        {/if}
    </div>

    <!-- ── CHAT BOTTOM SHEET ── -->
    {#if chatOpen}
        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
        <div class="m-chat-overlay" onclick={() => (chatOpen = false)}></div>
        <div class="m-chat-sheet">
            <div class="m-chat-handle">
                <span>💬 Chat</span>
                <button onclick={() => (chatOpen = false)}>✕</button>
            </div>
            <Chat messages={chatMessages} onSend={sendChat} username={me.username} />
        </div>
    {/if}
</div>

<style>
    .mobile-root {
        display: grid;
        grid-template-rows: 48px auto 1fr auto auto;
        height: 100dvh;
        overflow: hidden;
        background: #0d1f14;
        position: relative;
    }

    /* ── TOP BAR ── */
    .m-top {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0 0.75rem;
        background: var(--surface);
        border-bottom: 1px solid #2a2a2a;
    }
    .m-leave {
        background: transparent;
        border: 1px solid #444;
        border-radius: var(--radius);
        color: var(--text-muted);
        cursor: pointer;
        padding: 6px 12px;
        font-size: 1rem;
        line-height: 1;
    }
    .m-title {
        flex: 1;
        font-weight: 700;
        font-size: 0.95rem;
        color: var(--accent2);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .m-top-right {
        display: flex;
        align-items: center;
        gap: 0.4rem;
    }
    .m-icon-btn {
        background: transparent;
        border: 1px solid #444;
        border-radius: var(--radius);
        color: var(--text-muted);
        cursor: pointer;
        padding: 5px 9px;
        font-size: 0.95rem;
        line-height: 1;
    }

    /* ── POT STRIP ── */
    .m-pot-strip {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 0.55rem 1rem 0.5rem;
        background: rgba(0, 0, 0, 0.5);
        border-bottom: 1px solid #1b3a25;
        gap: 0.18rem;
        flex-shrink: 0;
    }
    .m-pot-main {
        display: flex;
        align-items: baseline;
        gap: 0.45rem;
    }
    .m-pot-label {
        font-size: 0.62rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--text-muted);
    }
    .m-pot-value {
        font-size: 1.65rem;
        font-weight: 800;
        color: var(--accent2);
        line-height: 1;
    }
    .m-bet-info {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.73rem;
        color: var(--text-muted);
    }
    .m-bet-info strong {
        color: var(--text);
    }
    .m-div {
        opacity: 0.35;
    }
    .m-timer-inline {
        margin-top: 0.2rem;
    }
    .m-connecting {
        font-size: 0.82rem;
        color: var(--text-muted);
        font-style: italic;
    }

    /* ── TABLE AREA ── */
    .m-table-area {
        background: radial-gradient(ellipse at center, #2d7a52 40%, #1b4d33 75%, #123626 100%);
        overflow: hidden;
        position: relative;
    }
    .m-round-result {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        gap: 0.5rem;
        padding: 1rem;
        text-align: center;
    }
    .m-round-result strong {
        color: var(--accent2);
        font-size: 1.1rem;
    }
    .m-round-result span {
        font-size: 0.8rem;
        color: var(--text-muted);
    }

    .m-opponents {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
        padding: 0.6rem;
        height: 100%;
        align-content: flex-start;
        overflow-y: auto;
        scrollbar-width: none;
    }
    .m-empty {
        color: rgba(255, 255, 255, 0.3);
        font-size: 0.8rem;
        width: 100%;
        text-align: center;
        padding: 1rem;
    }

    /* Opponent tile */
    .opp {
        flex: 1 1 calc(33% - 0.45rem);
        max-width: 120px;
        min-width: 72px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid #2a5c3a;
        border-radius: 8px;
        padding: 0.5rem 0.35rem;
        transition:
            border-color 0.2s,
            box-shadow 0.2s;
    }
    .opp.opp-turn {
        border-color: #c8a84b;
        box-shadow: 0 0 12px rgba(200, 168, 75, 0.5);
    }
    .opp.opp-folded {
        opacity: 0.35;
    }
    .opp-name {
        font-size: 0.68rem;
        font-weight: 600;
        color: var(--text);
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .opp-cards {
        display: flex;
        gap: 3px;
        justify-content: center;
        align-items: center;
        flex: 1;
    }
    .mini-stub {
        width: 18px;
        height: 26px;
        background: linear-gradient(135deg, #1a3060 60%, #0e1e40);
        border: 1px solid #3a5080;
        border-radius: 3px;
    }
    .opp-fold {
        font-size: 0.58rem;
        color: var(--text-muted);
    }
    .opp-bottom {
        display: flex;
        align-items: center;
        gap: 4px;
    }
    .opp-chips {
        font-size: 0.62rem;
        color: #c8a84b;
    }
    .opp-seen {
        font-size: 0.58rem;
        background: rgba(34, 197, 94, 0.15);
        color: #22c55e;
        border-radius: 3px;
        padding: 1px 3px;
    }
    .opp-sit {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: none;
        border: 1px dashed #2d7a52;
        border-radius: 6px;
        color: #2d7a52;
        cursor: pointer;
        width: 100%;
        min-height: 60px;
        height: 100%;
        justify-content: center;
        gap: 2px;
        transition:
            border-color 0.2s,
            color 0.2s;
    }
    .opp-sit:hover {
        border-color: var(--accent2);
        color: var(--accent2);
    }
    .opp-sit-plus {
        font-size: 1.15rem;
    }
    .opp-sit-num {
        font-size: 0.58rem;
        opacity: 0.7;
    }

    /* ── MY CARDS ROW ── */
    .m-my-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.55rem 1rem;
        background: rgba(8, 18, 12, 0.97);
        border-top: 2px solid #1b4d33;
        gap: 0.75rem;
        flex-shrink: 0;
    }
    .m-my-cards {
        display: flex;
        gap: 8px;
        align-items: center;
    }
    .m-no-cards {
        font-size: 0.75rem;
        color: var(--text-muted);
        font-style: italic;
    }
    .m-my-info {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;
    }
    .m-my-name {
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--accent2);
    }
    .m-my-chips {
        font-size: 0.8rem;
        color: #c8a84b;
    }
    .m-my-seat {
        font-size: 0.65rem;
        color: var(--text-muted);
        opacity: 0.6;
    }

    /* ── ACTION AREA ── */
    .m-action-area {
        background: #09160e;
        border-top: 1px solid #1e3a28;
        padding: 0.6rem 0.7rem 0.7rem;
        flex-shrink: 0;
    }
    .m-status {
        font-size: 0.85rem;
        color: var(--text-muted);
        font-style: italic;
        text-align: center;
        margin: 0.3rem 0;
    }
    .m-start-btn {
        width: 100%;
        padding: 0.85rem;
        background: var(--accent2);
        color: #000;
        border: none;
        border-radius: var(--radius);
        font-weight: 700;
        font-size: 1.05rem;
        cursor: pointer;
    }
    .m-start-btn:hover {
        background: color-mix(in srgb, var(--accent2) 85%, white);
    }

    .m-btn-row {
        display: grid;
        grid-template-columns: 1fr 2fr 1fr;
        gap: 0.4rem;
        margin-bottom: 0.45rem;
    }
    .m-btn {
        padding: 0.72rem 0.35rem;
        font-size: 0.85rem;
        font-weight: 700;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        touch-action: manipulation;
        transition:
            filter 0.12s,
            transform 0.1s;
        white-space: nowrap;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1px;
    }
    .m-btn:not(:disabled):active {
        transform: scale(0.96);
    }
    .m-btn:disabled {
        opacity: 0.28;
        cursor: not-allowed;
    }
    .m-fold {
        background: #b03030;
        color: #fff;
    }
    .m-call {
        background: #27943f;
        color: #fff;
    }
    .m-call strong {
        font-size: 1rem;
    }
    .m-see {
        background: #2471a3;
        color: #fff;
    }
    .m-show {
        background: var(--accent2, #d4af37);
        color: #000;
    }

    .m-raise-row {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        background: rgba(255, 255, 255, 0.04);
        border-radius: 8px;
        padding: 0.45rem 0.6rem;
    }
    .m-raise-label {
        font-size: 0.72rem;
        color: var(--text-muted);
        white-space: nowrap;
        flex-shrink: 0;
    }
    .m-raise-row input[type="range"] {
        flex: 1;
        accent-color: var(--accent);
        min-width: 0;
    }
    .m-raise-val {
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--accent);
        min-width: 28px;
        text-align: right;
        flex-shrink: 0;
    }
    .m-raise-btn {
        background: #8b4513;
        color: #fff;
        padding: 0.45rem 0.75rem;
        font-size: 0.8rem;
        border-radius: 6px;
        flex-shrink: 0;
    }

    /* ── CHAT SHEET ── */
    .m-chat-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 150;
    }
    .m-chat-sheet {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        height: 62dvh;
        background: var(--surface);
        border-top: 1px solid #333;
        border-radius: 14px 14px 0 0;
        display: flex;
        flex-direction: column;
        z-index: 151;
        box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.6);
    }
    .m-chat-handle {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #2a2a2a;
        font-size: 0.88rem;
        color: var(--text-muted);
    }
    .m-chat-handle button {
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        font-size: 1rem;
    }
</style>
