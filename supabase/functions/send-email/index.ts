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

    const { to, subject, html, template, data, country_code } = await req.json();

    if (!to) {
      return new Response(
        JSON.stringify({ success: false, message: "Recipient email diperlukan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isMalaysia = country_code === "MY" || data?.country_code === "MY";

    let emailSubject = subject;
    let emailHtml = html;

    // If template name provided, fetch from DB
    if (template && !html) {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      let tmpl = null;
      if (isMalaysia) {
        const { data: enTmpl } = await supabase
          .from("notification_templates")
          .select("subject, html_body")
          .eq("name", `${template}_en`)
          .eq("is_active", true)
          .maybeSingle();
        if (enTmpl) tmpl = enTmpl;
      }

      if (!tmpl) {
        const { data: defaultTmpl } = await supabase
          .from("notification_templates")
          .select("subject, html_body")
          .eq("name", template)
          .eq("is_active", true)
          .maybeSingle();
        tmpl = defaultTmpl;
      }

      if (!tmpl) {
        // Built-in fallback templates if notification_templates table doesn't have the row
        const builtInTemplates: Record<string, { subject: string; html_body: string }> = {
          order_created: {
            subject: isMalaysia
              ? "Order Confirmation #{{order_number}} — Benangbaju"
              : "Konfirmasi Pesanan #{{order_number}} — Benangbaju",
            html_body: isMalaysia
              ? "<p>Hello {{customer_name}},</p><p>Thank you for ordering at Benangbaju! Your order <strong>#{{order_number}}</strong> has been received and is awaiting payment.</p>"
              : "<p>Halo {{customer_name}},</p><p>Terima kasih telah memesan di Benangbaju! Pesanan Anda <strong>#{{order_number}}</strong> telah kami terima dan menunggu pembayaran.</p>",
          },
          payment_success: {
            subject: isMalaysia
              ? "Payment Successful for Order #{{order_number}} — Benangbaju"
              : "Pembayaran Berhasil untuk Pesanan #{{order_number}} — Benangbaju",
            html_body: isMalaysia
              ? "<p>Hello {{customer_name}},</p><p>Your payment for order <strong>#{{order_number}}</strong> has been received! Our warehouse team is now preparing your items for international dispatch.</p>"
              : "<p>Halo {{customer_name}},</p><p>Pembayaran untuk pesanan <strong>#{{order_number}}</strong> telah berhasil kami terima! Tim gudang kami sedang memproses pesanan Anda.</p>",
          },
          order_shipped: {
            subject: isMalaysia
              ? "Order #{{order_number}} Dispatched ✈️ — Benangbaju"
              : "Pesanan #{{order_number}} Telah Dikirim — Benangbaju",
            html_body: isMalaysia
              ? "<p>Hello {{customer_name}},</p><p>Great news! Your order <strong>#{{order_number}}</strong> has been dispatched via {{courier_name}} with tracking number: <strong>{{tracking_number}}</strong>.</p>"
              : "<p>Halo {{customer_name}},</p><p>Kabar baik! Pesanan <strong>#{{order_number}}</strong> telah dikirimkan menggunakan kurir {{courier_name}} dengan nomor resi: <strong>{{tracking_number}}</strong>.</p>",
          },
          order_completed: {
            subject: isMalaysia
              ? "Order #{{order_number}} Completed — Benangbaju"
              : "Pesanan #{{order_number}} Selesai — Benangbaju",
            html_body: isMalaysia
              ? "<p>Hello {{customer_name}},</p><p>Your order <strong>#{{order_number}}</strong> has been completed. Thank you for shopping with us!</p>"
              : "<p>Halo {{customer_name}},</p><p>Pesanan Anda <strong>#{{order_number}}</strong> telah selesai. Terima kasih telah berbelanja di Benangbaju!</p>",
          },
          order_cancelled: {
            subject: isMalaysia
              ? "Order #{{order_number}} Cancelled — Benangbaju"
              : "Pesanan #{{order_number}} Dibatalkan — Benangbaju",
            html_body: isMalaysia
              ? "<p>Hello {{customer_name}},</p><p>Your order <strong>#{{order_number}}</strong> has been cancelled.</p>"
              : "<p>Halo {{customer_name}},</p><p>Pesanan Anda <strong>#{{order_number}}</strong> telah dibatalkan.</p>",
          },
        };

        const cleanTemplateKey = String(template).toLowerCase().replace(/_en$/, "");
        if (builtInTemplates[cleanTemplateKey]) {
          tmpl = builtInTemplates[cleanTemplateKey];
        }
      }

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

    // Append international order footer helper for Malaysia orders if not already present
    if (isMalaysia && !emailHtml.includes("International Order (Malaysia)")) {
      const internationalFooter = `
<div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 11px; color: #737373; font-family: sans-serif; line-height: 1.5;">
  🇲🇾 <strong>International Order (Malaysia)</strong>: Shipped from Bandung, Indonesia. For questions, assistance, or claims, contact <a href="mailto:cs@benangbaju.com" style="color: #4a2840; text-decoration: underline;">cs@benangbaju.com</a> or WhatsApp <a href="https://wa.me/6285179747449" style="color: #4a2840; text-decoration: underline;">+62 851-7974-7449</a>.
</div>`;
      emailHtml = emailHtml.includes("</body>")
        ? emailHtml.replace("</body>", `${internationalFooter}</body>`)
        : `${emailHtml}${internationalFooter}`;
    }

    // Send email via Resend API or SMTP Fallback
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || Deno.env.get("SMTP_FROM") || "Benangbaju <noreply@benangbaju.com>";

    if (resendApiKey) {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: Array.isArray(to) ? to : [to],
          subject: emailSubject,
          html: emailHtml,
        }),
      });

      const resendData = await resendRes.json();
      if (!resendRes.ok) {
        console.error("Resend API error:", resendData);
        throw new Error(resendData.message || resendData.name || "Gagal mengirim email via Resend API");
      }
    } else {
      // Fallback ke SMTP
      const client = new SmtpClient();

      await client.connectTLS({
        hostname: Deno.env.get("SMTP_HOST") || "smtp.resend.com",
        port: Number(Deno.env.get("SMTP_PORT") || 465),
        username: Deno.env.get("SMTP_USER") || "resend",
        password: Deno.env.get("SMTP_PASS")!,
      });

      await client.send({
        from: fromEmail,
        to,
        subject: emailSubject,
        content: emailHtml,
        html: emailHtml,
      });

      await client.close();
    }

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
