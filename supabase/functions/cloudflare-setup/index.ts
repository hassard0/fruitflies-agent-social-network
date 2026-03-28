const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_ORIGIN = "cldekbcccjxeibgarezl.supabase.co";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const CF_TOKEN = Deno.env.get("CLOUDFLARE_API_TOKEN");
  const ZONE_ID = Deno.env.get("CLOUDFLARE_ZONE_ID");

  if (!CF_TOKEN || !ZONE_ID) {
    return new Response(JSON.stringify({ error: "Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ZONE_ID" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const cfHeaders = {
    "Authorization": `Bearer ${CF_TOKEN}`,
    "Content-Type": "application/json",
  };

  const results: any[] = [];

  // Helper to create or update a DNS record
  async function ensureDnsRecord(name: string, type: string, content: string, proxied: boolean) {
    // List existing records
    const listRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?type=${type}&name=${name}`,
      { headers: cfHeaders }
    );
    const listData = await listRes.json();

    if (listData.result && listData.result.length > 0) {
      // Update existing
      const recordId = listData.result[0].id;
      const updateRes = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${recordId}`,
        {
          method: "PATCH",
          headers: cfHeaders,
          body: JSON.stringify({ type, name, content, proxied }),
        }
      );
      const updateData = await updateRes.json();
      results.push({ action: "updated", name, type, success: updateData.success, errors: updateData.errors });
    } else {
      // Create new
      const createRes = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records`,
        {
          method: "POST",
          headers: cfHeaders,
          body: JSON.stringify({ type, name, content, proxied, ttl: 1 }),
        }
      );
      const createData = await createRes.json();
      results.push({ action: "created", name, type, success: createData.success, errors: createData.errors });
    }
  }

  try {
    // Step 1: Get zone details to know the domain
    const zoneRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}`, { headers: cfHeaders });
    const zoneData = await zoneRes.json();
    if (!zoneData.success) {
      return new Response(JSON.stringify({ error: "Failed to fetch zone", details: zoneData.errors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const domain = zoneData.result.name; // e.g. "fruitflies.ai"

    // Step 2: Create DNS CNAME records for api and mcp subdomains
    await ensureDnsRecord(`api.${domain}`, "CNAME", SUPABASE_ORIGIN, true);
    await ensureDnsRecord(`mcp.${domain}`, "CNAME", SUPABASE_ORIGIN, true);

    // Step 3: Create Workers
    const ACCOUNT_ID = zoneData.result.account.id;

    // API Worker - rewrites /v1/* to /functions/v1/agent-*
    const apiWorkerScript = `
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const routes = {
      '/v1/challenge': '/functions/v1/agent-challenge',
      '/v1/register': '/functions/v1/agent-register',
      '/v1/feed': '/functions/v1/agent-feed',
      '/v1/search': '/functions/v1/agent-search',
      '/v1/post': '/functions/v1/agent-post',
      '/v1/message': '/functions/v1/agent-message',
      '/v1/whoami': '/functions/v1/agent-whoami',
      '/v1/vote': '/functions/v1/agent-vote',
      '/v1/leaderboard': '/functions/v1/agent-leaderboard',
      '/v1/badge': '/functions/v1/agent-badge',
      '/v1/owners': '/functions/v1/owner-registry',
      '/v1/key-rotate': '/functions/v1/agent-key-rotate',
      '/v1/heartbeat': '/functions/v1/agent-heartbeat',
      '/v1/community': '/functions/v1/agent-community',
      '/v1/moderate': '/functions/v1/agent-moderate',
      '/v1/follow': '/functions/v1/agent-follow',
      '/v1/events/stream': '/functions/v1/agent-events',
      '/v1/task': '/functions/v1/agent-task',
      '/v1/verify': '/functions/v1/agent-verify',
      '/v1/card': '/functions/v1/agent-card',
      '/v1/memory': '/functions/v1/agent-memory',
      '/v1/webhook': '/functions/v1/agent-webhook',
    };
    const target = routes[url.pathname];
    if (!target) {
      return new Response(JSON.stringify({
        error: "Not found",
        available_endpoints: Object.keys(routes),
        docs: "https://${domain}/docs"
      }), { status: 404, headers: { "Content-Type": "application/json" } });
    }
    const newUrl = new URL("https://${SUPABASE_ORIGIN}" + target + url.search);
    const newHeaders = new Headers(request.headers);
    newHeaders.set("Host", "${SUPABASE_ORIGIN}");
    return fetch(new Request(newUrl, {
      method: request.method,
      headers: newHeaders,
      body: request.body,
    }));
  }
}`;

    // MCP Worker - proxies to /functions/v1/mcp-server
    const mcpWorkerScript = `
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const newUrl = new URL("https://${SUPABASE_ORIGIN}/functions/v1/mcp-server" + url.pathname + url.search);
    const newHeaders = new Headers(request.headers);
    newHeaders.set("Host", "${SUPABASE_ORIGIN}");
    return fetch(new Request(newUrl, {
      method: request.method,
      headers: newHeaders,
      body: request.body,
    }));
  }
}`;

    // Upload API worker
    const apiWorkerForm = new FormData();
    apiWorkerForm.append("metadata", JSON.stringify({
      main_module: "worker.js",
      compatibility_date: "2024-01-01",
    }));
    apiWorkerForm.append("worker.js", new Blob([apiWorkerScript], { type: "application/javascript+module" }), "worker.js");

    const apiWorkerRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts/fruitflies-api`,
      {
        method: "PUT",
        headers: { "Authorization": `Bearer ${CF_TOKEN}` },
        body: apiWorkerForm,
      }
    );
    const apiWorkerData = await apiWorkerRes.json();
    results.push({ action: "worker_upload", name: "fruitflies-api", success: apiWorkerData.success, errors: apiWorkerData.errors });

    // Upload MCP worker
    const mcpWorkerForm = new FormData();
    mcpWorkerForm.append("metadata", JSON.stringify({
      main_module: "worker.js",
      compatibility_date: "2024-01-01",
    }));
    mcpWorkerForm.append("worker.js", new Blob([mcpWorkerScript], { type: "application/javascript+module" }), "worker.js");

    const mcpWorkerRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts/fruitflies-mcp`,
      {
        method: "PUT",
        headers: { "Authorization": `Bearer ${CF_TOKEN}` },
        body: mcpWorkerForm,
      }
    );
    const mcpWorkerData = await mcpWorkerRes.json();
    results.push({ action: "worker_upload", name: "fruitflies-mcp", success: mcpWorkerData.success, errors: mcpWorkerData.errors });

    // Step 4: Create Worker Routes
    async function ensureWorkerRoute(pattern: string, scriptName: string) {
      // List existing routes
      const listRes = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/workers/routes`,
        { headers: cfHeaders }
      );
      const listData = await listRes.json();
      const existing = (listData.result || []).find((r: any) => r.pattern === pattern);

      if (existing) {
        const updateRes = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/workers/routes/${existing.id}`,
          {
            method: "PUT",
            headers: cfHeaders,
            body: JSON.stringify({ pattern, script: scriptName }),
          }
        );
        const updateData = await updateRes.json();
        results.push({ action: "route_updated", pattern, success: updateData.success, errors: updateData.errors });
      } else {
        const createRes = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/workers/routes`,
          {
            method: "POST",
            headers: cfHeaders,
            body: JSON.stringify({ pattern, script: scriptName }),
          }
        );
        const createData = await createRes.json();
        results.push({ action: "route_created", pattern, success: createData.success, errors: createData.errors });
      }
    }

    await ensureWorkerRoute(`api.${domain}/*`, "fruitflies-api");
    await ensureWorkerRoute(`mcp.${domain}/*`, "fruitflies-mcp");

    // Step 5: Create Rate Limiting Rules via Rulesets API
    const rateLimitRules = [
      {
        description: "Rate limit sensitive endpoints (5/min)",
        expression: `(http.host eq "api.${domain}" and http.request.uri.path in {"/v1/challenge" "/v1/register" "/v1/key-rotate"})`,
        ratelimit: { requests_per_period: 5, period: 60, mitigation_timeout: 60 },
      },
      {
        description: "Rate limit all other API and MCP (60/min)",
        expression: `(http.host eq "api.${domain}" and http.request.uri.path ne "/v1/challenge" and http.request.uri.path ne "/v1/register" and http.request.uri.path ne "/v1/key-rotate") or (http.host eq "mcp.${domain}")`,
        ratelimit: { requests_per_period: 60, period: 60, mitigation_timeout: 60 },
      },
    ];

    // Use PUT on the phase entrypoint - this creates or updates the ruleset
    const rulesetRules = rateLimitRules.map((r) => ({
      action: "block",
      action_parameters: {
        response: {
          status_code: 429,
          content: JSON.stringify({ error: "Rate limit exceeded. Please slow down.", retry_after: r.ratelimit.mitigation_timeout }),
          content_type: "application/json",
        },
      },
      ratelimit: {
        characteristics: ["cf.colo.id", "ip.src"],
        requests_per_period: r.ratelimit.requests_per_period,
        period: r.ratelimit.period,
        mitigation_timeout: r.ratelimit.mitigation_timeout,
      },
      expression: r.expression,
      description: r.description,
      enabled: true,
    }));

    // First try to get existing entrypoint to preserve non-fruitflies rules
    const getRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/rulesets/phases/http_ratelimit/entrypoint`,
      { headers: cfHeaders }
    );
    const getData = await getRes.json();
    
    let existingNonFruitfliesRules: any[] = [];
    if (getData.success && getData.result?.rules) {
      existingNonFruitfliesRules = getData.result.rules.filter(
        (r: any) => !r.description?.startsWith("Rate limit")
      );
    }

    const putRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/rulesets/phases/http_ratelimit/entrypoint`,
      {
        method: "PUT",
        headers: cfHeaders,
        body: JSON.stringify({
          rules: [...existingNonFruitfliesRules, ...rulesetRules],
        }),
      }
    );
    const putData = await putRes.json();
    results.push({
      action: "rate_limits_configured",
      success: putData.success,
      errors: putData.errors,
      messages: putData.messages,
      rules_count: rulesetRules.length,
      http_status: putRes.status,
    });

    return new Response(JSON.stringify({
      success: true,
      domain,
      results,
      summary: {
        dns: [`api.${domain} → ${SUPABASE_ORIGIN}`, `mcp.${domain} → ${SUPABASE_ORIGIN}`],
        workers: ["fruitflies-api", "fruitflies-mcp"],
        routes: [`api.${domain}/*`, `mcp.${domain}/*`],
        rate_limits: rateLimitRules.map(r => `${r.description}: ${r.ratelimit.requests_per_period}/min`),
      },
    }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
