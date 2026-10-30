# Alfa Creative Persada | Software & Digital Solutions

Website portfolio + jasa Alfa Creative Persada. HTML/CSS/JS vanilla, siap GitHub Pages. Situs jalan tanpa build; `tools/build.py` hanya dipakai untuk menyempurnakan SEO sebelum deploy.

## Struktur

```
/
├── index.html  about.html  services.html  portfolio.html  contact.html  404.html
├── sitemap.xml  robots.txt  manifest.webmanifest  favicon.ico  README.md  TODO.md
├── tools/build.py             (SEO: head, sitemap, robots, ganti domain, prerender)
├── products/index.html        (katalog, menu disembunyikan)
├── assets/css/style.css       (satu CSS bersama)
├── assets/fonts/              (Poppins self-hosted, tanpa Google Fonts)
├── assets/js/main.js          (komponen + render konten)
├── assets/img/                (favicon, logo, og-image.jpg, profile.jpg, projects/)
└── data/                      (site.json, services.json, projects.json, stack.json, faq.json, products.json)
```

## Jalankan lokal

Situs membaca file JSON, jadi harus lewat server (bukan klik dua kali file HTML):

```bash
python -m http.server 8000
# buka http://localhost:8000
```

Alternatif: ekstensi VS Code "Live Server".

## Ganti placeholder

Semua placeholder dikumpulkan di `data/site.json`:

| Yang diganti | Lokasi |
|---|---|
| Nomor WhatsApp | `contact.whatsapp` (format `62xxxxxxxxxx`, tanpa `+`) dan `contact.whatsappDisplay` |
| Domain | jalankan `python tools/build.py --domain https://domainanda.com --prerender` (otomatis mengganti di semua halaman, sitemap, robots, data terstruktur) |
| Link sosial | `social[].url` (kosong = tidak tampil) |
| Foto profil | simpan sebagai `assets/img/profile.jpg` (rasio 4:5, minimal 800x1000), lalu jalankan build (lihat bagian SEO) |
| Gambar share | sudah tersedia di `assets/img/og-image.jpg` (1200x630), ganti bila ingin desain lain |
| Form Formspree | `contact.formEndpoint` (mis. `https://formspree.io/f/xxxx`). Kosong = form memakai WhatsApp/email |

## SEO

Sumber data SEO ada di `data/site.json` (`url`, `seo.pages` untuk judul dan deskripsi tiap halaman). Setiap kali mengubah data, domain, atau menambah foto profil, jalankan dari folder proyek:

```bash
python tools/build.py --domain https://domainanda.com --prerender
```

Perintah ini: menulis ulang `<head>` semua halaman (title, description, canonical, hreflang, Open Graph, Twitter Card, ikon), membuat `sitemap.xml` dan `robots.txt`, mengganti domain, mendeteksi `assets/img/profile.jpg` lalu memasukkannya ke data terstruktur (Person, untuk peluang foto tampil di Google), dan menanam konten statis ke HTML agar terbaca crawler tanpa JavaScript.

`--prerender` butuh Playwright (`pip install playwright && playwright install chromium`). Tanpa itu, jalankan tanpa `--prerender`: situs tetap jalan dan data terstruktur dibuat oleh JavaScript.

Setelah online: daftarkan situs di Google Search Console, kirim `sitemap.xml`, dan minta pengindeksan untuk halaman utama.

## Tambah / ubah konten lewat JSON

- **Layanan**: tambah objek di `data/services.json` → `services` (field: `id`, `title`, `icon`, `short`, `description`, `features`). Ikon tersedia: `code, layers, smartphone, chart, zap, globe`.
- **Portfolio**: tambah objek di `data/projects.json` → `projects`. `category` harus salah satu `id` di `categories`. `featured: true` = tampil di Home (maks. 3). Isi `image` (mis. `assets/img/projects/a.jpg`) dan `link` bila ada.
- **Field proyek tambahan**: `linkLabel` (teks tombol) dan `note` (catatan kecil). `link` kosong = tombol tidak tampil.
- **Kategori baru**: tambah di `categories`.
- **Teknologi & tools**: ubah `data/stack.json` (grup `groups[].items`). Tampil di Home dan About.
- **FAQ**: ubah `data/faq.json` → `items` (`q`, `a`). `home: true` = ikut tampil di Home (semua tampil di Services). Data terstruktur FAQPage dibuat otomatis. Catatan: sejak 2026 Google tidak lagi menampilkan FAQ rich result, tetapi FAQ tetap berguna untuk kata kunci long-tail dan pengunjung.
- **Teks halaman**: ubah `data/site.json`.
- **Menu**: `nav` di `site.json`. `hidden: true` menyembunyikan dari navbar dan footer.

## Katalog produk

Halaman `/products/` sudah jadi tetapi menu disembunyikan, `robots.txt` memblokirnya, dan ada banner pratinjau. Untuk mempublikasikan:

1. `data/products.json`: ubah `enabled` ke `true`, isi harga dan gambar.
2. `data/site.json`: pada item nav "Produk" hapus `"hidden": true`.
3. Di `data/site.json` → `seo.pages.products`: hapus `"noindex": true`, lalu jalankan `python tools/build.py` (robots dan sitemap diperbarui otomatis).

Tambah produk baru dengan menambah objek di `products.json`. Detail produk otomatis di `/products/?p=<id>`, tombol pesan memakai `whatsappTemplate`.

## Deploy ke GitHub Pages

1. Buat repo GitHub, push seluruh isi folder ini ke branch `main` (file di root repo).
2. Repo → **Settings → Pages** → Source: *Deploy from a branch* → Branch `main`, folder `/ (root)` → Save.
3. Situs aktif di `https://username.github.io/nama-repo/`.

> Jika memakai alamat `username.github.io/nama-repo/` (tanpa custom domain), `404.html` perlu disesuaikan: ganti `/` pada path dan `data-root` menjadi `/nama-repo/`. Dengan custom domain, tidak perlu diubah.

### Custom domain

1. Beli domain, lalu di DNS tambahkan:
   - 4 record **A** untuk `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - 1 record **CNAME** `www` → `username.github.io`
2. Buat file bernama `CNAME` di root repo, isinya satu baris: `www.domainanda.com`
3. Settings → Pages → isi Custom domain, tunggu verifikasi, lalu centang **Enforce HTTPS**.
4. Jalankan `python tools/build.py --domain https://www.domainanda.com --prerender`, commit, push, lalu kirim `sitemap.xml` ke Google Search Console.

## Catatan teknis

- Navbar, footer, kartu, dan tombol dirender dari satu file `main.js`, tidak ada duplikasi di HTML.
- Data terstruktur (Organization, Person, WebSite, halaman, breadcrumb, layanan, daftar portfolio) dibuat otomatis dari `site.json` dan data JSON.
- Animasi menghormati `prefers-reduced-motion`.
