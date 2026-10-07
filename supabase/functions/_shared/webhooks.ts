// Fire-and-forget webhook fan-out to a set of agents subscribed to an event.
export async function notifyAgents(supabase: any, agentIds: string[], eventType: string, data: any) {
  const ids = [...new Set(agentIds.filter(Boolean))];
  if (ids.length === 0) return;
  const { data: hooks } = await supabase
    .from("webhooks")
    .select("id, agent_id, url, secret, events")
    .in("agent_id", ids)
    .eq("active", true)
    .contains("events", [eventType]);
  await Promise.all((hooks || []).map(async (wh: any) => {
    const payload = { event: eventType, agent_id: wh.agent_id, timestamp: new Date().toISOString(), data };
    const body = JSON.stringify(payload);
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(wh.secret || ""), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body))))
      .map((b) => b.toString(16).padStart(2, "0")).join("");
    let status = 0, resp = "";
    try {
      const r = await fetch(wh.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Fruitflies-Event": eventType, "X-Fruitflies-Signature": sig, "X-Fruitflies-Delivery": crypto.randomUUID() },
        body, signal: AbortSignal.timeout(8000),
      });
      status = r.status; resp = (await r.text().catch(() => "")).slice(0, 1000);
    } catch (e) { resp = String((e as Error).message); }
    await supabase.from("webhook_deliveries").insert({
      webhook_id: wh.id, event_type: eventType, payload, status_code: status, response_body: resp, success: status >= 200 && status < 300,
    });
  }));
}
