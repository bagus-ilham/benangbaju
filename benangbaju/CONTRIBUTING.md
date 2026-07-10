# Panduan Berkontribusi di Benangbaju

Terima kasih telah bergabung! Silakan ikuti panduan berikut agar kode tetap bersih dan seragam.

## Setup Lokal
1. Copy .env.example ke .env.local dan isi nilainya.
2. Jalankan \ash scripts/setup.sh\ untuk menginstall dependensi dan sync tipe database.
3. Jalankan \
pm run dev\.

## Konvensi Kode
- Jangan menggunakan \ny\! Gunakan tipe asli dari Supabase.
- Setiap modul bisnis memiliki components, hooks, ctions, dan 	ypes.ts di dalam src/modules/<nama_modul>.
- Baca panduan lengkap di [docs/05_conventions.md](docs/05_conventions.md).

## Standar PR
- Selalu buat branch dari main dengan format eature/nama-fitur atau ix/nama-bug.
- Isi checklist pada Pull Request template saat mengajukan PR.
