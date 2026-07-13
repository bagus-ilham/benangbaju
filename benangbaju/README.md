# Benangbaju E-Commerce

Benangbaju is a premium modest fashion e-commerce platform built with modern web technologies.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database & Auth**: Supabase
- **Payments**: Midtrans
- **Styling**: Tailwind CSS v4

## Getting Started

### Prerequisites

- Node.js >= 18
- npm or pnpm
- Supabase CLI (for local development)

### Environment Variables

Copy `.env.example` to `.env.local` and populate the following required variables:

```env
# === Supabase ===
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# === Midtrans ===
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=your_midtrans_client_key
NEXT_PUBLIC_MIDTRANS_SNAP_URL=your_midtrans_snap_url

# === App ===
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Benangbaju

# === Server (Do not expose to browser) ===
MIDTRANS_SERVER_KEY=your_midtrans_server_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ERP_API_KEY=your_erp_api_key
```

### Installation

```bash
npm ci
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Architecture

This project uses a modular architecture:

- `src/modules/`: Domain-specific business logic (e.g., `products`, `orders`, `cart`) containing components, repositories, and services.
- `src/shared/`: Shared components, hooks, and utilities used across modules.
