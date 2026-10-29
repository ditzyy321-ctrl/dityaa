# Soonya Everret — Netlify (seleksi staff nyata)
Yang nyata: formulir seleksi tersimpan di Netlify Blobs, ID unik dari server, kandidat melihat status asli (otomatis tiap 6 detik), admin menyetujui/menolak di halaman #admin.
Masih simulasi: login/daftar, chat, forum, dashboard (hanya di browser masing-masing).
Tidak ada bot WhatsApp: Netlify tidak bisa menjalankan bot yang harus selalu aktif. Keputusan lewat halaman admin.

## Deploy
1. Upload isi folder ini ke repo GitHub (index.html ada di `public/`, function di `netlify/functions/`).
2. Netlify > Add new site > Import from Git > pilih repo (pengaturan build biarkan terbaca dari netlify.toml).
3. Site configuration > Environment variables > tambah `ADMIN_KEY` berisi kata sandi admin yang PANJANG dan acak. Lalu Deploy ulang.
4. Buka `https://situsmu.netlify.app/#admin`, masukkan ADMIN_KEY, setujui atau tolak pendaftar.

## Catatan
- Kandidat tidak punya akun: mereka memakai ID + kode rahasia (ditampilkan setelah kirim, disimpan di browser). Dari perangkat lain pakai "Cek status".
- Satu nomor WhatsApp hanya bisa punya satu pendaftaran Pending.
- Keputusan hanya dari Pending; mengubah keputusan lewat tombol "Tinjau ulang" (tersimpan di riwayat).
- Belum ada pembatasan percobaan kunci admin; pakai ADMIN_KEY panjang (20+ karakter acak).
- Function sudah diuji dengan penyimpanan tiruan; belum diuji di Netlify sungguhan.
