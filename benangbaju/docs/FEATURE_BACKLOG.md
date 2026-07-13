# Feature Backlog & Scope Completeness

This document tracks schema definitions that exist in the database but have not yet been fully implemented in the Next.js application layer. These are identified as future roadmap items.

## 1. Guest Cart (`carts.session_id`)

**Status**: Schema ready, App layer missing.
**Description**: The database supports anonymous shopping carts via `session_id`, but the Next.js application currently forces authentication to use the cart.
**Action Items**:

- [ ] Implement session tracking in Edge Middleware.
- [ ] Modify `cart.service.ts` to accept and query by `sessionId` if `userId` is absent.
- [ ] Implement cart merging logic when a guest user logs in.

## 2. Stock Notifications (`stock_notifications`)

**Status**: Schema ready, App layer missing.
**Description**: Support for "Notify Me When Available" functionality for out-of-stock products.
**Action Items**:

- [ ] Create UI component for "Notify Me" button on out-of-stock variants.
- [ ] Create API route to insert records into `stock_notifications`.
- [ ] Implement a webhook or scheduled job to dispatch emails when `product_variants.stock` > 0.

## 3. Dynamic Landing Pages (`landing_pages`)

**Status**: Schema ready, App layer missing.
**Description**: CMS capability for admins to build dynamic landing pages directly from the database.
**Action Items**:

- [ ] Build Admin CRUD interface for `landing_pages`.
- [ ] Create dynamic catch-all route (e.g., `/p/[slug]`) to render the page content dynamically.

## 4. Transactional Emails (`notification_templates`)

**Status**: Schema ready, App layer missing.
**Description**: Dynamic email templates for order confirmation, shipping updates, etc.
**Action Items**:

- [ ] Integrate a transactional email provider (e.g., Resend, SendGrid).
- [ ] Create an email dispatch service that pulls templates from `notification_templates` and replaces interpolation variables (e.g., `{{order_number}}`).
