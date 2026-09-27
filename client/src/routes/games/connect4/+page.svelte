<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import Board from "./components/Board.svelte";

    // ── Views: "select" | "game" ─────────────────────────────────────
    let view = $state("select");

    onMount(() => {
        document.body.style.overflow = "hidden";
        if (new URLSearchParams(location.search).get("cpu") !== null) {
            view = "game";
        }
        return () => {
            document.body.style.overflow = "";
        };
    });
</script>

<svelte:head>
    <title>Connect 4</title>
</svelte:head>

<div class="shell">
    <header class="bar">
        {#if view === "select"}
            <button class="back-btn" onclick={() => goto("/portfolio")}>← Portfolio</button>
        {:else}
            <button
                class="back-btn"
                onclick={() => {
                    view = "select";
                }}>← Back</button
            >
        {/if}
        <span class="title">Connect 4</span>
        <span></span>
    </header>

    <main class="content">
        <!-- ── Mode selection ───────────────────────────────────────── -->
        {#if view === "select"}
            <div class="lobby-card">
                <h2 class="lobby-heading">Choose Mode</h2>
                <div class="mode-grid">
                    <button
                        class="mode-btn"
                        onclick={() => {
                            view = "game";
                        }}
                    >
                        <span class="mode-icon">🤖</span>
                        <span class="mode-label">vs CPU</span>
                        <span class="mode-sub">Easy · Medium · Hard</span>
                    </button>
                    <button class="mode-btn" onclick={() => goto("/multiplayer")}>
                        <span class="mode-icon">🌐</span>
                        <span class="mode-label">vs Human</span>
                        <span class="mode-sub">Online · Room link</span>
                    </button>
                </div>
            </div>
        {:else if view === "game"}
            <Board multiplayerState={null} />
        {/if}
    </main>
</div>

<style>
    .shell {
        display: grid;
        grid-template-rows: 44px 1fr;
        height: 100dvh;
        background: #1e1e1e;
        overflow: hidden;
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    }

    /* ── Header bar ──────────────────────────────────── */
    .bar {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        padding: 0 0.9rem;
        background: #141414;
        border-bottom: 1px solid #2a2a2a;
    }
    .title {
        font-size: 0.9rem;
        font-weight: 600;
        color: #eeff00;
        text-shadow: 0 0 16px rgba(238, 255, 0, 0.3);
        white-space: nowrap;
    }
    .back-btn {
        background: transparent;
        border: 1px solid #444;
        border-radius: 999px;
        color: #888;
        padding: 5px 12px;
        font-size: 0.82rem;
        font-weight: 500;
        cursor: pointer;
        white-space: nowrap;
        transition:
            border-color 0.15s,
            color 0.15s;
        justify-self: start;
    }
    .back-btn:hover {
        border-color: #eeff00;
        color: #fff;
    }

    /* ── Content area ────────────────────────────────── */
    .content {
        overflow: auto;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding: 2rem 1rem;
        background: #2d2d2d;
    }

    /* ── Lobby card ──────────────────────────────────── */
    .lobby-card {
        background: #1e1e1e;
        border: 1px solid #3a3a3a;
        border-radius: 12px;
        padding: 2rem 2.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
        max-width: 380px;
    }
    .lobby-heading {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 700;
        color: #eeff00;
        text-align: center;
    }

    /* ── Mode selection ──────────────────────────────── */
    .mode-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
    }
    .mode-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.35rem;
        padding: 1.2rem 0.75rem;
        background: #2a2a2a;
        border: 1px solid #3a3a3a;
        border-radius: 10px;
        cursor: pointer;
        transition:
            border-color 0.15s,
            background 0.15s;
    }
    .mode-btn:hover {
        border-color: #eeff00;
        background: #252525;
    }
    .mode-icon {
        font-size: 1.75rem;
    }
    .mode-label {
        font-size: 0.9rem;
        font-weight: 600;
        color: #e0e0e0;
    }
    .mode-sub {
        font-size: 0.72rem;
        color: #888;
    }
</style>
