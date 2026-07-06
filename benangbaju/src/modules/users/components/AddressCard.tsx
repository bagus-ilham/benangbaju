'use client'

import React from 'react'
import type { UserAddress } from '@/modules/shipping/types'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Edit2, Trash2, Check } from 'lucide-react'

interface AddressCardProps {
  address: UserAddress
  onEdit?: (address: UserAddress) => void
  onDelete?: (addressId: string) => void
  onSetDefault?: (addressId: string) => void
  onSelect?: (address: UserAddress) => void
  isSelected?: boolean
  showActions?: boolean
  showSelectButton?: boolean
}

export function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  onSelect,
  isSelected = false,
  showActions = true,
  showSelectButton = false,
}: AddressCardProps): React.JSX.Element {
  return (
    <div
      onClick={() => onSelect?.(address)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect?.(address)
        }
      }}
      role="button"
      tabIndex={0}
      className={`p-5 border text-sm font-sans relative transition duration-150 rounded-none cursor-pointer card-hover-lift gold-border-hover ${
        isSelected
          ? 'border-brand-gold bg-brand-gold-muted/10 ring-1 ring-brand-gold'
          : 'border-neutral-200 bg-white'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-neutral-800">{address.label}</span>
          {address.is_default && (
            <Badge variant="gold" className="text-[10px] py-0 px-2 rounded-none">
              Utama
            </Badge>
          )}
        </div>
        {isSelected && (
          <span className="text-brand-gold">
            <Check size={18} strokeWidth={2.5} />
          </span>
        )}
      </div>

      <div className="space-y-1 text-neutral-600 mb-4">
        <p className="font-semibold text-neutral-800">{address.recipient_name}</p>
        <p>{address.phone}</p>
        <p className="mt-1 leading-relaxed">{address.full_address}</p>
        <p className="text-xs text-neutral-500 font-medium">
          {address.district_name}, {address.city_name}, {address.province_name}{' '}
          {address.postal_code}
        </p>
      </div>

      {showActions && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-neutral-100 items-center justify-between">
          <div className="flex space-x-2">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(address)
                }}
                className="flex items-center text-xs text-neutral-600 hover:text-brand-gold transition duration-100"
              >
                <Edit2 size={13} className="mr-1" /> Ubah
              </button>
            )}
            {onDelete && !address.is_default && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm('Apakah Anda yakin ingin menghapus alamat ini?')) {
                    onDelete(address.id)
                  }
                }}
                className="flex items-center text-xs text-red-500 hover:text-red-700 transition duration-100"
              >
                <Trash2 size={13} className="mr-1" /> Hapus
              </button>
            )}
          </div>

          {onSetDefault && !address.is_default && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onSetDefault(address.id)
              }}
              className="text-xs text-neutral-600 hover:text-brand-gold hover:underline font-semibold transition duration-100"
            >
              Jadikan Utama
            </button>
          )}
        </div>
      )}

      {showSelectButton && !isSelected && onSelect && (
        <div className="pt-2 border-t border-neutral-100">
          <Button
            type="button"
            variant="outline"
            className="w-full text-xs py-1"
            onClick={(e) => {
              e.stopPropagation()
              onSelect(address)
            }}
          >
            Pilih Alamat Ini
          </Button>
        </div>
      )}
    </div>
  )
}
