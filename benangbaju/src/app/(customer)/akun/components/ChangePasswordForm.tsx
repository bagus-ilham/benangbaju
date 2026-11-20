import React from 'react'
import { motion } from 'framer-motion'
import { Input, Button, HandDrawnIcon } from '@/shared/components'
import { useMarket } from '@/shared/stores/marketStore'

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
          whileHover={{ y: [0, -2, 2, -2, 0] }}
          className="w-10 h-10 rounded-2xl bg-brand-blue-soft/85 border border-brand-blue-stroke/60 flex items-center justify-center text-brand-plum shrink-0"
        >
          <HandDrawnIcon name="lock" className="w-4 h-4" />
        </motion.div>
        <div>
          <span className="inline-block text-sm font-accent font-bold text-brand-blue-text leading-none">
            {isMY ? 'Account Security' : 'Keamanan Akun'}
          </span>
          <h2 className="text-lg sm:text-xl font-serif font-medium tracking-tight text-brand-plum">
            {isMY ? 'Change Password' : 'Ganti Kata Sandi'}
          </h2>
        </div>
      </div>

      <form onSubmit={handleUpdatePassword} className="space-y-6">
        <Input
          label={isMY ? 'New Password*' : 'Kata Sandi Baru*'}
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder={isMY ? 'Min. 8 characters' : 'Minimal 8 karakter'}
          required
        />

        <Input
          label={isMY ? 'Confirm New Password*' : 'Konfirmasi Kata Sandi Baru*'}
          type="password"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          placeholder={isMY ? 'Re-enter new password' : 'Ulangi kata sandi baru'}
          required
        />

        <div className="pt-4 border-t border-brand-plum/10 flex justify-end">
          <Button
            type="submit"
            variant="accent"
            isLoading={isSavingPassword}
            className="text-xs uppercase tracking-widest font-bold py-3 px-6"
          >
            {isMY ? 'Update Password' : 'Perbarui Kata Sandi'}
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
