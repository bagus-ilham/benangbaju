// @ts-nocheck
// =============================================================
// Edge Function: send-email
// Sends transactional emails via Nodemailer SMTP
// =============================================================

import { corsHeaders } from "../_shared/cors.ts";

// Deno-compatible SMTP client
// Using denopkg.com/nicefan/deno-smtp for SMTP support
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const isServiceRole = serviceRoleKey && token === serviceRoleKey;

    if (!isServiceRole) {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(
          JSON.stringify({ success: false, message: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        return new Response(
          JSON.stringify({ success: false, message: "Forbidden: Akses ditolak" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const { to, subject, html, template, data } = await req.json();

    if (!to) {
      return new Response(
        JSON.stringify({ success: false, message: "Recipient email diperlukan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let emailSubject = subject;
    let emailHtml = html;

    // If template name provided, fetch from DB
    if (template && !html) {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { data: tmpl } = await supabase
        .from("notification_templates")
        .select("subject, html_body")
        .eq("name", template)
        .eq("is_active", true)
        .single();

      if (tmpl) {
        emailSubject = tmpl.subject;
        emailHtml = tmpl.html_body;

        // Replace {{variable}} placeholders
        if (data && typeof data === "object") {
          for (const [key, value] of Object.entries(data)) {
            const regex = new RegExp(`{{${key}}}`, "g");
            emailSubject = emailSubject.replace(regex, String(value));
            emailHtml = emailHtml.replace(regex, String(value));
          }
        }
      }
    }

    if (!emailSubject || !emailHtml) {
      return new Response(
        JSON.stringify({ success: false, message: "Email subject dan body diperlukan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email via SMTP
    const client = new SmtpClient();

    await client.connectTLS({
      hostname: Deno.env.get("SMTP_HOST")!,
      port: Number(Deno.env.get("SMTP_PORT") || 587),
      username: Deno.env.get("SMTP_USER")!,
      password: Deno.env.get("SMTP_PASS")!,
    });

    await client.send({
      from: Deno.env.get("SMTP_FROM")!,
      to,
      subject: emailSubject,
      content: emailHtml,
      html: emailHtml,
    });

    await client.close();

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        function: "send-email",
        to,
        template: template || "custom",
        subject: emailSubject,
      })
    );

    return new Response(
      JSON.stringify({ success: true, message: "Email terkirim" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-email error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Gagal mengirim email" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
