const { performance } = require('perf_hooks');

// Mock data and dependencies
const createMockSupabase = (delay = 10) => {
  return {
    from: () => ({
      upsert: async (data, options) => {
        return new Promise((resolve) => setTimeout(() => resolve({ error: null }), delay));
      }
    })
  };
};

const runBenchmark = async () => {
  const itemCount = 50;
  const localItems = Array.from({ length: itemCount }, (_, i) => ({
    variantId: `var_${i}`,
    quantity: Math.floor(Math.random() * 5) + 1,
    stock: 10
  }));
  const cartId = 'cart_123';

  console.log(`Benchmarking with ${itemCount} items...\n`);

  // 1. Sequential Upsert (Baseline)
  const db1 = createMockSupabase();
  const startSequential = performance.now();

  for (const localItem of localItems) {
    await db1.from('cart_items').upsert({
      cart_id: cartId,
      variant_id: localItem.variantId,
      quantity: localItem.quantity,
    }, { onConflict: 'cart_id,variant_id' });
  }

  const endSequential = performance.now();
  const sequentialTime = endSequential - startSequential;
  console.log(`Sequential N+1 Upsert: ${sequentialTime.toFixed(2)}ms`);

  // 2. Bulk Upsert (Optimized)
  const db2 = createMockSupabase();
  const startBulk = performance.now();

  const upsertPayload = localItems.map(item => ({
    cart_id: cartId,
    variant_id: item.variantId,
    quantity: item.quantity,
  }));

  await db2.from('cart_items').upsert(upsertPayload, { onConflict: 'cart_id,variant_id' });

  const endBulk = performance.now();
  const bulkTime = endBulk - startBulk;
  console.log(`Bulk Upsert: ${bulkTime.toFixed(2)}ms`);

  console.log(`\nImprovement: ${((sequentialTime - bulkTime) / sequentialTime * 100).toFixed(2)}% faster`);
};

runBenchmark();
