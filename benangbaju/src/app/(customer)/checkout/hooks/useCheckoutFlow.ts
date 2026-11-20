/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/refs */
'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/modules/users/stores/authStore'
import { useMarket, useMarketStore } from '@/shared/stores/marketStore'
import { useCartStore } from '@/modules/cart/stores/cartStore'
import type { CartItem } from '@/modules/cart/stores/cartStore'
import { useUserAddresses, useShippingRates } from '@/modules/shipping/hooks/useShipping'
import type { UserAddress, ShippingOption } from '@/modules/shipping/types'
import { useCreateOrder, useGeneratePaymentToken } from '@/modules/orders/hooks/useOrders'
import { usePaymentFeeConfigs } from '@/modules/settings/hooks/useAdminSettings'
import { useSiteSettings } from '@/shared/hooks/useSiteSettings'
import type { PaymentFeeConfig } from '@/modules/orders/types'
import { validateVoucherAction } from '@/modules/vouchers/actions'
import { createBrowserClient } from '@/lib/supabase/client'
import { calculateChannelFee, calculateChannelFeeMyr } from '../components/PaymentMethodSelector'
import { DEFAULT_WEIGHT_GRAM, QRIS_MAX_AMOUNT_IDR } from '@/lib/constants'
import { trackInitiateCheckout } from '@/lib/analytics'

export interface AppliedVoucher {
  code: string
  currency?: 'IDR' | 'MYR'
  discount_amount: number
  discount_type?: string | null
  value: number
  max_discount?: number | null
}

