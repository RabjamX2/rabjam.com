<script>
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";

    let { data } = $props();

    // The game's static files live at /games/<slug>/index.html
    const gameUrl = `/games/${data.slug}/index.html`;

    onMount(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    });
</script>

<svelte:head>
    <title>Playing — {data.slug}</title>
</svelte:head>

<div class="game-shell">
    <header class="game-bar">
        <button class="back-btn" onclick={() => goto("/portfolio")}>← Portfolio</button>
        <span class="game-title">{data.slug.replace(/-/g, " ")}</span>
        <a class="fullscreen-link" href={gameUrl} target="_blank" rel="noopener" title="Open full screen">⛶</a>
    </header>
    <iframe class="game-frame" src={gameUrl} title={data.slug} allowfullscreen></iframe>
</div>

<style>
    .game-shell {
        display: grid;
        grid-template-rows: 44px 1fr;
        height: 100dvh;
        background: #000;
    }

    .game-bar {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0 0.9rem;
        background: var(--surface);
        border-bottom: 1px solid #2a2a2a;
    }

    .back-btn {
        background: transparent;
        border: 1px solid #444;
        border-radius: var(--radius);
        color: var(--text-muted);
        padding: 5px 12px;
        font-size: 0.85rem;
        font-weight: 500;
        cursor: pointer;
        white-space: nowrap;
    }
    .back-btn:hover {
        border-color: var(--accent);
        color: var(--text);
    }

    .game-title {
        flex: 1;
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--accent2);
        text-transform: capitalize;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .fullscreen-link {
        color: var(--text-muted);
        font-size: 1.1rem;
        text-decoration: none;
        line-height: 1;
        padding: 4px 6px;
        border-radius: 4px;
        transition: color 0.15s;
    }
    .fullscreen-link:hover {
        color: var(--text);
    }

    .game-frame {
        width: 100%;
        height: 100%;
        border: none;
        display: block;
    }
</style>
