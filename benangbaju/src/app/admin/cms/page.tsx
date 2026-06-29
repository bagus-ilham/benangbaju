'use client'

import React, { useState } from 'react'
import {
  useAdminRedirects,
  useAdminCreateRedirect,
  useAdminUpdateRedirect,
  useAdminDeleteRedirect,
  useAdminLandingPages,
  useAdminCreateLandingPage,
  useAdminUpdateLandingPage,
  useAdminDeleteLandingPage,
} from '@/hooks/useAdmin'
import type { RedirectRule, LandingPage } from '@/services/cms'
import type { Json } from '@/types/database'
import { 
  Button, 
  Input, 
  Modal, 
  AdminPageHeader,
  Tabs,
  TabsList,
  TabsTrigger,
  DataTable,
  Select,
  Textarea,
  Switch
} from '@/components/shared'
import { Plus, Edit, Trash2, Link2, FileCode, RefreshCw, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils/format'
import type { Column } from '@/components/shared/DataTable'

export default function AdminCmsPage() : React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'redirects' | 'landing_pages'>('redirects')

  // Queries
  const { data: redirects, isLoading: redirectsLoading, refetch: refetchRedirects } = useAdminRedirects()
  const { data: landingPages, isLoading: pagesLoading, refetch: refetchPages } = useAdminLandingPages()

  // Mutations
  const createRedirectMutation = useAdminCreateRedirect()
  const updateRedirectMutation = useAdminUpdateRedirect()
  const deleteRedirectMutation = useAdminDeleteRedirect()

  const createPageMutation = useAdminCreateLandingPage()
  const updatePageMutation = useAdminUpdateLandingPage()
  const deletePageMutation = useAdminDeleteLandingPage()

  // Modal states
  const [redirectModalOpen, setRedirectModalOpen] = useState(false)
  const [editingRedirect, setEditingRedirect] = useState<RedirectRule | null>(null)
  const [fromPath, setFromPath] = useState('')
  const [toPath, setToPath] = useState('')
  const [statusCode, setStatusCode] = useState<number>(301)
  const [redirectActive, setRedirectActive] = useState(true)

  const [pageModalOpen, setPageModalOpen] = useState(false)
  const [editingPage, setEditingPage] = useState<LandingPage | null>(null)
  const [pageSlug, setPageSlug] = useState('')
  const [pageTitle, setPageTitle] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDesc, setMetaDesc] = useState('')
  const [jsonContent, setJsonContent] = useState('{\n  "heading": "Selamat Datang",\n  "subheading": "Promo Terbatas Minggu Ini"\n}')
  const [pageActive, setPageActive] = useState(true)

  // --- Redirect Handlers ---
  const handleOpenRedirectModal = (rule: RedirectRule | null = null) => {
    if (rule) {
      setEditingRedirect(rule)
      setFromPath(rule.from_path)
      setToPath(rule.to_path)
      setStatusCode(rule.status_code)
      setRedirectActive(rule.is_active)
    } else {
      setEditingRedirect(null)
      setFromPath('')
      setToPath('')
      setStatusCode(301)
      setRedirectActive(true)
    }
    setRedirectModalOpen(true)
  }

  const handleSaveRedirect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fromPath.trim() || !toPath.trim()) {
      toast.error('Jalur asal dan tujuan wajib diisi')
      return
    }

    const payload = {
      from_path: fromPath.trim(),
      to_path: toPath.trim(),
      status_code: statusCode,
      is_active: redirectActive,
    }

    try {
      if (editingRedirect) {
        await updateRedirectMutation.mutateAsync({
          redirectId: editingRedirect.id,
          redirect: payload,
        })
        toast.success('Aturan pengalihan berhasil diperbarui')
      } else {
        await createRedirectMutation.mutateAsync(payload)
        toast.success('Aturan pengalihan baru ditambahkan')
      }
      setRedirectModalOpen(false)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Gagal menyimpan aturan'
      toast.error(errMsg)
    }
  }

  const handleDeleteRedirect = async (id: string, path: string) => {
    if (!confirm(`Hapus aturan pengalihan untuk "${path}"?`)) return
    try {
      await deleteRedirectMutation.mutateAsync(id)
      toast.success('Aturan pengalihan berhasil dihapus')
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Gagal menghapus aturan'
      toast.error(errMsg)
    }
  }

  // --- Landing Page Handlers ---
  const handleOpenPageModal = (page: LandingPage | null = null) => {
    if (page) {
      setEditingPage(page)
      setPageSlug(page.slug)
      setPageTitle(page.title)
      setMetaTitle(page.meta_title || '')
      setMetaDesc(page.meta_description || '')
      setJsonContent(JSON.stringify(page.content, null, 2))
      setPageActive(page.is_active)
    } else {
      setEditingPage(null)
      setPageSlug('')
      setPageTitle('')
      setMetaTitle('')
      setMetaDesc('')
      setJsonContent('{\n  "heading": "Selamat Datang",\n  "subheading": "Promo Terbatas Minggu Ini"\n}')
      setPageActive(true)
    }
    setPageModalOpen(true)
  }

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pageSlug.trim() || !pageTitle.trim()) {
      toast.error('Slug dan judul halaman wajib diisi')
      return
    }

    let parsedContent: Json = null
    try {
      parsedContent = JSON.parse(jsonContent)
    } catch (err) {
      toast.error('Format konten JSON tidak valid')
      return
    }

    const payload = {
      slug: pageSlug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
      title: pageTitle.trim(),
      content: parsedContent,
      meta_title: metaTitle.trim() || null,
      meta_description: metaDesc.trim() || null,
      is_active: pageActive,
    }

    try {
      if (editingPage) {
        await updatePageMutation.mutateAsync({
          landingPageId: editingPage.id,
          landingPage: payload,
        })
        toast.success('Halaman dinamis berhasil diperbarui')
      } else {
        await createPageMutation.mutateAsync(payload)
        toast.success('Halaman dinamis baru ditambahkan')
      }
      setPageModalOpen(false)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Gagal menyimpan halaman'
      toast.error(errMsg)
    }
  }

  const handleDeletePage = async (id: string, title: string) => {
    if (!confirm(`Hapus halaman dinamis "${title}"?`)) return
    try {
      await deletePageMutation.mutateAsync(id)
      toast.success('Halaman berhasil dihapus')
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Gagal menghapus halaman'
      toast.error(errMsg)
    }
  }

  const handleRefresh = () => {
    if (activeTab === 'redirects') {
      refetchRedirects()
    } else {
      refetchPages()
    }
    toast.success('Data diperbarui')
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Konten & SEO (CMS)"
        subtitle="Kelola pengalihan tautan URL dinamis dan kustomisasi halaman arahan untuk optimasi SEO."
      >
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="text-xs font-semibold py-2 px-3 border-neutral-200"
        >
          <RefreshCw size={12} className="mr-1.5" /> Segarkan
        </Button>
      </AdminPageHeader>

      {/* Glassmorphic Tabs Layout */}
      <div className="flex border-b border-neutral-200 relative mb-2">
        <button
          onClick={() => setActiveTab('redirects')}
          className={`flex items-center py-3 px-6 text-xs font-heading tracking-wider uppercase font-semibold transition-all relative outline-none ${
            activeTab === 'redirects'
              ? 'text-neutral-950 font-bold'
              : 'text-neutral-400 hover:text-neutral-700'
          }`}
        >
          <Link2 size={13} className="mr-2" /> Pengalihan URL ({redirects?.length || 0})
          {activeTab === 'redirects' && (
            <motion.div
              layoutId="activeCmsTab"
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-neutral-950"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('landing_pages')}
          className={`flex items-center py-3 px-6 text-xs font-heading tracking-wider uppercase font-semibold transition-all relative outline-none ${
            activeTab === 'landing_pages'
              ? 'text-neutral-950 font-bold'
              : 'text-neutral-400 hover:text-neutral-700'
          }`}
        >
          <FileCode size={13} className="mr-2" /> Landing Pages ({landingPages?.length || 0})
          {activeTab === 'landing_pages' && (
            <motion.div
              layoutId="activeCmsTab"
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-neutral-950"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
        </button>
      </div>

      {/* Content Area with Framer Motion Animation */}
      <AnimatePresence mode="wait">
        {activeTab === 'redirects' ? (
          <motion.div
            key="redirects-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex justify-end">
              <Button onClick={() => handleOpenRedirectModal()} className="text-xs font-bold uppercase tracking-wider py-2.5 px-4">
                <Plus size={14} className="mr-1.5" /> Tambah Pengalihan
              </Button>
            </div>

            {redirectsLoading ? (
              <div className="h-40 bg-white border border-neutral-200 animate-pulse" />
            ) : !redirects || redirects.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-neutral-200 text-neutral-400 text-xs italic bg-white">
                Belum ada aturan pengalihan URL yang terdaftar.
              </div>
            ) : (
              <div className="border border-neutral-200 bg-white rounded-none overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50/50 text-neutral-400 uppercase tracking-wider font-semibold">
                      <th className="py-4 px-6">Jalur Asal (From)</th>
                      <th className="py-4 px-6">Jalur Tujuan (To)</th>
                      <th className="py-4 px-6 text-center">Status Code</th>
                      <th className="py-4 px-6 text-center">Status</th>
                      <th className="py-4 px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-700 font-medium">
                    {redirects.map((rule, idx) => (
                      <motion.tr
                        key={rule.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.03 }}
                        className="hover:bg-neutral-50/30"
                      >
                        <td className="py-4 px-6 font-mono text-neutral-900">{rule.from_path}</td>
                        <td className="py-4 px-6 font-mono text-neutral-600">{rule.to_path}</td>
                        <td className="py-4 px-6 text-center">
                          <span className="bg-neutral-100 text-neutral-800 text-[10px] px-2 py-0.5 border border-neutral-200 font-bold">
                            {rule.status_code}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-block text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 ${
                            rule.is_active
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {rule.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right space-x-1.5">
                          <button onClick={() => handleOpenRedirectModal(rule)} className="text-neutral-500 hover:text-neutral-800 p-1.5 inline-block border border-neutral-200">
                            <Edit size={12} />
                          </button>
                          <button onClick={() => handleDeleteRedirect(rule.id, rule.from_path)} className="text-red-500 hover:text-red-700 p-1.5 inline-block border border-red-100 hover:bg-red-50">
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="pages-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex justify-end">
              <Button onClick={() => handleOpenPageModal()} className="text-xs font-bold uppercase tracking-wider py-2.5 px-4">
                <Plus size={14} className="mr-1.5" /> Buat Landing Page
              </Button>
            </div>

            {pagesLoading ? (
              <div className="h-40 bg-white border border-neutral-200 animate-pulse" />
            ) : !landingPages || landingPages.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-neutral-200 text-neutral-400 text-xs italic bg-white">
                Belum ada halaman dinamis yang terdaftar.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {landingPages.map((page, idx) => (
                  <motion.div
                    key={page.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.04 }}
                    whileHover={{ y: -2, transition: { duration: 0.1 } }}
                    className="border border-neutral-200 bg-white p-5 space-y-4 flex flex-col justify-between hover:shadow-xs transition duration-150"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-serif font-bold text-neutral-900 text-base">{page.title}</h3>
                          <p className="text-[10px] font-mono text-neutral-400 mt-0.5">Slug: /{page.slug}</p>
                        </div>
                        <span className={`inline-block text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 ${
                          page.is_active
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {page.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                      
                      {page.meta_title && (
                        <p className="text-xs text-neutral-500">
                          <strong className="text-neutral-700">Meta Title:</strong> {page.meta_title}
                        </p>
                      )}
                      {page.meta_description && (
                        <p className="text-xs text-neutral-500 max-w-md line-clamp-2">
                          <strong className="text-neutral-700">Meta Desc:</strong> {page.meta_description}
                        </p>
                      )}

                      <div className="pt-2">
                        <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider flex items-center">
                          <FileCode size={11} className="mr-1" /> JSON Content Keys:
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {typeof page.content === 'object' && page.content !== null && !Array.isArray(page.content) && Object.keys(page.content).map((key) => (
                            <span key={key} className="bg-neutral-50 border border-neutral-200 text-[9px] px-1.5 py-0.5 text-neutral-600 font-mono">
                              {key}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-neutral-100 flex justify-between items-center">
                      <span className="text-[9px] text-neutral-400 font-mono">Dibuat: {formatDate(page.created_at)}</span>
                      <div className="flex space-x-2">
                        <Button onClick={() => handleOpenPageModal(page)} variant="outline" className="text-[10px] py-1.5 px-3 font-bold uppercase border-neutral-200">
                          <Edit size={11} className="mr-1" /> Edit
                        </Button>
                        <Button onClick={() => handleDeletePage(page.id, page.title)} variant="outline" className="text-[10px] py-1.5 px-3 font-bold uppercase border-red-200 text-red-500 hover:bg-red-50">
                          <Trash2 size={11} className="mr-1" /> Hapus
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- REDIRECT MODAL --- */}
      {redirectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs font-sans text-xs">
          <div className="bg-white border border-neutral-200 w-full max-w-md p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-neutral-900">
                {editingRedirect ? 'Ubah Aturan Pengalihan' : 'Tambah Aturan Pengalihan'}
              </h3>
              <button onClick={() => setRedirectModalOpen(false)} className="text-neutral-400 hover:text-neutral-800" aria-label="Tutup modal">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveRedirect} className="space-y-4">
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
                    { label: '302 (Temporary Redirect)', value: '302' }
                  ]}
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="redirectActive"
                  checked={redirectActive}
                  onChange={(e) => setRedirectActive(e.target.checked)}
                />
                <label htmlFor="redirectActive" className="text-[10px] font-bold uppercase tracking-wider text-neutral-700 cursor-pointer">
                  Aktifkan pengalihan ini
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-neutral-100">
                <Button type="button" variant="outline" onClick={() => setRedirectModalOpen(false)}>Batal</Button>
                <Button type="submit" variant="primary" isLoading={createRedirectMutation.isPending || updateRedirectMutation.isPending}>
                  Simpan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- LANDING PAGE MODAL --- */}
      {pageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs font-sans text-xs">
          <div className="bg-white border border-neutral-200 w-full max-w-lg p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-neutral-900">
                {editingPage ? 'Ubah Landing Page' : 'Buat Landing Page Baru'}
              </h3>
              <button onClick={() => setPageModalOpen(false)} className="text-neutral-400 hover:text-neutral-800" aria-label="Tutup modal">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSavePage} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
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
                <label htmlFor="pageActive" className="text-[10px] font-bold uppercase tracking-wider text-neutral-700 cursor-pointer">
                  Aktifkan halaman ini
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-neutral-100">
                <Button type="button" variant="outline" onClick={() => setPageModalOpen(false)}>Batal</Button>
                <Button type="submit" variant="primary" isLoading={createPageMutation.isPending || updatePageMutation.isPending}>
                  Simpan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
