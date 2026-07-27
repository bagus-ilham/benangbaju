import React from 'react'
import { Input } from '@/shared/components'

interface RefundBankFormProps {
  bankName: string
  setBankName: (val: string) => void
  accountNumber: string
  setAccountNumber: (val: string) => void
  accountName: string
  setAccountName: (val: string) => void
}

export function RefundBankForm({
  bankName,
  setBankName,
  accountNumber,
  setAccountNumber,
  accountName,
  setAccountName,
}: RefundBankFormProps): React.JSX.Element {
  return (
    <div className="border border-neutral-200/80 p-5 sm:p-6 bg-brand-cream space-y-4 relative overflow-hidden rounded-2xl shadow-xs font-sans">
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-blue via-brand-gold to-brand-blue" />
      <h2 className="text-[10px] uppercase tracking-widest font-sans font-bold text-brand-plum border-b border-neutral-200/60 pb-2">
        Rekening Bank untuk Pengembalian Dana*
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="Nama Bank*"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          placeholder="cth: BCA, Mandiri"
          required
        />
        <Input
          label="Nomor Rekening*"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          placeholder="Nomor rekening bank"
          required
        />
        <Input
          label="Nama Pemilik Rekening*"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          placeholder="Nama pemilik sesuai buku tabungan"
          required
        />
      </div>
    </div>
  )
}
