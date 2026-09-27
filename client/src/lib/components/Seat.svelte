<script>
    import Card from "./Card.svelte";

    let { player, seatNumber, isMyself, gameInProgress, isCurrentTurn, onSitDown } = $props();
</script>

<div
    class="seat"
    class:occupied={!!player}
    class:myself={isMyself}
    class:folded={player?.handFolded}
    class:current-turn={isCurrentTurn && !player?.handFolded}
    class:seen={player?.handSeen && !player?.handFolded && !isMyself}
>
    {#if player}
        <!-- Player name + chips -->
        <div class="player-info">
            <span class="username">
                {player.username}
                {#if isMyself}<span class="you-tag">YOU</span>{/if}
            </span>
            <span class="chips">💰 {player.chips}</span>
        </div>

        <!-- Cards / status -->
        {#if isMyself}
            <!-- My seat: just show stubs so position is visible; real cards are in the bottom bar -->
            {#if player.handFolded}
                <span class="status-label fold">FOLDED</span>
            {:else if gameInProgress}
                <div class="card-stubs">
                    <div class="stub"></div>
                    <div class="stub"></div>
                    <div class="stub"></div>
                </div>
            {/if}
        {:else}
            <!-- Other players' cards -->
            {#if player.handFolded}
                <span class="status-label fold">FOLDED</span>
            {:else}
                <div class="hand" class:glowing={player.handSeen}>
                    {#each Array(player.handLength ?? 0) as _}
                        <Card faceDown size="small" />
                    {/each}
                </div>
                <!-- Seen indicator badge -->
                {#if player.handSeen}
                    <div class="seen-badge" title="Has seen their cards">
                        <span class="seen-eye">👁</span>
                        <span class="seen-text">SEEN</span>
                    </div>
                {/if}
            {/if}
        {/if}
    {:else if !gameInProgress}
        <button class="sit-btn" onclick={() => onSitDown(seatNumber)}>
            <span class="sit-icon">+</span>
            <span class="sit-label">Seat {seatNumber}</span>
        </button>
    {:else}
        <span class="empty-label">—</span>
    {/if}

    <!-- Pulsing ring for the player whose turn it is -->
    {#if isCurrentTurn && !player?.handFolded}
        <div class="turn-ring"></div>
    {/if}
</div>

<style>
    .seat {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        min-width: 88px;
    }

    /* ── Player info ── */
    .player-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
    }
    .username {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.74rem;
        font-weight: 700;
        color: #fff;
        background: rgba(0, 0, 0, 0.7);
        padding: 2px 8px;
        border-radius: 20px;
        white-space: nowrap;
        max-width: 104px;
        overflow: hidden;
        text-overflow: ellipsis;
        backdrop-filter: blur(4px);
    }
    .myself .username {
        color: var(--accent2);
    }
    .you-tag {
        font-size: 0.58rem;
        font-weight: 800;
        background: var(--accent2);
        color: #000;
        padding: 0 4px;
        border-radius: 4px;
        letter-spacing: 0.5px;
        flex-shrink: 0;
    }
    .chips {
        font-size: 0.67rem;
        color: #c8a84b;
        font-weight: 600;
    }
    .seen .chips {
        color: #4caf50;
    }

    /* ── Cards ── */
    .hand {
        display: flex;
        gap: 3px;
        align-items: center;
        padding: 3px 5px;
        border-radius: 7px;
        transition: box-shadow 0.4s;
    }
    .hand.glowing {
        box-shadow: 0 0 12px 3px rgba(76, 175, 80, 0.55);
    }

    /* ── Seen badge ── */
    .seen-badge {
        display: flex;
        align-items: center;
        gap: 3px;
        background: rgba(76, 175, 80, 0.18);
        border: 1px solid rgba(76, 175, 80, 0.5);
        border-radius: 10px;
        padding: 1px 6px;
        margin-top: 1px;
    }
    .seen-eye {
        font-size: 0.7rem;
        filter: drop-shadow(0 0 3px #4caf50);
    }
    .seen-text {
        font-size: 0.6rem;
        font-weight: 800;
        color: #4caf50;
        letter-spacing: 0.5px;
    }

    /* ── Card stubs for myself ── */
    .card-stubs {
        display: flex;
        gap: 3px;
    }
    .stub {
        width: 20px;
        height: 28px;
        border-radius: 3px;
        background: linear-gradient(135deg, #1e4d7a 0%, #0f2740 100%);
        border: 1px solid rgba(255, 255, 255, 0.12);
        opacity: 0.7;
    }

    /* ── Status labels ── */
    .status-label {
        font-size: 0.62rem;
        font-weight: 800;
        letter-spacing: 1px;
        padding: 2px 7px;
        border-radius: 4px;
    }
    .status-label.fold {
        color: #666;
        background: rgba(0, 0, 0, 0.45);
        text-decoration: line-through;
    }

    /* ── Sit button ── */
    .sit-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px dashed rgba(255, 255, 255, 0.18);
        border-radius: 10px;
        color: rgba(255, 255, 255, 0.38);
        cursor: pointer;
        padding: 10px 16px;
        transition:
            background 0.2s,
            border-color 0.2s,
            color 0.2s;
        min-width: 72px;
    }
    .sit-btn:hover {
        background: rgba(255, 255, 255, 0.13);
        border-color: var(--accent2);
        color: var(--accent2);
    }
    .sit-icon {
        font-size: 1.1rem;
        line-height: 1;
        font-weight: 300;
    }
    .sit-label {
        font-size: 0.62rem;
        opacity: 0.7;
    }
    .empty-label {
        color: rgba(255, 255, 255, 0.12);
        font-size: 0.72rem;
    }

    /* ── Turn ring ── */
    .turn-ring {
        position: absolute;
        inset: -8px;
        border-radius: 14px;
        border: 2px solid var(--accent2);
        animation: pulse-ring 1.4s ease-in-out infinite;
        pointer-events: none;
    }
    @keyframes pulse-ring {
        0%,
        100% {
            opacity: 1;
            box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.55);
        }
        50% {
            opacity: 0.6;
            box-shadow: 0 0 0 8px rgba(212, 175, 55, 0);
        }
    }

    /* ── State modifiers ── */
    .folded .player-info {
        opacity: 0.38;
    }
    .folded .hand {
        opacity: 0.3;
    }
    .current-turn .username {
        text-shadow: 0 0 10px rgba(212, 175, 55, 0.7);
        box-shadow: 0 0 10px rgba(212, 175, 55, 0.25);
    }
</style>
