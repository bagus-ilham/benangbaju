## 2024-06-24 - Missing Memoization in ProductCard
**Learning:** Found that `ProductCard.tsx` performs multiple expensive array operations (`.filter`, `.map`, `Math.min`, `Math.max`, `.find`, `.flatMap`, `Set` instantiation) directly in the render body. Since `ProductCard` manages local state (`isHovered`, `showAltImage`, `isAdding`), every hover or state change triggers a full re-evaluation of these arrays.
**Action:** Use `useMemo` to cache derived product data (prices, images, variants) based on the `product` prop, preventing redundant computations during local state updates like hover.

## 2024-06-24 - Bulk Upsert in Supabase
**Learning:** Supabase `upsert` accepts an array of objects. Looping through local items and calling `.upsert()` individually creates an N+1 query problem which can significantly degrade performance during synchronizations.
**Action:** Always check if a loop containing database queries can be aggregated into a single payload or array for bulk operations, especially with Supabase `insert` or `upsert`.
