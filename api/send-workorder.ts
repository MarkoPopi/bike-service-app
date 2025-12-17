import { Resend } from "resend";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(s: string) {
  return escapeHtml(s).replace(/"/g, "%22");
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    // Vercel včasih da body kot string
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        // ignore
      }
    }

    const { to, customerName, date, services, appUrl } = body ?? {};

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ ok: false, error: "Missing RESEND_API_KEY" });
    }

    if (!to || typeof to !== "string" || !isValidEmail(to)) {
      return res.status(400).json({ ok: false, error: "Manjka ali neveljaven email (to)" });
    }
    if (!services || typeof services !== "string") {
      return res.status(400).json({ ok: false, error: "Manjka services" });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const from = process.env.RESEND_FROM || "Bike Service <onboarding@resend.dev>";
    const subject = `Delovni nalog${typeof customerName === "string" && customerName ? ` – ${customerName}` : ""}${
      typeof date === "string" && date ? ` (${date})` : ""
    }`;

    const safeCustomer = typeof customerName === "string" ? customerName : "";
    const safeDate = typeof date === "string" ? date : "";
    const safeAppUrl = typeof appUrl === "string" ? appUrl : "";

    const text =
      `Pozdravljeni${safeCustomer ? `, ${safeCustomer}` : ""}!\n\n` +
      `Delovni nalog:\n` +
      (safeDate ? `Datum: ${safeDate}\n` : "") +
      `\n${services}\n\n` +
      (safeAppUrl ? `Povezava: ${safeAppUrl}\n` : "") +
      `\nLp,\nBike Service`;

    const html =
      `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.45">` +
      `<h2 style="margin:0 0 8px 0">Delovni nalog</h2>` +
      (safeCustomer ? `<div><b>Stranka:</b> ${escapeHtml(safeCustomer)}</div>` : "") +
      (safeDate ? `<div><b>Datum:</b> ${escapeHtml(safeDate)}</div>` : "") +
      `<pre style="margin-top:12px;padding:12px;border:1px solid #e5e7eb;border-radius:10px;white-space:pre-wrap;">${escapeHtml(
        services
      )}</pre>` +
      (safeAppUrl ? `<div style="margin-top:12px"><a href="${escapeAttr(safeAppUrl)}">Odpri aplikacijo</a></div>` : "") +
      `<div style="margin-top:18px;color:#6b7280">Lp,<br/>Bike Service</div>` +
      `</div>`;

    const result = await resend.emails.send({ from, to, subject, text, html });

    if (result.error) {
      return res.status(500).json({ ok: false, error: result.error.message ?? String(result.error) });
    }

    return res.status(200).json({ ok: true, id: result.data?.id ?? null });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message ?? String(e) });
  }
}
