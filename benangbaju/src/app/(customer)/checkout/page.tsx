/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/refs */
'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/modules/users/stores/authStore'
import { useMarketStore } from '@/shared/stores/marketStore'
import { useCartStore } from '@/modules/cart/stores/cartStore'
import type { CartItem } from '@/modules/cart/stores/cartStore'
import { useUserAddresses, useShippingRates } from '@/modules/shipping/hooks/useShipping'
import type { UserAddress, ShippingOption } from '@/modules/shipping/types'
import { useCreateOrder, useGeneratePaymentToken } from '@/modules/orders/hooks/useOrders'
import { usePaymentFeeConfigs, useSiteSettings } from '@/modules/settings/hooks/useAdminSettings'
import type { PaymentFeeConfig } from '@/modules/orders/types'
import { validateVoucherAction } from '@/modules/vouchers/actions'
import { createBrowserClient } from '@/lib/supabase/client'
import { AddressModal } from '@/modules/users/components/AddressModal'
import { AuthLoading, PageContainer, PageHero, HandDrawnIcon } from '@/shared/components'
import { CheckoutAddressForm, CheckoutSummaryCard, CheckoutProgressBar, PaymentMethodSelector } from './components'
import { calculateChannelFee, calculateChannelFeeMyr } from './components/PaymentMethodSelector'
import { DEFAULT_WEIGHT_GRAM, QRIS_MAX_AMOUNT_IDR } from '@/lib/constants'
import { trackInitiateCheckout } from '@/lib/analytics'

import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'

interface AppliedVoucher {
  code: string
  currency?: 'IDR' | 'MYR'
  discount_amount: number
  discount_type?: string | null
  value: number
  max_discount?: number | null
}

