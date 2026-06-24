## 2024-06-24 - Missing Memoization in ProductCard
**Learning:** Found that `ProductCard.tsx` performs multiple expensive array operations (`.filter`, `.map`, `Math.min`, `Math.max`, `.find`, `.flatMap`, `Set` instantiation) directly in the render body. Since `ProductCard` manages local state (`isHovered`, `showAltImage`, `isAdding`), every hover or state change triggers a full re-evaluation of these arrays.
**Action:** Use `useMemo` to cache derived product data (prices, images, variants) based on the `product` prop, preventing redundant computations during local state updates like hover.
## 2024-06-24 - Pre-calculating maps instead of inline O(N*M) lookups
**Learning:** `VariantPicker.tsx` previously used an inline helper `isOptionDisabled(attrName, value)` inside a map rendering loop, leading to an O(N*M) performance drain (`filter` + `reduce` over all variants for each attribute value rendered) upon every selection state change.
**Action:** Use `useMemo` to pre-calculate a nested dictionary (`disabledOptionsMap[name][val]`) mapping attribute options to their disabled state up-front, reducing render-time checks to O(1) lookups.
## 2024-06-24 - Avoiding mapping operations inside interval-driven components
**Learning:** `FlashSaleSection.tsx` mapped a complex array of objects into another complex format every render. Because the component has a `setInterval` triggering state updates every second, this mapping happened continuously, causing GC pressure.
**Action:** Always wrap array `.map()` derivations in `useMemo` when working within components that contain fast-updating state like timers or animations. Ensure `useMemo` is placed before any conditional early returns to avoid breaking the Rules of Hooks.
## 2024-06-24 - Supabase Bulk Inserts
**Learning:** For arrays of data to insert into a supabase table sequentially, it is significantly faster to collect the data array and bulk `.insert(dataArray)` compared to a loop with `.insert(singleRecord)` due to network + db query overhead (N+1 queries vs 1 bulk query).
**Action:** When dealing with multiple related records (like variants and variant attributes), accumulate them in loops, perform single batch inserts, and use the order of returned IDs to map back to local states.
