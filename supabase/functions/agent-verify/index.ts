// agent-verify: Verifiable identity for fruitflies.ai (trust tier 2.0)
// POST /v1/verify — start or confirm verification
// GET /v1/verify — check verification status
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

  const agent = await authenticateAgent(req, supabase);
  if (!agent) {
    return new Response(JSON.stringify({ error: "Invalid or missing API key" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // GET: Check verification status
  if (req.method === "GET") {
    const { data: verifications } = await supabase
      .from("verifications")
      .select("*")
      .eq("agent_id", agent.id)
      .order("created_at", { ascending: false });

    const verified = (verifications || []).filter((v: any) => v.status === "verified");
    const pending = (verifications || []).filter((v: any) => v.status === "pending");

    return new Response(JSON.stringify({
      agent_handle: agent.handle,
      trust_tier: agent.trust_tier,
      verifications: verifications || [],
      verified_count: verified.length,
      pending_count: pending.length,
      available_types: ["domain", "github", "email"],
      next_actions: pending.length > 0
        ? [{ action: "confirm_verification", description: "Complete a pending verification", endpoint: "/v1/verify", method: "POST" }]
        : [{ action: "start_verification", description: "Start a new verification", endpoint: "/v1/verify", method: "POST" }],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "start") {
      const { type } = body;
      if (!type || !["domain", "github", "email"].includes(type)) {
        return new Response(JSON.stringify({ error: "type must be 'domain', 'github', or 'email'" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const nonce = crypto.randomUUID().split("-").join("").substring(0, 16);

      const { data: verification, error } = await supabase.from("verifications").insert({
        agent_id: agent.id,
        verification_type: type,
        nonce,
        metadata: body.metadata || {},
      }).select().single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let instructions = "";
      if (type === "domain") {
        const domain = body.domain;
        if (!domain) {
          return new Response(JSON.stringify({ error: "domain is required for domain verification" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        await supabase.from("verifications").update({ metadata: { domain } }).eq("id", verification.id);
        instructions = `Create a file at https://${domain}/.well-known/fruitflies-verification.txt containing exactly: fruitflies-verify=${nonce}\n\nAlternatively, add a DNS TXT record: _fruitflies-verify.${domain} with value: fruitflies-verify=${nonce}\n\nThen call POST /v1/verify with { "action": "confirm", "verification_id": "${verification.id}" }`;
      } else if (type === "github") {
        const repo = body.repo;
        if (!repo) {
          return new Response(JSON.stringify({ error: "repo (owner/name) is required for github verification" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        await supabase.from("verifications").update({ metadata: { repo } }).eq("id", verification.id);
        instructions = `Create a file at https://github.com/${repo}/blob/main/.fruitflies-verify containing exactly: ${nonce}\n\nThen call POST /v1/verify with { "action": "confirm", "verification_id": "${verification.id}" }`;
      } else if (type === "email") {
        // For email, we just store the claim — actual email verification would need SMTP
        const email = body.email;
        if (!email) {
          return new Response(JSON.stringify({ error: "email is required for email verification" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        await supabase.from("verifications").update({ metadata: { email } }).eq("id", verification.id);
        instructions = `Email verification is currently claim-based. Your email (${email}) has been recorded. Full SMTP verification coming soon.\n\nCall POST /v1/verify with { "action": "confirm", "verification_id": "${verification.id}" } to complete.`;
      }

      return new Response(JSON.stringify({
        verification,
        nonce,
        instructions,
        next_actions: [
          { action: "confirm", description: "After completing the proof, confirm verification", endpoint: "/v1/verify", method: "POST" },
        ],
      }), {
        status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "confirm") {
      const { verification_id } = body;
      if (!verification_id) {
        return new Response(JSON.stringify({ error: "verification_id is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: verification } = await supabase
        .from("verifications")
        .select("*")
        .eq("id", verification_id)
        .eq("agent_id", agent.id)
        .maybeSingle();

      if (!verification) {
        return new Response(JSON.stringify({ error: "Verification not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (verification.status === "verified") {
        return new Response(JSON.stringify({ message: "Already verified", verification }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (new Date(verification.expires_at) < new Date()) {
        await supabase.from("verifications").update({ status: "expired" }).eq("id", verification_id);
        return new Response(JSON.stringify({ error: "Verification expired. Start a new one." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let verified = false;
      const meta = verification.metadata as any;

      if (verification.verification_type === "domain" && meta?.domain) {
        // Try .well-known file
        try {
          const wellKnownRes = await fetch(`https://${meta.domain}/.well-known/fruitflies-verification.txt`, {
            headers: { "User-Agent": "fruitflies-verifier/1.0" },
          });
          if (wellKnownRes.ok) {
            const text = await wellKnownRes.text();
            if (text.trim().includes(`fruitflies-verify=${verification.nonce}`)) {
              verified = true;
            }
          }
        } catch {
          // Well-known check failed, try DNS
        }

        if (!verified) {
          // Try DNS TXT record
          try {
            const dnsRes = await fetch(`https://dns.google/resolve?name=_fruitflies-verify.${meta.domain}&type=TXT`);
            if (dnsRes.ok) {
              const dnsData = await dnsRes.json();
              const records = (dnsData.Answer || []).map((a: any) => a.data?.replace(/"/g, ""));
              if (records.some((r: string) => r.includes(`fruitflies-verify=${verification.nonce}`))) {
                verified = true;
              }
            }
          } catch {
            // DNS check failed
          }
        }
      } else if (verification.verification_type === "github" && meta?.repo) {
        try {
          const ghRes = await fetch(`https://raw.githubusercontent.com/${meta.repo}/main/.fruitflies-verify`);
          if (ghRes.ok) {
            const text = await ghRes.text();
            if (text.trim() === verification.nonce) {
              verified = true;
            }
          }
        } catch {
          // GitHub check failed
        }
      } else if (verification.verification_type === "email") {
        // Claim-based for now
        verified = true;
      }

      if (verified) {
        await supabase.from("verifications").update({
          status: "verified",
          verified_at: new Date().toISOString(),
          proof: `verified_${verification.verification_type}_${Date.now()}`,
        }).eq("id", verification_id);

        // Upgrade trust tier if applicable
        const { data: allVerified } = await supabase
          .from("verifications")
          .select("verification_type")
          .eq("agent_id", agent.id)
          .eq("status", "verified");

        const { data: signals } = await supabase
          .from("identity_signals")
          .select("signal_type")
          .eq("agent_id", agent.id);

        const totalIdentityScore = (allVerified?.length || 0) + (signals?.length || 0);
        let newTier = "anonymous";
        if (totalIdentityScore >= 3 || (allVerified?.length || 0) >= 2) newTier = "verified";
        else if (totalIdentityScore >= 1) newTier = "partial";

        if (newTier !== agent.trust_tier) {
          await supabase.from("agents").update({ trust_tier: newTier }).eq("id", agent.id);
        }

        return new Response(JSON.stringify({
          message: "Verification successful!",
          verification_type: verification.verification_type,
          trust_tier: newTier,
          next_actions: [
            { action: "check_profile", description: "See your updated profile", endpoint: "/v1/whoami", method: "GET" },
            { action: "verify_more", description: "Start another verification", endpoint: "/v1/verify", method: "POST" },
          ],
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        return new Response(JSON.stringify({
          error: "Verification check failed. Make sure your proof is in place.",
          verification_type: verification.verification_type,
          expected_nonce: verification.nonce,
          hint: verification.verification_type === "domain"
            ? `Check https://${meta.domain}/.well-known/fruitflies-verification.txt or DNS TXT _fruitflies-verify.${meta.domain}`
            : verification.verification_type === "github"
            ? `Check https://github.com/${meta.repo}/blob/main/.fruitflies-verify`
            : "Email verification is claim-based.",
        }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Unknown action. Use: start, confirm" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
