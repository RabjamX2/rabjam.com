<script>
    import { tick } from "svelte";

    let { messages, onSend, username } = $props();

    let input = $state("");
    let listEl;

    $effect(() => {
        // Scroll to bottom when messages change
        if (messages.length && listEl) {
            tick().then(() => {
                listEl.scrollTop = listEl.scrollHeight;
            });
        }
    });

    function submit() {
        const msg = input.trim();
        if (!msg) return;
        onSend(msg);
        input = "";
    }
</script>

<div class="chat">
    <div class="chat-header">💬 Chat</div>
    <div class="messages" bind:this={listEl}>
        {#each messages as msg (msg.timestamp + msg.username)}
            <div class="msg" class:own={msg.username === username}>
                <span class="name">{msg.username}</span>
                <span class="text">{msg.message}</span>
            </div>
        {/each}
    </div>
    <div class="input-row">
        <input
            bind:value={input}
            placeholder="Message…"
            maxlength="500"
            onkeydown={(e) => e.key === "Enter" && submit()}
        />
        <button class="btn-secondary" onclick={submit} disabled={!input.trim()}>→</button>
    </div>
</div>

<style>
    .chat {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        border-top: 1px solid #333;
        padding-top: 0.5rem;
    }
    .chat-header {
        font-size: 0.8rem;
        color: var(--text-muted);
        margin-bottom: 4px;
    }
    .messages {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 0.8rem;
        min-height: 80px;
        max-height: 180px;
    }
    .msg {
        display: flex;
        gap: 5px;
        align-items: baseline;
    }
    .name {
        color: var(--accent2);
        font-weight: 600;
        white-space: nowrap;
    }
    .text {
        color: var(--text);
        word-break: break-word;
    }
    .msg.own .name {
        color: var(--accent);
    }
    .input-row {
        display: flex;
        gap: 4px;
        margin-top: 4px;
    }
    .input-row input {
        flex: 1;
        font-size: 0.8rem;
        padding: 0.3rem 0.5rem;
    }
    .input-row button {
        padding: 0.3rem 0.6rem;
        font-size: 0.85rem;
    }
</style>
