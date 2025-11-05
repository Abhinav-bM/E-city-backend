## Ecity Backend

A Node.js + MongoDB backend for an e-commerce application. This document explains key design choices, production hardening steps, and practical examples of how they improve reliability, performance, and security.

---

## Quick start

### Prerequisites
- **Node.js** 18+
- **MongoDB** 5+

### Setup
```bash
npm install
cp .env.example .env
# fill required env vars in .env
npm run dev
```

### Environment variables (example)
```bash
PORT=8080
MONGODB_URI=mongodb://localhost:27017/ecity
JWT_SECRET=replace-with-strong-secret
NODE_ENV=development
```

---

## Data model overview

### Base product
- General info about a product (name, brand, description, images, category).
- Multiple variants (e.g., colors, sizes) are linked to a base product.

### Product variant
- Each variant is a sellable SKU with its own `price`, `stock`, `images`, `attributes` (e.g., `{ color: "Red" }`).
- We added indexes for faster lookups: `baseProductId`, `isDefault`.

### Wishlist
- Stores which base products a user has wishlisted.
- Current implementation marks listing items as wishlisted if their base product is wishlisted.

---

## What changed and why it matters

### 1) Listing returns one item per unique primary attribute value
- Previously, the listing returned one base product with a single default variant.
- Now, `getProductsGroupedByVariant` groups variants by their primary attribute (e.g., Color) and returns one product per unique value.
- If a product has 6 variants but only 3 unique colors, it returns 3 products (one per color).
- Uses variant images if available, otherwise falls back to base product images.

#### Example
Before (1 base product with 6 variants, 3 colors): you see 6 cards (one per variant).
After: you see 3 cards (one per unique color). This prevents duplicate product cards and provides a cleaner browsing experience.

### 2) Grouped variant pagination, filtering, and sorting
- Pagination counts now reflect the total number of unique groups (not total variants).
- Variants are grouped by primary attribute (Color first, then first attribute in variantAttributes).
- For each group, the default variant is preferred; if none exists, the first variant is used.
- Supports optional `variantFilters` (e.g., `{"attributes.color": "Red"}`) and custom `sort` (e.g., `{ price: 1 }`).

#### Example usage (repository)
```js
// Returns red T-shirts first, sorted by price ascending
getProductsGroupedByVariant(
  { category: 'T-Shirts' },
  1,
  20,
  userId,
  { variantFilters: { 'attributes.color': 'Red' }, sort: { price: 1 } }
);
```

### 3) Lean queries for reads
- `.lean()` is used on read-heavy paths (base products, variants, wishlist) to reduce overhead and memory usage.
- Impact: Lower latency per request under load, especially for catalog pages.

### 4) Indexes for hot paths
- Base product: `{ category: 1 }`, `{ brand: 1 }`, `{ isActive: 1 }`.
- Variant: `{ baseProductId: 1 }`, `{ isDefault: 1 }`.
- Impact: Faster listing and detail retrieval. Essential as catalog grows.

### 5) `createProductVariant` returns the saved document
- Makes the function easier to use in services/controllers (immediate access to `_id`, `sku`, etc.).

---

## Production readiness checklist

### Security
- Add `helmet`, strict `CORS`, `compression`, and rate limiting.
- Enforce HTTPS/HSTS at proxy/CDN; secure cookies; disable `x-powered-by`.
- Validate and sanitize all inputs (NoSQL injection); verify `ObjectId`s.
- Short-lived access tokens + refresh tokens; rotate secrets; RBAC on admin routes.

#### Example (Express middlewares)
```js
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: ['https://yourshop.com'], credentials: true }));
app.use(compression());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 }));
```

### Validation and error handling
- Validate request bodies, params, and queries (Joi/Zod) at controllers.
- Standard error shape; map known domain errors to 4xx and unknown to 500.
- Add request-id and structured logs for debugging.

#### Example (Joi snippet)
```js
import Joi from 'joi';

export const listProductsSchema = Joi.object({
  category: Joi.string().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  color: Joi.string().optional()
});
```

### Data integrity and inventory
- Atomic stock updates (prevent oversells):
```js
await ProductVariant.findOneAndUpdate(
  { _id: variantId, stock: { $gte: quantity } },
  { $inc: { stock: -quantity } },
  { new: true }
);
```
- Use Mongo transactions for multi-document operations (order + stock + payment).
- Idempotency keys for order creation and payment webhooks.

### Performance and caching
- Add Redis caching for listing and product detail; invalidate on updates.
- Cap pagination and whitelist sort fields to protect DB.
- Consider external search (Meilisearch/Algolia/Elastic) for scalable catalog search.

### Observability
- Structured logging (pino/winston), request-id correlation, log rotation.
- Metrics (Prometheus): rate, latency, error %, Mongo ops, cache hit rate.
- Health endpoints: `/healthz` (liveness) and `/readyz` (readiness/deps).

### Testing and quality
- Unit tests for repositories/services; integration tests for cart/checkout.
- Contract tests for payment providers and webhooks.
- ESLint/Prettier; consider TypeScript or JSDoc types for maintainability.

### Build and deploy
- Dockerize with multi-stage builds, distroless base, non-root user.
- CI: lint/test/build; CD with blue/green or canary; env-specific configs.
- Config only via env vars; ship `.env.example`.

### Operations
- Automated backups and restore runbooks for Mongo.
- Schema migrations (migrate-mongo or custom runner) and versioning.
- Seed scripts for local/dev datasets.

### Media and assets
- Store images in S3/Cloud Storage, serve via CDN; validate uploads.
- Generate multiple sizes; use WebP/AVIF where supported.

### Payments and compliance
- Verify webhook signatures; retries with backoff; idempotent handlers.
- PII minimization; data retention; GDPR/DSR processes.

---

## API design and docs

### Versioning
- Prefix routes with `/v1` to allow safe evolution.

### OpenAPI/Swagger
- Provide a `swagger.json` or in-code annotations; publish at `/docs`.

### Consistent responses
- Enforce a standard envelope:
```json
{
  "data": {},
  "error": null,
  "meta": { "requestId": "..." }
}
```

---

## Example: listing variants like separate products

### Why
- Improves discoverability (SEO/ads can land on a specific color/size).
- UX clarity: users see exactly the variant they want.

### What changed in code (conceptually)
- Rewrote listing to fetch base products, then paginate and return variants.
- Added `variantFilters` and `sort` to support attribute filtering and custom ordering.

### Example call (service or repository)
```js
// Page 1 of Red variants in category "Shoes", cheapest first
await getProductsGroupedByVariant(
  { category: 'Shoes' },
  1,
  24,
  userId,
  { variantFilters: { 'attributes.color': 'Red' }, sort: { price: 1 } }
);
```

---

## Roadmap (suggested next steps)
- Wire controller/service to accept `variantFilters` and `sort` from query params (with whitelists).
- Add OpenAPI docs and publish Swagger UI.
- Introduce Redis caching for catalog endpoints.
- Add health checks, metrics, and structured logging.
- Harden security middlewares and validation across all endpoints.

---

## License
Proprietary. All rights reserved.
