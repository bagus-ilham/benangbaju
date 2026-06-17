# ⚙️ Environment Setup Guide — Benangbaju E-Commerce

> **Referensi:** [benangbaju_prd.md](file:///d:/Aulia%20Project/benangbaju_prd.md) — Bagian 27

---

## Daftar Isi

1. [Prerequisites](#1-prerequisites)
2. [Supabase Setup](#2-supabase-setup)
3. [Next.js Frontend Setup](#3-nextjs-frontend-setup)
4. [Midtrans Setup](#4-midtrans-setup)
5. [Email (SMTP) Setup](#5-email-smtp-setup)
6. [Environment Variables](#6-environment-variables)
7. [Development Workflow](#7-development-workflow)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prerequisites

| Tool | Versi Minimum | Instalasi |
|------|--------------|-----------|
| **Node.js** | 20 LTS | [nodejs.org](https://nodejs.org) |
| **npm** | 10+ | Bundled with Node.js |
| **Git** | 2.40+ | [git-scm.com](https://git-scm.com) |
| **Supabase CLI** | 1.200+ | `npm install -g supabase` |
| **Docker Desktop** | 4.0+ | [docker.com](https://docker.com) *(untuk Supabase local)* |
| **VS Code** | Latest | [code.visualstudio.com](https://code.visualstudio.com) |

### VS Code Extensions (Recommended)

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Prisma (untuk SQL highlighting)
- GitLens
- Error Lens

---

## 2. Supabase Setup

### 2.1 Buat Project di Supabase Cloud

1. Buka [supabase.com](https://supabase.com) → Create New Project
2. Pilih region: **Southeast Asia (Singapore)**
3. Set database password (simpan aman!)
4. Catat:
   - **Project URL:** `https://xxxx.supabase.co`
   - **Anon Key:** `eyJ...` (public)
   - **Service Role Key:** `eyJ...` (secret — JANGAN expose!)

### 2.2 Setup Supabase Local (Development)

```bash
# Init Supabase di project
cd "d:\Aulia Project"
supabase init

# Start local Supabase (Docker harus running)
supabase start

# Output: local URLs + keys
# API URL:       http://127.0.0.1:54321
# Anon Key:      eyJ...
# Service Role:  eyJ...
# Studio:        http://127.0.0.1:54323
```

### 2.3 Setup Auth Providers

#### Email + Password
- Sudah aktif by default di Supabase
- Konfigurasi di Dashboard → Authentication → Providers → Email

#### Google OAuth
1. Buka [Google Cloud Console](https://console.cloud.google.com)
2. Buat project baru atau pilih yang ada
3. APIs & Services → Credentials → Create OAuth 2.0 Client ID
4. Authorized redirect URI: `https://xxxx.supabase.co/auth/v1/callback`
5. Catat **Client ID** dan **Client Secret**
6. Di Supabase Dashboard → Authentication → Providers → Google → masukkan Client ID & Secret

### 2.4 Setup Storage Buckets

Buat buckets berikut di Supabase Dashboard → Storage:

| Bucket | Public | Deskripsi |
|--------|--------|-----------|
| `avatars` | ✅ Public | User avatars |
| `product-images` | ✅ Public | Product, category, collection images |
| `banners` | ✅ Public | Banner images |
| `review-media` | ✅ Public | Review photos/videos |
| `return-media` | ❌ Private | Return request photos |
| `invoices` | ❌ Private | Invoice PDFs |
| `settings` | ✅ Public | Site settings images |

### 2.5 Run Migrations

```bash
# Run semua migrations
supabase db push

# Atau reset (drop + recreate + seed)
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > src/types/database.ts
```

---

## 3. Next.js Frontend Setup

```bash
# Buat project Next.js (jika belum ada)
npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Install dependencies
npm install @supabase/supabase-js @supabase/ssr
npm install @tanstack/react-query
npm install zustand
npm install react-hook-form @hookform/resolvers
npm install zod
npm install framer-motion
npm install lucide-react
npm install react-hot-toast

# Dev dependencies
npm install -D @types/node prettier
```

### File Structure Setup

```bash
# Buat folder structure
mkdir -p src/components/{layout,shared,customer,product,admin,home,providers}
mkdir -p src/lib/{supabase,midtrans,utils}
mkdir -p src/services
mkdir -p src/stores
mkdir -p src/hooks
mkdir -p src/types
mkdir -p src/schemas
```

---

## 4. Midtrans Setup

### 4.1 Buat Akun Midtrans

1. Buka [midtrans.com](https://midtrans.com) → Daftar
2. Akses Dashboard → Settings → Access Keys
3. Catat:
   - **Merchant ID**
   - **Client Key** (Sandbox): `SB-Mid-client-xxxx`
   - **Server Key** (Sandbox): `SB-Mid-server-xxxx`

### 4.2 Konfigurasi Sandbox

1. Dashboard → Settings → Snap Preferences
2. Aktifkan payment methods yang diinginkan:
   - ✅ Bank Transfer (BCA, BNI, BRI, Mandiri, Permata)
   - ✅ GoPay
   - ✅ QRIS
   - ✅ ShopeePay
3. Set Notification URL: `https://xxxx.supabase.co/functions/v1/midtrans-webhook`

### 4.3 Frontend Integration

```typescript
// Pasang Snap.js di layout atau checkout page
<Script
  src={process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL}
  data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
/>
```

---

## 5. Email (SMTP) Setup

### 5.1 Gmail SMTP (Development)

1. Aktifkan 2-Factor Authentication di Google Account
2. Buat App Password: Google Account → Security → App Passwords
3. Gunakan App Password sebagai `SMTP_PASS`

### 5.2 Production SMTP

Opsi yang direkomendasikan:
- **Resend** (resend.com) — modern, developer-friendly
- **SendGrid** — established, free tier
- **Amazon SES** — murah, scalable

### 5.3 Set Edge Function Secrets

```bash
# Set secrets untuk Edge Function
supabase secrets set SMTP_HOST=smtp.gmail.com
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USER=no-reply@benangbaju.com
supabase secrets set SMTP_PASS=xxxx
supabase secrets set SMTP_FROM="Benangbaju <no-reply@benangbaju.com>"
```

---

## 6. Environment Variables

### 6.1 Frontend — `.env.local`

```bash
# === Supabase ===
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321        # Local
# NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co    # Production

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# === Midtrans ===
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxx
NEXT_PUBLIC_MIDTRANS_SNAP_URL=https://app.sandbox.midtrans.com/snap/snap.js
# Production: https://app.midtrans.com/snap/snap.js

# === App ===
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Production: https://benangbaju.com
NEXT_PUBLIC_APP_NAME=Benangbaju
```

### 6.2 Supabase Edge Function Secrets

```bash
# Midtrans
supabase secrets set MIDTRANS_SERVER_KEY=SB-Mid-server-xxxx
supabase secrets set MIDTRANS_MODE=sandbox
supabase secrets set MIDTRANS_SNAP_API_URL=https://app.sandbox.midtrans.com/snap/v1/transactions

# Email
supabase secrets set SMTP_HOST=smtp.gmail.com
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USER=no-reply@benangbaju.com
supabase secrets set SMTP_PASS=xxxx
supabase secrets set SMTP_FROM="Benangbaju <no-reply@benangbaju.com>"

# Supabase (admin operations dari Edge Function)
supabase secrets set SUPABASE_URL=https://xxxx.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...

# App
supabase secrets set APP_URL=https://benangbaju.com
supabase secrets set ADMIN_EMAIL=admin@benangbaju.com
supabase secrets set ADMIN_WHATSAPP=628xxxxxxxxxx
```

### 6.3 Template `.env.example`

```bash
# Copy this to .env.local and fill in values

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Midtrans
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=
NEXT_PUBLIC_MIDTRANS_SNAP_URL=https://app.sandbox.midtrans.com/snap/snap.js

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Benangbaju
```

> [!CAUTION]
> **Security Checklist:**
> - `SUPABASE_SERVICE_ROLE_KEY` → HANYA di Edge Function. JANGAN di frontend.
> - `MIDTRANS_SERVER_KEY` → HANYA di Edge Function. JANGAN di `NEXT_PUBLIC_*`.
> - `SMTP_PASS` → Gunakan App Password, bukan password asli.
> - `.env.local` → Sudah ada di `.gitignore`. Jangan commit!

---

## 7. Development Workflow

### 7.1 Mulai Development

```bash
# Terminal 1: Start Supabase local
supabase start

# Terminal 2: Start Next.js dev server
npm run dev
```

### 7.2 Database Changes

```bash
# Buat migration baru
supabase migration new create_new_table

# Edit file migration di supabase/migrations/

# Apply migration
supabase db push

# Regenerate types
supabase gen types typescript --local > src/types/database.ts
```

### 7.3 Edge Function Development

```bash
# Buat Edge Function baru
supabase functions new function-name

# Serve locally (hot reload)
supabase functions serve function-name --env-file supabase/.env

# Deploy
supabase functions deploy function-name
```

### 7.4 Useful Commands

```bash
# Reset DB (drop + recreate + seed)
supabase db reset

# View DB diff
supabase db diff

# Lint SQL
supabase db lint

# Stop Supabase local
supabase stop

# Link to remote project
supabase link --project-ref xxxx
```

---

## 8. Troubleshooting

### Docker tidak jalan
- Pastikan Docker Desktop running
- Windows: pastikan WSL2 enabled
- Run `docker info` untuk verify

### Supabase CLI error
```bash
# Update CLI
npm update -g supabase

# Clear local data
supabase stop --no-backup
supabase start
```

### Port conflict (54321, 54323)
```bash
# Stop proses yang pakai port
netstat -ano | findstr :54321
taskkill /PID <PID> /F
```

### TypeScript types outdated
```bash
# Regenerate setelah migration
supabase gen types typescript --local > src/types/database.ts

# Restart TS server di VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### Midtrans webhook tidak masuk (local dev)
- Midtrans webhook tidak bisa ke localhost
- Gunakan [ngrok](https://ngrok.com) untuk expose local Edge Function:
  ```bash
  ngrok http 54321
  ```
- Set Notification URL di Midtrans Dashboard ke ngrok URL
