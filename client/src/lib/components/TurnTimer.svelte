<script>
    let { duration, key } = $props();

    let remaining = $state(duration);
    let interval;

    function reset() {
        clearInterval(interval);
        remaining = duration;
        interval = setInterval(() => {
            remaining -= 1;
            if (remaining <= 0) clearInterval(interval);
        }, 1000);
    }

    $effect(() => {
        // Re-run whenever key changes (new turn)
        key; // consume dependency
        reset();
        return () => clearInterval(interval);
    });

    const pct = $derived((remaining / duration) * 100);
    const urgent = $derived(remaining <= 10);
</script>

<div class="timer" class:urgent>
    <div class="bar" style="width: {pct}%;"></div>
    <span class="label">{remaining}s</span>
</div>

<style>
    .timer {
        position: relative;
        height: 20px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        overflow: hidden;
    }
    .bar {
        height: 100%;
        background: var(--accent2);
        border-radius: 10px;
        transition:
            width 1s linear,
            background 0.3s;
    }
    .urgent .bar {
        background: var(--accent);
    }
    .label {
        position: absolute;
        right: 6px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 0.72rem;
        color: #fff;
        font-weight: 600;
    }
</style>
