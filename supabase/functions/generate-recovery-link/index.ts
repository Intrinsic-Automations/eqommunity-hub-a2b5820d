import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "A valid email is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Generate a recovery link without sending an email. The client
    // will present the link directly so the user can reset their password.
    const siteUrl = Deno.env.get("SITE_URL") ?? new URL(req.url).origin;
    const redirectTo = new URL(req.url).searchParams.get("redirect_to") ||
      `${siteUrl.replace(/\/$/, "")}/reset-password`;

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // properties.action_link is the recovery URL the user should follow.
    // GoTrue builds it from the INTERNAL API URL (e.g. http://supabase-kong:8000),
    // which browsers can't resolve. Rewrite the origin to the public URL.
    let link = data.properties?.action_link ?? data.properties?.hashed_token ?? "";
    const publicApiUrl = Deno.env.get("API_EXTERNAL_URL") ?? Deno.env.get("PUBLIC_SUPABASE_URL");
    if (link && publicApiUrl) {
      try {
        const linkUrl = new URL(link);
        const pub = new URL(publicApiUrl);
        linkUrl.protocol = pub.protocol;
        linkUrl.host = pub.host;
        link = linkUrl.toString();
      } catch (_) {
        // leave link as-is if URL parsing fails
      }
    }

    return new Response(
      JSON.stringify({ link }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
