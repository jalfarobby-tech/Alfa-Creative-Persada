#!/usr/bin/env python3
"""
Alat build opsional untuk Alfa Creative Persada (tanpa dependensi wajib).

  python tools/build.py                       -> tulis ulang <head> SEO, sitemap.xml, robots.txt, dan buat halaman blog/EN
  python tools/build.py --domain https://alfacreative.id
                                              -> sekaligus mengganti domain di semua tempat
  python tools/build.py --prerender           -> + tanam konten statis ke HTML (butuh Playwright)

Jalankan setiap selesai mengubah data/*.json (termasuk data/en/*.json dan data/blog.json) atau menambah foto profil, sebelum deploy.
Sumber kebenaran SEO: data/site.json (url, seo.pages, brand, contact, owner) dan terjemahannya di data/en/site.json.
Halaman artikel (blog/<id>.html dan en/blog/<id>.html) dibuat otomatis dari data/blog.json.
"""
import argparse, datetime, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LANGS = ['id', 'en']
SKIP = {'id': 'Lewati ke konten', 'en': 'Skip to content'}
# halaman dasar yang punya padanan di semua bahasa: kunci -> (file, kedalaman folder)
BASE = {'home': ('index.html', 0), 'about': ('about.html', 0), 'services': ('services.html', 0),
        'portfolio': ('portfolio.html', 0), 'contact': ('contact.html', 0), 'blog': ('blog/index.html', 1)}
PRIO = {'home': '1.0', 'services': '0.9', 'portfolio': '0.8', 'contact': '0.8', 'about': '0.7', 'blog': '0.7'}
esc = lambda s: (s or '').replace('&', '&amp;').replace('"', '&quot;').replace('<', '&lt;').replace('>', '&gt;')

def load(p): return json.loads((ROOT / p).read_text(encoding='utf8'))
def save_json(p, d): (ROOT / p).write_text(json.dumps(d, ensure_ascii=False, indent=2) + '\n', encoding='utf8')

def merge(a, b):   # sama dengan merge() di main.js
    keyed = lambda arr: all(isinstance(x, dict) and x.get('id') for x in arr)
    if isinstance(a, list) and isinstance(b, list):
        if keyed(a) and keyed(b):
            return [merge(x, next((y for y in b if y['id'] == x['id']), {})) if any(y['id'] == x['id'] for y in b) else x for x in a]
        return b
    if isinstance(a, dict) and isinstance(b, dict):
        o = dict(a)
        for k, v in b.items(): o[k] = merge(a[k], v) if k in a else v
        return o
    return b

def load_lang(name, lang):
    base = load(f'data/{name}.json')
    if lang == 'id': return base
    p = ROOT / f'data/{lang}/{name}.json'
    return merge(base, json.loads(p.read_text(encoding='utf8'))) if p.exists() else base

def page_defs(sites, blogs, products):
    """Semua halaman yang dikelola build: dict berisi key, lang, file, pre (awalan path relatif), cfg, alt (padanan bahasa)."""
    defs = []
    for lang in LANGS:
        site = sites[lang]; ep = 'en/' if lang == 'en' else ''
        for key, (f, depth) in BASE.items():
            cfg = dict(site['seo']['pages'][key]); idpath = sites['id']['seo']['pages'][key]['path']
            cfg['path'] = ep + idpath
            defs.append(dict(key=key, lang=lang, file=ep + f, pre='../' * (depth + (1 if lang == 'en' else 0)), cfg=cfg,
                             altpath={l: ('en/' if l == 'en' else '') + idpath for l in LANGS}, page=key, slug=None, ld=True))
        for post in blogs[lang]['posts']:
            cfg = dict(title=f"{post['title']} | {site['brand']['fullName']}", description=post['description'], path=f"{ep}blog/{post['id']}.html")
            defs.append(dict(key=f"post:{post['id']}", lang=lang, file=f"{ep}blog/{post['id']}.html", pre='../' * (2 if lang == 'en' else 1), cfg=cfg,
                             altpath={l: ('en/' if l == 'en' else '') + f"blog/{post['id']}.html" for l in LANGS}, page='article', slug=post['id'], ld=True,
                             og_type='article', published=post['date']))
    # halaman khusus bahasa Indonesia, tanpa padanan
    for key, f, pre in (('products', 'products/index.html', '../'), ('notfound', '404.html', '/')):
        defs.append(dict(key=key, lang='id', file=f, pre=pre, cfg=dict(sites['id']['seo']['pages'][key]), altpath=None, page=key, slug=None, ld=False))
    return defs

def shell(d, site):
    root = d['pre'] if d['pre'] != '/' else '/'
    slug = f' data-slug="{d["slug"]}"' if d['slug'] else ''
    return f'''<!DOCTYPE html>
<html lang="{d['lang']}">
<head></head>
<body data-page="{d['page']}" data-root="{root}" data-lang="{d['lang']}"{slug}>
  <a class="skip-link" href="#main">{SKIP[d['lang']]}</a>
  <header id="site-header" class="site-header"></header>
  <main id="main"></main>
  <footer id="site-footer" class="site-footer"></footer>
  <script src="{root}assets/js/main.js" defer></script>
</body>
</html>
'''

