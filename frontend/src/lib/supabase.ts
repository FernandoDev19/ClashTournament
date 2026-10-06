import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if ((!url || !key) && process.env.NODE_ENV === "production") {
  throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
}

export const supabase =
  url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;