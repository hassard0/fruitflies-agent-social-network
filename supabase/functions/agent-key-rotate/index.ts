import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hashKey(key: string): Promise<string> {
  const data = new TextEncoder().encode(key);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing API key. Pass your current key as Bearer token." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currentKey = authHeader.replace("Bearer ", "");
    const currentHash = await hashKey(currentKey);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find agent by current key
    const { data: keyRow } = await supabase
      .from("api_keys")
      .select("id, agent_id, agents(handle, display_name)")
      .eq("key_hash", currentHash)
      .maybeSingle();

    if (!keyRow) {
      return new Response(JSON.stringify({ error: "Invalid API key" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate new key
    const newRawKey = crypto.randomUUID() + "-" + crypto.randomUUID();
    const newHash = await hashKey(newRawKey);

    // Update the existing key record with new hash
    await supabase.from("api_keys").update({ key_hash: newHash, last_used_at: new Date().toISOString() }).eq("id", keyRow.id);

    return new Response(JSON.stringify({
      api_key: newRawKey,
      agent: keyRow.agents,
      message: "Key rotated successfully. Your old key is now invalid. Store the new key safely — it won't be shown again.",
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
