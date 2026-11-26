#!/usr/bin/env python3
"""Buat ulang aset logo perusahaan (tanda A): favicon, ikon HP, logo-512, gambar share (OG), logo WhatsApp.
Pakai:  python tools/make_brand.py [--wa-out /path/logo-wa.png]
Butuh:  pip install playwright pillow"""
import argparse, asyncio, json
from pathlib import Path
from PIL import Image
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / 'assets/img'
fonts = (ROOT / 'assets/fonts').as_uri()

A_POLY = ('<polygon fill="#E6E6E6" points="24,4 45.33,36 37.33,36 24,16 10.67,36 2.67,36"/>'
          '<polygon fill="#8A8D93" points="24,21 38.67,43 32.67,43 24,30 15.33,43 9.33,43"/>')
A_SVG = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">{A_POLY}</svg>'

site = json.load(open(ROOT / 'data/site.json', encoding='utf8'))
b = site['brand']
SERVICES = ' · '.join(['Website', 'Sistem', 'Aplikasi', 'Dashboard', 'Otomasi'])

FONT_CSS = ''.join(
    f"@font-face{{font-family:P;font-weight:{w};src:url({fonts}/poppins-latin-{w}-normal.woff2)}}" for w in (300, 400, 500))

FAVICON = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="48" height="48" rx="8" fill="#0B0B0B"/>
  <g transform="translate(4 4) scale(.83)">{A_POLY}</g>
</svg>
'''

ICON_HTML = '''<html><body style="margin:0;background:#0B0B0B">{svg}</body></html>'''

LOGO_HTML = f'''<html><body style="margin:0;width:1024px;height:1024px;background:radial-gradient(circle at 50% 50%,#1b1b1c 0%,#0f0f10 55%,#0a0a0a 100%);position:relative">
<svg width="1024" height="1024" style="position:absolute;inset:0"><circle cx="512" cy="512" r="440" fill="none" stroke="#2c2c2e" stroke-width="2"/><circle cx="512" cy="512" r="380" fill="none" stroke="#212123" stroke-width="2"/></svg>
<svg viewBox="0 0 48 48" width="560" height="560" style="position:absolute;left:232px;top:232px">{A_POLY}</svg></body></html>'''

OG_HTML = f'''<html><head><style>{FONT_CSS}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1200px;height:630px;background:linear-gradient(120deg,#0a0a0a 0%,#101011 55%,#1c1c1d 100%);font-family:P,sans-serif;color:#fff;position:relative;overflow:hidden}}
.lines{{position:absolute;right:0;top:0;width:330px;height:300px;opacity:.5;background:repeating-linear-gradient(135deg,transparent 0 9px,rgba(255,255,255,.07) 9px 10px);-webkit-mask-image:linear-gradient(225deg,#000 0,transparent 80%)}}
.t{{position:absolute;left:80px}}
.e{{top:98px;font-weight:300;font-size:23px;letter-spacing:.3em;color:#B9BDC6}}
.h{{top:200px;font-weight:400;font-size:58px;letter-spacing:.1em;line-height:1.28}}
.h span:last-child{{color:#C9CBD1}}
.r{{top:366px;width:56px;height:2px;background:#C9CBD1}}
.g{{top:396px;font-weight:400;font-size:27px;letter-spacing:.22em;color:#B9BDC6}}
.s{{top:504px;font-weight:300;font-size:26px;color:#9a9da6}}
.art{{position:absolute;right:34px;top:135px;width:360px;height:360px}}
.art svg.m{{position:absolute;left:96px;top:96px;width:168px;height:168px}}
</style></head><body><div class="lines"></div>
<div class="t e">{b['fullName'].upper()}</div>
<div class="t h"><span>{b['wordmark'][0]}</span><br><span>{b['wordmark'][1]}</span></div>
<div class="t r"></div><div class="t g">{b['tagline'].upper()}</div>
<div class="t s">{SERVICES}</div>
<div class="art"><svg width="360" height="360" style="position:absolute;inset:0"><circle cx="180" cy="180" r="178" fill="none" stroke="#2f2f31" stroke-width="1.5"/><circle cx="180" cy="180" r="128" fill="none" stroke="#3a3a3d" stroke-width="1.5"/></svg>
<svg class="m" viewBox="0 0 48 48">{A_POLY}</svg></div></body></html>'''


async def main(wa_out):
    (IMG / 'favicon.svg').write_text(FAVICON, encoding='utf8')
    kit = IMG / 'brand'; kit.mkdir(exist_ok=True)
    def mk(c1, c2): return A_POLY.replace('#E6E6E6', c1).replace('#8A8D93', c2)
    for name, (c1, c2) in {'logo-mark.svg': ('#E6E6E6', '#8A8D93'), 'logo-mark-terang.svg': ('#17181A', '#6E727A'),
                           'logo-mark-satu-warna.svg': ('#FFFFFF', '#FFFFFF')}.items():
        (kit / name).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">{mk(c1, c2)}</svg>\n', encoding='utf8')
    async with async_playwright() as p:
        br = await p.chromium.launch()
        async def shot(html, w, h, out, **kw):
            pg = await br.new_page(viewport={'width': w, 'height': h}, device_scale_factor=1)
            tmp = ROOT / '_brand_tmp.html'; tmp.write_text(html, encoding='utf8')
            await pg.goto(tmp.as_uri()); await pg.evaluate('document.fonts.ready'); await pg.wait_for_timeout(500)
            tmp.unlink()
            await pg.screenshot(path=str(out), omit_background=False, **kw); await pg.close()
        for size, name in ((48, 'favicon-48.png'), (192, 'favicon-192.png'), (180, 'apple-touch-icon.png')):
            svg = FAVICON.replace('<svg ', f'<svg width="{size}" height="{size}" ', 1)
            await shot(ICON_HTML.format(svg=svg), size, size, IMG / name)
        await shot(LOGO_HTML, 1024, 1024, IMG / '_logo1024.png')
        await shot(OG_HTML, 1200, 630, IMG / '_og.png')
        await br.close()
    big = Image.open(IMG / '_logo1024.png').convert('RGB')
    big.resize((512, 512), Image.LANCZOS).save(IMG / 'logo-512.png', optimize=True)
    if wa_out: big.save(wa_out)
    Image.open(IMG / '_og.png').convert('RGB').save(IMG / 'og-image.jpg', quality=90, optimize=True)
    Image.open(IMG / 'favicon-48.png').convert('RGBA').save(
        ROOT / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
    (IMG / '_logo1024.png').unlink(); (IMG / '_og.png').unlink()
    print('OK: favicon.svg/ico, favicon-48/192, apple-touch-icon, logo-512, og-image' + (f', WA -> {wa_out}' if wa_out else ''))


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--wa-out')
    asyncio.run(main(ap.parse_args().wa_out))
