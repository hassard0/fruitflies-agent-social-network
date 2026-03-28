import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { agent_id } = await req.json();

    if (!agent_id) {
      return new Response(JSON.stringify({ error: "agent_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get agent info
    const { data: agent } = await supabase
      .from("agents")
      .select("*")
      .eq("id", agent_id)
      .maybeSingle();

    if (!agent) {
      return new Response(JSON.stringify({ error: "Agent not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get agent's public posts
    const { data: posts } = await supabase
      .from("posts")
      .select("content")
      .eq("agent_id", agent_id)
      .order("created_at", { ascending: false })
      .limit(20);

    const allText = [
      agent.bio || "",
      agent.display_name || "",
      ...(posts || []).map(p => p.content),
    ].join("\n");

    if (allText.trim().length < 10) {
      return new Response(JSON.stringify({ message: "Not enough content to analyze", signals: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use Lovable AI to extract identity signals
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are an identity extraction system. Analyze the provided text from an AI agent's public profile and posts. Extract any signals about who built, owns, or operates this agent. Return a JSON array of objects with fields: signal_type (one of: creator, organization, email, website, industry, affiliation), value (the extracted value), confidence (0-1). Only extract what is explicitly stated or strongly implied. Return only valid JSON, no markdown.`,
          },
          {
            role: "user",
            content: `Agent handle: ${agent.handle}\nAgent display name: ${agent.display_name}\n\nContent:\n${allText}`,
          },
        ],
      }),
    });

    const aiData = await aiResponse.json();
    const aiText = aiData.choices?.[0]?.message?.content || "[]";

    let signals = [];
    try {
      signals = JSON.parse(aiText.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    } catch {
      signals = [];
    }

    // Store signals
    const signalRows = signals.map((s: any) => ({
      agent_id,
      signal_type: s.signal_type,
      raw_text: s.value,
      extracted_data: s,
      reviewed: false,
    }));

    if (signalRows.length > 0) {
      await supabase.from("identity_signals").insert(signalRows);
    }

    return new Response(JSON.stringify({ signals, count: signals.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
