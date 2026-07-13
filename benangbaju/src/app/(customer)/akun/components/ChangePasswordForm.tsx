import React from 'react'
import { motion } from 'framer-motion'
import { Key } from 'lucide-react'
import { Input, Button } from '@/shared/components'

interface ChangePasswordFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  itemVariants: any
  newPassword: string
  setNewPassword: (val: string) => void
  confirmNewPassword: string
  setConfirmNewPassword: (val: string) => void
  handleUpdatePassword: (e: React.FormEvent) => void
  isSavingPassword: boolean
}

export function ChangePasswordForm({
  itemVariants,
  newPassword,
  setNewPassword,
  confirmNewPassword,
  setConfirmNewPassword,
  handleUpdatePassword,
  isSavingPassword,
}: ChangePasswordFormProps): React.JSX.Element {
  return (
    <motion.div
      variants={itemVariants}
      className="border border-neutral-200 p-6 sm:p-8 rounded-none bg-white shadow-sm hover:shadow-md transition-shadow duration-300 card-hover-lift gold-border-hover relative overflow-hidden group"
    >
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-gold to-brand-gold-light" />
      <h2 className="text-sm uppercase tracking-widest font-heading font-bold text-brand-black mb-6 flex items-center">
        <motion.div whileHover={{ y: [0, -2, 2, -2, 0] }} className="mr-2">
          <Key
            size={16}
            className="text-neutral-500 group-hover:text-brand-black transition-colors"
          />
        </motion.div>
        Ganti Kata Sandi
      </h2>

      <form onSubmit={handleUpdatePassword} className="space-y-6">
        <Input
          label="Kata Sandi Baru*"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Minimal 8 karakter"
          required
        />

        <Input
          label="Konfirmasi Kata Sandi Baru*"
          type="password"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          placeholder="Ulangi kata sandi baru"
          required
        />

        <div className="pt-4 border-t border-neutral-100 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSavingPassword}
            className="text-xs uppercase tracking-widest font-semibold py-3 px-6"
          >
            Perbarui Kata Sandi
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
