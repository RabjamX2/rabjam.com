<script>
    import { uiMode, LAYOUTS } from "$lib/stores/uiMode.svelte.js";

    let open = $state(false);
</script>

<div class="switcher">
    <button class="switcher-btn" onclick={() => (open = !open)} title="Switch layout">⚙️</button>
    {#if open}
        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
        <div class="overlay" onclick={() => (open = false)}></div>
        <div class="switcher-menu">
            <p class="menu-label">UI Layout</p>
            {#each LAYOUTS as layout}
                <button
                    class="menu-item"
                    class:active={uiMode.value === layout.id}
                    onclick={() => {
                        uiMode.set(layout.id);
                        open = false;
                    }}
                >
                    <span>{layout.label}</span>
                    <small>{layout.desc}</small>
                </button>
            {/each}
        </div>
    {/if}
</div>

<style>
    .switcher {
        position: relative;
    }
    .switcher-btn {
        background: transparent;
        border: 1px solid #444;
        border-radius: var(--radius);
        color: var(--text-muted);
        cursor: pointer;
        padding: 4px 8px;
        font-size: 0.9rem;
        line-height: 1;
        transition:
            border-color 0.2s,
            color 0.2s;
    }
    .switcher-btn:hover {
        border-color: var(--accent2);
        color: var(--accent2);
    }
    .overlay {
        position: fixed;
        inset: 0;
        z-index: 199;
    }
    .switcher-menu {
        position: absolute;
        right: 0;
        top: calc(100% + 6px);
        background: var(--surface);
        border: 1px solid #333;
        border-radius: var(--radius);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        min-width: 160px;
        z-index: 200;
        overflow: hidden;
    }
    .menu-label {
        font-size: 0.7rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 0.5rem 0.75rem 0.25rem;
        margin: 0;
    }
    .menu-item {
        display: flex;
        flex-direction: column;
        width: 100%;
        text-align: left;
        background: none;
        border: none;
        padding: 0.5rem 0.75rem;
        cursor: pointer;
        color: var(--text);
        transition: background 0.15s;
    }
    .menu-item:hover {
        background: rgba(255, 255, 255, 0.06);
    }
    .menu-item.active {
        color: var(--accent2);
    }
    .menu-item small {
        font-size: 0.7rem;
        color: var(--text-muted);
        margin-top: 1px;
    }
</style>
