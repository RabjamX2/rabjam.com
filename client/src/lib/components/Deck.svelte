<script>
    import Card from "./Card.svelte";
    let { deckLength } = $props();
    const visible = $derived(Math.min(deckLength, 5));
</script>

<div class="deck-wrap">
    <div class="deck">
        {#each Array(visible) as _, i}
            <div class="card-layer" style="top: {-i * 2}px; left: {i * 1}px;">
                <Card faceDown size="small" />
            </div>
        {/each}
    </div>
    <span class="count">{deckLength}</span>
</div>

<style>
    .deck-wrap {
        position: absolute;
        bottom: 1rem;
        right: 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
    }
    .deck {
        position: relative;
        width: 40px;
        height: 60px;
    }
    .card-layer {
        position: absolute;
    }
    .count {
        font-size: 0.72rem;
        color: rgba(255, 255, 255, 0.5);
    }
</style>
