import { productService } from '../product.service'

async function test() {
  console.log('--- TEST 1: Search "mode shirt" ---')
  const res1 = await productService.getProducts({ searchQuery: 'mode shirt' })
  console.log('Success:', res1.success)
  console.log('Total Count:', res1.pagination?.total_count)
  console.log(
    'Results:',
    res1.data?.map((p) => ({
      name: p.name,
      slug: p.slug,
      category: p.categories?.name,
    }))
  )

  console.log('\n--- TEST 2: Search "kemeja" ---')
  const res2 = await productService.getProducts({ searchQuery: 'kemeja', limit: 10 })
  console.log('Total Count:', res2.pagination?.total_count)
  console.log(
    'Results (first 10):',
    res2.data?.map((p) => ({ name: p.name, slug: p.slug }))
  )

  console.log('\n--- TEST 3: Search "blus" ---')
  const res3 = await productService.getProducts({ searchQuery: 'blus' })
  console.log('Total Count:', res3.pagination?.total_count)
  console.log(
    'Results:',
    res3.data?.map((p) => ({ name: p.name, slug: p.slug }))
  )

  console.log('\n--- TEST 4: Search "celana" ---')
  const res4 = await productService.getProducts({ searchQuery: 'celana' })
  console.log('Total Count:', res4.pagination?.total_count)
  console.log(
    'Results:',
    res4.data?.map((p) => ({ name: p.name, slug: p.slug }))
  )

  console.log('\n--- TEST 5: Search "rok" ---')
  const res5 = await productService.getProducts({ searchQuery: 'rok' })
  console.log('Total Count:', res5.pagination?.total_count)
  console.log(
    'Results:',
    res5.data?.map((p) => ({ name: p.name, slug: p.slug }))
  )

  console.log('\n--- TEST 6: Normal Catalog (No Search Query) ---')
  const res6 = await productService.getProducts({ limit: 5 })
  console.log('Total Count:', res6.pagination?.total_count)
  console.log(
    'Results (5 items):',
    res6.data?.map((p) => ({ name: p.name, slug: p.slug }))
  )
}

test().catch((err) => console.error(err))
