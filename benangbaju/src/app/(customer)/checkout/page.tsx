'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import type { CartItem } from '@/stores/cartStore'
import { useUserAddresses, useShippingRates } from '@/hooks/useShipping'
import type { UserAddress, ShippingOption } from '@/services/shipping'
import { useCreateOrder, useGeneratePaymentToken } from '@/hooks/useOrders'
import { validateVoucher } from '@/services/vouchers'
import { createBrowserClient } from '@/lib/supabase/client'
import { AddressCard } from '@/components/customer/AddressCard'
import { AddressModal } from '@/components/customer/AddressModal'
import { Button, Input, AuthLoading, PageContainer, PageHero } from '@/components/shared'
import { Plus, MapPin, Tag, ShoppingBag, Truck, Check } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import { formatIDR } from '@/lib/utils'

const supabase = createBrowserClient()

interface AppliedVoucher {
  code: string
  discount_amount: number
  discount_type?: string | null
  value: number
  max_discount?: number | null
}

export default function CheckoutPage() : React.JSX.Element {
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
  }, [isMounted, cartItems.length, authLoading, isAuthenticated, orderPlaced, router, isSyncing, hasSynced])

  // 3. Load Midtrans Snap.js Script
  useEffect(() => {
    const snapScriptUrl = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL || 'https://app.sandbox.midtrans.com/snap/snap.js'
    const existingScript = document.querySelector(`script[src="${snapScriptUrl}"]`)
    if (!existingScript) {
      const script = document.createElement('script')
      script.src = snapScriptUrl
      script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '')
      script.async = true
      document.body.appendChild(script)
    }
  }, [])

  // 4. Fetch Addresses
  const { data: addresses, isLoading: addressesLoading } = useUserAddresses(user?.id || '')

  // Fetch available active vouchers
  const { data: availableVouchers } = useQuery({
    queryKey: ['checkout-available-vouchers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  // Set default address initially
  useEffect(() => {
    if (addresses && addresses.length > 0) {
      const defaultAddr = addresses.find((a) => a.is_default) || addresses[0]
      setSelectedAddress(defaultAddr)
    }
  }, [addresses])

  // 5. Query Variant Weights to calculate total weight
  const { data: variantDetails } = useQuery({
    queryKey: ['checkout-weights', displayItems.map((i) => i.variantId)],
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

  // Calculate total weight - wait until variantDetails is fetched to avoid double fetching shipping rates
  const totalWeight = useMemo(() => {
    return variantDetails
      ? displayItems.reduce((acc, item) => {
          const detail = variantDetails.find((v) => v.id === item.variantId)
          let weight = 1000
          if (detail) {
            if (typeof detail.weight_gram === 'number') {
              weight = detail.weight_gram
            } else if (detail.products) {
              const prod = detail.products
              if (Array.isArray(prod)) {
                const first = prod[0]
                if (first && typeof first === 'object' && 'weight_gram' in first) {
                  const w = first['weight_gram']
                  if (typeof w === 'number') {
                    weight = w
                  }
                }
              } else if (typeof prod === 'object' && 'weight_gram' in prod) {
                const w = prod['weight_gram']
                if (typeof w === 'number') {
                  weight = w
                }
              }
            }
          }
          return acc + weight * item.quantity
        }, 0)
      : 0
  }, [displayItems, variantDetails])

  // 6. Fetch Shipping Rates for selected zone
  const { data: shippingData, isLoading: shippingLoading } = useShippingRates(
    selectedAddress?.zone_id || null,
    totalWeight
  )

  const shippingOptions = shippingData?.data || []

  // Reset courier selection if address changes
  useEffect(() => {
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
      const result = await validateVoucher(supabase, code, subtotal, user.id)
      if (result.success && result.valid) {
        // Fetch full details of the voucher to know constraints
        const { data: voucherInfo } = await supabase
          .from('vouchers')
          .select('value, discount_type, max_discount')
          .eq('code', code.toUpperCase())
          .single()

        setAppliedVoucher({
          code: result.code || code.toUpperCase(),
          discount_amount: result.discount_amount || 0,
          discount_type: voucherInfo?.discount_type,
          value: voucherInfo?.value || 0,
          max_discount: voucherInfo?.max_discount,
        })
        toast.success(`Voucher ${result.code} berhasil digunakan!`)
      } else {
        toast.error(result.message || 'Voucher tidak valid')
        setAppliedVoucher(null)
      }
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
        shippingCost: selectedCourier.price,
        notes: notes.trim() || undefined,
      })

      if (!orderRes.success || !orderRes.data) {
        toast.error(orderRes.message || 'Gagal membuat pesanan')
        return
      }

      const orderNumber = orderRes.data.order_number
      const orderId = orderRes.data.order_id

      toast.success('Pesanan berhasil dibuat, memproses pembayaran...')
      setOrderSnapshot(cartItems)
      setOrderPlaced(true)
      clearCart()
      setCheckoutStep('payment')

      // 2. Generate Midtrans payment token
      const paymentRes = await generatePaymentTokenMutation.mutateAsync(orderNumber)

      if (!paymentRes.success || !paymentRes.token) {
        toast.error(paymentRes.message || 'Gagal mendapatkan token pembayaran. Silakan coba di halaman riwayat pesanan.')
        clearCart()
        router.push(`/pesanan/${orderNumber}`)
        return
      }

      // 3. Open Midtrans Snap pop-up
      if (window.snap) {
        window.snap.pay(paymentRes.token, {
          onSuccess: () => {
            toast.success('Pembayaran berhasil! Memverifikasi...')
            router.push(`/pesanan/${orderNumber}?verifying=1`)
          },
          onPending: () => {
            toast.success('Pesanan disimpan, silakan selesaikan pembayaran.')
            router.push(`/pesanan/${orderNumber}`)
          },
          onError: () => {
            toast.error('Pembayaran gagal! Silakan coba lagi.')
            router.push(`/pesanan/${orderNumber}`)
          },
          onClose: () => {
            toast('Menunggu pembayaran Anda.', { icon: 'ℹ️' })
            router.push(`/pesanan/${orderNumber}`)
          },
        })
      } else {
        // Fallback to redirect URL
        if (paymentRes.redirect_url) {
          window.location.href = paymentRes.redirect_url
        } else {
          clearCart()
          router.push(`/pesanan/${orderNumber}`)
        }
      }
    } catch (err: unknown) {
      console.error(err)
      toast.error('Terjadi kesalahan saat membuat pesanan')
    }
  }

  const isCheckoutProcessing = createOrderMutation.isPending || generatePaymentTokenMutation.isPending

  if (authLoading || !isAuthenticated || isSyncing || !hasSynced || (cartItems.length === 0 && !orderPlaced && !checkoutInitiated.current)) {
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
        
        {/* Step-style Visual Progress Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-center space-x-2 md:space-x-4 mb-10 max-w-md mx-auto"
        >
          <Link href="/cart" className="flex items-center space-x-2 group">
            <div className="w-5 h-5 rounded-full border border-neutral-300 flex items-center justify-center text-[10px] text-neutral-400 font-sans group-hover:border-brand-black group-hover:text-brand-black transition-colors">1</div>
            <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-heading group-hover:text-brand-black transition-colors">Keranjang</span>
          </Link>
          <div className="w-8 md:w-12 h-px bg-neutral-200" />
          <div className="flex items-center space-x-2">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-sans font-semibold ${checkoutStep === 'shipping' ? 'bg-brand-gold text-white shadow-[0_0_10px_rgba(154,123,79,0.3)]' : 'border border-neutral-300 text-neutral-400'}`}>2</div>
            <span className={`text-[10px] uppercase tracking-wider font-heading ${checkoutStep === 'shipping' ? 'font-semibold text-brand-gold' : 'text-neutral-400'}`}>Pengiriman</span>
          </div>
          <div className="w-8 md:w-12 h-px bg-neutral-200" />
          <div className="flex items-center space-x-2">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-sans font-semibold ${checkoutStep === 'payment' ? 'bg-brand-gold text-white shadow-[0_0_10px_rgba(154,123,79,0.3)]' : 'border border-neutral-300 text-neutral-400'}`}>3</div>
            <span className={`text-[10px] uppercase tracking-wider font-heading ${checkoutStep === 'payment' ? 'font-semibold text-brand-gold' : 'text-neutral-400'}`}>Pembayaran</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: SHIPPING DETAILS */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-8"
          >
            {/* Address Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs uppercase tracking-widest font-heading font-bold text-brand-black flex items-center">
                  <MapPin size={14} className="mr-2 text-neutral-500" /> Alamat Pengiriman
                </h2>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setAddressModalOpen(true)}
                  className="inline-flex items-center text-[11px] text-neutral-600 hover:text-brand-black font-heading font-medium uppercase tracking-wider transition-colors duration-200"
                >
                  <Plus size={12} className="mr-1" /> Tambah Alamat
                </motion.button>
              </div>

              {addressesLoading ? (
                <div className="h-24 bg-neutral-100 animate-pulse rounded-none" />
              ) : addresses && addresses.length > 0 ? (
                <div className="space-y-3">
                  {/* Selected Address Display */}
                  {selectedAddress ? (
                    <motion.div 
                      layoutId="selectedAddressBox"
                      className="border border-brand-gold bg-brand-gold-muted/10 p-4 relative rounded-none shadow-sm"
                    >
                      <p className="font-heading font-semibold text-xs text-brand-gold uppercase tracking-wider">
                        {selectedAddress.label} (Pilihan)
                      </p>
                      <p className="font-sans font-medium text-neutral-700 mt-1.5">{selectedAddress.recipient_name} | {selectedAddress.phone}</p>
                      <p className="text-neutral-500 text-xs mt-1 leading-relaxed">{selectedAddress.full_address}</p>
                      <p className="text-[10px] text-neutral-400 mt-1 font-sans">
                        {selectedAddress.district_name}, {selectedAddress.city_name}, {selectedAddress.province_name} {selectedAddress.postal_code}
                      </p>
                    </motion.div>
                  ) : (
                    <p className="text-sm text-red-500 font-medium">Harap pilih atau tambahkan alamat baru</p>
                  )}

                  {/* Other Addresses Accordion/Dropdown */}
                  {addresses.length > 1 && (
                    <div className="border border-neutral-200 p-4 space-y-3 bg-white">
                      <p className="text-[10px] text-neutral-400 font-heading font-medium uppercase tracking-widest">Pilih Alamat Lain:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                        {addresses
                          .filter((a) => a.id !== selectedAddress?.id)
                          .map((address) => (
                            <motion.div
                              whileHover={{ y: -1, borderColor: '#171717' }}
                              whileTap={{ scale: 0.98 }}
                              key={address.id}
                              onClick={() => setSelectedAddress(address)}
                              className="p-3 border border-neutral-200 text-xs cursor-pointer bg-white transition-all duration-200"
                            >
                              <p className="font-heading font-medium text-[10px] text-brand-black uppercase tracking-wider">{address.label}</p>
                              <p className="font-sans text-neutral-700 mt-1 font-medium">{address.recipient_name}</p>
                              <p className="text-neutral-500 truncate mt-0.5 text-[11px]">{address.full_address}</p>
                            </motion.div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-neutral-200">
                  <p className="text-xs text-neutral-400 mb-3">Belum ada alamat pengiriman.</p>
                  <Button
                    onClick={() => setAddressModalOpen(true)}
                    variant="outline"
                    className="text-xs uppercase font-semibold"
                  >
                    Tambah Alamat Pertama
                  </Button>
                </div>
              )}
            </div>

            {/* Shipping Method Section */}
            <div className="space-y-4 pt-4 border-t border-neutral-100">
              <h2 className="text-xs uppercase tracking-widest font-heading font-bold text-brand-black flex items-center">
                <Truck size={14} className="mr-2 text-neutral-500" /> Opsi Pengiriman
              </h2>

              {!selectedAddress ? (
                <p className="text-xs text-neutral-400 italic">Harap pilih alamat terlebih dahulu untuk menampilkan opsi pengiriman.</p>
              ) : shippingLoading ? (
                <div className="space-y-2">
                  <div className="h-12 bg-neutral-100 animate-pulse rounded-none" />
                  <div className="h-12 bg-neutral-100 animate-pulse rounded-none" />
                </div>
              ) : shippingOptions.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {shippingOptions.map((option) => (
                    <motion.div
                      whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderColor: '#171717' }}
                      whileTap={{ scale: 0.99 }}
                      key={option.id}
                      onClick={() => setSelectedCourier(option)}
                      className={`p-4 border cursor-pointer transition-all duration-300 relative rounded-none ${
                        selectedCourier?.id === option.id
                          ? 'border-brand-gold bg-brand-gold-muted/10 ring-1 ring-brand-gold'
                          : 'border-neutral-200 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-heading font-medium text-xs text-brand-black uppercase tracking-wider">
                          {option.courier_name}
                        </span>
                        <span className="font-sans font-bold text-xs text-brand-black">
                          {formatIDR(option.price)}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400">
                        Estimasi tiba: {option.etd_min} - {option.etd_max} Hari
                      </p>
                      {selectedCourier?.id === option.id && (
                        <div className="absolute top-2 right-2 bg-brand-gold text-white rounded-full p-0.5">
                          <Check size={8} />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-red-500 font-semibold">Pengiriman tidak tersedia untuk zona alamat Anda. Harap hubungi Admin.</p>
              )}
            </div>

            {/* Note Section */}
            <div className="space-y-2 pt-4 border-t border-neutral-100">
              <label className="block text-xs uppercase tracking-widest font-heading font-bold text-brand-black">
                Catatan Pesanan
              </label>
              <textarea
                className="w-full px-4 py-3 border border-neutral-200 focus:border-brand-black focus:bg-neutral-50/30 outline-none rounded-none transition-all duration-300 h-20 resize-none text-xs focus-ring-premium"
                placeholder="Tulis instruksi khusus (cth: ukuran tambahan, warna cadangan, dll)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
            <div className="border border-neutral-200 p-6 bg-white rounded-none shadow-sm hover:shadow-md transition-shadow duration-300 card-hover-lift gold-border-hover relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-gold to-brand-gold-light" />
              <h2 className="text-xs uppercase tracking-widest font-heading font-bold text-brand-black mb-6 flex items-center border-b border-neutral-100 pb-3">
                <ShoppingBag size={14} className="mr-2 text-neutral-500" /> Ringkasan Pesanan
              </h2>

              {/* Items List */}
              <div className="divide-y divide-neutral-100 max-h-60 overflow-y-auto pr-1 mb-6">
                {displayItems.map((item) => (
                  <div key={item.variantId} className="py-3 flex space-x-3 text-xs">
                    {item.imageUrl && (
                      <div className="relative w-10 h-14 border border-neutral-100 rounded-none bg-neutral-50 flex-shrink-0">
                        <Image
                          src={item.imageUrl}
                          alt={item.productName || item.name}
                          className="object-cover"
                          fill
                          sizes="40px"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-medium text-brand-black uppercase tracking-wide truncate text-[11px]">{item.productName || item.name}</p>
                      {item.variantName && (
                        <p className="text-[9px] text-neutral-400 uppercase tracking-wider">{item.variantName}</p>
                      )}
                      <p className="text-[10px] text-neutral-400 mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-sans font-semibold text-brand-black">
                        {formatIDR(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Voucher Code Form */}
              <div className="pb-6 border-b border-neutral-100 mb-6">
                <label className="block text-[10px] uppercase tracking-widest font-heading font-bold text-neutral-400 mb-2">
                  Punya Kode Voucher?
                </label>
                <AnimatePresence mode="wait">
                  {appliedVoucher ? (
                    <motion.div 
                      key="applied"
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                      className="flex items-center justify-between bg-brand-gold-muted/10 border border-brand-gold px-4 py-2.5 rounded-none text-xs"
                    >
                      <div className="flex items-center space-x-2 text-brand-gold font-heading font-medium uppercase tracking-wider text-[10px]">
                        <Tag size={12} className="text-neutral-500" />
                        <span>{appliedVoucher.code} diterapkan</span>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={handleRemoveVoucher}
                        className="text-red-500 font-bold hover:text-red-700 transition ml-2"
                      >
                        Hapus
                      </motion.button>
                    </motion.div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Masukkan kode voucher"
                          className="flex-1 px-3 py-2 border border-neutral-200 focus:border-brand-black outline-none text-xs uppercase rounded-none transition-colors duration-200 focus-ring-premium"
                          value={voucherCodeInput}
                          onChange={(e) => setVoucherCodeInput(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="py-2.5 px-4 text-xs font-bold uppercase tracking-wider"
                          onClick={handleApplyVoucher}
                          isLoading={voucherLoading}
                        >
                          Pakai
                        </Button>
                      </div>

                      {/* Available Vouchers suggestions */}
                      {availableVouchers && availableVouchers.length > 0 && (
                        <div className="pt-1 space-y-1.5">
                          <span className="text-[9px] uppercase tracking-widest font-heading font-medium text-neutral-400 block">
                            Voucher Tersedia (Klik untuk Memakai)
                          </span>
                          <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
                            {availableVouchers.map((voucher) => {
                              const isSpendMet = subtotal >= voucher.min_purchase;
                              return (
                                <button
                                  key={voucher.id}
                                  type="button"
                                  disabled={!isSpendMet}
                                  onClick={() => handleApplyVoucherDirectly(voucher.code)}
                                  className={`flex-shrink-0 text-left p-2.5 border transition-all duration-200 w-36 rounded-none relative overflow-hidden select-none ${
                                    isSpendMet
                                      ? 'border-brand-gold/40 bg-brand-gold-muted/5 hover:bg-brand-gold-muted/10 cursor-pointer animate-pulse-gentle'
                                      : 'border-neutral-200 bg-neutral-50/50 opacity-40 cursor-not-allowed'
                                  }`}
                                >
                                  <div className="flex justify-between items-center mb-0.5">
                                    <span className="font-heading font-bold text-[10px] text-brand-gold uppercase tracking-wider">
                                      {voucher.code}
                                    </span>
                                  </div>
                                  <div className="text-[9px] text-neutral-500 font-sans line-clamp-1 mb-1">
                                    {voucher.name}
                                  </div>
                                  <div className="text-[9px] font-heading font-bold text-neutral-700">
                                    {voucher.discount_type === 'percentage' ? `${voucher.value}% OFF` : `${formatIDR(voucher.value)} OFF`}
                                  </div>
                                  <div className="text-[8px] text-neutral-400 font-sans">
                                    Min. Belanja: {formatIDR(voucher.min_purchase)}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Cost Calculation Details */}
              <div className="space-y-3 text-xs text-neutral-500 border-b border-neutral-100 pb-5 mb-5 font-sans">
                <div className="flex justify-between">
                  <span>Subtotal Produk</span>
                  <span className="font-semibold text-brand-black">
                    {formatIDR(subtotal)}
                  </span>
                </div>
                {appliedVoucher && (
                  <div className="flex justify-between font-semibold">
                    <span>Diskon Voucher</span>
                    <span className="text-red-600">
                      - {formatIDR(discountAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Ongkos Kirim</span>
                  <span className="font-semibold text-brand-black">
                    {selectedCourier
                      ? formatIDR(shippingCost)
                      : 'Pilih kurir...'}
                  </span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-center text-brand-black font-heading mb-8">
                <span className="text-xs uppercase tracking-widest font-medium">Total Pembayaran</span>
                <span className="text-lg font-bold">
                  {formatIDR(totalAmount)}
                </span>
              </div>

              {/* Payment trigger button */}
              <Button
                type="button"
                variant="primary"
                onClick={handlePlaceOrder}
                isLoading={isCheckoutProcessing}
                className="w-full py-4 text-xs uppercase tracking-widest font-semibold"
                disabled={!selectedAddress || !selectedCourier}
              >
                Bayar Sekarang
              </Button>
            </div>
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

