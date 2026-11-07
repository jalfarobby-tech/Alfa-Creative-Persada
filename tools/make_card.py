#!/usr/bin/env python3
"""
Buat kartu nama siap cetak (PDF 2 halaman: depan & belakang, ukuran 90x55 mm + bleed 3 mm per sisi).

  python tools/make_card.py                                  -> QR ke WhatsApp (bisa dipakai sebelum punya domain)
  python tools/make_card.py --website https://domainanda.com -> QR + baris alamat mengarah ke website

Butuh: pip install segno playwright && playwright install chromium
Data (nama, nomor, email) diambil dari data/site.json. Hasil di folder card-output/ di samping folder proyek (di luar situs, supaya tidak ikut ter-deploy).
"""
import argparse, json, re
from pathlib import Path
import segno
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser()
ap.add_argument('--website', help='mis. https://alfacreative.id (QR mengarah ke sini)')
ap.add_argument('--qr', help='URL lain untuk QR (default: website bila ada, jika tidak WhatsApp)')
ap.add_argument('--out', default=str(ROOT.parent / 'card-output'))
a = ap.parse_args()

site = json.loads((ROOT / 'data/site.json').read_text(encoding='utf8'))
o, c, b = site['owner'], site['contact'], site['brand']
wa = 'https://wa.me/' + re.sub(r'\D', '', c['whatsapp'])
target = a.qr or a.website or wa
site_label = re.sub(r'^https?://', '', a.website).rstrip('/') if a.website else ''
caption = 'Scan untuk buka website' if (a.website and not a.qr) else 'Scan untuk chat WhatsApp'
qr = segno.make(target, error='m', boost_error=False).svg_inline(scale=1, border=0, dark='#0B0B0B', light=None, omitsize=True)
qr = re.sub(r'<svg ', '<svg class="qrsvg" ', qr, count=1)
fonts = (ROOT / 'assets/fonts').as_uri()

ico = lambda p: f'<svg viewBox="0 0 24 24" width="3.4mm" height="3.4mm" fill="none" stroke="#C0C0C0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">{p}</svg>'
I = {
 'phone': '<rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
 'mail': '<rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22 6 12 13 2 6"/>',
 'globe': '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
 'pin': '<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'}
rows = [('phone', c['whatsappDisplay']), ('mail', c['email'])] + ([('globe', site_label)] if site_label else []) + [('pin', c['location'])]
rows_html = ''.join(f'<li>{ico(I[k])}<span>{v}</span></li>' for k, v in rows)
front_site = f'<div class="fsite">{site_label}</div>' if site_label else f'<div class="fsite">{b["fullName"]}</div>'

S_LOGO = '<svg viewBox="0 0 48 48"><polygon fill="#E6E6E6" points="12,5 42,5 36,12 14,12 14,20 6,20 6,11"/><polygon fill="#E6E6E6" points="14,20 36,20 42,28 14,28"/><polygon fill="#8A8D93" points="34,28 42,28 42,37 36,43 6,43 12,36 34,36"/></svg>'
A_LOGO = '<svg viewBox="0 0 48 48"><polygon fill="#E6E6E6" points="21,5 27,5 13,43 6,43"/><polygon fill="#8A8D93" points="21,5 27,5 42,43 35,43"/><polygon fill="#E6E6E6" points="11,32 37,32 39,38 9,38"/></svg>'

