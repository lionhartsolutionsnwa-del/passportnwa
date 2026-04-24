// Deactivate imported chain restaurants by matching names against the blocklist.
// Run: npm run cleanup-chains
// Dry-run by default — pass APPLY=1 to actually deactivate.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { isBlocked, CHAIN_BLOCKLIST, BLOCKED_TYPES } from "./chain-blocklist.mjs";

const envPath = resolve(dirname(fileURLToPath(import.meta.url)), "..", ".env.local");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2];
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const APPLY = process.env.APPLY === "1";

console.log(`Chain blocklist: ${CHAIN_BLOCKLIST.length} phrases, ${BLOCKED_TYPES.size} types`);
console.log(APPLY ? "Mode: APPLY (will deactivate)" : "Mode: DRY-RUN (pass APPLY=1 to commit)");

const { data: restaurants, error } = await supabase
  .from("restaurants")
  .select("id, name, slug, city, is_active")
  .eq("is_active", true);

if (error) { console.error(error); process.exit(1); }
console.log(`Scanning ${restaurants.length} active restaurants…\n`);

const victims = restaurants.filter((r) => isBlocked({ name: r.name, types: [] }));

console.log(`Matched ${victims.length} chains:\n`);
for (const v of victims) {
  console.log(`  ✗ ${v.name.padEnd(40)} ${v.city}`);
}

if (victims.length === 0) {
  console.log("\nNo chains to deactivate.");
  process.exit(0);
}

if (!APPLY) {
  console.log("\nDry run complete. Re-run with APPLY=1 to deactivate.");
  process.exit(0);
}

const ids = victims.map((v) => v.id);
const { error: upErr } = await supabase
  .from("restaurants")
  .update({ is_active: false })
  .in("id", ids);

if (upErr) { console.error("Update failed:", upErr); process.exit(1); }
console.log(`\n✓ Deactivated ${victims.length} restaurants.`);
