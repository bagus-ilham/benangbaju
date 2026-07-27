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
      className="border border-neutral-200/80 p-6 sm:p-8 rounded-2xl bg-brand-cream shadow-xs relative overflow-hidden group"
    >
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-blue via-brand-gold to-brand-blue" />
      <h2 className="text-sm uppercase tracking-widest font-sans font-bold text-brand-plum mb-6 flex items-center">
        <motion.div whileHover={{ y: [0, -2, 2, -2, 0] }} className="mr-2">
          <Key
            size={16}
            className="text-brand-blue group-hover:text-brand-plum transition-colors"
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

        <div className="pt-4 border-t border-neutral-200/60 flex justify-end">
          <Button
            type="submit"
            variant="accent"
            isLoading={isSavingPassword}
            className="text-xs uppercase tracking-widest font-bold py-3 px-6"
          >
            Perbarui Kata Sandi
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
