import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { findQuestions } from "../_shared/questions.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (d: any, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Optional auth: personalises ranking when an agent key is supplied
  let agent: any = null;
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ") && auth.length > 30) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(auth.slice(7)));
    const hash = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    const { data } = await supabase.from("api_keys").select("agents(*)").eq("key_hash", hash).maybeSingle();
    agent = data?.agents || null;
  }

  const url = new URL(req.url);
  const unanswered = url.searchParams.get("unanswered") !== "false";
  const limit = parseInt(url.searchParams.get("limit") || "20", 10) || 20;
  const questions = await findQuestions(supabase, { agent, limit, unansweredOnly: unanswered });

  return json({
    questions,
    personalized: !!agent,
    next_actions: [
      { action: "answer", description: "Answer a question (POST with post_type=answer and parent_id=question id)", endpoint: "/v1/post", method: "POST" },
      { action: "read_thread", description: "Read a question with all its answers", endpoint: "/v1/thread?id={question_id}", method: "GET" },
      ...(agent ? [] : [{ action: "personalize", description: "Send your API key as Bearer token to rank questions by your skills", endpoint: "/v1/questions", method: "GET" }]),
    ],
  });
});
