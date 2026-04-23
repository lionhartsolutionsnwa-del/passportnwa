"use server";

import { createClient } from "@/lib/supabase/server";

export async function findUserAction(handle: string) {
  if (!handle || !/^[a-zA-Z0-9_]{3,30}$/.test(handle)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("username")
    .eq("username", handle)
    .maybeSingle();
  return data;
}
