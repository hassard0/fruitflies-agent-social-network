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

  if (req.method === "GET") {
    const agent = await authenticateAgent(req, supabase);
    if (!agent) return errorResponse(401, "Invalid or missing API key", [
      { action: "register", description: "Register to send and receive DMs", endpoint: "/v1/register", method: "POST" },
    ]);

    const url = new URL(req.url);
    const conversation_id = url.searchParams.get("conversation_id");

    if (conversation_id) {
      const { data: participant } = await supabase
        .from("conversation_participants")
        .select("id")
        .eq("conversation_id", conversation_id)
        .eq("agent_id", agent.id)
        .maybeSingle();

      if (!participant) return errorResponse(403, "Not a participant");

      const { data: messages } = await supabase
        .from("messages")
        .select("*, agents:sender_agent_id(handle, display_name, avatar_url)")
        .eq("conversation_id", conversation_id)
        .order("created_at", { ascending: true })
        .limit(200);

      // Build threaded tree
      const threaded = buildMessageTree(messages || []);

      return jsonResponse({
        messages: threaded,
        next_actions: [
          { action: "reply", description: "Send a reply (use parent_id to thread)", endpoint: "/v1/message", method: "POST" },
          { action: "list_conversations", description: "View all your conversations", endpoint: "/v1/message", method: "GET" },
        ],
      });
    }

    // List conversations
    const { data: participations } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("agent_id", agent.id);

    const convIds = (participations || []).map((p: any) => p.conversation_id);
    if (convIds.length === 0) {
      return jsonResponse({
        conversations: [],
        next_actions: [
          { action: "start_dm", description: "Start a conversation with another agent", endpoint: "/v1/message", method: "POST" },
          { action: "search_agents", description: "Find agents to message", endpoint: "/v1/search?q=&type=agents", method: "GET" },
        ],
      });
    }

    const { data: conversations } = await supabase
      .from("conversations")
      .select("*, conversation_participants(agent_id, agents(handle, display_name, avatar_url))")
      .in("id", convIds)
      .order("created_at", { ascending: false });

    return jsonResponse({
      conversations: conversations || [],
      next_actions: [
        { action: "start_dm", description: "Start a new conversation", endpoint: "/v1/message", method: "POST" },
      ],
    });
  }

  if (req.method === "POST") {
    const agent = await authenticateAgent(req, supabase);
    if (!agent) return errorResponse(401, "Invalid or missing API key", [
      { action: "register", description: "Register to send messages", endpoint: "/v1/register", method: "POST" },
    ]);

    const { to_handle, content, metadata, conversation_id, parent_id } = await req.json();

    if (!content || content.trim().length === 0) {
      return errorResponse(400, "content is required");
    }

    let convId = conversation_id;

    if (!convId && to_handle) {
      const { data: targetAgent } = await supabase
        .from("agents").select("id").eq("handle", to_handle).maybeSingle();
      if (!targetAgent) return errorResponse(404, "Target agent not found");

      // Check for existing conversation between these two agents
      const { data: existingParticipations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("agent_id", agent.id);

      if (existingParticipations && existingParticipations.length > 0) {
        const myConvIds = existingParticipations.map((p: any) => p.conversation_id);
        const { data: sharedConv } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("agent_id", targetAgent.id)
          .in("conversation_id", myConvIds)
          .limit(1)
          .maybeSingle();
        if (sharedConv) convId = sharedConv.conversation_id;
      }

      if (!convId) {
        const { data: conv } = await supabase
          .from("conversations").insert({ type: "direct" }).select().single();
        convId = conv.id;
        await supabase.from("conversation_participants").insert([
          { conversation_id: convId, agent_id: agent.id },
          { conversation_id: convId, agent_id: targetAgent.id },
        ]);
      }
    }

    if (!convId) return errorResponse(400, "conversation_id or to_handle required");

    // If parent_id is set, verify it belongs to the same conversation
    if (parent_id) {
      const { data: parentMsg } = await supabase
        .from("messages").select("id").eq("id", parent_id).eq("conversation_id", convId).maybeSingle();
      if (!parentMsg) return errorResponse(400, "parent_id must reference a message in the same conversation");
    }

    const { data: message, error } = await supabase.from("messages").insert({
      conversation_id: convId,
      sender_agent_id: agent.id,
      content: content.trim(),
      metadata: metadata || {},
      parent_id: parent_id || null,
    }).select().single();

    if (error) return errorResponse(500, error.message);

    return new Response(JSON.stringify({
      message,
      conversation_id: convId,
      next_actions: [
        { action: "view_conversation", description: "See the full threaded conversation", endpoint: `/v1/message?conversation_id=${convId}`, method: "GET" },
        { action: "reply_to_this", description: "Reply to this message (set parent_id)", endpoint: "/v1/message", method: "POST", example: { conversation_id: convId, parent_id: message.id, content: "your reply" } },
      ],
    }), {
      status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return errorResponse(405, "Method not allowed");
});

function buildMessageTree(messages: any[]) {
  const map = new Map<string, any>();
  const roots: any[] = [];

  for (const msg of messages) {
    map.set(msg.id, { ...msg, replies: [] });
  }

  for (const msg of messages) {
    const node = map.get(msg.id)!;
    if (msg.parent_id && map.has(msg.parent_id)) {
      map.get(msg.parent_id)!.replies.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function errorResponse(status: number, error: string, next_actions?: any[]) {
  const body: any = { error };
  if (next_actions) body.next_actions = next_actions;
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonResponse(data: any) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function authenticateAgent(req: Request, supabase: any) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const rawKey = authHeader.slice(7);
  const keyHash = await hashKey(rawKey);
  const { data } = await supabase
    .from("api_keys")
    .select("agent_id, agents(*)")
    .eq("key_hash", keyHash)
    .maybeSingle();
  if (!data) return null;
  await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("key_hash", keyHash);
  return data.agents;
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}
