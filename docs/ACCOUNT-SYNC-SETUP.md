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

| Variable Name | Status | Keterangan |
|---|---|---|
| `SINAI_APPS_SCRIPT_URL` | **Wajib** | URL Web App Apps Script (harus berakhiran `/exec`) |
| `SINAI_API_KEY` | **Wajib** | Kunci rahasia backend (min. 32 karakter). Nilai harus identik dengan Script Property `SINAI_API_KEY` di Apps Script. |
| `SINAI_SESSION_SECRET` | *Direkomendasikan* | Kunci penandatangan token sesi JWT (min. 32 karakter). Jika kosong, diturunkan secara deterministik dari `SINAI_API_KEY`. |
| `SINAUU_SESSION_SECRET` | *Alternatif* | Kunci penandatangan sesi alternatif yang didukung bila `SINAI_SESSION_SECRET` tidak ditentukan. |

### Variabel Usang (Obsolete / Deprecated)
Variabel-variabel lama berikut **tidak lagi digunakan** dan telah digantikan:
- `GAS_URL` → Gunakan `SINAI_APPS_SCRIPT_URL`.
- `GAS_API_KEY` → Gunakan `SINAI_API_KEY`.
- `SESSION_SECRET` → Gunakan `SINAI_SESSION_SECRET` (atau `SINAUU_SESSION_SECRET`).

*Catatan Keamanan: Jangan pernah memublikasikan nilai kunci rahasia aktual ke repositori Git.*

---

## 4. Model Runtime Cloud-Only

Dalam arsitektur *cloud-only* SinauuEnglish:
- **Google Sheets via Apps Script** adalah satu-satunya lokasi penyimpanan permanen (*single source of truth*) untuk seluruh progres belajar pengguna terautentikasi (kosakata, SRS, grammar, reading habit, adventure, XP, dan studio draft).
- **Client Cache (IndexedDB / Memory)**:
  - Untuk pengguna non-login (*Tamu / Guest*), progres disimpan di perangkat lokal (IndexedDB / localStorage cadangan).
  - Saat pengguna masuk (*login*) atau mendaftar (*signup*), sistem mendeteksi apakah ada progres lokal/antrean offline. Jika ada, data dimigrasikan secara atomik ke cloud, diverifikasi pembacaan ulangnya secara mendalam, lalu data lokal dibersihkan dengan batas akun (*account-scoped purge*).
  - Pengguna terautentikasi mengambil data langsung dari cloud saat inisialisasi, dan mutasi data hanya ditandai "Tersimpan di cloud" setelah respons konfirmasi komit diterima dari server.

---

## 5. Verifikasi Kesehatan Backend

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

## 6. Aturan Keamanan Penting
- **Jangan pernah menyalin `SINAI_API_KEY` ke kode frontend JavaScript, CSS, HTML, atau commit Git publik.**
- Jangan membagikan Google Spreadsheet dengan hak edit publik.
- Web App Apps Script dijalankan sebagai *Me*, sehingga pengguna tidak memerlukan izin Google langsung ke spreadsheet.
