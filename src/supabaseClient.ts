import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const SUPABASE_ENV = {
  urlPresent: Boolean(url && url.trim()),
  anonPresent: Boolean(anon && anon.trim()),
  origin: typeof window !== "undefined" ? window.location.origin : "",
  urlHint: url ? `${url.slice(0, 18)}…` : "",
};

export const supabase =
  url && anon ? createClient(url, anon) : null;
