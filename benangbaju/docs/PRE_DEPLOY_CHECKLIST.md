# Pre-Deployment Checklist

Gunakan daftar periksa ini sebelum melakukan deployment ke environment produksi (Production) untuk memastikan tidak ada konfigurasi, keamanan, atau migrasi yang tertinggal.

## 1. Database & Migrations

- [ ] Semua file migrasi (`supabase migration up`) telah dijalankan di production.
- [ ] Tipe TypeScript Supabase di dalam aplikasi (`src/shared/types/database.ts`) sudah sinkron dengan skema DB production terbaru.
- [ ] `05_ledger_hotfix.sql` dan `06_vault_compliance.sql` (bila menggunakan eksekusi manual) telah di-_run_ dengan aman tanpa error.
- [ ] RLS (Row Level Security) aktif di semua tabel publik (terutama `profiles`, `orders`, `cart_items`, `checkout_locks`, `return_requests`).
- [ ] Supabase Backup Policy (PITR) sudah diatur minimal 7 hari (Wajib untuk Rollback Policy).

## 2. Environment Variables (`.env`)

Pastikan semua _environment variables_ berikut terisi dengan nilai _production_ di platform _hosting_ (misal: Vercel):

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (Penting untuk Rate Limit)
- [ ] `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` (Ganti ke Production Key)
- [ ] `MIDTRANS_SERVER_KEY` (Ganti ke Production Key)
- [ ] `NEXT_PUBLIC_MIDTRANS_SNAP_URL` (Ganti ke `app.midtrans.com/snap/snap.js`)
- [ ] `ERP_API_KEY` (Secret unik untuk sinkronisasi inventory)
- [ ] `NEXT_PUBLIC_APP_URL` (Ganti ke domain asli aplikasi, misal `https://benangbaju.com`)

## 3. Security & CI/CD

- [ ] Uji coba login dan registrasi berjalan normal (sinkronisasi email Auth ke Profiles bekerja).
- [ ] Uji coba transaksi (Checkout) berhasil mendapatkan respons dari Midtrans.
- [ ] Jalankan `npm run lint` dan pastikan tidak ada _error_.
- [ ] Jalankan `npm run test` dan pastikan seluruh _unit test_ (38 tests) PASS.
- [ ] Jalankan `npm run audit:licenses` dan pastikan tidak ada depedensi ilegal.

## 4. Third-Party Integrations

- [ ] Webhook URL di dashboard Midtrans Production telah diarahkan ke `https://[domain-anda]/api/v1/orders/midtrans-webhook`.
- [ ] Jika URL WhatsApp berubah, update konfigurasinya.

---

_Dibuat dalam rangka audit kesiapan peluncuran (Persona Porter)._
