/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/refs */
'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/modules/users/stores/authStore'
import { useCartStore } from '@/modules/cart/stores/cartStore'
import type { CartItem } from '@/modules/cart/stores/cartStore'
import { useUserAddresses, useShippingRates } from '@/modules/shipping/hooks/useShipping'
import type { UserAddress, ShippingOption } from '@/modules/shipping/types'
import { useCreateOrder, useGeneratePaymentToken } from '@/modules/orders/hooks/useOrders'
import { validateVoucherAction } from '@/modules/vouchers/actions'
import { createBrowserClient } from '@/lib/supabase/client'
import { AddressModal } from '@/modules/users/components/AddressModal'
import { AuthLoading, PageContainer, PageHero } from '@/shared/components'
import { CheckoutAddressForm, CheckoutSummaryCard, CheckoutProgressBar } from './components'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { SmartLink as Link } from '@/shared/components'
import { useMidtransScript } from '@/shared/hooks/useMidtransScript'

import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'

const supabase = createBrowserClient()

interface AppliedVoucher {
  code: string
  discount_amount: number
  discount_type?: string | null
  value: number
  max_discount?: number | null
}

export default function CheckoutPage(): React.JSX.Element {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()
  const { items: cartItems, clearCart, isSyncing, hasSynced } = useCartStore()

  // Modal State
  const [addressModalOpen, setAddressModalOpen] = useState(false)

  // Checkout Form States
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null)
  const [selectedCourier, setSelectedCourier] = useState<ShippingOption | null>(null)
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

  // 3. Load Midtrans Snap.js Script
  useMidtransScript()

  // 4. Fetch Addresses
  const { data: addressesRes, isLoading: addressesLoading } = useUserAddresses(user?.id || '')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const addresses = addressesRes?.data || []

  // Fetch available active vouchers
  const { data: availableVouchers } = useQuery({
    queryKey: ['checkout-available-vouchers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vouchers')
        .select(
          'id, code, name, discount_type, value, max_discount, min_purchase, starts_at, expires_at, usage_limit, usage_per_user, used_count, is_active, created_at'
        )
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
  })

  // Set default address initially
  useEffect(() => {
    if (addresses && addresses.length > 0) {
      const defaultAddr = addresses.find((a) => a.is_default) || addresses[0]
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedAddress(defaultAddr)
    }
  }, [addresses])

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

  // Calculate total weight - wait until variantDetails is fetched to avoid double fetching shipping rates
  const totalWeight = useMemo(() => {
    if (!variantDetails) return 0

    return displayItems.reduce((acc, item) => {
      const detail = variantDetails.find((v) => v.id === item.variantId) as any
      const product = Array.isArray(detail?.products) ? detail.products[0] : detail?.products

      const weight = detail?.weight_gram ?? product?.weight_gram ?? 1000
      return acc + (Number(weight) || 1000) * (item.quantity || 1)
    }, 0)
  }, [displayItems, variantDetails])

  // 6. Fetch Shipping Rates for selected zone
  const { data: shippingDataRes, isLoading: shippingLoading } = useShippingRates(
    selectedAddress?.zone_id || null,
    totalWeight
  )

  const shippingOptions = shippingDataRes?.data || []

  // Reset courier selection if address changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedCourier(null)
  }, [selectedAddress])

  // Calculate Prices
  const subtotal = displayItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const shippingCost = selectedCourier ? selectedCourier.price : 0

  // Calculate Discount Amount
  let discountAmount = 0
  if (appliedVoucher) {
    if (appliedVoucher.discount_type === 'fixed') {
      discountAmount = Math.min(appliedVoucher.value, subtotal)
    } else if (appliedVoucher.discount_type === 'percentage') {
      discountAmount = subtotal * (appliedVoucher.value / 100)
      if (appliedVoucher.max_discount) {
        discountAmount = Math.min(discountAmount, appliedVoucher.max_discount)
      }
    }
  }

  const totalAmount = Math.max(0, subtotal - discountAmount + shippingCost)

  const handleApplyVoucherDirectly = async (code: string) => {
    if (!user) return
    setVoucherLoading(true)
    try {
      const result = await validateVoucherAction(code, subtotal)
      if (result.success) {
        const validVoucher = result.data
        // Fetch full details of the voucher to know constraints
        const { data: voucherInfo } = await supabase
          .from('vouchers')
          .select('value, discount_type, max_discount')
          .eq('code', code.toUpperCase())
          .single()

        setAppliedVoucher({
          code: validVoucher.code || code.toUpperCase(),
          discount_amount: validVoucher.discount_amount || 0,
          discount_type: voucherInfo?.discount_type,
          value: voucherInfo?.value || 0,
          max_discount: voucherInfo?.max_discount,
        })
        toast.success(`Voucher ${validVoucher.code} berhasil digunakan!`)
      } else {
        toast.error(result.error?.message || 'Voucher tidak valid')
        setAppliedVoucher(null)
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast.error('Gagal memvalidasi voucher')
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
    toast.success('Voucher dihapus')
  }

  const handlePlaceOrder = async () => {
    if (!user) return
    if (!selectedAddress) {
      toast.error('Harap pilih alamat pengiriman')
      return
    }
    if (!selectedCourier) {
      toast.error('Harap pilih metode pengiriman')
      return
    }

    checkoutInitiated.current = true
    try {
      // 1. Create order in database
      const orderRes = await createOrderMutation.mutateAsync({
        userId: user.id,
        addressId: selectedAddress.id,
        voucherCode: appliedVoucher?.code || undefined,
        courierName: `${selectedCourier.courier_name} (${selectedCourier.etd_min}-${selectedCourier.etd_max} hari)`,
        shippingRateId: selectedCourier.id,
        shippingCost: selectedCourier.price,
        notes: notes.trim() || undefined,
      })

      const orderNumber = orderRes.order_number
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const orderId = orderRes.order_id

      toast.success('Pesanan berhasil dibuat, memproses pembayaran...')
      setOrderSnapshot(cartItems)
      setOrderPlaced(true)
      clearCart()
      setCheckoutStep('payment')

      // 2. Generate Midtrans payment token
      const { token, redirect_url } = await generatePaymentTokenMutation.mutateAsync(orderNumber)

      if (!token) {
        toast.error('Gagal mendapatkan token pembayaran. Silakan coba di halaman riwayat pesanan.')
        clearCart()
        router.push(`/pesanan/${orderNumber}`)
        return
      }

      // 3. Open Midtrans Snap pop-up
      if (window.snap) {
        window.snap.pay(token, {
          onSuccess: () => {
            toast.success('Pembayaran berhasil! Memverifikasi...')
            router.push(`/pesanan/${orderNumber}?verifying=1`)
          },

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          onPending: function (result: any) {
            toast('Menunggu pembayaran diselesaikan.', { icon: 'ℹ️' })
            router.push(`/pesanan/${orderNumber}`)
          },

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          onError: function (result: any) {
            toast.error('Pembayaran gagal! Silakan coba lagi nanti.')
            router.push(`/pesanan/${orderNumber}`)
          },
          onClose: function () {
            router.push(`/pesanan/${orderNumber}`)
          },
        })
      } else {
        if (redirect_url) {
          window.location.href = redirect_url
        }
      }
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
    <div className="min-h-screen bg-white font-sans">
      <PageHero
        eyebrow="Pembelian"
        title="Checkout"
        subtitle="Lengkapi alamat pengiriman dan selesaikan pembayaran."
      />
      <PageContainer size="lg" className="py-10 page-content">
        <CheckoutProgressBar checkoutStep={checkoutStep} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: SHIPPING DETAILS */}
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
            />
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
              discountAmount={discountAmount}
              totalAmount={totalAmount}
              voucherCodeInput={voucherCodeInput}
              onVoucherInputChange={setVoucherCodeInput}
              appliedVoucher={appliedVoucher}
              onApplyVoucher={handleApplyVoucher}
              onApplyVoucherDirectly={handleApplyVoucherDirectly}
              onRemoveVoucher={handleRemoveVoucher}
              availableVouchers={availableVouchers || []}
              voucherLoading={voucherLoading}
              onPaymentSubmit={handlePlaceOrder}
              isCheckoutProcessing={isCheckoutProcessing}
              isPaymentTokenLoading={generatePaymentTokenMutation.isPending}
              canSubmit={!!(selectedAddress && selectedCourier)}
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