def head(site, d, ld=''):
    cfg, pre, lang = d['cfg'], d['pre'], d['lang']
    base = site['url'].rstrip('/')
    canon = f"{base}/{cfg['path']}"
    img = f"{base}/{site['seo']['ogImage']}"
    name = site['brand']['fullName']
    alt = f"{name} | {site['brand']['name']}: {site['brand']['tagline']}"
    noindex = cfg.get('noindex')
    robots = 'noindex,nofollow' if noindex else 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
    og_type = d.get('og_type') or ('profile' if d['key'] == 'about' else 'website')
    locale = {'id': 'id_ID', 'en': 'en_US'}
    L = []; a = L.append
    a('<meta charset="utf-8">')
    a('<meta name="viewport" content="width=device-width, initial-scale=1">')
    a(f"<title>{esc(cfg['title'])}</title>")
    if cfg['description']: a(f'<meta name="description" content="{esc(cfg["description"])}">')
    a(f'<meta name="robots" content="{robots}">')
    a(f'<meta name="author" content="{esc(site["owner"]["name"])}">')
    a(f'<meta name="theme-color" content="{site["seo"]["themeColor"]}">')
    a('<meta name="color-scheme" content="dark">')
    if not noindex:
        a(f'<link rel="canonical" href="{canon}">')
        alts = d.get('altpath') or {lang: cfg['path']}
        for l in LANGS:
            if l in alts: a(f'<link rel="alternate" hreflang="{l}" href="{base}/{alts[l]}">')
        a(f'<link rel="alternate" hreflang="x-default" href="{base}/{alts.get("id", cfg["path"])}">')
        a(f'<meta property="og:type" content="{og_type}">')
        a(f'<meta property="og:site_name" content="{esc(name)}">')
        a(f'<meta property="og:locale" content="{locale[lang]}">')
        for l in LANGS:
            if l != lang and l in (d.get('altpath') or {}): a(f'<meta property="og:locale:alternate" content="{locale[l]}">')
        a(f'<meta property="og:title" content="{esc(cfg["title"])}">')
        a(f'<meta property="og:description" content="{esc(cfg["description"])}">')
        a(f'<meta property="og:url" content="{canon}">')
        a(f'<meta property="og:image" content="{img}">')
        a('<meta property="og:image:type" content="image/jpeg">')
        a('<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">')
        a(f'<meta property="og:image:alt" content="{esc(alt)}">')
        if d['key'] == 'about':
            first, _, last = site['owner']['name'].partition(' ')
            a(f'<meta property="profile:first_name" content="{esc(first)}"><meta property="profile:last_name" content="{esc(last)}">')
        if og_type == 'article':
            a(f'<meta property="article:published_time" content="{d["published"]}">')
            a(f'<meta property="article:author" content="{esc(site["owner"]["name"])}">')
        a('<meta name="twitter:card" content="summary_large_image">')
        a(f'<meta name="twitter:title" content="{esc(cfg["title"])}">')
        a(f'<meta name="twitter:description" content="{esc(cfg["description"])}">')
        a(f'<meta name="twitter:image" content="{img}">')
        a(f'<meta name="twitter:image:alt" content="{esc(alt)}">')
    a(f'<link rel="icon" href="{pre}favicon.ico" sizes="48x48">')
    a(f'<link rel="icon" href="{pre}assets/img/favicon.svg" type="image/svg+xml">')
    a(f'<link rel="icon" href="{pre}assets/img/favicon-192.png" type="image/png" sizes="192x192">')
    a(f'<link rel="apple-touch-icon" href="{pre}assets/img/apple-touch-icon.png">')
    a(f'<link rel="manifest" href="{pre}manifest.webmanifest">')
    for w in (400, 500):
        if (ROOT / f'assets/fonts/poppins-latin-{w}-normal.woff2').exists():
            a(f'<link rel="preload" href="{pre}assets/fonts/poppins-latin-{w}-normal.woff2" as="font" type="font/woff2" crossorigin>')
    a(f'<link rel="stylesheet" href="{pre}assets/css/style.css">')
    if ld: a(f'<script type="application/ld+json" data-ld="1">{ld}</script>')
    return '<head>\n  ' + '\n  '.join(L) + '\n</head>'

def write_head(sites, d, ld=''):
    path = ROOT / d['file']
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists(): path.write_text(shell(d, sites[d['lang']]), encoding='utf8')
    html = path.read_text(encoding='utf8')
    new = head(sites[d['lang']], d, ld)
    html = re.sub(r'<head>.*?</head>', lambda m: new, html, count=1, flags=re.S)
    path.write_text(html, encoding='utf8')

