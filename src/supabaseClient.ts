import { createClient } from "@supabase/supabase-js";

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

// pomembno: supabase client mora obstajati, da TS build ne pade
// fallback vrednosti so "dummy" in se ne uporabljajo, če SUPABASE_READY = false
export const SUPABASE_READY = Boolean(url && anon);

export const SUPABASE_ENV = {
  urlPresent: Boolean(url),
  anonPresent: Boolean(anon),
  origin: typeof window !== "undefined" ? window.location.origin : "",
  urlHint: url ? `${url.slice(0, 18)}…` : "",
};

export const supabase = createClient(
  url || "https://example.supabase.co",
  anon || "public-anon-key"
);
