# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-07-13

### Added

- **Security**: Atomic rate limit RPC via `atomic_rate_limit.sql` to prevent race conditions in `proxy.ts`. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Security**: Transactional `replace_cart_items` RPC via `cart_replace_transaction.sql` for safe cart replacements. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Security**: RLS policy for `return_requests` via `return_requests_rls.sql` to protect bank data. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Security**: `getUser()` enforcement over `getSession()` in `admin-log.repository.ts`. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Security**: Removed signature leak logging in `midtrans-webhook`. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Observability**: Structured JSON logging in production via `logger.ts`. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Observability**: Created `docs/runbook.md` for Incident and Disaster Recovery. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Architecture**: Merged `actions/checkout.ts` into `actions.ts` for consistency. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Architecture**: Unified `benangbaju/.env.example` and removed root clone. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Schema**: Added `created_at` and `updated_at` to `order_shipping`. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Schema**: Casted monetary columns to `numeric` in `product_variants`, `flash_sale_items`, `shipping_rates`. ([#42](https://github.com/aulia/benangbaju/pull/42))

### Changed

- **Optimization**: Resolved N+1 query problem in `product.repository.ts` by removing serial fetches. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Optimization**: Extracted cart mapping logic in `cart.service.ts` to `mapDbCartItemToLocal`. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Bugfix**: Improved TOCTOU mitigation in checkout to check `variant_id` identity. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Bugfix**: Fixed `p_voucher_code` bug where empty string `""` became `undefined`. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Bugfix**: Refactored `voucher.repository.ts` to return raw data and removed `ApiResponse` mixing. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Security**: Tightened `next.config.ts` CSP by removing broad wildcards (`https://*`). ([#42](https://github.com/aulia/benangbaju/pull/42))

### Added (Previous)

- **Security**: Added PostgreSQL `CHECK` constraints via `add_check_constraints.sql` for money and dates. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Security**: Upgraded CSP in `next.config.ts` (removed `unsafe-eval`). ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Idempotency**: Added unique constraint via `webhook_idempotency.sql` to prevent duplicate payment webhooks. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Automation**: Added PostgreSQL trigger via `product_rating_trigger.sql` for auto-calculating review summaries. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **DX**: Added comprehensive `.env.example`. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **DX**: Added npm `setup`, `db:reset`, and `db:types` scripts. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Architecture**: Added standardized `components/`, `hooks/`, `actions/` structure across modules. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Utils**: Added unified `formatRupiah` in `src/shared/utils/currency.ts`. ([#42](https://github.com/aulia/benangbaju/pull/42))

### Changed

- **Rate Limiting**: Migrated from memory-based to Edge (Supabase) in `rate_limit.sql` and `proxy.ts`. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Security**: Hardened inventory sync API (`src/proxy.ts`) using `crypto.timingSafeEqual` to prevent timing attacks. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Resilience**: Added a 10-second global fetch timeout to Supabase Client and Server instances to fail fast during outages. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Bugfix**: Fixed 0-stock evaluation bug in `cart.service.ts` using `??` instead of `||`. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Bugfix**: Fixed `order.repository.ts` undefined variables mapping for Supabase RPCs. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Bugfix**: Added type casting validation in `order.service.ts` to prevent silent RPC failures. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Cleanup**: Moved JS scripts to `scripts/` directory. ([#42](https://github.com/aulia/benangbaju/pull/42))

### Removed

- **Type Safety**: Purged `any` types from Dashboard components and Supabase parsers. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Cleanup**: Removed unused Supabase client initializations in API routes to save edge resources. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Cleanup**: Removed dead backward compatibility exports from `product.service.ts`. ([#42](https://github.com/aulia/benangbaju/pull/42))
- **Dependencies**: Removed `ts-morph` from `devDependencies`. ([#42](https://github.com/aulia/benangbaju/pull/42))
