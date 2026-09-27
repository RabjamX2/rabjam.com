import { createServerClient } from "@supabase/ssr";
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, SSR_API_URL as API } from "$lib/config";

export const handle = async ({ event, resolve }) => {
    event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
        cookies: {
            getAll: () => event.cookies.getAll(),
            setAll: (cookies) => {
                cookies.forEach(({ name, value, options }) =>
                    event.cookies.set(name, value, { ...options, path: "/" }),
                );
            },
        },
    });

    const {
        data: { session },
    } = await event.locals.supabase.auth.getSession();

    event.locals.session = session ?? null;

    if (session) {
        try {
            const res = await fetch(`${API}/api/users/check-auth`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            event.locals.user = res.ok ? (await res.json()).user : null;
        } catch {
            event.locals.user = null;
        }
    } else {
        event.locals.user = null;
    }

    return resolve(event, {
        filterSerializedResponseHeaders: (name) => name === "content-range" || name === "x-supabase-api-version",
    });
};
