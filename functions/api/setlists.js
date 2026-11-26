// Recent setlists: pulls the band's latest setlists from setlist.fm and caches them for 6 hours.
// Needs a Cloudflare secret named SETLISTFM_API_KEY (set in the Pages project settings).
// Until the key is set, or if setlist.fm is down, this returns an error and the page
// falls back to the setlists built into js/site.js.
const ARTIST = 'Bring Out Yer Dead';
const MAX = 6;          // shows to list
const TTL = 6 * 3600;   // seconds to cache
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export async function onRequestGet({ request, env, waitUntil }) {
  if (!env.SETLISTFM_API_KEY) return json({ ok: false, error: 'not-configured' }, 503);
  const cache = caches.default;
  const key = new Request(new URL('/api/setlists', request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;

  const sets = [];
  for (let p = 1; p <= 2 && sets.length < MAX; p++) {
    const r = await fetch('https://api.setlist.fm/rest/1.0/search/setlists?artistName=' + encodeURIComponent(ARTIST) + '&p=' + p, {
      headers: { 'x-api-key': env.SETLISTFM_API_KEY, accept: 'application/json' }
    });
    if (!r.ok) { if (p === 1) return json({ ok: false, error: 'setlistfm', status: r.status }, 502); break; }
    const data = await r.json();
    const list = data.setlist || [];
    for (const x of list) {
      if (!x.artist || x.artist.name.toLowerCase() !== ARTIST.toLowerCase()) continue;
      const songs = ((x.sets && x.sets.set) || []).flatMap(s => (s.song || []).map(g => g.name)).filter(Boolean);
      if (!songs.length) continue; // show listed with no songs entered yet
      const [dd, mm, yyyy] = String(x.eventDate || '').split('-').map(Number);
      const city = (x.venue && x.venue.city) || {};
      sets.push({
        d: MONTHS[mm - 1] + ' ' + dd + ', ' + yyyy,
        v: (x.venue && x.venue.name) || '',
        c: [city.name, city.stateCode].filter(Boolean).join(', '),
        u: x.url || '',
        s: songs
      });
      if (sets.length >= MAX) break;
    }
    if (list.length < (data.itemsPerPage || 20)) break;
  }
  if (!sets.length) return json({ ok: false, error: 'empty' }, 502);

  const res = new Response(JSON.stringify({ ok: true, sets }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=' + TTL }
  });
  waitUntil(cache.put(key, res.clone()));
  return res;
}

const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
