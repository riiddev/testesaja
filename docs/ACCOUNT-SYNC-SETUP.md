# SinauuEnglish — Google Apps Script Backend & Cross-Device Sync Setup

Panduan ini mendokumentasikan arsitektur backend, konfigurasi Google Apps Script, dan petunjuk pemeliharaan sinkronisasi akun SinauuEnglish.

---

## 1. Arsitektur

- **Frontend (Browser / PWA)**:
  - Pembelajaran berbasis *local-first* (IndexedDB + localStorage).
  - Melakukan sinkronisasi otomatis (*background sync*), saat online, saat kembali ke tab (*focus/visibility*), serta antrean perubahan offline (*offline change queue*).
  - Menyediakan tombol manual **Sinkronkan sekarang** (*Sync Now*).
- **Vercel API Gateway (`/api/account` & `/api/progress`)**:
  - Menangani hash kata sandi (PBKDF2/scrypt), penerbitan token sesi JWT (`access` & `refresh`), dan memproteksi kredensial backend.
  - Meneruskan data sinkronisasi terkompresi secara aman ke Web App Google Apps Script.
- **Google Sheets & Google Apps Script**:
  - File skrip kanonik: [`backend/google-apps-script/Code.gs`](file:///c:/Users/MyBook%20Hype%20AMD/Downloads/testesaja-main/testesaja-main/backend/google-apps-script/Code.gs).
  - Mengelola 3 tab spreadsheet otomatis: `Accounts`, `LearningStates`, dan `Collections`.
  - Menggunakan `LockService` untuk proteksi *concurrent updates*, `CacheService` untuk efisiensi *read query*, dan operasi *batch* (`getValues`/`setValues`).

---

## 2. Langkah Deployment Google Apps Script

Bila Anda memperbarui kode Apps Script:

1. Buka Google Spreadsheet database SinauuEnglish.
2. Di menu atas, klik **Extensions** → **Apps Script**.
3. Buka file skrip (biasanya `Code.gs`).
4. Salin seluruh isi dari [`backend/google-apps-script/Code.gs`](file:///c:/Users/MyBook%20Hype%20AMD/Downloads/testesaja-main/testesaja-main/backend/google-apps-script/Code.gs) dan tempel menggantikan seluruh kode yang lama (pastikan tidak ada bagian yang terpotong).
5. Buka **Project Settings** (ikon roda gigi di menu sebelah kiri).
6. Gulir ke bawah ke bagian **Script Properties**, pastikan properti berikut terisi:
   - **Property**: `SINAI_API_KEY`
   - **Value**: Rahasia acak minimal 32 karakter (sama persis dengan `SINAI_API_KEY` di Environment Variables Vercel).
7. Simpan Project Settings.
8. Klik tombol biru **Deploy** di kanan atas → **Manage deployments**.
9. Edit deployment Web App aktif (atau klik **New deployment** jika baru):
   - **Select type**: Web app.
   - **Execute as**: *Me* (email akun Google Anda).
   - **Who has access**: *Anyone*.
10. Klik **Deploy**.
11. Salin **Web app URL** yang berakhiran `/exec`.

---

## 3. Konfigurasi Environment Variables di Vercel

Di dasbor Vercel → Project Settings → **Environment Variables**, pastikan variabel berikut terisi untuk *Production* dan *Preview*:

| Variable Name | Keterangan |
|---|---|
| `SINAI_APPS_SCRIPT_URL` | URL Web App Apps Script (berakhiran `/exec`) |
| `SINAI_API_KEY` | Kunci rahasia yang sama dengan di Script Properties Apps Script (min. 32 karakter) |
| `SINAI_SESSION_SECRET` | *(Opsional)* Kunci penandatangan token sesi (jika kosong, diturunkan dari `SINAI_API_KEY`) |

---

## 4. Verifikasi Kesehatan Backend

Setelah deploy, lakukan verifikasi melalui terminal atau browser:

```bash
# 1. Health check publik melalui Vercel
curl -s "https://domain-anda.vercel.app/api/account?action=status"
# Respons yang benar:
# {"ready":true,"provider":"google-sheets-apps-script"}

# 2. Direct Web App Health check
curl -s -L "https://script.google.com/macros/s/AKfycb.../exec?action=health"
# Respons yang benar:
# {"ok":true,"version":"2.0.0",...}
```

---

## 5. Aturan Keamanan Penting
- **Jangan pernah menyalin `SINAI_API_KEY` ke kode frontend JavaScript, CSS, HTML, atau commit Git publik.**
- Jangan membagikan Google Spreadsheet dengan hak edit publik.
- Web App Apps Script dijalankan sebagai *Me*, sehingga pengguna tidak memerlukan izin Google langsung ke spreadsheet.
