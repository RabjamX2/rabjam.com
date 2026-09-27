import { env } from "$env/dynamic/public";

export const PUBLIC_SUPABASE_URL =
    env.PUBLIC_SUPABASE_URL || "https://sdhhssolwwwxhdaktnlt.supabase.co";

export const PUBLIC_SUPABASE_PUBLISHABLE_KEY =
    env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_79oAnS8ZvkVxkhH1C0DGGQ_F79oQx2a";

/**
 * Client-side API URL (defaults to origin-relative string "")
 */
export const PUBLIC_API_URL = env.PUBLIC_API_URL || "";

/**
 * Server-side SSR API URL (defaults to local Express port http://127.0.0.1:3001)
 */
export const SSR_API_URL = env.PUBLIC_API_URL || "http://127.0.0.1:3001";
