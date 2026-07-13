# Panduan Berkontribusi di Benangbaju

Terima kasih telah bergabung! Silakan ikuti panduan berikut agar kode tetap bersih dan seragam.

## Setup Lokal

1. Copy `.env.example` ke `.env.local` dan isi nilainya.
2. Jalankan `npm install` untuk menginstall dependensi.
3. Jalankan `npm run dev`.

## Konvensi Kode

- Jangan menggunakan `any`! Gunakan tipe asli dari Supabase.
- Setiap modul bisnis memiliki `components`, `hooks`, `actions`, dan `types.ts` di dalam `src/modules/<nama_modul>`.

## Standar PR

- Selalu buat branch dari `main` dengan format `feature/nama-fitur` atau `fix/nama-bug`.
- Pastikan kode melewati pengecekan statis (`npm run build`) dan pengujian (`npm run test`) sebelum membuat Pull Request.
