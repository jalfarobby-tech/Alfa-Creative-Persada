/* Alfa Creative Persada | Software & Digital Solutions
   Satu file JS untuk semua halaman: komponen reusable (navbar, footer, card, button) + render konten dari /data/*.json.
   Setiap halaman memakai <body data-page="..." data-root="...">  (root = "" di root, "../" di subfolder, "/" di 404). */
(() => {
  'use strict';

  const page = document.body.dataset.page || '';
  const root = document.body.dataset.root || '';
  const lang = document.body.dataset.lang || 'id';
  const slug = document.body.dataset.slug || '';
  let UI = {};                                              // string antarmuka (site.json -> ui), per bahasa
  const $ = (s, c = document) => c.querySelector(s);

  /* ---------- Helpers ---------- */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const PAGE_ROUTE = /^(index\.html|about\.html|services\.html|portfolio\.html|contact\.html|blog\/)/;
  const url = (p) => {
    if (/^(https?:|mailto:|tel:|#)/.test(p)) return p;
    return lang === 'en' && PAGE_ROUTE.test(p) ? `${root}en/${p}` : root + p;
  };
  const waLink = (site, msg) =>
    `https://wa.me/${String(site.contact.whatsapp).replace(/\D/g, '')}?text=${encodeURIComponent(msg || site.contact.waGreeting || '')}`;
  /* Gabungkan terjemahan ke data dasar: objek digabung per kunci, array berisi {id} digabung per id, lainnya diganti */
  const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
  const merge = (a, b) => {
    if (Array.isArray(a) && Array.isArray(b)) {
      const keyed = (arr) => arr.every((x) => isObj(x) && x.id);
      return keyed(a) && keyed(b) ? a.map((x) => { const y = b.find((z) => z.id === x.id); return y ? merge(x, y) : x; }) : b;
    }
    if (isObj(a) && isObj(b)) { const o = { ...a }; Object.keys(b).forEach((k) => { o[k] = k in a ? merge(a[k], b[k]) : b[k]; }); return o; }
    return b;
  };
  const loadJSON = async (name) => {
    const r = await fetch(`${root}data/${name}.json`);
    if (!r.ok) throw new Error(`Gagal memuat ${name}.json`);
    const base = await r.json();
    if (lang === 'id') return base;
    try {
      const t = await fetch(`${root}data/${lang}/${name}.json`);
      return t.ok ? merge(base, await t.json()) : base;
    } catch (_) { return base; }
  };

  /* Data yang dibutuhkan tiap halaman (site.json selalu dimuat) */
  const NEEDS = {
    home: ['services', 'projects', 'stack', 'faq', 'blog'],
    about: ['stack'],
    services: ['services', 'stack', 'faq'],
    portfolio: ['projects', 'stack'],
    contact: ['services', 'stack'],
    products: ['products'],
    blog: ['blog'],
    article: ['blog'],
    notfound: []
  };

  /* ---------- Icons (outline) ---------- */
  const ICONS = {
    code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    smartphone: '<rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
    chart: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    arrow: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    message: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l2-5.2A8.4 8.4 0 1 1 21 11.5z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22 6 12 13 2 6"/>',
    pin: '<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>',
    github: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3.1-.3 6.4-1.5 6.4-7a5.4 5.4 0 0 0-1.5-3.8 5 5 0 0 0-.1-3.8s-1.2-.4-3.9 1.5a13.4 13.4 0 0 0-7 0C6.4 1.6 5.2 2 5.2 2a5 5 0 0 0-.1 3.8A5.4 5.4 0 0 0 3.6 9.6c0 5.4 3.3 6.6 6.4 7a3.4 3.4 0 0 0-.9 2.6V22"/>',
    linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
    tool: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>'
  };
  const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.code}</svg>`;

  /* ---------- Logo (SVG inline, dua tone silver) ---------- */
  const logoS = (cls = '') =>
    `<svg class="logo ${cls}" viewBox="0 0 48 48" role="img" aria-label="Logo Alfa Creative Persada"><polygon class="l1" points="12,5 42,5 36,12 14,12 14,20 6,20 6,11"/><polygon class="l1" points="14,20 36,20 42,28 14,28"/><polygon class="l2" points="34,28 42,28 42,37 36,43 6,43 12,36 34,36"/></svg>`;
  const logoA = (cls = '') =>
    `<svg class="logo ${cls}" viewBox="0 0 48 48" role="img" aria-label="Mark Alfa Creative Persada"><polygon class="l1" points="21,5 27,5 13,43 6,43"/><polygon class="l2" points="21,5 27,5 42,43 35,43"/><polygon class="l1" points="11,32 37,32 39,38 9,38"/></svg>`;

  /* ---------- Komponen reusable ---------- */
  const brand = (site) =>
    `<a class="brand" href="${esc(url('index.html'))}" aria-label="${esc(site.brand.short)}, ${esc(UI.backHome)}">${logoS()}<span class="brand-text"><span>${esc(site.brand.wordmark[0])}</span><span>${esc(site.brand.wordmark[1])}</span></span></a>`;

  const button = (label, href, { ghost = false, ext = false, ico = '' } = {}) =>
    `<a class="btn${ghost ? ' btn--ghost' : ''}" href="${esc(url(href))}"${ext ? ' target="_blank" rel="noopener"' : ''}>${esc(label)}${ico ? icon(ico) : ''}</a>`;

  const sectionHead = (eyebrow, title, text, extra = '') =>
    `<div class="section-head${extra ? ' section-head--row' : ''} reveal"><div><span class="eyebrow">${esc(eyebrow)}</span><h2>${esc(title)}</h2>${text ? `<p>${esc(text)}</p>` : ''}</div>${extra}</div>`;

  const pageHero = (eyebrow, title, text) =>
    `<section class="page-hero"><span class="diag diag--tr" aria-hidden="true"></span><div class="container fade-in"><span class="eyebrow">${esc(eyebrow)}</span><h1 class="title-line">${esc(title)}</h1>${text ? `<p>${esc(text)}</p>` : ''}</div></section>`;

  const checklist = (items = []) =>
    `<ul class="checklist">${items.map((t) => `<li>${icon('check')}<span>${esc(t)}</span></li>`).join('')}</ul>`;

  const serviceCard = (s, i = 0) =>
    `<a class="card service-card reveal" style="--d:${i * 0.06}s" href="${esc(url('services.html'))}#${esc(s.id)}"><span class="icon">${icon(s.icon)}</span><h3>${esc(s.title)}</h3><p>${esc(s.short)}</p><span class="card-link">${esc(UI.detail)} ${icon('arrow')}</span></a>`;

  const hostOf = (u) => { try { return new URL(u).host.replace(/^www\./, ''); } catch (_) { return ''; } };
  const thumbOf = (img, alt, link = '') => img
    ? `<div class="thumb thumb--shot"><div class="thumb-bar" aria-hidden="true"><i></i><i></i><i></i>${hostOf(link) ? `<span>${esc(hostOf(link))}</span>` : ''}</div><div class="thumb-img"><img src="${esc(url(img))}" alt="${esc(alt)}" loading="lazy" decoding="async" width="1200" height="575"></div></div>`
    : `<div class="thumb thumb--ph" aria-hidden="true">${logoA()}</div>`;

  const catLabel = (p, cats) => (cats.find((c) => c.id === p.category) || {}).label || p.category;

  /* Kartu proyek di Home (tautan ke portfolio) */
  const projectCard = (p, cats = [], i = 0) =>
    `<a class="card project-card reveal" style="--d:${i * 0.06}s" href="${esc(url('portfolio.html'))}#${esc(p.id)}">${thumbOf(p.image, p.title, p.link)}<div class="project-body"><span class="tag">${esc(catLabel(p, cats))}</span><h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p><div class="tags">${(p.stack || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div></div></a>`;

  /* Kartu proyek di halaman Portfolio (bisa difilter) */
  const projectItem = (p, cats = [], i = 0) => {
    const link = p.link ? `<a class="card-link" href="${esc(p.link)}" target="_blank" rel="noopener">${esc(p.linkLabel || UI.viewProject)} ${icon('arrow')}</a>` : '';
    const meta = p.note ? `<p class="meta">${esc(p.note)}</p>` : '';
    return `<article class="card project-card reveal" id="${esc(p.id)}" data-cat="${esc(p.category)}" style="--d:${(i % 3) * 0.06}s">${thumbOf(p.image, p.title, p.link)}<div class="project-body"><span class="tag">${esc(catLabel(p, cats))}</span><h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p><div class="tags">${(p.stack || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>${meta}${link ? `<div class="links">${link}</div>` : ''}</div></article>`;
  };

  const stackSection = (stack, intro, alt = false) => `
<section class="section${alt ? ' section--alt' : ''}"><div class="container">
  ${sectionHead(intro.eyebrow, intro.title, intro.text)}
  <div class="stack-grid">${stack.groups.map((g, i) => `<div class="card stack-card reveal" style="--d:${i * 0.06}s"><span class="icon">${icon(g.icon)}</span><h3>${esc(g.title)}</h3><ul class="chips">${g.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>`).join('')}</div>
</div></section>`;

  const faqFor = (data) => {
    if (!data.faq) return [];
    const all = data.faq.items || [];
    return page === 'home' ? all.filter((i) => i.home) : all;
  };

  const faqSection = (data) => {
    const items = faqFor(data);
    if (!items.length) return '';
    const f = data.faq;
    const more = page === 'home' ? button(UI.allFaq, 'services.html#faq', { ghost: true, ico: 'arrow' }) : '';
    return `<section class="section" id="faq"><div class="container">
  ${sectionHead(f.eyebrow, f.title, f.text, more)}
  <div class="faq">${items.map((i) => `<details class="faq-item reveal"><summary><span>${esc(i.q)}</span><i aria-hidden="true"></i></summary><div class="faq-a"><p>${esc(i.a)}</p></div></details>`).join('')}</div>
</div></section>`;
  };

  /* ---------- Blog ---------- */
  const fmtDate = (d) => new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'id-ID', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(d));
  const postUrl = (p) => `blog/${p.id}.html`;
  const postCard = (p, i = 0) =>
    `<a class="card post-card reveal" style="--d:${i * 0.06}s" href="${esc(url(postUrl(p)))}"><div class="post-meta"><time datetime="${esc(p.date)}">${esc(fmtDate(p.date))}</time><span>${esc(p.minutes)} ${esc(UI.minRead)}</span></div><h3>${esc(p.title)}</h3><p>${esc(p.excerpt)}</p><div class="tags">${(p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div><span class="card-link">${esc(UI.readMore)} ${icon('arrow')}</span></a>`;
  const sortedPosts = (blog) => [...blog.posts].sort((a, b) => b.date.localeCompare(a.date));
  const blogSection = (site, blog) => {
    const i = site.home.blogIntro;
    return `<section class="section"><div class="container">
  ${sectionHead(i.eyebrow, i.title, i.text, button(UI.allArticles, 'blog/', { ghost: true, ico: 'arrow' }))}
  <div class="grid grid--3">${sortedPosts(blog).slice(0, 3).map(postCard).join('')}</div>
</div></section>`;
  };

  const ctaBand = (site) => {
    const c = site.home.cta;
    return `<section class="cta-band"><span class="diag diag--tr" aria-hidden="true"></span><span class="diag diag--bl" aria-hidden="true"></span><div class="container reveal"><span class="eyebrow">${esc(c.eyebrow)}</span><h2>${esc(c.title)}</h2><p>${esc(c.text)}</p><div class="btn-row">${button(UI.chatWa, waLink(site, site.contact.waGreeting), { ext: true, ico: 'message' })}${button(UI.contactPage, 'contact.html', { ghost: true })}</div></div></section>`;
  };

  /* ---------- Header & Footer ---------- */
  /* Pengalih bahasa: tampil hanya di halaman yang punya padanan */
  const REL = { home: 'index.html', about: 'about.html', services: 'services.html', portfolio: 'portfolio.html', contact: 'contact.html', blog: 'blog/' };
  const relPath = () => (page === 'article' ? `blog/${slug}.html` : REL[page]);
  const langSwitch = () => {
    const rel = relPath();
    if (!rel) return '';
    const href = lang === 'en' ? root + rel : `${root}en/${rel}`;
    return `<a class="lang-switch" href="${esc(href)}" hreflang="${esc(UI.switchLang)}" lang="${esc(UI.switchLang)}" aria-label="${esc(UI.switchLabel)}">${esc(UI.switchCode)}</a>`;
  };

  function renderHeader(site) {
    const links = site.nav
      .filter((n) => !n.hidden)
      .map((n) => `<li><a href="${esc(url(n.href))}"${n.page === page || (n.page === 'blog' && page === 'article') ? ' aria-current="page"' : ''}>${esc(n.label)}</a></li>`)
      .join('');
    $('#site-header').innerHTML = `<div class="container nav">${brand(site)}<nav id="nav-menu" class="nav-menu" aria-label="${esc(UI.menuLabel)}"><ul>${links}</ul><a class="btn btn--sm nav-cta" href="${esc(url('contact.html'))}">${esc(UI.hire)}</a>${langSwitch()}</nav><button class="burger" type="button" aria-label="${esc(UI.menuOpen)}" aria-expanded="false" aria-controls="nav-menu"><span></span><span></span><span></span></button></div>`;
  }

  function renderFooter(site) {
    const links = site.nav.filter((n) => !n.hidden).map((n) => `<li><a href="${esc(url(n.href))}">${esc(n.label)}</a></li>`).join('');
    const social = (site.social || [])
      .filter((s) => s.url)
      .map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener" aria-label="${esc(s.name)}">${icon(s.icon)}</a>`)
      .join('');
    $('#site-footer').innerHTML = `<span class="diag diag--tr" aria-hidden="true"></span><div class="container"><div class="footer-grid"><div>${brand(site)}<p>${esc(site.brand.acpTagline)}. ${esc(site.brand.fullName)} by ${esc(site.owner.name)}.</p>${social ? `<div class="social">${social}</div>` : ''}</div><div><h4>${esc(UI.footerMenu)}</h4><ul class="footer-links">${links}</ul></div><div><h4>${esc(UI.footerContact)}</h4><ul class="footer-contact"><li>${icon('mail')}<a href="mailto:${esc(site.contact.email)}">${esc(site.contact.email)}</a></li><li>${icon('message')}<a href="${esc(waLink(site))}" target="_blank" rel="noopener">${esc(site.contact.whatsappDisplay)}</a></li><li>${icon('pin')}<span>${esc(site.contact.location)}</span></li></ul></div></div><div class="footer-bottom"><span>&copy; ${new Date().getFullYear()} ${esc(site.brand.fullName)}. ${esc(UI.rights)}</span><span>${esc(site.brand.tagline)}</span></div></div>`;
  }

  /* ---------- Halaman: Home ---------- */
  function renderHome({ site, services, projects, stack, faq, blog }) {
    const h = site.home.hero;
    const featured = projects.projects.filter((p) => p.featured).slice(0, 3);
    return `
<section class="hero"><span class="diag diag--tr" aria-hidden="true"></span><div class="container hero-inner">
  <div class="fade-in">
    <span class="eyebrow">${esc(h.eyebrow)}</span>
    <h1 class="title-line">${site.brand.wordmark.map((w) => `<span>${esc(w)}</span>`).join('')}</h1>
    <p class="tagline">${esc(site.brand.tagline)}</p>
    <p class="desc">${esc(h.desc)}</p>
    <div class="btn-row">${button(h.ctaPrimary.label, h.ctaPrimary.href)}${button(h.ctaSecondary.label, waLink(site, site.contact.waGreeting), { ghost: true, ext: true, ico: 'message' })}</div>
  </div>
  <div class="vline" aria-hidden="true"></div>
  <div class="hero-art fade-in" aria-hidden="true">${logoS()}</div>
</div></section>

<section class="section section--alt"><div class="container">
  ${sectionHead(UI.servicesEyebrow, site.home.servicesIntro.title, site.home.servicesIntro.text, button(UI.allServices, 'services.html', { ghost: true, ico: 'arrow' }))}
  <div class="grid grid--3">${services.services.map(serviceCard).join('')}</div>
</div></section>

<section class="section"><div class="container">
  ${sectionHead(UI.portfolioEyebrow, site.home.portfolioIntro.title, site.home.portfolioIntro.text, button(UI.viewPortfolio, 'portfolio.html', { ghost: true, ico: 'arrow' }))}
  <div class="grid grid--3">${featured.map((p, i) => projectCard(p, projects.categories, i)).join('')}</div>
</div></section>
${stackSection(stack, site.home.stackIntro, true)}
${blogSection(site, blog)}
${faqSection({ faq })}
${ctaBand(site)}`;
  }

  /* ---------- Halaman: About ---------- */
  function renderAbout({ site, stack }) {
    const a = site.about;
    const o = site.owner;
    return `
${pageHero(a.hero.eyebrow, a.hero.title, a.hero.text)}

<section class="section"><div class="container about-grid">
  <figure class="profile-photo reveal">
    <div class="photo-frame">
      <img src="${esc(url(o.photo))}" alt="${esc(o.name)}, ${esc(o.role)} ${esc(site.brand.fullName)}" width="480" height="600" decoding="async" data-photo>
      <div class="photo-ph" hidden aria-hidden="true">${logoA()}<span>${esc(UI.photoPh)}</span></div>
    </div>
    <figcaption><strong>${esc(o.name)}</strong><span>${esc(o.role)}</span></figcaption>
  </figure>
  <div class="profile-text reveal">
    <span class="eyebrow">${esc(a.profile.eyebrow)}</span>
    <h2 class="title-line">${esc(a.profile.title)}</h2>
    ${a.profile.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}
    <dl class="facts">${a.profile.facts.map((f) => `<dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd>`).join('')}</dl>
  </div>
</div></section>

<section class="section section--alt"><div class="container">
  ${sectionHead(a.valuesIntro.eyebrow, a.valuesIntro.title, a.valuesIntro.text)}
  <div class="grid grid--3">${a.values.map((v, i) => `<div class="card reveal" style="--d:${i * 0.06}s"><span class="icon">${icon(v.icon)}</span><h3>${esc(v.title)}</h3><p>${esc(v.text)}</p></div>`).join('')}</div>
</div></section>

${stackSection(stack, site.home.stackIntro)}

<section class="section section--alt"><div class="container">
  <div class="acp-block reveal">${logoA()}<div><span class="eyebrow">${esc(a.acp.eyebrow)}</span><h2>${esc(a.acp.title)}</h2><p>${esc(a.acp.text)}</p></div></div>
</div></section>

${ctaBand(site)}`;
  }

  /* ---------- Halaman: Services ---------- */
  function renderServices({ site, services, faq }) {
    const s = site.servicesPage;
    return `
${pageHero(s.hero.eyebrow, s.hero.title, s.hero.text)}

<section class="section"><div class="container">
  <div class="grid grid--3">${services.services.map((v, i) => `
    <article class="card service-detail reveal" id="${esc(v.id)}" style="--d:${(i % 3) * 0.07}s">
      <span class="icon">${icon(v.icon)}</span>
      <h2>${esc(v.title)}</h2>
      <p class="lead">${esc(v.description)}</p>
      ${checklist(v.features)}
      <div class="card-foot">${button(UI.consult, waLink(site, UI.waConsult.replace('{layanan}', v.title)), { ghost: true, ext: true, ico: 'message' })}</div>
    </article>`).join('')}
  </div>
</div></section>

<section class="section section--alt"><div class="container">
  ${sectionHead(s.process.eyebrow, s.process.title, s.process.text)}
  <ol class="process">${services.process.map((p, i) => `<li class="reveal" style="--d:${i * 0.06}s"><span class="step-no">${esc(p.step)}</span><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></li>`).join('')}</ol>
</div></section>

${faqSection({ faq })}
${ctaBand(site)}`;
  }

  /* ---------- Halaman: Portfolio ---------- */
  function renderPortfolio({ site, projects }) {
    const p = site.portfolioPage;
    return `
${pageHero(p.hero.eyebrow, p.hero.title, p.hero.text)}

<section class="section"><div class="container">
  <div class="filters reveal" role="group" aria-label="${esc(UI.filterLabel)}">${projects.categories.map((c, i) => `<button class="chip" type="button" data-filter="${esc(c.id)}" aria-pressed="${i === 0}">${esc(c.label)}</button>`).join('')}</div>
  <div class="grid grid--3" id="project-grid">${projects.projects.map((x, i) => projectItem(x, projects.categories, i)).join('')}</div>
  <p class="empty" id="project-empty" hidden>${esc(UI.emptyCat)}</p>
  <p class="note">${esc(p.note)}</p>
</div></section>

${ctaBand(site)}`;
  }

  /* ---------- Halaman: Contact ---------- */
  function renderContact({ site, services }) {
    const c = site.contact;
    const cp = site.contactPage;
    const hasForm = Boolean(c.formEndpoint);
    const buttons = hasForm
      ? `<button class="btn" type="submit" data-channel="form">${esc(UI.send)}</button><button class="btn btn--ghost" type="submit" data-channel="wa">${esc(UI.wa)}</button>`
      : `<button class="btn" type="submit" data-channel="wa">${esc(UI.sendWa)}</button><button class="btn btn--ghost" type="submit" data-channel="mail">${esc(UI.sendMail)}</button>`;
    const social = (site.social || []).filter((s) => s.url).map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener" aria-label="${esc(s.name)}">${icon(s.icon)}</a>`).join('');
    return `
${pageHero(cp.hero.eyebrow, cp.hero.title, cp.hero.text)}

<section class="section"><div class="container contact-grid">
  <div class="reveal">
    <form id="contact-form" class="form">
      <div class="field-row">
        <div class="field"><label for="f-name">${esc(UI.formName)}</label><input id="f-name" name="name" type="text" autocomplete="name" required placeholder="${esc(UI.formNamePh)}"></div>
        <div class="field"><label for="f-email">${esc(UI.formEmail)}</label><input id="f-email" name="email" type="email" autocomplete="email" required placeholder="nama@email.com"></div>
      </div>
      <div class="field"><label for="f-service">${esc(UI.formService)}</label>
        <select id="f-service" name="service"><option value="">${esc(UI.formServicePh)}</option>${services.services.map((s) => `<option value="${esc(s.title)}">${esc(s.title)}</option>`).join('')}<option value="${esc(UI.formOther)}">${esc(UI.formOther)}</option></select></div>
      <div class="field"><label for="f-message">${esc(UI.formMessage)}</label><textarea id="f-message" name="message" required placeholder="${esc(UI.formMessagePh)}"></textarea></div>
      <input type="hidden" name="_subject" value="${esc(UI.formSubject)}">
      <input class="hp" type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true">
      <div class="btn-row">${buttons}</div>
      <p id="form-status" class="form-status" role="status" aria-live="polite"></p>
    </form>
  </div>
  <aside class="card info-card reveal" style="--d:.08s">
    <h2>${esc(cp.info.title)}</h2>
    <ul class="info-list">
      <li><span class="icon">${icon('mail')}</span><div><small>${esc(UI.infoEmail)}</small><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></div></li>
      <li><span class="icon">${icon('message')}</span><div><small>${esc(UI.infoWa)}</small><a href="${esc(waLink(site))}" target="_blank" rel="noopener">${esc(c.whatsappDisplay)}</a></div></li>
      <li><span class="icon">${icon('pin')}</span><div><small>${esc(UI.infoLoc)}</small><span class="v">${esc(c.location)}</span></div></li>
      <li><span class="icon">${icon('zap')}</span><div><small>${esc(UI.infoResp)}</small><span class="v">${esc(cp.info.response)}</span></div></li>
    </ul>
    ${social ? `<div class="social">${social}</div>` : ''}
  </aside>
</div></section>`;
  }

  /* ---------- Halaman: 404 ---------- */
  function renderNotFound({ site }) {
    const n = site.notFound;
    return `<section class="page-hero nf"><span class="diag diag--tr" aria-hidden="true"></span><div class="container fade-in"><span class="nf-code" aria-hidden="true">404</span><span class="eyebrow">${esc(n.eyebrow)}</span><h1 class="title-line">${esc(n.title)}</h1><p>${esc(n.text)}</p><div class="btn-row">${button('Kembali ke Beranda', 'index.html')}${button('Hubungi Kami', 'contact.html', { ghost: true })}</div></div></section>`;
  }

  /* ---------- Halaman: Blog & Artikel ---------- */
  function renderBlog({ site, blog }) {
    const b = site.blogPage;
    return `
${pageHero(b.hero.eyebrow, b.hero.title, b.hero.text)}

<section class="section"><div class="container">
  <div class="grid grid--3">${sortedPosts(blog).map(postCard).join('')}</div>
</div></section>

${ctaBand(site)}`;
  }

  const bodyBlock = (b) => (b.h ? `<h2>${esc(b.h)}</h2>` : b.ul ? `<ul>${b.ul.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : `<p>${esc(b.p)}</p>`);

  function renderArticle({ site, blog }) {
    const post = blog.posts.find((x) => x.id === slug);
    if (!post) return renderNotFound({ site });
    const others = sortedPosts(blog).filter((x) => x.id !== post.id).slice(0, 2);
    return `
<section class="page-hero article-hero"><div class="container fade-in">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="${esc(url('index.html'))}">${esc(UI.breadHome)}</a><span aria-hidden="true">/</span><a href="${esc(url('blog/'))}">${esc(UI.pageNames.blog)}</a></nav>
  <h1 class="title-line">${esc(post.title)}</h1>
  <p class="post-meta"><time datetime="${esc(post.date)}">${esc(fmtDate(post.date))}</time><span>${esc(post.minutes)} ${esc(UI.minRead)}</span></p>
</div></section>

<section class="section"><div class="container article">
  <div class="prose reveal">${post.body.map(bodyBlock).join('')}</div>
  <div class="article-foot reveal"><a class="back-link" href="${esc(url('blog/'))}">${icon('arrow')} ${esc(UI.backBlog)}</a></div>
</div></section>

${others.length ? `<section class="section section--alt"><div class="container">
  ${sectionHead(UI.pageNames.blog, UI.relatedPosts, '')}
  <div class="grid grid--3">${others.map(postCard).join('')}</div>
</div></section>` : ''}

${ctaBand(site)}`;
  }

  /* ---------- Halaman: Katalog produk (menu disembunyikan lewat nav[].hidden di site.json) ---------- */
  function renderProducts({ site, products }) {
    const pp = site.productsPage;
    const q = new URLSearchParams(location.search).get('p');
    const item = products.products.find((x) => x.id === q);
    const wa = (p) => waLink(site, (products.whatsappTemplate || 'Halo Alfa Creative Persada, saya ingin memesan: {produk}').replace('{produk}', p.name));
    const banner = products.enabled ? '' : `<div class="preview-banner">${esc(pp.previewNote)}</div>`;

    if (item) {
      document.title = `${item.name} | Alfa Creative Persada`;
      return `${banner}
<section class="section"><div class="container">
  <a class="back-link" href="${esc(url('products/'))}">${icon('arrow')} Semua produk</a>
  <div class="product-detail">
    <div class="reveal">${thumbOf(item.image, item.name)}</div>
    <div class="reveal" style="--d:.08s">
      <span class="eyebrow">Produk</span>
      <h1 class="title-line">${esc(item.name)}</h1>
      <p class="tagline">${esc(item.tagline)}</p>
      <span class="price">${esc(item.price)}</span>
      <p class="desc">${esc(item.description)}</p>
      ${checklist(item.features)}
      <div class="btn-row">${button('Pesan via WhatsApp', wa(item), { ext: true, ico: 'message' })}${button('Tanya Dulu', 'contact.html', { ghost: true })}</div>
    </div>
  </div>
</div></section>`;
    }

    return `${banner}
${pageHero(pp.hero.eyebrow, pp.hero.title, pp.hero.text)}
<section class="section"><div class="container">
  <div class="grid grid--3">${products.products.map((p, i) => `<a class="card project-card reveal" style="--d:${i * 0.06}s" href="${esc(url('products/'))}?p=${encodeURIComponent(p.id)}">${thumbOf(p.image, p.name)}<div class="project-body"><span class="tag">Produk</span><h3>${esc(p.name)}</h3><p>${esc(p.tagline)}</p><span class="price">${esc(p.price)}</span><span class="card-link">Detail ${icon('arrow')}</span></div></a>`).join('')}</div>
</div></section>
${ctaBand(site)}`;
  }

  const PAGES = {
    home: renderHome,
    about: renderAbout,
    services: renderServices,
    portfolio: renderPortfolio,
    contact: renderContact,
    products: renderProducts,
    blog: renderBlog,
    article: renderArticle,
    notfound: renderNotFound
  };

  /* ---------- SEO: JSON-LD (disusun dari site.json + data halaman) ---------- */
  const PAGE_PATH = { home: '', about: 'about.html', services: 'services.html', portfolio: 'portfolio.html', contact: 'contact.html', blog: 'blog/', article: '' };
  const PAGE_TYPE = { home: 'WebPage', about: 'AboutPage', services: 'WebPage', portfolio: 'CollectionPage', contact: 'ContactPage', blog: 'Blog', article: 'WebPage' };

  function injectSEO(site, data = {}) {
    if (!(page in PAGE_PATH)) return;                       // 404 & katalog tersembunyi: tanpa JSON-LD
    const base = site.url.replace(/\/$/, '');
    const abs = (p = '') => `${base}/${String(p).replace(/^\//, '')}`;
    const b = site.brand, c = site.contact, o = site.owner, seo = site.seo || {};
    const lp = lang === 'en' ? 'en/' : '';
    const post = page === 'article' && data.blog ? data.blog.posts.find((x) => x.id === slug) : null;
    const path = lp + (page === 'article' ? `blog/${slug}.html` : PAGE_PATH[page]);
    const pm = { type: PAGE_TYPE[page], name: post ? post.title : (UI.pageNames || {})[page] };
    const inLang = UI.lang || 'id';
    const sameAs = (site.social || []).map((s) => s.url).filter(Boolean);
    const knows = data.stack ? data.stack.groups.flatMap((g) => g.items) : undefined;
    const orgId = abs('#org'), personId = abs('about.html#person'), siteId = abs('#website'), pageId = `${abs(path)}#webpage`;
    const metaDesc = (document.querySelector('meta[name="description"]') || {}).content || b.description;
    const place = { '@type': 'PostalAddress', addressLocality: seo.city, addressRegion: seo.region, addressCountry: seo.country };

    const graph = [
      {
        '@type': ['ProfessionalService', 'Organization'], '@id': orgId,
        name: b.fullName, alternateName: [b.name, `${b.fullName} | ${b.name}`], url: abs(),
        logo: { '@type': 'ImageObject', url: abs(b.logoPng), width: 512, height: 512 },
        image: abs(seo.ogImage), description: b.description, slogan: b.tagline,
        email: c.email, telephone: '+' + String(c.whatsapp).replace(/\D/g, ''), address: place,
        areaServed: { '@type': 'Country', name: 'Indonesia' },
        founder: { '@id': personId },
        contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', email: c.email, telephone: '+' + String(c.whatsapp).replace(/\D/g, ''), availableLanguage: ['id', 'en'], areaServed: 'ID' },
        sameAs: sameAs.length ? sameAs : undefined, knowsAbout: knows,
        hasOfferCatalog: data.services ? {
          '@type': 'OfferCatalog', name: UI.offerCatalog,
          itemListElement: data.services.services.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.title, description: s.description } }))
        } : undefined
      },
      {
        '@type': 'Person', '@id': personId, name: o.name, jobTitle: o.role, url: abs(lp + 'about.html'),
        image: o.photoPublished ? { '@type': 'ImageObject', url: abs(o.photo), caption: `${o.name}, ${o.role} ${b.fullName}` } : undefined,
        worksFor: { '@id': orgId }, homeLocation: place, sameAs: sameAs.length ? sameAs : undefined, knowsAbout: knows
      },
      { '@type': 'WebSite', '@id': siteId, url: abs(), name: b.fullName, alternateName: `${b.fullName} | ${b.name}`, inLanguage: ['id', 'en'], publisher: { '@id': orgId } },
      {
        '@type': pm.type, '@id': pageId, url: abs(path), name: document.title, description: metaDesc, inLanguage: inLang,
        isPartOf: { '@id': siteId }, about: { '@id': orgId },
        primaryImageOfPage: { '@type': 'ImageObject', url: abs(seo.ogImage), width: 1200, height: 630 },
        breadcrumb: page === 'home' ? undefined : { '@id': `${abs(path)}#breadcrumb` },
        mainEntity: page === 'about' ? { '@id': personId } : (page === 'portfolio' ? { '@id': `${abs(path)}#projects` } : (post ? { '@id': `${abs(path)}#article` } : undefined))
      }
    ];

    if (page !== 'home') {
      const crumbs = [{ name: UI.breadHome, item: abs(lp) }];
      if (post) crumbs.push({ name: UI.pageNames.blog, item: abs(`${lp}blog/`) });
      crumbs.push({ name: pm.name, item: abs(path) });
      graph.push({
        '@type': 'BreadcrumbList', '@id': `${abs(path)}#breadcrumb`,
        itemListElement: crumbs.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.name, item: x.item }))
      });
    }
    if (post) {
      graph.push({
        '@type': 'BlogPosting', '@id': `${abs(path)}#article`, headline: post.title, description: post.description,
        datePublished: post.date, dateModified: post.updated || post.date, inLanguage: inLang,
        author: { '@id': personId }, publisher: { '@id': orgId }, mainEntityOfPage: { '@id': pageId },
        image: abs(seo.ogImage), keywords: (post.tags || []).join(', ')
      });
    }
    if (page === 'blog' && data.blog) {
      graph.push({
        '@type': 'ItemList', '@id': `${abs(path)}#posts`, numberOfItems: data.blog.posts.length,
        itemListElement: sortedPosts(data.blog).map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(`${lp}blog/${x.id}.html`), name: x.title }))
      });
    }
    if (data.faq && (page === 'home' || page === 'services')) {
      const qs = faqFor(data);
      if (qs.length) graph.push({
        '@type': 'FAQPage', '@id': `${abs(path)}#faq`,
        mainEntity: qs.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } }))
      });
    }
    if (page === 'services' && data.services) {
      data.services.services.forEach((s) => graph.push({
        '@type': 'Service', '@id': abs(`${lp}services.html#${s.id}`), url: abs(`${lp}services.html#${s.id}`),
        name: s.title, serviceType: s.title, description: s.description,
        provider: { '@id': orgId }, areaServed: { '@type': 'Country', name: 'Indonesia' }
      }));
    }
    if (page === 'portfolio' && data.projects) {
      graph.push({
        '@type': 'ItemList', '@id': `${abs(path)}#projects`, name: UI.portfolioList, numberOfItems: data.projects.projects.length,
        itemListElement: data.projects.projects.map((p, i) => ({
          '@type': 'ListItem', position: i + 1,
          item: {
            '@type': 'CreativeWork', name: p.title, description: p.summary,
            url: p.link || abs(`${lp}portfolio.html#${p.id}`), image: p.image ? abs(p.image) : undefined,
            keywords: (p.stack || []).join(', '), creator: { '@id': personId }
          }
        }))
      });
    }

    document.querySelectorAll('script[data-ld]').forEach((n) => n.remove());   // selalu bangun ulang agar mengikuti data terbaru
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.dataset.ld = '1';
    s.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
    document.head.appendChild(s);
  }

  /* ---------- Interaksi ---------- */
  function setupHeader() {
    const header = $('#site-header');
    const burger = $('.burger', header);
    const setOpen = (open) => {
      header.classList.toggle('menu-open', open);
      document.body.classList.toggle('no-scroll', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? UI.menuClose : UI.menuOpen);
    };
    burger.addEventListener('click', () => setOpen(!header.classList.contains('menu-open')));
    header.addEventListener('click', (e) => { if (e.target.closest('.nav-menu a')) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    window.matchMedia('(min-width:861px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* Foto profil: jika assets/img/profile.jpg belum ada, tampilkan placeholder */
  function setupPhotoFallback() {
    document.querySelectorAll('img[data-photo]').forEach((img) => {
      const ph = img.parentElement.querySelector('.photo-ph');
      const fail = () => { img.hidden = true; if (ph) ph.hidden = false; };
      img.addEventListener('error', fail);
      if (img.complete && img.naturalWidth === 0) fail();
    });
  }

  function setupPortfolioFilter() {
    const wrap = $('.filters');
    if (!wrap) return;
    const items = [...document.querySelectorAll('#project-grid [data-cat]')];
    const empty = $('#project-empty');
    wrap.addEventListener('click', (e) => {
      const b = e.target.closest('[data-filter]');
      if (!b) return;
      wrap.querySelectorAll('[data-filter]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      const f = b.dataset.filter;
      let n = 0;
      items.forEach((el) => { const show = f === 'all' || el.dataset.cat === f; el.hidden = !show; if (show) n++; });
      empty.hidden = n > 0;
    });
  }

  function setupContactForm(site) {
    const form = $('#contact-form');
    if (!form) return;
    const status = $('#form-status');
    const say = (t, c = '') => { status.textContent = t; status.className = 'form-status ' + c; };
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (form.elements._gotcha && form.elements._gotcha.value) return;
      const ch = (e.submitter && e.submitter.dataset.channel) || 'wa';
      const f = Object.fromEntries(new FormData(form));
      const text = `${UI.waIntro}\n\n${UI.waName}: ${f.name}\n${UI.waEmail}: ${f.email}\n${UI.waService}: ${f.service || '-'}\n\n${UI.waMsg}:\n${f.message}`;
      if (ch === 'wa') {
        window.open(waLink(site, text), '_blank', 'noopener');
        say(UI.stOpenWa, 'ok');
      } else if (ch === 'mail') {
        location.href = `mailto:${site.contact.email}?subject=${encodeURIComponent(UI.mailSubject + ' ' + f.name)}&body=${encodeURIComponent(text)}`;
        say(UI.stOpenMail, 'ok');
      } else {
        say(UI.stSending);
        const btns = form.querySelectorAll('button');
        btns.forEach((b) => { b.disabled = true; });
        try {
          const r = await fetch(site.contact.formEndpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
          if (!r.ok) throw new Error('bad');
          form.reset();
          say(UI.stOk, 'ok');
        } catch (_) {
          say(UI.stErr, 'err');
        } finally {
          btns.forEach((b) => { b.disabled = false; });
        }
      }
    });
  }

  function setupReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion:reduce)').matches) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach((el) => io.observe(el));
  }

  /* ---------- Skeleton (tampil saat data belum siap / sinyal lambat) ---------- */
  const skeleton = () => `<div class="sk-page" role="status" aria-live="polite"><span class="visually-hidden">${document.documentElement.lang === 'en' ? 'Loading content…' : 'Memuat konten…'}</span><div class="container sk-hero" aria-hidden="true"><span class="sk sk-eyebrow"></span><span class="sk sk-title"></span><span class="sk sk-title sk-title--s"></span><span class="sk sk-line"></span><span class="sk sk-line sk-line--s"></span><div class="sk-btns"><span class="sk sk-btn"></span><span class="sk sk-btn"></span></div></div><div class="container sk-grid" aria-hidden="true">${Array.from({ length: 6 }, () => '<div class="sk-card"><span class="sk sk-ico"></span><span class="sk sk-line sk-line--w"></span><span class="sk sk-line"></span><span class="sk sk-line sk-line--s"></span></div>').join('')}</div></div>`;

  /* Gambar: shimmer selama memuat, lalu fade-in */
  function setupImageLoading(root) {
    root.querySelectorAll('img').forEach((img) => {
      if (img.complete) return;
      img.classList.add('img-loading');
      const done = () => img.classList.remove('img-loading');
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    });
  }

  /* ---------- Init ---------- */
  async function init() {
    const main = $('#main');
    const prerendered = !!(main && main.dataset.pre);
    if (main && !prerendered && page !== 'notfound') {
      document.documentElement.classList.add('js');
      main.setAttribute('aria-busy', 'true');
      main.innerHTML = skeleton();
    }
    try {
      const site = await loadJSON('site');
      const names = NEEDS[page] || [];
      const loaded = await Promise.all(names.map(loadJSON));
      const data = { site };
      names.forEach((n, i) => { data[n] = loaded[i]; });

      UI = site.ui || {};
      renderHeader(site);
      renderFooter(site);
      const render = PAGES[page];
      document.documentElement.classList.add('js');
      if (render) main.innerHTML = render(data);
      main.removeAttribute('aria-busy');
      setupImageLoading(main);
      setupHeader();
      setupPhotoFallback();
      setupPortfolioFilter();
      setupContactForm(site);
      injectSEO(site, data);
      setupReveal();
      if (prerendered) main.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
      if (location.hash) { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
    } catch (err) {
      console.error(err);
      $('#main').innerHTML = '<div class="container notice"><h1>Konten gagal dimuat</h1><p>Jalankan situs lewat server lokal (mis. <code>python -m http.server</code>), bukan dibuka langsung dari file.</p></div>';
    }
  }

  init();
})();
