<script>
    import "../app.css";
    import { setContext } from "svelte";
    import { writable } from "svelte/store";
    import { createSupabaseBrowserClient } from "$lib/supabaseClient.js";
    import { invalidateAll } from "$app/navigation";

    let { data, children } = $props();

    const supabase = createSupabaseBrowserClient();

    const userStore = writable(data.user);
    $effect(() => {
        userStore.set(data.user);
    });

    setContext("user", userStore);
    setContext("supabase", supabase);

    $effect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            // Re-run all server load functions when auth state changes
            if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
                invalidateAll();
            }
        });
        return () => subscription.unsubscribe();
    });
</script>

{@render children()}
