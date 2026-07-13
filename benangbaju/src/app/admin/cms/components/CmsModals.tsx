'use client'

import React from 'react'
import { X } from 'lucide-react'
import { Button, Input, Select, Switch, Textarea } from '@/shared/components'

export function RedirectFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingRedirect,
  fromPath,
  setFromPath,
  toPath,
  setToPath,
  statusCode,
  setStatusCode,
  redirectActive,
  setRedirectActive,
  isPending,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}: any) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs font-sans text-xs">
      <div className="bg-white border border-neutral-200 w-full max-w-md p-6 sm:p-8 space-y-6">
        <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
          <h3 className="font-serif text-lg font-bold text-neutral-900">
            {editingRedirect ? 'Ubah Aturan Pengalihan' : 'Tambah Aturan Pengalihan'}
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-800"
            aria-label="Tutup modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Jalur Asal (From Path)*"
            required
            placeholder="cth: /promo-lama"
            className="font-mono"
            value={fromPath}
            onChange={(e) => setFromPath(e.target.value)}
            helperText="Harus diawali dengan tanda garis miring (/)."
          />

          <Input
            label="Jalur Tujuan (To Path)*"
            required
            placeholder="cth: /produk/baru"
            className="font-mono"
            value={toPath}
            onChange={(e) => setToPath(e.target.value)}
            helperText="Dapat berupa internal path atau URL eksternal lengkap."
          />

          <div className="flex flex-col space-y-1">
            <Select
              label="Status Code*"
              required
              value={statusCode.toString()}
              onChange={(val) => setStatusCode(Number(val))}
              options={[
                { label: '301 (Permanent Redirect)', value: '301' },
                { label: '302 (Temporary Redirect)', value: '302' },
              ]}
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="redirectActive"
              checked={redirectActive}
              onChange={(e) => setRedirectActive(e.target.checked)}
            />
            <label
              htmlFor="redirectActive"
              className="text-[10px] font-bold uppercase tracking-wider text-neutral-700 cursor-pointer"
            >
              Aktifkan pengalihan ini
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-neutral-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={isPending}>
              Simpan
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function LandingPageFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingPage,
  pageSlug,
  setPageSlug,
  pageTitle,
  setPageTitle,
  metaTitle,
  setMetaTitle,
  metaDesc,
  setMetaDesc,
  jsonContent,
  setJsonContent,
  pageActive,
  setPageActive,
  isPending,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}: any) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs font-sans text-xs">
      <div className="bg-white border border-neutral-200 w-full max-w-lg p-6 sm:p-8 space-y-6">
        <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
          <h3 className="font-serif text-lg font-bold text-neutral-900">
            {editingPage ? 'Ubah Landing Page' : 'Buat Landing Page Baru'}
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-800"
            aria-label="Tutup modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Judul Halaman*"
              required
              placeholder="cth: Promo Ramadhan"
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
            />
            <Input
              label="Slug Path*"
              required
              placeholder="cth: promo-ramadhan"
              className="font-mono"
              value={pageSlug}
              onChange={(e) => setPageSlug(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Meta Title (SEO)"
              placeholder="Meta Title halaman"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
            />
            <Input
              label="Meta Description (SEO)"
              placeholder="Deskripsi pencarian Google..."
              value={metaDesc}
              onChange={(e) => setMetaDesc(e.target.value)}
            />
          </div>

          <div className="flex flex-col space-y-1">
            <Textarea
              label="Konten JSON Halaman (Dynamic Content)*"
              required
              rows={6}
              placeholder={'{\n  "heading": "Promo Terbaik"\n}'}
              className="font-mono"
              value={jsonContent}
              onChange={(e) => setJsonContent(e.target.value)}
              helperText="Wajib dalam format JSON valid."
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="pageActive"
              checked={pageActive}
              onChange={(e) => setPageActive(e.target.checked)}
            />
            <label
              htmlFor="pageActive"
              className="text-[10px] font-bold uppercase tracking-wider text-neutral-700 cursor-pointer"
            >
              Aktifkan halaman ini
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-neutral-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={isPending}>
              Simpan
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
