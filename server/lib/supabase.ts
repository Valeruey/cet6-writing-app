import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        "SUPABASE_URL/SUPABASE_ANON_KEY not set — ensure it's configured in Vercel environment variables"
      );
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set — ensure it's configured in Vercel environment variables"
      );
    }
    _supabaseAdmin = createClient(url, key);
  }
  return _supabaseAdmin;
}

// Lazy proxies that forward all property access to the underlying client
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop: string) {
    const client = getSupabase();
    const val = (client as any)[prop];
    return typeof val === "function" ? val.bind(client) : val;
  },
});

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop: string) {
    const client = getSupabaseAdmin();
    const val = (client as any)[prop];
    return typeof val === "function" ? val.bind(client) : val;
  },
});
