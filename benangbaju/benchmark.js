const { performance } = require('perf_hooks');

// Mock latency for an API/DB call (e.g., 50ms)
const NETWORK_LATENCY = 50;

const mockApiCall = (items) => {
  return new Promise((resolve) => {
    // Even bulk operations take a bit longer, but far less than N individual calls
    const latency = NETWORK_LATENCY + (Array.isArray(items) ? items.length * 2 : 0);
    setTimeout(resolve, latency);
  });
};

async function runBenchmark() {
  const NUM_ITEMS = 20;
  const items = Array.from({ length: NUM_ITEMS }, (_, i) => ({ id: i, qty: 1 }));

  console.log(`Starting benchmark for ${NUM_ITEMS} items...\n`);

  // 1. Current Approach: N+1 individual upserts
  const startNPlus1 = performance.now();
  for (const item of items) {
    await mockApiCall(item);
  }
  const endNPlus1 = performance.now();
  const timeNPlus1 = (endNPlus1 - startNPlus1).toFixed(2);
  console.log(`❌ N+1 Approach (Current): ${timeNPlus1} ms`);

  // 2. Optimized Approach: 1 bulk upsert
  const startBulk = performance.now();
  await mockApiCall(items); // sending the whole array at once
  const endBulk = performance.now();
  const timeBulk = (endBulk - startBulk).toFixed(2);
  console.log(`✅ Bulk Approach (Optimized): ${timeBulk} ms`);

  const improvement = ((timeNPlus1 - timeBulk) / timeNPlus1 * 100).toFixed(2);
  console.log(`\n🚀 Performance Improvement: ${improvement}% faster`);
}

runBenchmark();
