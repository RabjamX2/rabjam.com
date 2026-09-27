<script>
    let {
        isMyTurn,
        handSeen,
        folded,
        seenThisTurn,
        isEveryoneSeen,
        currentBlind,
        myChips,
        maxBet = 0,
        onAction,
    } = $props();

    const callAmount = $derived(handSeen ? currentBlind * 2 : currentBlind);
    const minRaise = $derived(currentBlind * 2);
    const maxRaise = $derived(maxBet > 0 ? Math.min(maxBet, myChips) : myChips);

    let raiseAmount = $state(0);
    $effect(() => {
        // Reset slider to minimum when the blind level changes (someone raised)
        raiseAmount = minRaise;
    });
    // Always display/submit a value clamped between min and max
    const clampedRaise = $derived(Math.min(Math.max(raiseAmount, minRaise), maxRaise));
</script>

{#if folded}
    <p class="status-msg">You folded this round.</p>
{:else if !isMyTurn}
    <p class="status-msg">Waiting for your turn…</p>
{:else}
    <div class="actions">
        <!-- Primary action buttons -->
        <div class="btn-row">
            <button class="btn fold" onclick={() => onAction("fold")}>Fold</button>

            <button class="btn call" disabled={myChips < callAmount} onclick={() => onAction("call")}>
                {handSeen ? "Call (Seen)" : "Call (Blind)"} · <strong>{callAmount}</strong>
            </button>

            {#if !handSeen}
                <button
                    class="btn see"
                    disabled={seenThisTurn}
                    onclick={() => onAction("see")}
                    title="Look at your cards (costs nothing, but doubles your bet)"
                >
                    See Cards 👁
                </button>
            {/if}

            {#if isEveryoneSeen}
                <button class="btn show" onclick={() => onAction("endRound")}> Showdown 🃏 </button>
            {/if}
        </div>

        <!-- Raise row -->
        <div class="raise-row">
            <span class="raise-label">Raise to:</span>
            <input
                type="range"
                min={minRaise}
                max={Math.max(minRaise, maxRaise)}
                step={minRaise}
                bind:value={raiseAmount}
            />
            <span class="raise-val">{clampedRaise}</span>
            <button
                class="btn raise"
                disabled={myChips < (handSeen ? clampedRaise * 2 : clampedRaise)}
                onclick={() => onAction("raise", clampedRaise)}
            >
                Raise → {clampedRaise}
            </button>
        </div>
    </div>
{/if}

<style>
    .status-msg {
        font-size: 0.82rem;
        color: var(--text-muted);
        font-style: italic;
        margin: 0;
    }

    .actions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .btn-row {
        display: flex;
        gap: 0.45rem;
        flex-wrap: wrap;
        align-items: center;
    }

    .raise-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    .raise-label {
        font-size: 0.75rem;
        color: var(--text-muted);
        white-space: nowrap;
    }
    .raise-val {
        font-size: 0.78rem;
        font-weight: 700;
        color: var(--accent);
        min-width: 28px;
        text-align: right;
    }
    input[type="range"] {
        flex: 1;
        accent-color: var(--accent);
        min-width: 60px;
    }

    .btn {
        padding: 0.48rem 1.1rem;
        font-size: 0.85rem;
        font-weight: 700;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition:
            filter 0.15s,
            transform 0.1s;
        white-space: nowrap;
    }
    .btn:not(:disabled):hover {
        filter: brightness(1.18);
    }
    .btn:not(:disabled):active {
        transform: scale(0.97);
    }
    .btn:disabled {
        opacity: 0.28;
        cursor: not-allowed;
    }

    .fold {
        background: #b03030;
        color: #fff;
    }
    .call {
        background: #27943f;
        color: #fff;
    }
    .see {
        background: #2471a3;
        color: #fff;
    }
    .show {
        background: var(--accent2, #d4af37);
        color: #000;
    }
    .raise {
        background: var(--accent, #e94560);
        color: #fff;
    }
</style>
