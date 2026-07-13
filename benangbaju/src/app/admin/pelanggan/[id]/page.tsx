'use client'

import React, { use } from 'react'
import { useAdminCustomerDetail } from '@/app/admin/hooks/useAdmin'
import { AdminPageHeader, Button } from '@/shared/components'
import { ArrowLeft, MapPin, ShoppingBag, Heart, AlertCircle, Package } from 'lucide-react'
import { SmartLink as Link } from '@/shared/components'
import { formatDate } from '@/lib/utils/format'
import { formatIDR } from '@/lib/utils/format'
import Image from 'next/image'

interface AdminCustomerDetailPageProps {
  params: Promise<{ id: string }>
}

export default function AdminCustomerDetailPage({ params }: AdminCustomerDetailPageProps) {
  const { id } = use(params)
  const { data: customerRes, isLoading, isError } = useAdminCustomerDetail(id)
  const customer = customerRes?.data || null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-neutral-400 text-xs tracking-widest uppercase animate-pulse">
          Memuat detail pelanggan...
        </p>
      </div>
    )
  }

  if (isError || !customer) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={24} className="mx-auto text-red-500 mb-2" />
        <p className="text-red-500 text-sm">
          Gagal memuat detail pelanggan atau pelanggan tidak ditemukan.
        </p>
        <Link href="/admin/pelanggan">
          <Button variant="outline" className="mt-4 text-xs uppercase">
            Kembali
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      <AdminPageHeader
        title="Detail Pelanggan"
        subtitle={`Melihat informasi detail untuk ${customer.name}`}
      >
        <Link href="/admin/pelanggan">
          <Button variant="outline" className="text-xs font-semibold py-2 px-3 border-neutral-200">
            <ArrowLeft size={12} className="mr-1.5" /> Kembali
          </Button>
        </Link>
      </AdminPageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kolom Profil */}
        <div className="space-y-6">
          <div className="border border-neutral-200 bg-white p-6 rounded-none">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4 border-b border-neutral-100 pb-2">
              Profil Pelanggan
            </h3>
            <div className="flex flex-col items-center text-center">
              <div className="h-20 w-20 rounded-full bg-neutral-900 text-white flex items-center justify-center text-2xl font-bold uppercase mb-4 overflow-hidden">
                {customer.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={customer.avatar_url}
                    alt={customer.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (customer.name || 'U').substring(0, 2)
                )}
              </div>
              <h4 className="text-lg font-bold text-neutral-900">{customer.name}</h4>
              <p className="text-sm text-neutral-500">{customer.email || 'Tidak ada email'}</p>
              <p className="text-sm text-neutral-500">{customer.phone || 'Tidak ada telepon'}</p>

              <div className="mt-6 w-full text-left space-y-2">
                <div className="flex justify-between items-center text-xs border-b border-neutral-100 pb-2">
                  <span className="text-neutral-500">Status</span>
                  <span
                    className={`font-bold uppercase tracking-wider px-2 py-0.5 rounded-none text-[9px] ${
                      customer.is_active
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {customer.is_active ? 'Aktif' : 'Diblokir'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-b border-neutral-100 pb-2">
                  <span className="text-neutral-500">Bergabung</span>
                  <span className="text-neutral-900 font-medium">
                    {formatDate(customer.created_at)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2">
                  <span className="text-neutral-500">ID Pelanggan</span>
                  <span className="text-neutral-900 font-mono text-[10px]">{customer.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Detail (Alamat, Cart, Wishlist) */}
        <div className="md:col-span-2 space-y-6">
          {/* Daftar Alamat */}
          <div className="border border-neutral-200 bg-white rounded-none">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center">
              <MapPin size={16} className="text-neutral-500 mr-2" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                Alamat Tersimpan ({customer.addresses.length})
              </h3>
            </div>
            <div className="p-0">
              {customer.addresses.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-400 italic">
                  Belum ada alamat tersimpan.
                </div>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {customer.addresses.map((address) => (
                    <li key={address.id} className="p-4 text-xs">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <span className="font-bold text-neutral-900 mr-2">
                            {address.recipient_name}
                          </span>
                          <span className="text-neutral-500">({address.phone})</span>
                        </div>
                        {address.is_default && (
                          <span className="bg-neutral-900 text-white text-[9px] px-1.5 py-0.5 font-bold uppercase">
                            Utama
                          </span>
                        )}
                      </div>
                      <p className="text-neutral-600 mb-1">{address.label}</p>
                      <p className="text-neutral-700 leading-relaxed">{address.full_address}</p>
                      <p className="text-neutral-500 mt-1">
                        {address.district_name}, {address.city_name}, {address.province_name}{' '}
                        {address.postal_code}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Keranjang Belanja */}
          <div className="border border-neutral-200 bg-white rounded-none">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center">
              <ShoppingBag size={16} className="text-neutral-500 mr-2" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                Keranjang Belanja Aktif ({customer.cart_items.length})
              </h3>
            </div>
            <div className="p-0">
              {customer.cart_items.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-400 italic">
                  Keranjang belanja kosong.
                </div>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {customer.cart_items.map((item) => (
                    <li key={item.id} className="p-4 flex items-center space-x-4 text-xs">
                      <div className="w-12 h-12 bg-neutral-100 flex-shrink-0 relative overflow-hidden">
                        {item.variant?.product?.image_url ? (
                          <Image
                            src={item.variant.product.image_url}
                            alt="Product"
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <Package
                            size={20}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neutral-300"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-neutral-900">
                          {item.variant?.product?.name || 'Produk Tidak Diketahui'}
                        </p>
                        <p className="text-neutral-500">
                          Varian: {item.variant?.name || '-'} | SKU: {item.variant?.sku || '-'}
                        </p>
                        <div className="mt-1 flex items-center space-x-4 text-neutral-700">
                          <span className="font-medium text-brand-black">
                            {formatIDR(item.variant?.price || 0)}
                          </span>
                          <span>Qty: {item.quantity}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Wishlist */}
          <div className="border border-neutral-200 bg-white rounded-none">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center">
              <Heart size={16} className="text-neutral-500 mr-2" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                Wishlist ({customer.wishlist_items.length})
              </h3>
            </div>
            <div className="p-0">
              {customer.wishlist_items.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-400 italic">
                  Wishlist kosong.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                  {customer.wishlist_items.map((item) => (
                    <div key={item.id} className="border border-neutral-100 group">
                      <div className="aspect-[3/4] bg-neutral-100 relative overflow-hidden">
                        {item.product?.image_url ? (
                          <Image
                            src={item.product.image_url}
                            alt="Product"
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <Package
                            size={24}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neutral-300"
                          />
                        )}
                      </div>
                      <div className="p-2 text-center text-xs">
                        <p className="font-bold text-neutral-900 truncate">
                          {item.product?.name || 'Produk Tidak Diketahui'}
                        </p>
                        <p className="text-brand-black mt-1 font-medium">
                          {formatIDR(item.product?.price || 0)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
