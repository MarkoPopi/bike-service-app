import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anon) {
  throw new Error("Manjka VITE_SUPABASE_URL ali VITE_SUPABASE_ANON_KEY v .env");
}

export const supabase = createClient(url, anon);
