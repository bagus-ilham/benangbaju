import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const syncCartActionMock = vi.fn().mockResolvedValue({ success: true, data: [] })
const clearCartActionMock = vi.fn().mockResolvedValue({ success: true })

vi.mock('@/modules/cart/actions', () => ({
  syncCartAction: (...args: unknown[]) => syncCartActionMock(...args),
  clearCartAction: (...args: unknown[]) => clearCartActionMock(...args),
}))

import type { User } from '@supabase/supabase-js'
import { useCartStore } from '../cartStore'
import { useMarketStore } from '@/shared/stores/marketStore'
import { useAuthStore } from '@/modules/users/stores/authStore'

describe('useCartStore regression checks', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    useMarketStore.getState().setMarket('ID')
    useAuthStore.setState({ user: null })
    useCartStore.getState().resetCart()
  })

  afterEach(() => {
    useCartStore.getState().resetCart()
    useMarketStore.getState().setMarket('ID')
    useAuthStore.setState({ user: null })
    vi.useRealTimers()
  })

  it('refuses to add an item with zero stock in both ID and MY markets', async () => {
    await useCartStore.getState().addItem(
      {
        variantId: 'var-oos',
        productName: 'Out of Stock Dress',
        variantName: 'M',
        name: 'Out of Stock Dress',
        sku: 'OOS-M',
        price: 150000,
        comparePrice: null,
        priceMyr: 45,
        imageUrl: null,
        slug: 'oos-dress',
        stock: 0,
        stockMy: 0,
      },
      1
    )

    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('allows adding a Malaysia-only stocked item when market is MY and stock=0, stockMy>0', async () => {
    useMarketStore.getState().setMarket('MY')

    await useCartStore.getState().addItem(
      {
        variantId: 'var-my',
        productName: 'Malaysia Dress',
        variantName: 'L',
        name: 'Malaysia Dress',
        sku: 'MY-L',
        price: 150000,
        comparePrice: null,
        priceMyr: 45,
        imageUrl: null,
        slug: 'my-dress',
        stock: 0,
        stockMy: 5,
      },
      2
    )

    const items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(2)
  })

  it('cancels pending debounced sync timer on resetCart so logout never wipes DB cart', async () => {
    useAuthStore.setState({
      user: { id: 'user-123', email: 'user@example.com' } as unknown as User,
    })

    await useCartStore.getState().addItem(
      {
        variantId: 'var-1',
        productName: 'Dress',
        variantName: 'S',
        name: 'Dress',
        sku: 'DRS-S',
        price: 120000,
        comparePrice: null,
        imageUrl: null,
        slug: 'dress',
        stock: 10,
        stockMy: 0,
      },
      1
    )

    // Timer should now be scheduled
    expect(useCartStore.getState().syncTimeoutId).not.toBeNull()

    // Immediately logout before the 1000ms debounce timer fires
    useCartStore.getState().resetCart()
    expect(useCartStore.getState().syncTimeoutId).toBeNull()

    vi.advanceTimersByTime(2000)

    expect(syncCartActionMock).not.toHaveBeenCalled()
  })
})
