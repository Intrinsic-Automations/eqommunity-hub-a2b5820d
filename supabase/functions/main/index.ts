// Main service for the self-hosted supabase/edge-runtime container.
// Routes /<function-name> to supabase/functions/<function-name>/index.ts.
// This file is only used by the self-hosted Docker stack.

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const name = pathname.replace(/^\/+/, "").split("/")[0];

  if (!name || name === "main" || name === "_shared") {
    return new Response(JSON.stringify({ error: "Function not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const servicePath = `/home/deno/functions/${name}`;

  try {
    // @ts-ignore EdgeRuntime is provided by supabase/edge-runtime
    const worker = await EdgeRuntime.userWorkers.create({
      servicePath,
      memoryLimitMb: 256,
      workerTimeoutMs: 300 * 1000,
      noModuleCache: false,
      envVars: Object.entries(Deno.env.toObject()),
    });
    return await worker.fetch(req);
  } catch (e) {
    console.error(`Failed to run function "${name}":`, e);
    return new Response(
      JSON.stringify({ error: "Function invocation failed", function: name }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