def write_sitemap_robots(sites, defs, blogs, products):
    base = sites['id']['url'].rstrip('/')
    today = datetime.date.today().isoformat()
    items = []
    for d in defs:
        if d['cfg'].get('noindex'): continue
        items.append(d)
    if products.get('enabled'):
        items.append(dict(key='products', cfg=sites['id']['seo']['pages']['products'], altpath=None, page='products'))
    body = ''
    for d in items:
        loc = f"{base}/{d['cfg']['path']}"
        lastmod = d.get('published') or today
        pr = PRIO.get(d['key'], '0.6' if d['page'] != 'article' else '0.6')
        links = ''
        if d.get('altpath'):
            links = ''.join(f'    <xhtml:link rel="alternate" hreflang="{l}" href="{base}/{p}"/>\n' for l, p in d['altpath'].items())
            links += f'    <xhtml:link rel="alternate" hreflang="x-default" href="{base}/{d["altpath"]["id"]}"/>\n'
        body += f"  <url>\n    <loc>{loc}</loc>\n    <lastmod>{lastmod}</lastmod>\n    <priority>{pr}</priority>\n{links}  </url>\n"
    (ROOT / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + body + '</urlset>\n', encoding='utf8')
    robots = 'User-agent: *\nAllow: /\n' + ('' if products.get('enabled') else 'Disallow: /products/\n') + f'\nSitemap: {base}/sitemap.xml\n'
    (ROOT / 'robots.txt').write_text(robots, encoding='utf8')

def prerender(defs):
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print('! Playwright belum terpasang: lewati prerender (pip install playwright && playwright install chromium)'); return {}
    import http.server, socketserver, threading, functools
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
    handler.log_message = lambda *a, **k: None
    srv = socketserver.TCPServer(('127.0.0.1', 0), handler); port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    out = {}
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1280, 'height': 900})
        for d in defs:
            if not d['ld']: continue
            pg.goto(f"http://127.0.0.1:{port}/{d['file']}"); pg.wait_for_selector('#main .section, #main .hero, #main .page-hero', timeout=8000)
            pg.wait_for_function("document.querySelector('script[data-ld]')", timeout=8000)
            out[d['key'] + '|' + d['lang']] = pg.evaluate("""() => ({
              header: document.querySelector('#site-header').innerHTML,
              main: document.querySelector('#main').innerHTML,
              footer: document.querySelector('#site-footer').innerHTML,
              ld: document.querySelector('script[data-ld]').textContent })""")
        b.close()
    srv.shutdown()
    return out

def bake(d, r):
    path = ROOT / d['file']
    html = path.read_text(encoding='utf8')
    html = re.sub(r'(<header id="site-header" class="site-header">).*?(</header>)', lambda m: m.group(1) + r['header'] + m.group(2), html, count=1, flags=re.S)
    html = re.sub(r'<main id="main"[^>]*>.*?</main>', lambda m: '<main id="main" data-pre="1">' + r['main'] + '</main>', html, count=1, flags=re.S)
    html = re.sub(r'(<footer id="site-footer" class="site-footer">).*?(</footer>)', lambda m: m.group(1) + r['footer'] + m.group(2), html, count=1, flags=re.S)
    path.write_text(html, encoding='utf8')

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--domain', help='mis. https://alfacreative.id (tanpa garis miring di akhir)')
    ap.add_argument('--prerender', action='store_true', help='tanam konten statis ke HTML (butuh Playwright)')
    a = ap.parse_args()

    site0 = load('data/site.json'); products = load('data/products.json')
    if a.domain: site0['url'] = a.domain.rstrip('/')
    site0['owner']['photoPublished'] = (ROOT / site0['owner']['photo']).exists()   # foto profil otomatis terdeteksi
    save_json('data/site.json', site0)
    sites = {l: load_lang('site', l) for l in LANGS}
    blogs = {l: load_lang('blog', l) for l in LANGS}
    defs = page_defs(sites, blogs, products)

    # bersihkan artikel yatim (artikel dihapus dari blog.json)
    keep = {d['file'] for d in defs}
    for folder in ('blog', 'en/blog'):
        for f in (ROOT / folder).glob('*.html') if (ROOT / folder).exists() else []:
            rel = f.relative_to(ROOT).as_posix()
            if f.name != 'index.html' and rel not in keep: f.unlink()

    for d in defs: write_head(sites, d)              # tahap 1: head bersih (tanpa JSON-LD lama)
    write_sitemap_robots(sites, defs, blogs, products)
    if a.prerender:
        pre = prerender(defs)
        for d in defs:
            r = pre.get(d['key'] + '|' + d['lang'])
            if r: write_head(sites, d, ld=r['ld']); bake(d, r)
        print(f'Prerender: {len(pre)} halaman')
    print(f"OK  domain={site0['url']}  foto_profil={'ada' if site0['owner']['photoPublished'] else 'belum ada'}  halaman={len(defs)}")
    if 'yourwebsite.com' in site0['url']: print('!   Domain masih placeholder. Jalankan: python tools/build.py --domain https://domainanda.com --prerender')

if __name__ == '__main__':
    main()