export function useCheckoutFlow() {
  const market = useMarket()
  const setMarket = useMarketStore((state) => state.setMarket)
  const [supabase] = useState(() => createBrowserClient())
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()
  const { items: cartItems, clearCart, isSyncing, hasSynced } = useCartStore()

  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null)
  const [selectedCourier, setSelectedCourier] = useState<ShippingOption | null>(null)
  const [selectedChannel, setSelectedChannel] = useState<PaymentFeeConfig | null>(null)
  const [notes, setNotes] = useState('')
  const [voucherCodeInput, setVoucherCodeInput] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(null)
  const [voucherLoading, setVoucherLoading] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState<'shipping' | 'payment'>('shipping')
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderSnapshot, setOrderSnapshot] = useState<CartItem[]>([])
  const [isMounted, setIsMounted] = useState(false)
  const checkoutInitiated = useRef(false)
  const hasCheckedEmptyCart = useRef(false)

  const { data: feeConfigsRes, isLoading: feeConfigsLoading } = usePaymentFeeConfigs()
  const feeConfigs = useMemo(() => feeConfigsRes?.data || [], [feeConfigsRes?.data])

  const { myrExchangeRate, isMalaysiaShippingEnabled } = useSiteSettings()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true)
  }, [])

  const displayItems: CartItem[] = orderPlaced ? orderSnapshot : cartItems
  const createOrderMutation = useCreateOrder()
  const generatePaymentTokenMutation = useGeneratePaymentToken()

  useEffect(() => {
    if (!isMounted) return
    if (!authLoading && !isAuthenticated) {
      router.push('/masuk?redirect=/checkout')
    }
  }, [isMounted, isAuthenticated, authLoading, router])

  useEffect(() => {
    if (!isMounted) return
    if (!useCartStore.persist.hasHydrated()) return
    if (isSyncing || !hasSynced) return
    if (hasCheckedEmptyCart.current) return

    if (!authLoading && isAuthenticated) {
      if (cartItems.length === 0 && !orderPlaced && !checkoutInitiated.current) {
        hasCheckedEmptyCart.current = true
        toast.error('Keranjang belanja Anda kosong')
        router.push('/produk')
      } else if (cartItems.length > 0) {
        hasCheckedEmptyCart.current = true
      }
    }
  }, [isMounted, cartItems.length, authLoading, isAuthenticated, orderPlaced, router, isSyncing, hasSynced])

  const { data: addressesRes, isLoading: addressesLoading } = useUserAddresses(user?.id || '')
  const addresses = useMemo(() => addressesRes?.data || [], [addressesRes?.data])

  const currentCountryCode = selectedAddress?.country_code || market || 'ID'
  const isMalaysia = currentCountryCode === 'MY'

  const lastAlignedAddressIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (selectedAddress?.id && selectedAddress.id !== lastAlignedAddressIdRef.current) {
      lastAlignedAddressIdRef.current = selectedAddress.id
      const addrCountry = selectedAddress.country_code as 'ID' | 'MY' | undefined
      if (addrCountry && addrCountry !== market) {
        setMarket(addrCountry)
        toast(
          addrCountry === 'MY'
            ? 'Harga disesuaikan untuk pengiriman ke Malaysia.'
            : 'Harga disesuaikan untuk pengiriman ke Indonesia.',
          { icon: 'ℹ️' }
        )
      }
    }
  }, [selectedAddress?.id, selectedAddress?.country_code, market, setMarket])

  const { data: availableVouchers } = useQuery({
    queryKey: ['checkout-available-vouchers'],
    queryFn: async () => {
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from('vouchers')
        .select(
          'id, code, name, currency, discount_type, value, max_discount, min_purchase, starts_at, expires_at, usage_limit, usage_per_user, used_count, is_active, applicable_countries, created_at'
        )
        .eq('is_active', true)
        .eq('is_hidden', false)
        .lte('starts_at', now)
        .gte('expires_at', now)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []).filter(
        (v) => v.usage_limit === null || v.usage_limit === undefined || v.used_count < v.usage_limit
      )
    },
  })

  const filteredAvailableVouchers = useMemo(() => {
    return (availableVouchers || []).filter((v) => {
      const countries = v.applicable_countries
      if (!countries || countries.length === 0) return true
      if (countries.includes('ALL')) return true
      return countries.includes(currentCountryCode)
    })
  }, [availableVouchers, currentCountryCode])

  useEffect(() => {
    if (!addresses || addresses.length === 0) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedAddress((prev) => {
      if (prev && addresses.some((a) => a.id === prev.id)) {
        return addresses.find((a) => a.id === prev.id) || prev
      }
      return (
        addresses.find((a) => a.country_code === market && a.is_default) ||
        addresses.find((a) => a.country_code === market) ||
        addresses.find((a) => a.is_default) ||
        addresses[0]
      )
    })
  }, [addresses, market])

  useEffect(() => {
    if (isMalaysia && feeConfigs.length > 0) {
      const qrisConfig = feeConfigs.find((c) => c.channel_code === 'QRIS' && c.is_active)
      if (qrisConfig && selectedChannel?.channel_code !== 'QRIS') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedChannel(qrisConfig)
      }
    }
  }, [isMalaysia, feeConfigs, selectedChannel])

  const variantIdsStr = useMemo(
    () => displayItems.map((i) => i.variantId).sort().join(','),
    [displayItems]
  )

  const { data: variantDetails } = useQuery({
    queryKey: ['checkout-weights', variantIdsStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select('id, weight_gram, products (weight_gram)')
        .in('id', displayItems.map((i) => i.variantId))
      if (error) throw error
      return data
    },
    enabled: displayItems.length > 0,
  })

  const totalWeight = useMemo(() => {
    if (!variantDetails) return 0
    return displayItems.reduce((acc, item) => {
      const detail = variantDetails.find((v) => v.id === item.variantId) as any
      const product = Array.isArray(detail?.products) ? detail.products[0] : detail?.products
      const variantWeight = Number(detail?.weight_gram)
      const productWeight = Number(product?.weight_gram)
      const weight =
        !isNaN(variantWeight) && variantWeight > 0
          ? variantWeight
          : !isNaN(productWeight) && productWeight > 0
            ? productWeight
            : DEFAULT_WEIGHT_GRAM
      return acc + weight * (item.quantity || 1)
    }, 0)
  }, [displayItems, variantDetails])

  const { data: shippingDataRes, isLoading: shippingLoading } = useShippingRates(
    totalWeight > 0 ? selectedAddress?.zone_id || null : null,
    totalWeight
  )
  const shippingOptions = shippingDataRes?.data || []

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedCourier(null)
  }, [selectedAddress])

  const unavailableMyItems = useMemo(
    () => (isMalaysia ? displayItems.filter((item) => item.priceMyr == null || item.priceMyr <= 0) : []),
    [displayItems, isMalaysia]
  )

  const outOfStockMyItems = useMemo(
    () =>
      isMalaysia
        ? displayItems.filter((item) => typeof item.stockMy === 'number' && item.stockMy < item.quantity)
        : [],
    [displayItems, isMalaysia]
  )

  const hasMyCartIssue = unavailableMyItems.length > 0 || outOfStockMyItems.length > 0

  const subtotalMyr = useMemo(() => {
    if (!isMalaysia) return 0
    return Number(
      displayItems
        .reduce((acc, item) => acc + (item.priceMyr && item.priceMyr > 0 ? item.priceMyr : 0) * item.quantity, 0)
        .toFixed(2)
    )
  }, [displayItems, isMalaysia])

  const subtotalIdr = useMemo(
    () => displayItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [displayItems]
  )

  const shippingCostMyr = useMemo(() => {
    if (!isMalaysia || !selectedCourier) return 0
    return selectedCourier.price_myr != null
      ? Number(selectedCourier.price_myr)
      : Number((selectedCourier.price / myrExchangeRate).toFixed(2))
  }, [isMalaysia, selectedCourier, myrExchangeRate])

  const shippingCostIdr = selectedCourier ? selectedCourier.price : 0
  const discountAmountMyr = isMalaysia ? Number(appliedVoucher?.discount_amount || 0) : 0

  let discountAmountIdr = 0
  if (!isMalaysia && appliedVoucher) {
    if (appliedVoucher.discount_amount > 0) {
      discountAmountIdr = Math.min(appliedVoucher.discount_amount, subtotalIdr)
    } else if (appliedVoucher.discount_type === 'fixed') {
      const rawVal =
        appliedVoucher.currency === 'MYR'
          ? Math.round(appliedVoucher.value * myrExchangeRate)
          : appliedVoucher.value
      discountAmountIdr = Math.min(rawVal, subtotalIdr)
    } else if (appliedVoucher.discount_type === 'percentage') {
      discountAmountIdr = Math.round(subtotalIdr * (appliedVoucher.value / 100))
      if (appliedVoucher.max_discount) {
        const rawMax =
          appliedVoucher.currency === 'MYR'
            ? Math.round(appliedVoucher.max_discount * myrExchangeRate)
            : appliedVoucher.max_discount
        discountAmountIdr = Math.min(discountAmountIdr, rawMax)
      }
    }
  }

  const baseAmountMyr = Math.max(0, Number((subtotalMyr + shippingCostMyr - discountAmountMyr).toFixed(2)))
  const paymentFeeMyr = useMemo(() => {
    if (!isMalaysia || !selectedChannel) return 0
    return calculateChannelFeeMyr(selectedChannel, baseAmountMyr, myrExchangeRate)
  }, [isMalaysia, selectedChannel, baseAmountMyr, myrExchangeRate])

  const totalMyr = Math.max(0, Number((baseAmountMyr + paymentFeeMyr).toFixed(2)))
  const subtotal = isMalaysia ? Math.round(subtotalMyr * myrExchangeRate) : subtotalIdr
  const shippingCost = isMalaysia ? Math.round(shippingCostMyr * myrExchangeRate) : shippingCostIdr
  const discountAmount = isMalaysia ? Math.round(discountAmountMyr * myrExchangeRate) : discountAmountIdr
  const baseAmount = Math.max(0, subtotal + shippingCost - discountAmount)
  const paymentFee = useMemo(() => {
    if (!selectedChannel) return 0
    if (isMalaysia) return Math.round(paymentFeeMyr * myrExchangeRate)
    return calculateChannelFee(selectedChannel, baseAmount)
  }, [selectedChannel, isMalaysia, paymentFeeMyr, myrExchangeRate, baseAmount])

  const totalAmount = isMalaysia
    ? Math.round(totalMyr * myrExchangeRate)
    : Math.max(0, subtotal - discountAmount + shippingCost + paymentFee)

  const voucherValidationSubtotal = isMalaysia ? subtotalMyr : subtotalIdr

  const hasTrackedCheckout = useRef(false)
  useEffect(() => {
    if (cartItems.length > 0 && !hasTrackedCheckout.current) {
      hasTrackedCheckout.current = true
      trackInitiateCheckout(
        cartItems.map((i) => ({ id: i.variantId, name: i.name, price: i.price, quantity: i.quantity })),
        totalAmount
      )
    }
  }, [cartItems, totalAmount])

  useEffect(() => {
    if (appliedVoucher && currentCountryCode) {
      validateVoucherAction(appliedVoucher.code, voucherValidationSubtotal, currentCountryCode)
        .then((res) => {
          if (!res.success) {
            toast.error(
              res.error?.message ||
                (currentCountryCode === 'MY'
                  ? `Promo code ${appliedVoucher.code} is not applicable for Malaysia orders`
                  : `Voucher ${appliedVoucher.code} tidak berlaku untuk pengiriman ke Indonesia`)
            )
            setAppliedVoucher(null)
          } else if (res.data) {
            setAppliedVoucher((prev) =>
              prev ? { ...prev, currency: res.data.currency, discount_amount: res.data.discount_amount || 0 } : null
            )
          }
        })
        .catch(() => setAppliedVoucher(null))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCountryCode, voucherValidationSubtotal])

  const handleApplyVoucherDirectly = async (code: string) => {
    if (!user) return
    const normalizedCode = code.trim().toUpperCase()
    if (!normalizedCode) return
    setVoucherLoading(true)
    try {
      const result = await validateVoucherAction(normalizedCode, voucherValidationSubtotal, currentCountryCode)
      if (result.success) {
        const validVoucher = result.data
        const { data: voucherInfo } = await supabase
          .from('vouchers')
          .select('value, discount_type, max_discount, currency')
          .eq('code', normalizedCode)
          .maybeSingle()

        setAppliedVoucher({
          code: validVoucher.code || normalizedCode,
          currency: validVoucher.currency || (voucherInfo?.currency as 'IDR' | 'MYR') || 'IDR',
          discount_amount: validVoucher.discount_amount || 0,
          discount_type: voucherInfo?.discount_type,
          value: voucherInfo?.value || 0,
          max_discount: voucherInfo?.max_discount,
        })
        toast.success(
          isMalaysia
            ? `Promo code ${validVoucher.code} applied successfully!`
            : `Voucher ${validVoucher.code} berhasil digunakan!`
        )
      } else {
        toast.error(result.error?.message || (isMalaysia ? 'Voucher is not valid' : 'Voucher tidak valid'))
        setAppliedVoucher(null)
      }
    } catch {
      toast.error(isMalaysia ? 'Failed to validate voucher' : 'Gagal memvalidasi voucher')
    } finally {
      setVoucherLoading(false)
    }
  }

  const handleApplyVoucher = async () => {
    if (!voucherCodeInput.trim()) return
    await handleApplyVoucherDirectly(voucherCodeInput.trim())
  }

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null)
    setVoucherCodeInput('')
    toast.success(isMalaysia ? 'Promo code removed' : 'Voucher dihapus')
  }

  const handlePlaceOrder = async () => {
    if (!user) return
    if (!selectedAddress) return void toast.error('Harap pilih alamat pengiriman')
    if (isMalaysia && !isMalaysiaShippingEnabled) {
      return void toast.error('Pengiriman ke Malaysia sedang dinonaktifkan sementara.')
    }
    if (isMalaysia && unavailableMyItems.length > 0) {
      return void toast.error(
        'Some items in your bag are not available for Malaysia shipping. Please remove them first.'
      )
    }
    if (isMalaysia && outOfStockMyItems.length > 0) {
      return void toast.error(
        'Malaysia stock is insufficient for some items in your bag. Please adjust quantities in your bag.'
      )
    }
    const isQrisChannel = selectedChannel?.channel_code?.toUpperCase() === 'QRIS'
    if ((isMalaysia || isQrisChannel) && totalAmount > QRIS_MAX_AMOUNT_IDR) {
      return void toast.error(
        isMalaysia
          ? 'Total pembayaran melebihi batas transaksi QRIS Cross-Border (Rp 10.000.000)'
          : 'Total pembayaran melebihi batas regulasi pembayaran QRIS (maksimal Rp 10.000.000)'
      )
    }
    if (!selectedCourier) return void toast.error('Harap pilih metode pengiriman')
    if (!selectedChannel) return void toast.error('Harap pilih metode pembayaran')

    checkoutInitiated.current = true
    try {
      await useCartStore.getState().syncCart(user.id, false)
      const orderRes = await createOrderMutation.mutateAsync({
        userId: user.id,
        addressId: selectedAddress.id,
        voucherCode: appliedVoucher?.code || undefined,
        courierName: `${selectedCourier.courier_name} (${selectedCourier.etd_min}-${selectedCourier.etd_max} hari)`,
        shippingRateId: selectedCourier.id,
        shippingCost,
        shippingCostMyr: isMalaysia ? shippingCostMyr : undefined,
        notes: notes.trim() || undefined,
        paymentFee,
        paymentFeeMyr: isMalaysia ? paymentFeeMyr : undefined,
        paymentChannel: selectedChannel.channel_code,
      })

      toast.success('Pesanan berhasil dibuat!')
      setOrderSnapshot(cartItems)
      setOrderPlaced(true)
      clearCart()
      setCheckoutStep('payment')
      router.push(`/pesanan/${orderRes.order_number}?autoPay=1`)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Terjadi kesalahan saat memproses pesanan')
      checkoutInitiated.current = false
    }
  }

  const isLoading =
    authLoading ||
    !isAuthenticated ||
    isSyncing ||
    !hasSynced ||
    (cartItems.length === 0 && !orderPlaced && !checkoutInitiated.current)

  return {
    market,
    user,
    isLoading,
    addressModalOpen,
    setAddressModalOpen,
    addresses,
    addressesLoading,
    selectedAddress,
    setSelectedAddress,
    shippingOptions,
    shippingLoading,
    selectedCourier,
    setSelectedCourier,
    notes,
    setNotes,
    totalWeight,
    feeConfigs,
    feeConfigsLoading,
    selectedChannel,
    setSelectedChannel,
    currentCountryCode,
    isMalaysia,
    isMalaysiaShippingEnabled,
    hasMyCartIssue,
    unavailableMyItems,
    outOfStockMyItems,
    myrExchangeRate,
    displayItems,
    subtotal,
    shippingCost,
    paymentFee,
    discountAmount,
    totalAmount,
    baseAmountMyr,
    subtotalMyr,
    shippingCostMyr,
    paymentFeeMyr,
    discountAmountMyr,
    totalMyr,
    voucherCodeInput,
    setVoucherCodeInput,
    appliedVoucher,
    filteredAvailableVouchers,
    voucherLoading,
    checkoutStep,
    handleApplyVoucher,
    handleApplyVoucherDirectly,
    handleRemoveVoucher,
    handlePlaceOrder,
    isCheckoutProcessing: createOrderMutation.isPending || generatePaymentTokenMutation.isPending,
    isPaymentTokenLoading: generatePaymentTokenMutation.isPending,
    canSubmit:
      !!(selectedAddress && selectedCourier && selectedChannel) &&
      (!isMalaysia || (isMalaysiaShippingEnabled && !hasMyCartIssue)),
  }
}
