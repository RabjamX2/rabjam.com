<script>
    // Card ranks 1=A, 2-10, 11=J, 12=Q, 13=K
    let { rank, suit, faceDown = false, size = "normal" } = $props();

    const RANK_LABELS = {
        1: "A",
        11: "J",
        12: "Q",
        13: "K",
    };
    const SUIT_SYMBOLS = {
        spades: "♠",
        hearts: "♥",
        diamonds: "♦",
        clubs: "♣",
    };
    const RED_SUITS = new Set(["hearts", "diamonds"]);

    const label = $derived(rank ? (RANK_LABELS[rank] ?? String(rank)) : "");
    const symbol = $derived(suit ? (SUIT_SYMBOLS[suit] ?? suit) : "");
    const isRed = $derived(suit ? RED_SUITS.has(suit) : false);
</script>

<div class="card {size}" class:face-down={faceDown} class:red={isRed}>
    {#if faceDown}
        <div class="card-back"></div>
    {:else}
        <span class="corner top">{label}<br />{symbol}</span>
        <span class="pip center">{symbol}</span>
        <span class="corner bottom">{label}<br />{symbol}</span>
    {/if}
</div>

<style>
    .card {
        width: 56px;
        height: 80px;
        border-radius: 6px;
        background: #fff;
        border: 1px solid #ddd;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        user-select: none;
        box-shadow: 1px 2px 6px rgba(0, 0, 0, 0.35);
        font-family: "Georgia", serif;
    }
    .card.small {
        width: 40px;
        height: 58px;
        font-size: 0.65rem;
    }
    .card.large {
        width: 72px;
        height: 104px;
        font-size: 1.1rem;
    }

    .card.red {
        color: #cc0000;
    }
    .card:not(.red) {
        color: #111;
    }

    .card-back {
        width: 100%;
        height: 100%;
        border-radius: 6px;
        background: repeating-linear-gradient(45deg, #1a237e, #1a237e 4px, #283593 4px, #283593 8px);
    }

    .corner {
        position: absolute;
        font-size: 0.75rem;
        font-weight: 700;
        line-height: 1.1;
        text-align: center;
    }
    .corner.top {
        top: 3px;
        left: 4px;
    }
    .corner.bottom {
        bottom: 3px;
        right: 4px;
        transform: rotate(180deg);
    }
    .pip.center {
        font-size: 1.5rem;
        line-height: 1;
    }
    .card.small .pip.center {
        font-size: 1.1rem;
    }
    .card.large .pip.center {
        font-size: 2rem;
    }
</style>
