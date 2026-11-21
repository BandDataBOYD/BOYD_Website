// Contact form: emails the message to the band through Brevo.
// Needs a Cloudflare secret named BREVO_API_KEY (set in the Pages project settings).
const TO = { email: 'kirk@BringOutYerDead.net', name: 'Bring Out Yer Dead' };
const FROM = { email: 'info@bringoutyerdead.net', name: 'BOYD Website' };

export async function onRequestPost({ request, env }) {
  const f = await request.formData();
  if (f.get('bot-field')) return json({ ok: true });
  const first = clean(f.get('first'), 80), last = clean(f.get('last'), 80);
  const email = clean(f.get('email'), 200).toLowerCase();
  const message = clean(f.get('message'), 5000);
  if (!first || !last || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: 'invalid' }, 400);
  if (!env.BREVO_API_KEY) return json({ ok: false, error: 'not-configured' }, 503);
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const r = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: FROM, to: [TO], replyTo: { email, name: `${first} ${last}` },
      subject: `Website message from ${first} ${last}`,
      htmlContent: `<p><b>From:</b> ${esc(first)} ${esc(last)} &lt;${esc(email)}&gt;</p><p>${esc(message || '(no message)').replace(/\n/g, '<br>')}</p><p style="color:#888">Sent from the contact form on bringoutyerdead.net. Hit reply to answer them directly.</p>`
    })
  });
  return r.ok ? json({ ok: true }) : json({ ok: false, error: 'brevo' }, 502);
}

const clean = (v, n) => String(v || '').trim().slice(0, n);
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json' } });
