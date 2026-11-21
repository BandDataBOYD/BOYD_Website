// Fan club signup: adds the email to the Brevo fan club list.
// Needs a Cloudflare secret named BREVO_API_KEY (set in the Pages project settings).
const LIST_ID = 2; // Brevo list "Your first list" (the fan club list)

export async function onRequestPost({ request, env }) {
  const form = await request.formData();
  if (form.get('bot-field')) return json({ ok: true }); // honeypot: quietly ignore bots
  const email = String(form.get('email') || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !form.get('consent')) {
    return json({ ok: false, error: 'invalid' }, 400);
  }
  if (!env.BREVO_API_KEY) return json({ ok: false, error: 'not-configured' }, 503);
  const r = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ email, listIds: [LIST_ID], updateEnabled: true})
  });
  if (r.ok || r.status === 204) return json({ ok: true });
  return json({ ok: false, error: 'brevo' }, 502);
}

const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json' } });