html = f'''<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Kartu Nama - {o['name']} (siap cetak, bleed 3mm)</title><style>
@font-face{{font-family:P;font-weight:300;src:url({fonts}/poppins-latin-300-normal.woff2)}}
@font-face{{font-family:P;font-weight:400;src:url({fonts}/poppins-latin-400-normal.woff2)}}
@font-face{{font-family:P;font-weight:500;src:url({fonts}/poppins-latin-500-normal.woff2)}}
@page{{size:96mm 61mm;margin:0}}
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{background:#0B0B0B}}
.page{{position:relative;width:96mm;height:61mm;background:#0B0B0B;overflow:hidden;page-break-after:always;font-family:P,sans-serif;color:#F2F2F2}}
.page:last-child{{page-break-after:auto}}
.bg{{position:absolute;inset:0;width:96mm;height:61mm}}
.abs{{position:absolute}}
.slogo{{left:14mm;top:20.5mm;width:17.5mm;height:17.5mm}}
.vline{{left:36mm;top:21.5mm;width:.25mm;height:15.5mm;background:#6B7280}}
.w1,.w2{{left:40mm;font-weight:400;font-size:8pt;letter-spacing:.2em;line-height:1}}
.w1{{top:26.4mm}} .w2{{top:31.3mm}}
.tag{{left:40mm;top:37.4mm;font-weight:300;font-size:6.6pt;letter-spacing:.12em;color:#B9BDC6}}
.fline{{left:11mm;top:49.2mm;width:6mm;height:.25mm;background:#8A8D93}}
.fsite{{left:11mm;top:51mm;font-weight:300;font-size:5.6pt;letter-spacing:.1em;color:#B9BDC6}}
.name{{left:11mm;top:10.6mm;font-weight:500;font-size:12.5pt;letter-spacing:.01em;line-height:1.1}}
.role{{left:11mm;top:17.2mm;font-weight:300;font-size:7.4pt;letter-spacing:.06em;color:#B9BDC6}}
.rline{{left:11mm;top:21.8mm;width:6mm;height:.25mm;background:#C0C0C0}}
ul{{position:absolute;left:11mm;top:24.4mm;list-style:none;display:grid;gap:2.05mm}}
li{{display:flex;align-items:center;gap:2.2mm;font-weight:300;font-size:6.8pt;letter-spacing:.02em;line-height:1}}
.qrbox{{left:69.2mm;top:17.6mm;width:20.2mm;height:20.2mm;background:#E9E9EB;border-radius:1.2mm;padding:2mm}}
.qrbox .qrsvg{{width:100%;height:100%;display:block}}
.qcap{{left:66mm;width:26.4mm;top:39.2mm;text-align:center;font-weight:300;font-size:5.2pt;letter-spacing:.08em;color:#B9BDC6;line-height:1.3}}
.alogo{{left:11mm;top:46.4mm;width:6.4mm;height:6.4mm}}
.bname{{left:19.6mm;top:47.1mm;font-weight:500;font-size:5.8pt;letter-spacing:.2em;line-height:1}}
.bsub{{left:19.6mm;top:50.5mm;font-weight:300;font-size:5pt;letter-spacing:.1em;color:#B9BDC6;line-height:1}}
.bdiv{{left:57mm;top:46.6mm;width:.25mm;height:6mm;background:#6B7280}}
.btag{{left:59.4mm;top:47.1mm;font-weight:300;font-size:5pt;letter-spacing:.06em;color:#B9BDC6;line-height:1.5}}
</style></head><body>
<section class="page">
  <svg class="bg" viewBox="0 0 96 61" preserveAspectRatio="none"><polygon points="85.1,0 96,0 96,11 81.2,11" fill="#1a1a1b"/><polygon points="63.2,61 96,13 96,61" fill="#131314"/><polygon points="69.6,61 96,22.4 96,31.8 76,61" fill="#262627"/><polygon points="78.8,61 96,35.9 96,43.5 84,61" fill="#3a3a3c"/></svg>
  <div class="abs slogo">{S_LOGO}</div><div class="abs vline"></div>
  <div class="abs w1">SOFTWARE &amp;</div><div class="abs w2">DIGITAL SOLUTIONS</div>
  <div class="abs tag">{b['tagline']}</div>
  <div class="abs fline"></div><div class="abs fsite">{site_label or b['fullName']}</div>
</section>
<section class="page">
  <svg class="bg" viewBox="0 0 96 61" preserveAspectRatio="none"><polygon points="76.5,0 82,0 96,14 96,18.8" fill="#161617"/><polygon points="82,0 96,0 96,14" fill="#2a2a2b"/></svg>
  <div class="abs name">{o['name']}</div><div class="abs role">{o['role']}</div><div class="abs rline"></div>
  <ul>{rows_html}</ul>
  <div class="abs qrbox">{qr}</div><div class="abs qcap">{caption}</div>
  <div class="abs alogo">{A_LOGO}</div><div class="abs bname">ALFA CREATIVE</div><div class="abs bsub">PERSADA</div>
  <div class="abs bdiv"></div><div class="abs btag">Creative Ideas<br>for a Better Future</div>
</section></body></html>'''

out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
(out / 'kartu-nama.html').write_text(html, encoding='utf8')
with sync_playwright() as p:
    br = p.chromium.launch(); pg = br.new_page()
    pg.goto((out / 'kartu-nama.html').as_uri()); pg.wait_for_timeout(500)
    pg.pdf(path=str(out / 'kartu-nama-print.pdf'), width='96mm', height='61mm', print_background=True, margin=dict(top='0', right='0', bottom='0', left='0'), prefer_css_page_size=True)
    pg2 = br.new_page(viewport={'width': 363, 'height': 231}, device_scale_factor=6.6); pg2.goto((out / 'kartu-nama.html').as_uri()); pg2.wait_for_timeout(500)
    for i, name in enumerate(('depan', 'belakang')):
        pg2.locator('.page').nth(i).screenshot(path=str(out / f'kartu-{name}-preview.png'))
    br.close()
print('OK ->', out, '| QR ->', target)
