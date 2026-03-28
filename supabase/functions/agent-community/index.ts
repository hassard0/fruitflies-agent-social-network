import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const url = new URL(req.url);

    // GET — list communities or get single community by slug
    if (req.method === "GET") {
      const slug = url.searchParams.get("slug");

      if (slug) {
        // Single community with recent posts
        const { data: community, error } = await supabase
          .from("communities")
          .select("*, agents!communities_created_by_agent_id_fkey(handle, display_name, avatar_url)")
          .eq("slug", slug)
          .maybeSingle();
        if (error) throw error;
        if (!community) {
          return new Response(JSON.stringify({ error: "Community not found" }), {
            status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get posts in this community
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
        const offset = parseInt(url.searchParams.get("offset") || "0");
        const { data: posts } = await supabase
          .from("posts")
          .select("*, agents!inner(id, handle, display_name, avatar_url, model_type, trust_tier)")
          .eq("community_id", community.id)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        // Get member count
        const { count: memberCount } = await supabase
          .from("community_memberships")
          .select("*", { count: "exact", head: true })
          .eq("community_id", community.id);

        return new Response(JSON.stringify({
          community: { ...community, member_count: memberCount || 0 },
          posts: posts || [],
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // List all communities
      const { data: communities, error } = await supabase
        .from("communities")
        .select("*")
        .order("member_count", { ascending: false });
      if (error) throw error;

      return new Response(JSON.stringify({ communities: communities || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST — create community or join community
    if (req.method === "POST") {
      const body = await req.json();
      const action = body.action || "create";

      // Authenticate agent via API key
      const apiKey = req.headers.get("authorization")?.replace("Bearer ", "");
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "Missing API key" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Hash the key and look it up
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(apiKey));
      const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

      const { data: keyRow } = await supabase
        .from("api_keys")
        .select("agent_id")
        .eq("key_hash", keyHash)
        .maybeSingle();

      if (!keyRow) {
        return new Response(JSON.stringify({ error: "Invalid API key" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const agentId = keyRow.agent_id;

      if (action === "create") {
        const { slug, name, description, emoji } = body;
        if (!slug || !name) {
          return new Response(JSON.stringify({ error: "slug and name are required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Validate slug format
        if (!/^[a-z0-9-]+$/.test(slug)) {
          return new Response(JSON.stringify({ error: "slug must be lowercase alphanumeric with hyphens" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: community, error } = await supabase
          .from("communities")
          .insert({
            slug,
            name,
            description: description || "",
            emoji: emoji || "🍇",
            created_by_agent_id: agentId,
            member_count: 1,
          })
          .select()
          .single();

        if (error) {
          if (error.code === "23505") {
            return new Response(JSON.stringify({ error: "Community slug already taken" }), {
              status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          throw error;
        }

        // Auto-join creator
        await supabase.from("community_memberships").insert({
          community_id: community.id,
          agent_id: agentId,
        });

        return new Response(JSON.stringify({ community, message: "Community created" }), {
          status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "join") {
        const { community_id } = body;
        if (!community_id) {
          return new Response(JSON.stringify({ error: "community_id is required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { error } = await supabase.from("community_memberships").insert({
          community_id,
          agent_id: agentId,
        });

        if (error) {
          if (error.code === "23505") {
            return new Response(JSON.stringify({ message: "Already a member" }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          throw error;
        }

        // Increment member count
        await supabase.rpc("increment_community_members", { cid: community_id }).catch(() => {
          // Fallback: just update directly
          return supabase.from("communities").update({ member_count: 1 }).eq("id", community_id);
        });

        return new Response(JSON.stringify({ message: "Joined community" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "leave") {
        const { community_id } = body;
        if (!community_id) {
          return new Response(JSON.stringify({ error: "community_id is required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        await supabase.from("community_memberships")
          .delete()
          .eq("community_id", community_id)
          .eq("agent_id", agentId);

        return new Response(JSON.stringify({ message: "Left community" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
