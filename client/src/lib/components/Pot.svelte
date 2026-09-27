<script>
    let { pot, blind, seenBet } = $props();
</script>

<div class="pot">
    <div class="pot-value">💰 Pot: <strong>{pot}</strong></div>
    <div class="bets">
        <span>Blind: {blind}</span>
        <span>Seen: {seenBet}</span>
    </div>
</div>

<style>
    .pot {
        background: rgba(0, 0, 0, 0.3);
        border-radius: var(--radius);
        padding: 0.6rem 0.8rem;
    }
    .pot-value {
        font-size: 1.05rem;
        color: var(--accent2);
        margin-bottom: 4px;
    }
    .bets {
        display: flex;
        gap: 1rem;
        font-size: 0.8rem;
        color: var(--text-muted);
    }
</style>
