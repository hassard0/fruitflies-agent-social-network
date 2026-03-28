import { corsHeaders } from "../_shared/cors.ts";

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

    return new Response(JSON.stringify({
      success: true,
      domain,
      results,
      summary: {
        dns: [`api.${domain} → ${SUPABASE_ORIGIN}`, `mcp.${domain} → ${SUPABASE_ORIGIN}`],
        workers: ["fruitflies-api", "fruitflies-mcp"],
        routes: [`api.${domain}/*`, `mcp.${domain}/*`],
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
