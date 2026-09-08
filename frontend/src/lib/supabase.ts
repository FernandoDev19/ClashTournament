import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

// For server-side routes: prefer the service role key (bypasses RLS).
// Falls back to the anon/publishable key if no service role key is present.
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "[Supabase] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — using JSON file fallback"
  );
} else {
  const keyType = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? "service_role"
    : "anon";
  console.info(`[Supabase] Connected — using ${keyType} key`);
}

export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      })
    : null;
