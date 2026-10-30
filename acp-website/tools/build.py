#!/usr/bin/env python3
"""
Alat build opsional untuk Alfa Creative Persada (tanpa dependensi wajib).

  python tools/build.py                       -> tulis ulang <head> SEO, sitemap.xml, robots.txt
  python tools/build.py --domain https://alfacreative.id
                                              -> sekaligus mengganti domain di semua tempat
  python tools/build.py --prerender           -> + tanam konten statis ke HTML (butuh Playwright)

Jalankan setiap selesai mengubah data/*.json atau menambah foto profil, sebelum deploy.
Sumber kebenaran SEO ada di data/site.json (url, seo.pages, brand, contact, owner).
"""
import argparse, datetime, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGES = {  # kunci -> (file, awalan path relatif)
    'home': ('index.html', ''), 'about': ('about.html', ''), 'services': ('services.html', ''),
    'portfolio': ('portfolio.html', ''), 'contact': ('contact.html', ''),
    'products': ('products/index.html', '../'), 'notfound': ('404.html', '/'),
}
LD_PAGES = ['home', 'about', 'services', 'portfolio', 'contact']
esc = lambda s: (s or '').replace('&', '&amp;').replace('"', '&quot;').replace('<', '&lt;').replace('>', '&gt;')

def load(p): return json.loads((ROOT / p).read_text(encoding='utf8'))
def save_json(p, d): (ROOT / p).write_text(json.dumps(d, ensure_ascii=False, indent=2) + '\n', encoding='utf8')

def head(site, key, pre, ld=''):
    cfg = site['seo']['pages'][key]
    base = site['url'].rstrip('/')
    canon = f"{base}/{cfg['path']}"
    img = f"{base}/{site['seo']['ogImage']}"
    name = site['brand']['fullName']
    alt = f"{name} | {site['brand']['name']}: {site['brand']['tagline']}"
    noindex = cfg.get('noindex')
    robots = 'noindex,nofollow' if noindex else 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
    is_about = key == 'about'
    L = []
    a = L.append
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
        a(f'<link rel="alternate" hreflang="id" href="{canon}">')
        a(f'<link rel="alternate" hreflang="x-default" href="{canon}">')
        a(f'<meta property="og:type" content="{"profile" if is_about else "website"}">')
        a(f'<meta property="og:site_name" content="{esc(name)}">')
        a('<meta property="og:locale" content="id_ID">')
        a(f'<meta property="og:title" content="{esc(cfg["title"])}">')
        a(f'<meta property="og:description" content="{esc(cfg["description"])}">')
        a(f'<meta property="og:url" content="{canon}">')
        a(f'<meta property="og:image" content="{img}">')
        a('<meta property="og:image:type" content="image/jpeg">')
        a('<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">')
        a(f'<meta property="og:image:alt" content="{esc(alt)}">')
        if is_about:
            first, _, last = site['owner']['name'].partition(' ')
            a(f'<meta property="profile:first_name" content="{esc(first)}"><meta property="profile:last_name" content="{esc(last)}">')
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
    for w in (300, 500):
        a(f'<link rel="preload" href="{pre}assets/fonts/poppins-latin-{w}-normal.woff2" as="font" type="font/woff2" crossorigin>')
    a(f'<link rel="stylesheet" href="{pre}assets/css/style.css">')
    if ld: a(f'<script type="application/ld+json" data-ld="1">{ld}</script>')
    return '<head>\n  ' + '\n  '.join(L) + '\n</head>'

def write_head(site, key, ld=''):
    f, pre = PAGES[key]
    path = ROOT / f
    html = path.read_text(encoding='utf8')
    new = head(site, key, pre, ld)
    html = re.sub(r'<head>.*?</head>', lambda m: new, html, count=1, flags=re.S)
    path.write_text(html, encoding='utf8')

def write_sitemap_robots(site, products):
    base = site['url'].rstrip('/')
    today = datetime.date.today().isoformat()
    prio = {'home': '1.0', 'services': '0.9', 'portfolio': '0.8', 'contact': '0.8', 'about': '0.7'}
    keys = LD_PAGES + (['products'] if products.get('enabled') else [])
    urls = ''.join(
        f"  <url>\n    <loc>{base}/{site['seo']['pages'][k]['path']}</loc>\n    <lastmod>{today}</lastmod>\n    <priority>{prio.get(k, '0.6')}</priority>\n  </url>\n"
        for k in keys)
    (ROOT / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + '</urlset>\n', encoding='utf8')
    robots = 'User-agent: *\nAllow: /\n' + ('' if products.get('enabled') else 'Disallow: /products/\n') + f'\nSitemap: {base}/sitemap.xml\n'
    (ROOT / 'robots.txt').write_text(robots, encoding='utf8')

def prerender(site):
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
        for key in LD_PAGES:
            f, _ = PAGES[key]
            pg.goto(f'http://127.0.0.1:{port}/{f}'); pg.wait_for_selector('#main .section, #main .hero, #main .page-hero', timeout=8000)
            pg.wait_for_function("document.querySelector('script[data-ld]')", timeout=8000)
            out[key] = pg.evaluate("""() => ({
              header: document.querySelector('#site-header').innerHTML,
              main: document.querySelector('#main').innerHTML,
              footer: document.querySelector('#site-footer').innerHTML,
              ld: document.querySelector('script[data-ld]').textContent })""")
        b.close()
    srv.shutdown()
    return out

def bake(key, r):
    f, _ = PAGES[key]
    path = ROOT / f
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

    site = load('data/site.json'); products = load('data/products.json')
    if a.domain:
        site['url'] = a.domain.rstrip('/')
    site['owner']['photoPublished'] = (ROOT / site['owner']['photo']).exists()   # foto profil otomatis terdeteksi
    save_json('data/site.json', site)

    for k in PAGES: write_head(site, k)            # tahap 1: head bersih (tanpa JSON-LD lama)
    write_sitemap_robots(site, products)
    if a.prerender:
        pre = prerender(site)
        for k, r in pre.items():
            write_head(site, k, ld=r['ld']); bake(k, r)
        print(f'Prerender: {len(pre)} halaman')
    print(f"OK  domain={site['url']}  foto_profil={'ada' if site['owner']['photoPublished'] else 'belum ada'}")
    if 'yourwebsite.com' in site['url']: print('!   Domain masih placeholder. Jalankan: python tools/build.py --domain https://domainanda.com --prerender')

if __name__ == '__main__':
    main()
