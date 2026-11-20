import React from 'react'
import { motion } from 'framer-motion'
import { Input, Button, HandDrawnIcon } from '@/shared/components'
import { useMarket } from '@/shared/stores/marketStore'

interface EditProfileFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  itemVariants: any
  email: string
  name: string
  setName: (val: string) => void
  phone: string
  setPhone: (val: string) => void
  handleUpdateProfile: (e: React.FormEvent) => void
  isSaving: boolean
}

export function EditProfileForm({
  itemVariants,
  email,
  name,
  setName,
  phone,
  setPhone,
  handleUpdateProfile,
  isSaving,
}: EditProfileFormProps): React.JSX.Element {
  const market = useMarket()
  const isMY = market === 'MY'

  return (
    <motion.div
      variants={itemVariants}
      className="border border-brand-plum/10 p-6 sm:p-8 rounded-3xl bg-brand-cream shadow-xs relative overflow-hidden group"
    >
      <div className="card-accent-bar" />
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-brand-plum/10">
        <motion.div
          whileHover={{ rotate: 12 }}
          className="w-10 h-10 rounded-2xl bg-brand-blue-soft/70 border border-brand-blue-stroke/60 flex items-center justify-center text-brand-plum shrink-0"
        >
          <HandDrawnIcon name="user" className="w-4 h-4" />
        </motion.div>
        <div>
          <span className="inline-block text-sm font-accent font-bold text-brand-blue-text leading-none">
            {isMY ? 'Personal Details' : 'Data Diri'}
          </span>
          <h2 className="text-lg sm:text-xl font-serif font-medium tracking-tight text-brand-plum">
            {isMY ? 'Profile Information' : 'Informasi Profil'}
          </h2>
        </div>
      </div>

      <form onSubmit={handleUpdateProfile} className="space-y-6">
        <Input
          label={isMY ? 'Email (Read-only)' : 'Email (Tidak dapat diubah)'}
          value={email}
          readOnly
          disabled
        />

        <Input
          label={isMY ? 'Full Name*' : 'Nama Lengkap*'}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={isMY ? 'Your full name' : 'Nama lengkap Anda'}
          maxLength={100}
          required
        />

        <Input
          label={isMY ? 'Phone Number' : 'Nomor Telepon'}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          maxLength={20}
          placeholder={isMY ? 'e.g. +60123456789' : 'cth: 08123456789'}
        />

        <div className="pt-4 border-t border-brand-plum/10 flex justify-end">
          <Button
            type="submit"
            variant="accent"
            isLoading={isSaving}
            className="text-xs uppercase tracking-widest font-bold py-3 px-6"
          >
            {isMY ? 'Save Changes' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
