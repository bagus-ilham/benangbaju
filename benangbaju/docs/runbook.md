# Benangbaju Incident Runbook & Disaster Recovery

## 1. Overview
Dokumen ini berisi panduan penanganan insiden operasional, prosedur pemulihan bencana (DR), dan eskalasi.

## 2. Common Alerts & Runbooks

### 2.1 Webhook Payment Mismatch (Midtrans)
- **Symptom**: User sudah membayar namun pesanan tidak diproses. `payment_logs` tidak mencatat webhook.
- **Action**:
  1. Periksa dashboard Midtrans untuk memastikan transaksi sukses.
  2. Gunakan Endpoint Manual Sync (via Admin Dashboard) atau panggil ulang `POST /api/v1/orders/sync-payment` dengan `order_id`.
  3. Periksa log Supabase Edge Function `midtrans-webhook`.

### 2.2 Rate Limit Triggered Terlalu Sering
- **Symptom**: HTTP 429 meningkat di `/api/v1/*`.
- **Action**:
  1. Periksa tabel `rate_limit_logs` dan identifikasi `ip_address` paling banyak di-*block*.
  2. Bila terdeteksi *scraping* atau DDoS, blokir IP di layer CDN (misal Cloudflare).
  3. Sesuaikan parameter p_max_requests pada fungsi RPC `check_rate_limit` bila limit terlalu agresif.

### 2.3 Cart Tidak Tersinkronisasi
- **Symptom**: User kehilangan isi keranjang setelah pembayaran gagal.
- **Action**:
  1. Keranjang diganti lewat transaksi RPC `replace_cart_items`. Pastikan transaksi sukses di database.
  2. Data dapat direstorasi via `Point-in-Time Recovery` (PITR) Supabase bila rusak masif.

## 3. Disaster Recovery (Database & Edge)

### 3.1 Point-in-Time Recovery (PITR)
- **Symptom**: Data korup akibat salah rilis migrasi (misal: cart terhapus permanen atau kolom ter-drop).
- **Action**:
  1. Akses Supabase Dashboard -> Database -> Backups.
  2. Pilih "Restore to specific point in time".
  3. Masukkan timestamp sebelum insiden terjadi.
  4. Periksa log *migration* untuk menemukan penyebab dan *revert* kode yang relevan.

### 3.2 Rollback & Down Migrations Policy
- **Kebijakan**: Kami **TIDAK** menggunakan *down migrations* (misalnya `supabase migration down`). *Down migrations* berisiko tinggi menghapus data transaksi pelanggan secara tidak sengaja.
- **Strategi Rollback**: Jika terjadi kegagalan skema di produksi, rollback **wajib** dilakukan menggunakan Supabase PITR (Point-in-Time Recovery). 
- **Prasyarat**: Pastikan Supabase Backup Policy di *dashboard* diatur minimal **7 hari PITR aktif** untuk *environment* produksi.

### 3.3 Migrasi Skema Darurat
Gunakan `supabase migration up` dengan file migrasi hotfix (seperti `05_ledger_hotfix.sql`) untuk memperbaiki masalah secara *forward-only* (tanpa menghapus tabel lama). Bila perlu menggunakan SQL mentah untuk *bypass* migrasi, catat semua aktivitas pada `CHANGELOG.md` dan buat file `supabase_schema.txt` agar konsisten.

## 4. Escalation
- Level 1: Backend Engineer On-call
- Level 2: Tech Lead / DevOps
- Level 3: CTO (Bila kerugian finansial terindikasi, ex: manipulasi diskon Voucher / TOCTOU bypass).
