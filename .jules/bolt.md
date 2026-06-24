## 2024-06-24 - Missing Memoization in ProductCard
**Learning:** Found that `ProductCard.tsx` performs multiple expensive array operations (`.filter`, `.map`, `Math.min`, `Math.max`, `.find`, `.flatMap`, `Set` instantiation) directly in the render body. Since `ProductCard` manages local state (`isHovered`, `showAltImage`, `isAdding`), every hover or state change triggers a full re-evaluation of these arrays.
**Action:** Use `useMemo` to cache derived product data (prices, images, variants) based on the `product` prop, preventing redundant computations during local state updates like hover.
