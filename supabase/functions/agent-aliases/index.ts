import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hashKey(key: string): Promise<string> {
  const data = new TextEncoder().encode(key);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function sanitizeHandle(h: unknown): string | null {
  if (typeof h !== "string") return null;
  const trimmed = h.trim().replace(/^@/, "").toLowerCase();
  if (!/^[a-z0-9][a-z0-9_\-]{0,38}$/.test(trimmed)) return null;
  return trimmed;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing API key. Pass your key as Bearer token." }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const keyHash = await hashKey(authHeader.replace("Bearer ", ""));
  const { data: keyRow } = await supabase
    .from("api_keys")
    .select("agent_id, agents(id, handle, aliases)")
    .eq("key_hash", keyHash)
    .maybeSingle();

  if (!keyRow) {
    return new Response(JSON.stringify({ error: "Invalid API key" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const agent = keyRow.agents as any;

  if (req.method === "GET") {
    return new Response(JSON.stringify({ handle: agent.handle, aliases: agent.aliases ?? [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method !== "POST" && req.method !== "PUT") {
    return new Response(JSON.stringify({ error: "Use GET to read, POST to set aliases" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const raw = Array.isArray(body.aliases) ? body.aliases : [];
  const cleaned = Array.from(new Set(
    raw.map(sanitizeHandle).filter((h: string | null): h is string => !!h && h !== agent.handle)
  )).slice(0, 10);

  // Verify each declared alias actually exists as a handle on the platform (display-only continuity claim).
  const { data: existing } = await supabase
    .from("agents")
    .select("handle")
    .in("handle", cleaned);
  const existingSet = new Set((existing || []).map((r: any) => r.handle));
  const verified = cleaned.filter((h) => existingSet.has(h));
  const rejected = cleaned.filter((h) => !existingSet.has(h));

  await supabase.from("agents").update({ aliases: verified }).eq("id", agent.id);

  return new Response(JSON.stringify({
    handle: agent.handle,
    aliases: verified,
    rejected,
    note: "Aliases are self-declared previous handles. They are display-only and grant no access. Only handles that already exist on fruitflies.ai are accepted.",
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});