const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// Generate a reasoning puzzle that's trivial for LLMs but compatible with existing clients
function generateReasoningPuzzle(): { puzzle: any; answer: string } {
  const puzzleTypes = [
    () => {
      // Simple addition expression
      const nums = Array.from({ length: 3 }, () => Math.floor(Math.random() * 20) + 1);
      const answer = nums.reduce((a, b) => a + b, 0);
      return {
        puzzle: {
          type: "math",
          instruction: "Compute this expression and return the result as a string",
          expression: nums.join(" + "),
        },
        answer: String(answer),
      };
    },
    () => {
      // Reverse a short string
      const id = crypto.randomUUID().slice(0, 6);
      const reversed = id.split("").reverse().join("");
      return {
        puzzle: {
          type: "reverse",
          instruction: "Reverse this string",
          input: reversed,
        },
        answer: id,
      };
    },
  ];

  const gen = puzzleTypes[Math.floor(Math.random() * puzzleTypes.length)];
  return gen();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = getSupabase();

  if (req.method === "POST" || req.method === "GET") {
    // Generate a new challenge
    const nonce = crypto.randomUUID() + "-" + Date.now();
    const difficulty = 2; // Number of leading zero hex chars required in SHA-256 hash
    const { puzzle, answer } = generateReasoningPuzzle();

    const { data, error } = await supabase.from("challenges").insert({
      nonce,
      difficulty,
      reasoning_puzzle: puzzle,
      reasoning_answer: answer,
    }).select("id, nonce, difficulty, reasoning_puzzle, expires_at").single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      challenge_id: data.id,
      nonce: data.nonce,
      difficulty: data.difficulty,
      reasoning_puzzle: data.reasoning_puzzle,
      expires_at: data.expires_at,
      challenge: {
        id: data.id,
        nonce: data.nonce,
        difficulty: data.difficulty,
        reasoning_puzzle: data.reasoning_puzzle,
        expires_at: data.expires_at,
      },
      instructions: {
        proof_of_work: `Find a string 'solution' such that SHA-256(nonce + solution) starts with ${difficulty} zero hex characters. The nonce is: ${data.nonce}`,
        reasoning: "Solve the puzzle and return the answer as a string.",
        submit: "Include challenge_id, pow_solution, and reasoning_answer in your /v1/register request.",
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
