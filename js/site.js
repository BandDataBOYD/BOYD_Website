{
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- social icons ---------- */
const SOCIAL = [
  ['Facebook', 'https://www.facebook.com/BringOutYerDeadNC', '<path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z"/>'],
  ['Instagram', 'https://www.instagram.com/bringoutyerdeadband/', '<path d="M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 3.9 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2zM12 0C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9c.2 4.4 2.6 6.8 7 7 1.2.1 1.6.1 4.9.1s3.7 0 4.9-.1c4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9c-.2-4.4-2.6-6.8-7-7C15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.4 1.4 0 1 0 0 2.9 1.4 1.4 0 0 0 0-2.9z"/>'],
  ['TikTok', 'https://www.tiktok.com/@officialbringoutyerdead', '<path d="M19.6 6.7a4.8 4.8 0 0 1-3.8-4.2V2h-3.4v13.7a2.9 2.9 0 1 1-2-2.7V9.5a6.3 6.3 0 1 0 5.4 6.2V8.8a8.2 8.2 0 0 0 4.8 1.5V6.9l-1-.2z"/>'],
  ['YouTube', 'https://www.youtube.com/channel/UCQ5zhto_H1IK1-C3n1uaO1Q', '<path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6z"/>']
];
const BLURB = { Facebook: 'Show dates, photos and the BOYD community', Instagram: 'Photos and stories from the road', TikTok: 'Short clips from the stage', YouTube: 'Full songs and jams' };
$$('[data-social-big]').forEach(el => el.innerHTML = SOCIAL.map(([n, u, p]) => `<a class="${n === 'Facebook' ? 'fb' : ''}" href="${u}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg><span><b>${n === 'Facebook' ? 'Join Us On Facebook' : n}</b><small>${BLURB[n]}</small></span></a>`).join(''));
$$('[data-social]').forEach(el => el.innerHTML = SOCIAL.map(([n, u, p]) => `<a href="${u}" aria-label="${n}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24">${p}</svg></a>`).join(''));
const yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

/* ---------- nav ---------- */
const nav = $('#nav'), burger = $('#burger'), links = $('#links');
if (nav) {
  const onScroll = () => nav.classList.toggle('solid', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
}
if (burger) {
  burger.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
  $$('a', links).forEach(a => a.addEventListener('click', () => { links.classList.remove('open'); burger.setAttribute('aria-expanded', false); }));
}

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
$$('.reveal').forEach(el => io.observe(el));

/* ---------- liquid light show ---------- */
const cv = $('#oil');
if (cv) {
  const ctx = cv.getContext('2d');
  const PALETTES = [
    ['#d8303a', '#3d6bff', '#e8b44a', '#9b3dff'],
    ['#ff7a1a', '#ff2e63', '#ffd23f', '#2ec4b6'],
    ['#3d6bff', '#00c2a8', '#7b2ff7', '#2ec4ff'],
    ['#e8b44a', '#d8303a', '#7cbb3a', '#ff7a1a']
  ];
  let pal = 0, t = Math.random() * 100;
  const blobs = Array.from({ length: 7 }, (_, i) => ({ a: i * 1.7, b: i * 2.3, s: .6 + Math.random() * .7, r: .28 + Math.random() * .22, c: i % 4 }));
  const size = () => { cv.width = Math.max(160, cv.clientWidth / 4); cv.height = Math.max(120, cv.clientHeight / 4); };
  const ro = new ResizeObserver(size); ro.observe(cv); size();
  const frame = () => {
    const W = cv.width, H = cv.height, P = PALETTES[pal];
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    for (const b of blobs) {
      const x = W * (.5 + .42 * Math.sin(t * .13 * b.s + b.a)), y = H * (.5 + .4 * Math.cos(t * .11 * b.s + b.b));
      const r = Math.max(W, H) * b.r * (1 + .15 * Math.sin(t * .3 + b.a));
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, P[b.c] + 'cc'); g.addColorStop(.6, P[b.c] + '33'); g.addColorStop(1, P[b.c] + '00');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
  };
  let raf;
  const loop = () => { t += .016; frame(); raf = requestAnimationFrame(loop); };
  const heroIO = new IntersectionObserver(([e]) => { cancelAnimationFrame(raf); if (e.isIntersecting && !reduce) loop(); });
  frame(); heroIO.observe(cv);
  $('#oilBtn').addEventListener('click', () => { pal = (pal + 1) % PALETTES.length; t += 20; frame(); });
}

/* ---------- members ---------- */
const ICON = {
  guitar: '<path d="M19 3l2 2-5.5 5.5M14 9l1 1M9.5 11.5a3.5 3.5 0 0 0-4.9 0c-1.6 1.6-.6 3.5-2.1 5-1 1 2 4 3 3 1.5-1.5 3.4-.5 5-2.1a3.5 3.5 0 0 0 0-4.9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="8.5" cy="15.5" r="1.3" fill="currentColor"/>',
  keys: '<rect x="2.5" y="6" width="19" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7 6v7M12 6v7M17 6v7M7 13v5M12 13v5M17 13v5" stroke="currentColor" stroke-width="1.8"/>',
  bass: '<path d="M20 2l2 2-7 7M13 10l1 1M10 12a4 4 0 0 0-5.6 0c-1.8 1.8-.6 4-2.4 5.8-.9.9 2.3 4.1 3.2 3.2C7 19.2 9.2 20.4 11 18.6a4 4 0 0 0 0-5.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M6.5 16.5l2-2" stroke="currentColor" stroke-width="1.8"/>',
  drums: '<ellipse cx="12" cy="9" rx="8" ry="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 9v7c0 1.7 3.6 3 8 3s8-1.3 8-3V9M3 2l7 6M21 2l-7 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'
};
const MEMBERS = [
  { n: 'Kirk Farmer', as: 'Jerry Garcia', r: 'Lead Guitar · Vocals', p: 'kirk', pics: ['kirk-sing', 'kirk-tiger', 'kirk-smile'],
    b: 'Kirk plays Jerry\'s parts: the lead guitar and the Jerry songs. He plays a replica of Jerry\'s Tiger through a Garcia-style rig, chasing the tone and touch that made those leads sing, from a sweet Stella Blue to a Morning Dew that takes the roof off.' },
  { n: 'Jonas Mac', as: 'Bob Weir', r: 'Rhythm Guitar · Vocals', p: 'jonas', pics: ['jonas-sing', 'jonas-sg', 'jonas-bw'],
    b: 'Jonas covers Bobby\'s side of the stage: rhythm guitar, the cowboy songs and the rockers. Bobby\'s odd, beautiful chord shapes are what make the two guitars talk to each other, and Jonas brings that same back-and-forth to every jam.' },
  { n: 'Chris "CJ" Johnson', as: 'The Keyboard Chair', r: 'Keyboards · Vocals', p: 'cj', pics: ['cj-sing', 'cj-floral', 'cj-keys'],
    b: 'CJ covers every era of Dead keys in one spot: Keith\'s piano, Brent\'s organ and vocals, and the Hornsby years. He also travels with a parrot, two sloths and a tie-dye bear, who ride on his keyboards every night and are the only members of the band who have never missed a cue.' },
  { n: 'Cris Perez', as: 'Phil Lesh', r: 'Bass', p: 'cris', pics: ['cris-green', 'cris-white', 'bass-lights'],
    b: 'Cris plays bass the way Phil did: as a lead voice instead of just the bottom end. Big, melodic lines that steer the jams wherever they want to go.' },
  { n: 'Seth Blanchard', as: 'Bill Kreutzmann', r: 'Drums', p: 'seth', pics: ['drums-sweater', 'seth-hat', 'drum-duo'],
    b: 'Seth plays Billy\'s side of the drum riser: the steady, swinging groove the whole band leans on, from the tightest shuffle to the longest jam.' },
  { n: 'Clay Councilman', as: 'Mickey Hart', r: 'Drums · Percussion · Vocals', p: 'clay', pics: ['drummer-smile', 'two-drummers', 'seth-outdoor'],
    b: 'Clay plays Mickey\'s side: second kit and percussion. With Seth, he brings back the Rhythm Devils, the two-drummer sound that powered the Dead live, right through Drums and Space. As a bonus, Clay also sings, adding a fourth voice to the harmonies.' }
];
const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const mem = $('#members'), md = $('#md');
if (mem) {
  mem.innerHTML = MEMBERS.map((m, i) => `<button type="button" class="m reveal" data-i="${i}" aria-haspopup="dialog"><img class="ph" src="img/members/${m.p}.jpg" alt="${esc(m.n)}" loading="lazy" width="640" height="800"><b>${esc(m.n)}</b><span>${m.r}</span><i class="more">Read More</i></button>`).join('');
  $$('.m.reveal').forEach(el => io.observe(el));
}
if (mem && md) {
  let last = null;
  const open = i => {
    const m = MEMBERS[i]; last = document.activeElement;
    $('.mdpics', md).innerHTML = m.pics.map((f, k) => `<img src="img/gallery/${f}-sm.jpg" alt="${esc(m.n)} on stage, photo ${k + 1}" loading="lazy">`).join('');
    $('.mdtxt', md).innerHTML = `<h3 id="mdt">${esc(m.n)}</h3><span>${m.r}</span><p>${m.b}</p>`;
    md.hidden = false; document.body.style.overflow = 'hidden'; $('.mdx', md).focus();
  };
  const close = () => { md.hidden = true; document.body.style.overflow = ''; if (last) last.focus(); };
  mem.addEventListener('click', e => { const b = e.target.closest('.m'); if (b) open(+b.dataset.i); });
  $('.mdx', md).addEventListener('click', close);
  md.addEventListener('click', e => { if (e.target === md) close(); });
  addEventListener('keydown', e => { if (!md.hidden && e.key === 'Escape') close(); });
}

/* ---------- setlists (from setlist.fm) ---------- */
const SETS = [
  { d: 'Oct 16, 2026', v: 'Lincoln Theatre', c: 'Raleigh, NC', part: true, s: ['Greatest Story Ever Told', 'Black-Throated Wind', 'Walk in the Sunshine', 'Playing in the Band', 'Looks Like Rain', 'Mexicali Blues', 'One More Saturday Night', 'Cassidy', 'Mississippi Half-Step Uptown Toodeloo', 'Box of Rain', 'Scarlet Begonias', 'Fire on the Mountain'] },
  { d: 'Aug 22, 2026', v: 'The Jefferson Theater', c: 'Charlottesville, VA', s: ['Deal', 'My Brother Esau', 'Hell in a Bucket', 'China Cat Sunflower', 'I Know You Rider', 'Playing in the Band', 'Wharf Rat', 'Terrapin Station', 'One More Saturday Night'] },
  { d: 'Oct 4, 2025', v: 'Parkway Brewing', c: 'Salem, VA', part: true, s: ['Bertha', 'Tennessee Jed', 'Mama Tried', 'Dire Wolf', 'Looks Like Rain', 'Deal', 'Mr. Charlie', 'Deep Elem Blues', 'Box of Rain', 'Mississippi Half-Step Uptown Toodeloo', 'Me and Bobby McGee', 'Luckenbach, Texas'] },
  { d: 'Aug 22, 2025', v: 'Lincoln Theatre', c: 'Raleigh, NC', part: true, s: ['Cold Rain and Snow', 'Minglewood Blues', 'Dire Wolf', 'El Paso', 'Tennessee Jed', 'The Music Never Stopped', "Uncle John's Band", 'Crazy Fingers', 'Man Smart, Woman Smarter', 'St. Stephen', 'Drums', 'Space'] },
  { d: 'Jul 19, 2025', v: 'The Jefferson Theater', c: 'Charlottesville, VA', part: true, s: ['Help on the Way', 'Slipknot!', "Franklin's Tower", 'Jack Straw', 'Sugaree', 'Minglewood Blues', 'Brown-Eyed Women', 'Cassidy', 'Althea', 'Deal', 'Scarlet Begonias', 'Fire on the Mountain'] },
  { d: 'Jun 13, 2025', v: 'Lincoln Theatre', c: 'Raleigh, NC', part: true, s: ['Mississippi Half-Step Uptown Toodeloo', "Walkin' Blues", 'Row Jimmy', 'When I Paint My Masterpiece', 'When Push Comes to Shove', 'Cassidy', 'Friend of the Devil', 'Let It Grow', 'Shakedown Street', 'Saint of Circumstance', 'Ship of Fools', 'Estimated Prophet'] }
];
const picker = $('#picker'), card = $('#card');
if (picker) {
  picker.innerHTML = SETS.map((x, i) => `<button type="button" role="tab" id="set${i}" aria-selected="${i === 0}" data-i="${i}">${x.v}<small>${x.d} · ${x.c}</small></button>`).join('');
  const show = i => {
    const x = SETS[i];
    $$('button', picker).forEach(b => b.setAttribute('aria-selected', b.dataset.i == i));
    card.innerHTML = `<h3>${x.v}</h3><div class="where">${x.c} · ${x.d}</div><ol>${x.s.map(s => `<li>${s}</li>`).join('')}</ol><p class="src">${x.part ? 'Partial list. ' : ''}Setlist via <a href="https://www.setlist.fm/setlists/bring-out-yer-dead-73efc609.html" target="_blank" rel="noopener">setlist.fm</a></p>`;
  };
  picker.addEventListener('click', e => { const b = e.target.closest('button'); if (b) show(+b.dataset.i); });
  show(0);
}

/* ---------- video: embed when hosted, link out when framed ---------- */
const vid = $('#video');
if (vid) vid.addEventListener('click', e => {
  if (window.self !== window.top) return;
  e.preventDefault();
  vid.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/videoseries?list=${vid.dataset.list}&autoplay=1" title="Bring Out Yer Dead videos" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
});


/* ---------- photo gallery + lightbox ---------- */
const PHOTOS = [
  ['banner-wide', '', 'The full band under the Bring Out Yer Dead banner'],
  ['psych-room', '', 'The whole band on stage with psychedelic projections covering the room'],
  ['kirk-bw', '', 'Kirk Farmer smiling mid-song, black and white'],
  ['foh-crowd', '', 'A packed floor seen from the sound booth'],
  ['jonas-smile', '', 'Jonas Mac grinning at the mic'],
  ['from-drums', '', 'The view from behind the drums out to a full theater'],
  ['cj-floral', '', 'CJ Johnson at his keyboards with his stuffed-animal crew'],
  ['two-drummers', '', 'Both drummers at work, side by side'],
  ['hands-logo', '', 'Fans with fists up in front of the band and its logo backdrop'],
  ['kirk-sing', '', 'Kirk Farmer singing with his eyes closed'],
  ['crowd-wide', '', 'A packed room watching the band under blue light'],
  ['banner-laugh', '', 'The band cracking up mid-show in red light'],
  ['drummer-smile', '', 'Drummer grinning behind his kit'],
  ['cris-green', '', 'Cris Perez on his five-string under green light'],
  ['theater-wide', '', 'The full band on a theater stage under a psychedelic screen'],
  ['jonas-kirk', '', 'Jonas and Kirk trading vocals'],
  ['drums-sweater', '', 'Drummer in a Steal Your Face sweater'],
  ['skull-screen', '', 'The band under a giant skull projection'],
  ['drum-duo', '', 'Both drummers out front for the drums segment'],
  ['balcony-crowd', '', 'A full theater floor seen from the balcony'],
  ['cris-white', '', 'Cris Perez on bass under red stage lights'],
  ['cj-crowd-2', '', 'CJ and Kirk facing a packed theater'],
  ['jonas-sing', '', 'Jonas Mac singing at the mic'],
  ['stage-green', '', 'The front line from stage left under green beams'],
  ['kirk-tiger', '', 'Kirk Farmer playing his Tiger guitar'],
  ['crowd-front', '', 'Fans dancing at the front of the stage'],
  ['bass-lights', '', 'Cris Perez on bass under stage lights'],
  ['greenroom', '', 'The band hanging out in the green room before a show']
];
const pg = $('#pgrid'), lb = $('#lb');
if (pg && lb) {
  pg.innerHTML = PHOTOS.map(([f, c, a], i) => `<button type="button" data-i="${i}" aria-label="View photo: ${a}"><img src="img/gallery/${f}-sm.jpg" alt="${a}" loading="lazy"></button>`).join('');
  const img = $('img', lb), cap = $('.lbc', lb);
  let cur = 0, last = null;
  const show = i => { cur = (i + PHOTOS.length) % PHOTOS.length; const [f, , a] = PHOTOS[cur]; img.src = `img/gallery/${f}.jpg`; img.alt = a; cap.textContent = `${cur + 1} / ${PHOTOS.length}`; };
  const open = i => { last = document.activeElement; show(i); lb.hidden = false; document.body.style.overflow = 'hidden'; $('.lbx', lb).focus(); };
  const close = () => { lb.hidden = true; document.body.style.overflow = ''; if (last) last.focus(); };
  pg.addEventListener('click', e => { const b = e.target.closest('button'); if (b) open(+b.dataset.i); });
  $('.lbx', lb).addEventListener('click', close);
  $('.lbp', lb).addEventListener('click', () => show(cur - 1));
  $('.lbn', lb).addEventListener('click', () => show(cur + 1));
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  addEventListener('keydown', e => { if (lb.hidden) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
  let x0 = null;
  lb.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1)); x0 = null; });
}

/* ---------- forms (Cloudflare Pages Functions -> Brevo) ---------- */
$$('form[data-ajax]').forEach(f => f.addEventListener('submit', async e => {
  e.preventDefault();
  const msg = f.parentElement.querySelector('.msg') || f.querySelector('.msg');
  const btn = f.querySelector('[type=submit]');
  btn.disabled = true;
  try {
    const r = await fetch(f.getAttribute('action'), { method: 'POST', body: new FormData(f) });
    if (!r.ok) throw 0;
    f.reset();
    msg.textContent = f.name === 'mailing-list' ? "You're on the list. See you at the show." : 'Thanks — we got your message.';
  } catch {
    msg.textContent = "That didn't go through. Email johnmoyerbookings@gmail.com and we'll get back to you.";
  }
  btn.disabled = false;
}));
}
