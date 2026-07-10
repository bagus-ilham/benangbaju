# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-07-10
### Added
- **Security**: Added PostgreSQL `CHECK` constraints via `add_check_constraints.sql` for money and dates.
- **Security**: Upgraded CSP in `next.config.ts` (removed `unsafe-eval`).
- **Idempotency**: Added unique constraint via `webhook_idempotency.sql` to prevent duplicate payment webhooks.
- **Automation**: Added PostgreSQL trigger via `product_rating_trigger.sql` for auto-calculating review summaries.
- **DX**: Added comprehensive `.env.example`.
- **DX**: Added npm `setup`, `db:reset`, and `db:types` scripts.
- **Architecture**: Added standardized `components/`, `hooks/`, `actions/` structure across modules.
- **Utils**: Added unified `formatRupiah` in `src/shared/utils/currency.ts`.

### Changed
- **Rate Limiting**: Migrated from memory-based to Edge (Supabase) in `rate_limit.sql` and `proxy.ts`.
- **Security**: Hardened inventory sync API (`src/proxy.ts`) using `crypto.timingSafeEqual` to prevent timing attacks.
- **Resilience**: Added a 10-second global fetch timeout to Supabase Client and Server instances to fail fast during outages.
- **Bugfix**: Fixed 0-stock evaluation bug in `cart.service.ts` using `??` instead of `||`.
- **Bugfix**: Fixed `order.repository.ts` undefined variables mapping for Supabase RPCs.
- **Bugfix**: Added type casting validation in `order.service.ts` to prevent silent RPC failures.
- **Cleanup**: Moved JS scripts to `scripts/` directory.

### Removed
- **Type Safety**: Purged `any` types from Dashboard components and Supabase parsers.
- **Cleanup**: Removed unused Supabase client initializations in API routes to save edge resources.
- **Cleanup**: Removed dead backward compatibility exports from `product.service.ts`.
- **Dependencies**: Removed `ts-morph` from `devDependencies`.
