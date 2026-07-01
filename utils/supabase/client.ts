import { createBrowserClient } from "@supabase/ssr";

// Browser Supabase client — used for sign-in and reading the current session.
// It uses the anon (public) key, which is safe to expose: it only grants what
// your Row Level Security policies allow, and privileged work stays server-side.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
