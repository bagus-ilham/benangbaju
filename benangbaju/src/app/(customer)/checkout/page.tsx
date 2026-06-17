'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { useUserAddresses, useShippingRates } from '@/hooks/useShipping'
import { useCreateOrder, useGeneratePaymentToken } from '@/hooks/useOrders'
import { validateVoucher } from '@/services/vouchers'
import { createBrowserClient } from '@/lib/supabase/client'
import { AddressCard } from '@/components/customer/AddressCard'
import { AddressModal } from '@/components/customer/AddressModal'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Plus, MapPin, Tag, ShoppingBag, Truck } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'

const supabase = createBrowserClient()

export default function CheckoutPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()
  const { items: cartItems, clearCart } = useCartStore()

  // Modal State
  const [addressModalOpen, setAddressModalOpen] = useState(false)

  // Checkout Form States
  const [selectedAddress, setSelectedAddress] = useState<any | null>(null)
  const [selectedCourier, setSelectedCourier] = useState<any | null>(null)
  const [notes, setNotes] = useState('')
  const [voucherCodeInput, setVoucherCodeInput] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState<any | null>(null)
  const [voucherLoading, setVoucherLoading] = useState(false)

  const createOrderMutation = useCreateOrder()
  const generatePaymentTokenMutation = useGeneratePaymentToken()

  // 1. Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/masuk?redirect=/checkout')
    }
  }, [isAuthenticated, authLoading, router])

  // 2. Redirect if cart is empty
  useEffect(() => {
    if (!authLoading && isAuthenticated && cartItems.length === 0) {
      toast.error('Keranjang belanja Anda kosong')
      router.push('/produk')
    }
  }, [cartItems, authLoading, isAuthenticated, router])

  // 3. Load Midtrans Snap.js Script
  useEffect(() => {
    const snapScriptUrl = 'https://app.sandbox.midtrans.com/snap/snap.js'
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

  // Set default address initially
  useEffect(() => {
    if (addresses && addresses.length > 0) {
      const defaultAddr = addresses.find((a) => a.is_default) || addresses[0]
      setSelectedAddress(defaultAddr)
    }
  }, [addresses])

  // 5. Query Variant Weights to calculate total weight
  const { data: variantDetails } = useQuery({
    queryKey: ['checkout-weights', cartItems.map((i) => i.variantId)],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select('id, weight_gram, products (weight_gram)')
        .in('id', cartItems.map((i) => i.variantId))
      
      if (error) throw error
      return data
    },
    enabled: cartItems.length > 0,
  })

  // Calculate total weight
  const totalWeight = cartItems.reduce((acc, item) => {
    const detail = variantDetails?.find((v) => v.id === item.variantId)
    const weight = detail?.weight_gram || (detail?.products as any)?.weight_gram || 1000
    return acc + weight * item.quantity
  }, 0)

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
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
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

  const handleApplyVoucher = async () => {
    if (!voucherCodeInput.trim() || !user) return
    setVoucherLoading(true)
    try {
      const result = await validateVoucher(supabase, voucherCodeInput.trim(), subtotal, user.id)
      if (result.success && result.valid) {
        // Fetch full details of the voucher to know constraints
        const { data: voucherInfo } = await supabase
          .from('vouchers')
          .select('value, discount_type, max_discount')
          .eq('code', voucherCodeInput.trim().toUpperCase())
          .single()

        setAppliedVoucher({
          code: result.code,
          discount_amount: result.discount_amount,
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

      // 2. Generate Midtrans payment token
      const paymentRes = await generatePaymentTokenMutation.mutateAsync(orderNumber)

      if (!paymentRes.success || !paymentRes.token) {
        toast.error(paymentRes.message || 'Gagal mendapatkan token pembayaran. Silakan coba di halaman riwayat pesanan.')
        clearCart()
        router.push(`/pesanan/${orderNumber}`)
        return
      }

      // 3. Open Midtrans Snap pop-up
      if ((window as any).snap) {
        (window as any).snap.pay(paymentRes.token, {
          onSuccess: (result: any) => {
            toast.success('Pembayaran berhasil!')
            clearCart()
            router.push(`/pesanan/${orderNumber}`)
          },
          onPending: (result: any) => {
            toast.success('Pesanan disimpan, silakan selesaikan pembayaran.')
            clearCart()
            router.push(`/pesanan/${orderNumber}`)
          },
          onError: (result: any) => {
            toast.error('Pembayaran gagal! Silakan coba lagi.')
            clearCart()
            router.push(`/pesanan/${orderNumber}`)
          },
          onClose: () => {
            toast('Menunggu pembayaran Anda.', { icon: 'ℹ️' })
            clearCart()
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
    } catch (err: any) {
      console.error(err)
      toast.error('Terjadi kesalahan saat membuat pesanan')
    }
  }

  const isCheckoutProcessing = createOrderMutation.isPending || generatePaymentTokenMutation.isPending

  if (authLoading || !isAuthenticated || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center font-sans">
        <p className="text-neutral-400 text-sm tracking-widest uppercase animate-pulse">Memuat Checkout...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-serif tracking-tight text-neutral-900 mb-8 pb-4 border-b border-neutral-100">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: SHIPPING DETAILS */}
          <div className="lg:col-span-7 space-y-8">
            {/* Address Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm uppercase tracking-widest font-bold text-neutral-800 flex items-center">
                  <MapPin size={16} className="mr-2" /> Alamat Pengiriman
                </h2>
                <button
                  onClick={() => setAddressModalOpen(true)}
                  className="inline-flex items-center text-xs text-neutral-600 hover:text-neutral-950 font-semibold"
                >
                  <Plus size={14} className="mr-1" /> Tambah Alamat
                </button>
              </div>

              {addressesLoading ? (
                <div className="h-24 bg-neutral-100 animate-pulse rounded-none" />
              ) : addresses && addresses.length > 0 ? (
                <div className="space-y-3">
                  {/* Selected Address Display */}
                  {selectedAddress ? (
                    <div className="border border-neutral-900 bg-neutral-50/50 p-4 relative rounded-none">
                      <p className="font-semibold text-neutral-800">{selectedAddress.label} (Pilihan)</p>
                      <p className="font-medium text-neutral-700 mt-1">{selectedAddress.recipient_name} | {selectedAddress.phone}</p>
                      <p className="text-neutral-600 text-sm mt-1">{selectedAddress.full_address}</p>
                      <p className="text-xs text-neutral-400 mt-1">
                        {selectedAddress.district_name}, {selectedAddress.city_name}, {selectedAddress.province_name} {selectedAddress.postal_code}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-red-500 font-medium">Harap pilih atau tambahkan alamat baru</p>
                  )}

                  {/* Other Addresses Accordion/Dropdown */}
                  {addresses.length > 1 && (
                    <div className="border border-neutral-200 p-4 space-y-3">
                      <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Pilih Alamat Lain:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                        {addresses
                          .filter((a) => a.id !== selectedAddress?.id)
                          .map((address) => (
                            <div
                              key={address.id}
                              onClick={() => setSelectedAddress(address)}
                              className="p-3 border border-neutral-200 hover:border-neutral-800 text-xs cursor-pointer bg-white transition"
                            >
                              <p className="font-semibold text-neutral-800">{address.label}</p>
                              <p className="font-medium text-neutral-700 mt-1">{address.recipient_name}</p>
                              <p className="text-neutral-500 truncate mt-0.5">{address.full_address}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-neutral-200">
                  <p className="text-sm text-neutral-500 mb-3">Belum ada alamat pengiriman.</p>
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
              <h2 className="text-sm uppercase tracking-widest font-bold text-neutral-800 flex items-center">
                <Truck size={16} className="mr-2" /> Opsi Pengiriman
              </h2>

              {!selectedAddress ? (
                <p className="text-sm text-neutral-400 italic">Harap pilih alamat terlebih dahulu untuk menampilkan opsi pengiriman.</p>
              ) : shippingLoading ? (
                <div className="space-y-2">
                  <div className="h-12 bg-neutral-100 animate-pulse rounded-none" />
                  <div className="h-12 bg-neutral-100 animate-pulse rounded-none" />
                </div>
              ) : shippingOptions.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {shippingOptions.map((option) => (
                    <div
                      key={option.id}
                      onClick={() => setSelectedCourier(option)}
                      className={`p-4 border cursor-pointer transition rounded-none ${
                        selectedCourier?.id === option.id
                          ? 'border-neutral-900 bg-neutral-50/50 ring-1 ring-neutral-900'
                          : 'border-neutral-200 hover:border-neutral-400 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-sm text-neutral-800 uppercase">
                          {option.courier_name}
                        </span>
                        <span className="font-bold text-sm text-neutral-900">
                          Rp {option.price.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500">
                        Estimasi tiba: {option.etd_min} - {option.etd_max} Hari
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-red-500 font-medium">Pengiriman tidak tersedia untuk zona alamat Anda. Harap hubungi Admin.</p>
              )}
            </div>

            {/* Note Section */}
            <div className="space-y-2 pt-4 border-t border-neutral-100">
              <label className="block text-xs uppercase tracking-widest font-bold text-neutral-800">
                Catatan Pesanan
              </label>
              <textarea
                className="w-full px-4 py-3 border border-neutral-200 focus:border-neutral-800 outline-none rounded-none transition h-20 resize-none"
                placeholder="Tulis instruksi khusus (cth: ukuran tambahan, warna cadangan, dll)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* RIGHT: ORDER SUMMARY */}
          <div className="lg:col-span-5 space-y-6">
            <div className="border border-neutral-200 p-6 bg-white rounded-none">
              <h2 className="text-sm uppercase tracking-widest font-bold text-neutral-800 mb-6 flex items-center border-b border-neutral-100 pb-3">
                <ShoppingBag size={16} className="mr-2" /> Ringkasan Pesanan
              </h2>

              {/* Items List */}
              <div className="divide-y divide-neutral-100 max-h-60 overflow-y-auto pr-1 mb-6">
                {cartItems.map((item) => (
                  <div key={item.variantId} className="py-3 flex space-x-3 text-sm">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-12 h-16 object-cover border border-neutral-100 rounded-none bg-neutral-50"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-800 truncate">{item.name}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-neutral-900">
                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Voucher Code Form */}
              <div className="pb-6 border-b border-neutral-100 mb-6">
                <label className="block text-xs uppercase tracking-widest font-bold text-neutral-600 mb-2">
                  Punya Kode Voucher?
                </label>
                {appliedVoucher ? (
                  <div className="flex items-center justify-between bg-neutral-50 border border-neutral-800 px-4 py-2.5 rounded-none text-xs">
                    <div className="flex items-center space-x-2 text-neutral-800 font-semibold">
                      <Tag size={14} />
                      <span>{appliedVoucher.code} diterapkan</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveVoucher}
                      className="text-red-500 font-bold hover:text-red-700 transition ml-2"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Masukkan kode voucher"
                      className="flex-1 px-3 py-2 border border-neutral-200 focus:border-neutral-800 outline-none text-sm uppercase rounded-none"
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
                )}
              </div>

              {/* Cost Calculation Details */}
              <div className="space-y-3 text-sm text-neutral-600 border-b border-neutral-100 pb-5 mb-5">
                <div className="flex justify-between">
                  <span>Subtotal Produk</span>
                  <span className="font-semibold text-neutral-900">
                    Rp {subtotal.toLocaleString('id-ID')}
                  </span>
                </div>
                {appliedVoucher && (
                  <div className="flex justify-between text-neutral-800 font-semibold">
                    <span>Diskon Voucher</span>
                    <span className="text-red-600">
                      - Rp {discountAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Ongkos Kirim</span>
                  <span className="font-semibold text-neutral-900">
                    {selectedCourier
                      ? `Rp ${shippingCost.toLocaleString('id-ID')}`
                      : 'Pilih kurir...'}
                  </span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-center text-neutral-900 font-serif mb-8">
                <span className="text-base font-semibold">Total Pembayaran</span>
                <span className="text-xl font-bold">
                  Rp {totalAmount.toLocaleString('id-ID')}
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
          </div>
        </div>
      </div>

      <AddressModal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        userId={user?.id || ''}
      />
    </div>
  )
}
