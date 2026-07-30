import React from 'react'
import { motion } from 'framer-motion'
import { User } from 'lucide-react'
import { Input, Button } from '@/shared/components'

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
  return (
    <motion.div
      variants={itemVariants}
      className="border border-neutral-200/80 p-6 sm:p-8 rounded-2xl bg-brand-cream shadow-xs relative overflow-hidden group"
    >
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-gold via-amber-200 to-brand-gold" />
      <h2 className="text-sm uppercase tracking-widest font-sans font-bold text-brand-plum mb-6 flex items-center">
        <motion.div whileHover={{ rotate: 15 }} className="mr-2">
          <User
            size={16}
            className="text-brand-blue group-hover:text-brand-plum transition-colors"
          />
        </motion.div>
        Informasi Profil
      </h2>

      <form onSubmit={handleUpdateProfile} className="space-y-6">
        <Input label="Email (Tidak dapat diubah)" value={email} readOnly disabled />

        <Input
          label="Nama Lengkap*"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama lengkap Anda"
          maxLength={100}
          required
        />

        <Input
          label="Nomor Telepon"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          maxLength={20}
          placeholder="cth: 08123456789"
        />

        <div className="pt-4 border-t border-neutral-200/60 flex justify-end">
          <Button
            type="submit"
            variant="accent"
            isLoading={isSaving}
            className="text-xs uppercase tracking-widest font-bold py-3 px-6"
          >
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
