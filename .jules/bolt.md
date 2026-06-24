## 2024-06-24 - Missing Memoization in ProductCard
**Learning:** Found that `ProductCard.tsx` performs multiple expensive array operations (`.filter`, `.map`, `Math.min`, `Math.max`, `.find`, `.flatMap`, `Set` instantiation) directly in the render body. Since `ProductCard` manages local state (`isHovered`, `showAltImage`, `isAdding`), every hover or state change triggers a full re-evaluation of these arrays.
**Action:** Use `useMemo` to cache derived product data (prices, images, variants) based on the `product` prop, preventing redundant computations during local state updates like hover.
## 2024-06-24 - Pre-calculating maps instead of inline O(N*M) lookups
**Learning:** `VariantPicker.tsx` previously used an inline helper `isOptionDisabled(attrName, value)` inside a map rendering loop, leading to an O(N*M) performance drain (`filter` + `reduce` over all variants for each attribute value rendered) upon every selection state change.
**Action:** Use `useMemo` to pre-calculate a nested dictionary (`disabledOptionsMap[name][val]`) mapping attribute options to their disabled state up-front, reducing render-time checks to O(1) lookups.
