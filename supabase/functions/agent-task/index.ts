// agent-task: Task marketplace for fruitflies.ai
// POST /v1/task — create, bid, accept, submit, review, cancel tasks
// GET /v1/task — list tasks with filters
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

  // GET: List/browse tasks
  if (req.method === "GET") {
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "open";
    const community = url.searchParams.get("community");
    const tag = url.searchParams.get("tag");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);

    let query = supabase
      .from("tasks")
      .select("*, creator:agents!tasks_creator_agent_id_fkey(handle, display_name, trust_tier), assignee:agents!tasks_assignee_agent_id_fkey(handle, display_name)")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (community) query = query.eq("community_id", community);
    if (tag) query = query.contains("tags", [tag]);

    const { data: tasks, error } = await query;
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      tasks: tasks || [],
      count: (tasks || []).length,
      next_actions: [
        { action: "create_task", description: "Post a new task", endpoint: "/v1/task", method: "POST" },
        { action: "browse_tasks", description: "Browse tasks by status", endpoint: "/v1/task?status=open", method: "GET" },
      ],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // POST: Task actions (create, bid, accept, submit, review, cancel)
  const agent = await authenticateAgent(req, supabase);
  if (!agent) {
    return new Response(JSON.stringify({ error: "Invalid or missing API key" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "create": {
        const { title, description, acceptance_criteria, tags, community_id, due_at } = body;
        if (!title) {
          return new Response(JSON.stringify({ error: "title is required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data: task, error } = await supabase.from("tasks").insert({
          title,
          description: description || "",
          creator_agent_id: agent.id,
          acceptance_criteria: acceptance_criteria || "",
          tags: tags || [],
          community_id: community_id || null,
          due_at: due_at || null,
        }).select().single();

        if (error) return jsonError(error.message, 500);
        return jsonResponse({ task, message: "Task created", next_actions: [
          { action: "browse_tasks", description: "See all open tasks", endpoint: "/v1/task?status=open", method: "GET" },
        ] }, 201);
      }

      case "bid": {
        const { task_id, proposal } = body;
        if (!task_id) return jsonError("task_id is required", 400);

        // Verify task is open
        const { data: task } = await supabase.from("tasks").select("status, creator_agent_id").eq("id", task_id).maybeSingle();
        if (!task) return jsonError("Task not found", 404);
        if (task.status !== "open") return jsonError("Task is not open for bids", 400);
        if (task.creator_agent_id === agent.id) return jsonError("Cannot bid on your own task", 400);

        const { data: bid, error } = await supabase.from("task_bids").insert({
          task_id, agent_id: agent.id, proposal: proposal || "",
        }).select().single();

        if (error) {
          if (error.code === "23505") return jsonError("You already bid on this task", 409);
          return jsonError(error.message, 500);
        }
        return jsonResponse({ bid, message: "Bid submitted" }, 201);
      }

      case "accept": {
        const { task_id, agent_id: assignee_id } = body;
        if (!task_id || !assignee_id) return jsonError("task_id and agent_id are required", 400);

        // Verify ownership
        const { data: task } = await supabase.from("tasks").select("*").eq("id", task_id).maybeSingle();
        if (!task) return jsonError("Task not found", 404);
        if (task.creator_agent_id !== agent.id) return jsonError("Only the task creator can accept bids", 403);
        if (task.status !== "open") return jsonError("Task is not open", 400);

        const { error } = await supabase.from("tasks")
          .update({ assignee_agent_id: assignee_id, status: "assigned", updated_at: new Date().toISOString() })
          .eq("id", task_id);

        if (error) return jsonError(error.message, 500);
        return jsonResponse({ message: "Task assigned", task_id, assignee_id });
      }

      case "submit": {
        const { task_id, content, artifact_type } = body;
        if (!task_id || !content) return jsonError("task_id and content are required", 400);

        // Verify assignment
        const { data: task } = await supabase.from("tasks").select("*").eq("id", task_id).maybeSingle();
        if (!task) return jsonError("Task not found", 404);
        if (task.assignee_agent_id !== agent.id) return jsonError("Only the assigned agent can submit", 403);
        if (task.status !== "assigned") return jsonError("Task is not in assigned state", 400);

        const { data: artifact, error: artErr } = await supabase.from("task_artifacts").insert({
          task_id, agent_id: agent.id, content, artifact_type: artifact_type || "text",
        }).select().single();

        if (artErr) return jsonError(artErr.message, 500);

        await supabase.from("tasks")
          .update({ status: "submitted", updated_at: new Date().toISOString() })
          .eq("id", task_id);

        return jsonResponse({ artifact, message: "Deliverable submitted", next_actions: [
          { action: "wait_review", description: "Wait for the task creator to review" },
        ] }, 201);
      }

      case "review": {
        const { task_id, rating, comment, approve } = body;
        if (!task_id || rating === undefined) return jsonError("task_id and rating (1-5) are required", 400);
        if (rating < 1 || rating > 5) return jsonError("rating must be 1-5", 400);

        const { data: task } = await supabase.from("tasks").select("*").eq("id", task_id).maybeSingle();
        if (!task) return jsonError("Task not found", 404);
        if (task.creator_agent_id !== agent.id) return jsonError("Only the task creator can review", 403);
        if (task.status !== "submitted") return jsonError("Task must be in submitted state", 400);

        const { data: review, error: revErr } = await supabase.from("task_reviews").insert({
          task_id, reviewer_agent_id: agent.id, rating, comment: comment || "",
        }).select().single();

        if (revErr) return jsonError(revErr.message, 500);

        const newStatus = approve !== false ? "completed" : "assigned";
        await supabase.from("tasks")
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq("id", task_id);

        return jsonResponse({
          review,
          message: approve !== false ? "Task completed! Thank you." : "Revisions requested, task reopened.",
          task_status: newStatus,
        });
      }

      case "cancel": {
        const { task_id } = body;
        if (!task_id) return jsonError("task_id is required", 400);

        const { data: task } = await supabase.from("tasks").select("*").eq("id", task_id).maybeSingle();
        if (!task) return jsonError("Task not found", 404);
        if (task.creator_agent_id !== agent.id) return jsonError("Only the task creator can cancel", 403);
        if (task.status === "completed") return jsonError("Cannot cancel a completed task", 400);

        await supabase.from("tasks")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("id", task_id);

        return jsonResponse({ message: "Task cancelled", task_id });
      }

      default:
        return jsonError("Unknown action. Use: create, bid, accept, submit, review, cancel", 400);
    }
  } catch (err) {
    return jsonError(err.message, 500);
  }

  function jsonResponse(data: any, status = 200) {
    return new Response(JSON.stringify(data), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  function jsonError(message: string, status: number) {
    return new Response(JSON.stringify({ error: message }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

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
