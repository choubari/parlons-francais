import "server-only";
import { getEnv } from "@/lib/db/client";

/**
 * Email a magic sign-in link via Resend. In local dev (no RESEND_API_KEY set)
 * the link is logged to the server console so you can still sign in.
 */
export async function sendMagicLink(email: string, url: string): Promise<void> {
  const env = await getEnv();
  const isProd = process.env.NODE_ENV === "production";

  if (!env.RESEND_API_KEY) {
    console.log(`\n[auth] Magic link for ${email}:\n${url}\n`);
    return;
  }
  const from = env.RESEND_FROM || "Parlons <parlons@mail.choubari.com>";
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0b2545">
      <h1 style="font-size:22px;margin:0 0 8px">Connexion à Parlons</h1>
      <p style="color:#6b7a90;line-height:1.6">Cliquez sur le bouton ci-dessous pour vous connecter. Ce lien expire dans 15 minutes et ne peut être utilisé qu'une fois.</p>
      <a href="${url}" style="display:inline-block;margin:16px 0;background:#e1000f;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:12px">Se connecter →</a>
      <p style="color:#6b7a90;font-size:13px">Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Votre lien de connexion Parlons",
      html,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    // In dev, don't block sign-in on email delivery (e.g. Resend's test mode
    // only delivers to the account owner) — print the link to the console.
    if (!isProd) {
      console.log(
        `\n[auth] Resend send failed (${res.status}); use this link to sign in:\n${url}\n`,
      );
      return;
    }
    throw new Error(`Resend failed (${res.status}): ${detail}`);
  }
}
