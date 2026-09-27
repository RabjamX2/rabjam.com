<script>
    let { table } = $props();
</script>

{#if table.spectators.length > 0}
    <div class="spectators">
        <span class="label">👁 Watching:</span>
        <span class="names">{table.spectators.join(", ")}</span>
    </div>
{/if}

<style>
    .spectators {
        font-size: 0.78rem;
        color: var(--text-muted);
        border-top: 1px solid #333;
        padding-top: 0.4rem;
    }
    .label {
        font-weight: 600;
        margin-right: 4px;
    }
</style>