export default function CheckoutPage(): React.JSX.Element {
  const { market, setMarket } = useMarketStore()
  const [supabase] = useState(() => createBrowserClient())
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()
  const { items: cartItems, clearCart, isSyncing, hasSynced } = useCartStore()

  // Modal State
  const [addressModalOpen, setAddressModalOpen] = useState(false)

  // Checkout Form States
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

  // Fetch payment fee configs & site settings
  const { data: feeConfigsRes, isLoading: feeConfigsLoading } = usePaymentFeeConfigs()
  const feeConfigs = useMemo(() => feeConfigsRes?.data || [], [feeConfigsRes?.data])

  const { data: siteSettingsRes } = useSiteSettings()
  const siteSettings = useMemo(() => {
    const map: Record<string, string> = {}
    siteSettingsRes?.data?.forEach((s) => {
      map[s.key] = s.value
    })
    return map
  }, [siteSettingsRes?.data])

  const myrExchangeRate = useMemo(() => {
    const rate = parseFloat(siteSettings['myr_exchange_rate'] || '3600')
    return isNaN(rate) || rate <= 0 ? 3600 : rate
  }, [siteSettings])

  const isMalaysiaShippingEnabled = useMemo(() => {
    return siteSettings['enable_malaysia_shipping'] !== 'false'
  }, [siteSettings])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true)
  }, [])

  const displayItems: CartItem[] = orderPlaced ? orderSnapshot : cartItems

  const createOrderMutation = useCreateOrder()
  const generatePaymentTokenMutation = useGeneratePaymentToken()

  // 1. Redirect if not authenticated
  useEffect(() => {
    if (!isMounted) return
    if (!authLoading && !isAuthenticated) {
      router.push('/masuk?redirect=/checkout')
    }
  }, [isMounted, isAuthenticated, authLoading, router])

  // 2. Redirect if cart is empty (checked once after hydration and sync)
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
  }, [
    isMounted,
    cartItems.length,
    authLoading,
    isAuthenticated,
    orderPlaced,
    router,
    isSyncing,
    hasSynced,
  ])

  // 4. Fetch Addresses
  const { data: addressesRes, isLoading: addressesLoading } = useUserAddresses(user?.id || '')
  const addresses = useMemo(() => addressesRes?.data || [], [addressesRes?.data])

  // Current Address Country Code (fallback to active market or 'ID')
  const currentCountryCode = selectedAddress?.country_code || market || 'ID'
  const isMalaysia = currentCountryCode === 'MY'

  // R3: Automatically align market store with destination address country when address changes
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

  // Fetch available active vouchers
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

  // Filter available vouchers for the current shipping country
  const filteredAvailableVouchers = useMemo(() => {
    return (availableVouchers || []).filter((v) => {
      const countries = v.applicable_countries
      if (!countries || countries.length === 0) return true
      if (countries.includes('ALL')) return true
      return countries.includes(currentCountryCode)
    })
  }, [availableVouchers, currentCountryCode])

  // Set default address initially
  useEffect(() => {
    if (addresses && addresses.length > 0) {
      const defaultAddr = addresses.find((a) => a.is_default) || addresses[0]
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedAddress(defaultAddr)
    }
  }, [addresses])

  // When switching to Malaysia address, automatically lock/select QRIS channel
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
    () =>
      displayItems
        .map((i) => i.variantId)
        .sort()
        .join(','),
    [displayItems]
  )

  // 5. Query Variant Weights to calculate total weight
  const { data: variantDetails } = useQuery({
    queryKey: ['checkout-weights', variantIdsStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select('id, weight_gram, products (weight_gram)')
        .in(
          'id',
          displayItems.map((i) => i.variantId)
        )

      if (error) throw error
      return data
    },
    enabled: displayItems.length > 0,
  })

  // Calculate total weight with DEFAULT_WEIGHT_GRAM (400g) fallback
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

  // 6. Fetch Shipping Rates for selected zone
  const { data: shippingDataRes, isLoading: shippingLoading } = useShippingRates(
    totalWeight > 0 ? selectedAddress?.zone_id || null : null,
    totalWeight
  )

  const shippingOptions = shippingDataRes?.data || []

  // Reset courier selection if address changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedCourier(null)
  }, [selectedAddress])

  // Check unavailable or insufficient-stock items when shipping to Malaysia
  const unavailableMyItems = useMemo(() => {
    if (!isMalaysia) return []
    return displayItems.filter((item) => item.priceMyr == null || item.priceMyr <= 0)
  }, [displayItems, isMalaysia])

  const outOfStockMyItems = useMemo(() => {
    if (!isMalaysia) return []
    return displayItems.filter(
      (item) => typeof item.stockMy === 'number' && item.stockMy < item.quantity
    )
  }, [displayItems, isMalaysia])

  const hasMyCartIssue = unavailableMyItems.length > 0 || outOfStockMyItems.length > 0

  // Calculate Prices (native RM for Malaysia, native IDR for Indonesia)
  const subtotalMyr = useMemo(() => {
    if (!isMalaysia) return 0
    return Number(
      displayItems
        .reduce((acc, item) => acc + (item.priceMyr && item.priceMyr > 0 ? item.priceMyr : 0) * item.quantity, 0)
        .toFixed(2)
    )
  }, [displayItems, isMalaysia])

  const subtotalIdr = useMemo(() => {
    return displayItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
  }, [displayItems])

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
    if (appliedVoucher.discount_type === 'fixed') {
      discountAmountIdr = Math.min(appliedVoucher.value, subtotalIdr)
    } else if (appliedVoucher.discount_type === 'percentage') {
      discountAmountIdr = Math.round(subtotalIdr * (appliedVoucher.value / 100))
      if (appliedVoucher.max_discount) {
        discountAmountIdr = Math.min(discountAmountIdr, appliedVoucher.max_discount)
      }
    } else {
      discountAmountIdr = appliedVoucher.discount_amount || 0
    }
  }

  const baseAmountMyr = Math.max(
    0,
    Number((subtotalMyr + shippingCostMyr - discountAmountMyr).toFixed(2))
  )
  const paymentFeeMyr = useMemo(() => {
    if (!isMalaysia || !selectedChannel) return 0
    return calculateChannelFeeMyr(selectedChannel, baseAmountMyr, myrExchangeRate)
  }, [isMalaysia, selectedChannel, baseAmountMyr, myrExchangeRate])

  const totalMyr = Math.max(0, Number((baseAmountMyr + paymentFeeMyr).toFixed(2)))

  // IDR amounts (for Indonesia checkout OR DOKU QRIS IDR settlement estimate for Malaysia)
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

  // Track InitiateCheckout event with strictly locked IDR currency
  const hasTrackedCheckout = useRef(false)
  useEffect(() => {
    if (cartItems.length > 0 && !hasTrackedCheckout.current) {
      hasTrackedCheckout.current = true
      trackInitiateCheckout(
        cartItems.map((i) => ({
          id: i.variantId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        totalAmount
      )
    }
  }, [cartItems, totalAmount])

  // Re-verify applied voucher if destination country or subtotal changes
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
              prev
                ? {
                    ...prev,
                    currency: res.data.currency,
                    discount_amount: res.data.discount_amount || 0,
                  }
                : null
            )
          }
        })
        .catch(() => {
          setAppliedVoucher(null)
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCountryCode, voucherValidationSubtotal])

  const handleSelectPaymentChannel = (channel: PaymentFeeConfig) => {
    setSelectedChannel(channel)
  }

  const handleApplyVoucherDirectly = async (code: string) => {
    if (!user) return
    setVoucherLoading(true)
    try {
      const result = await validateVoucherAction(code, voucherValidationSubtotal, currentCountryCode)
      if (result.success) {
        const validVoucher = result.data
        // Fetch full details of the voucher to know constraints
        const { data: voucherInfo } = await supabase
          .from('vouchers')
          .select('value, discount_type, max_discount, currency')
          .eq('code', code.toUpperCase())
          .single()

        setAppliedVoucher({
          code: validVoucher.code || code.toUpperCase(),
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
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
    if (!selectedAddress) {
      toast.error('Harap pilih alamat pengiriman')
      return
    }
    if (isMalaysia && !isMalaysiaShippingEnabled) {
      toast.error('Pengiriman ke Malaysia sedang dinonaktifkan sementara.')
      return
    }
    if (isMalaysia && unavailableMyItems.length > 0) {
      toast.error('Some items in your bag are not available for Malaysia shipping. Please remove them first.')
      return
    }
    if (isMalaysia && outOfStockMyItems.length > 0) {
      toast.error('Malaysia stock is insufficient for some items in your bag. Please adjust quantities in your bag.')
      return
    }
    const isQrisChannel = selectedChannel?.channel_code?.toUpperCase() === 'QRIS'
    if ((isMalaysia || isQrisChannel) && totalAmount > QRIS_MAX_AMOUNT_IDR) {
      toast.error(
        isMalaysia
          ? 'Total pembayaran melebihi batas transaksi QRIS Cross-Border (Rp 10.000.000)'
          : 'Total pembayaran melebihi batas regulasi pembayaran QRIS (maksimal Rp 10.000.000)'
      )
      return
    }
    if (!selectedCourier) {
      toast.error('Harap pilih metode pengiriman')
      return
    }
    if (!selectedChannel) {
      toast.error('Harap pilih metode pembayaran')
      return
    }

    checkoutInitiated.current = true
    try {
      // 0. Ensure cart items are 100% flushed and synced to database
      await useCartStore.getState().syncCart(user.id, false)

      // 1. Create order in database
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

      const orderNumber = orderRes.order_number

      toast.success('Pesanan berhasil dibuat!')
      setOrderSnapshot(cartItems)
      setOrderPlaced(true)
      clearCart()
      setCheckoutStep('payment')

      // Redirect main tab directly to the order detail page with autoPay parameter
      router.push(`/pesanan/${orderNumber}?autoPay=1`)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Terjadi kesalahan saat memproses pesanan')
      checkoutInitiated.current = false
    }
  }

  const isCheckoutProcessing =
    createOrderMutation.isPending || generatePaymentTokenMutation.isPending

  const isCheckoutInitiated = checkoutInitiated.current

  if (
    authLoading ||
    !isAuthenticated ||
    isSyncing ||
    !hasSynced ||
    (cartItems.length === 0 && !orderPlaced && !isCheckoutInitiated)
  ) {
    return <AuthLoading message="Memuat Checkout..." />
  }

  return (
    <div className="min-h-screen bg-brand-cream font-sans">
      <PageHero
        eyebrow={market === "MY" || isMalaysia ? "Checkout" : "Pembelian"}
        title="Checkout"
        subtitle={market === "MY" || isMalaysia ? "Complete your delivery address and choose a payment method." : "Lengkapi alamat pengiriman dan pilih metode pembayaran."}
      />
      <PageContainer size="lg" className="py-10 page-content">
        <CheckoutProgressBar checkoutStep={checkoutStep} />

        {isMalaysia && !isMalaysiaShippingEnabled && (
          <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 flex items-start gap-3">
            <HandDrawnIcon name="alert-triangle" className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-800">{market === "MY" || isMalaysia ? "International Shipping Disabled" : "Pengiriman Internasional Dinonaktifkan"}</p>
              <p className="mt-0.5 text-red-700">{market === "MY" || isMalaysia ? "Shipping to Malaysia is currently paused by the system. Please select an Indonesian delivery address or contact Customer Care." : "Pengiriman ke Malaysia saat ini sedang dinonaktifkan sementara oleh sistem. Silakan pilih alamat pengiriman di Indonesia atau hubungi Customer Service kami."}</p>
            </div>
          </div>
        )}

        {isMalaysia && hasMyCartIssue && (
          <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 flex items-start gap-3">
            <HandDrawnIcon name="alert-triangle" className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-950">
                Action Required for Malaysia Shipping
              </p>
              {unavailableMyItems.length > 0 && (
                <p className="mt-0.5 text-xs">
                  {unavailableMyItems.length} item(s) in your bag are not available for Malaysia shipping. Please remove them in your shopping bag first.
                </p>
              )}
              {outOfStockMyItems.length > 0 && (
                <p className="mt-0.5 text-xs">
                  {outOfStockMyItems.length} item(s) exceed available Malaysia stock. Please reduce quantity in your shopping bag.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: SHIPPING & PAYMENT DETAILS */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-8"
          >
            <CheckoutAddressForm
              addresses={addresses}
              selectedAddress={selectedAddress}
              onSelectAddress={setSelectedAddress}
              onAddNewAddress={() => setAddressModalOpen(true)}
              addressesLoading={addressesLoading}
              shippingOptions={shippingOptions}
              selectedCourier={selectedCourier}
              onSelectCourier={setSelectedCourier}
              shippingLoading={shippingLoading}
              notes={notes}
              onNotesChange={setNotes}
              totalWeightGram={totalWeight}
              myrExchangeRate={myrExchangeRate}
            />

            {/* PAYMENT METHOD SELECTOR */}
            <div className="bg-brand-cream border border-neutral-200/80 p-6 rounded-2xl shadow-xs">
              <PaymentMethodSelector
                feeConfigs={feeConfigs}
                selectedChannelCode={selectedChannel?.channel_code || null}
                onSelectChannel={handleSelectPaymentChannel}
                subtotal={subtotal}
                shippingCost={shippingCost}
                discountAmount={discountAmount}
                baseAmountMyr={baseAmountMyr}
                myrExchangeRate={myrExchangeRate}
                loading={feeConfigsLoading}
                countryCode={currentCountryCode}
              />
            </div>
          </motion.div>

          {/* RIGHT: ORDER SUMMARY */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 space-y-6"
          >
            <CheckoutSummaryCard
              displayItems={displayItems}
              subtotal={subtotal}
              shippingCost={shippingCost}
              paymentFee={paymentFee}
              discountAmount={discountAmount}
              totalAmount={totalAmount}
              subtotalMyr={subtotalMyr}
              shippingCostMyr={shippingCostMyr}
              paymentFeeMyr={paymentFeeMyr}
              discountAmountMyr={discountAmountMyr}
              totalMyr={totalMyr}
              voucherCodeInput={voucherCodeInput}
              onVoucherInputChange={setVoucherCodeInput}
              appliedVoucher={appliedVoucher}
              onApplyVoucher={handleApplyVoucher}
              onApplyVoucherDirectly={handleApplyVoucherDirectly}
              onRemoveVoucher={handleRemoveVoucher}
              availableVouchers={filteredAvailableVouchers}
              voucherLoading={voucherLoading}
              onPaymentSubmit={handlePlaceOrder}
              isCheckoutProcessing={isCheckoutProcessing}
              isPaymentTokenLoading={generatePaymentTokenMutation.isPending}
              canSubmit={
                !!(selectedAddress && selectedCourier && selectedChannel) &&
                (!isMalaysia || (isMalaysiaShippingEnabled && !hasMyCartIssue))
              }
              selectedChannelCode={selectedChannel?.channel_code || null}
              isMalaysia={isMalaysia}
              myrExchangeRate={myrExchangeRate}
            />
          </motion.div>
        </div>
      </PageContainer>

      <AddressModal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        userId={user?.id || ''}
      />
    </div>
  )
}
