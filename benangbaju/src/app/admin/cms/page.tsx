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
} from '@/app/admin/hooks/useAdmin'
import type { RedirectRule, LandingPage } from '@/modules/cms/types'
import type { Json } from '@/shared/types/database'
import { Button, AdminPageHeader } from '@/shared/components'
import { Link2, FileCode, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  AdminRedirectsTable,
  AdminLandingPagesTable,
  RedirectFormModal,
  LandingPageFormModal,
} from './components'

export default function AdminCmsPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'redirects' | 'landing_pages'>('redirects')

  // Queries
  const {
    data: redirectsRes,
    isLoading: redirectsLoading,
    refetch: refetchRedirects,
  } = useAdminRedirects()
  const redirects = redirectsRes?.data || []
  const {
    data: landingPagesRes,
    isLoading: pagesLoading,
    refetch: refetchPages,
  } = useAdminLandingPages()
  const landingPages = landingPagesRes?.data || []

  // Mutations
  const createRedirectMutation = useAdminCreateRedirect()
  const updateRedirectMutation = useAdminUpdateRedirect()
  const deleteRedirectMutation = useAdminDeleteRedirect()

  const createPageMutation = useAdminCreateLandingPage()
  const updatePageMutation = useAdminUpdateLandingPage()
  const deletePageMutation = useAdminDeleteLandingPage()

  // Modal states - Redirects
  const [redirectModalOpen, setRedirectModalOpen] = useState(false)
  const [editingRedirect, setEditingRedirect] = useState<RedirectRule | null>(null)
  const [fromPath, setFromPath] = useState('')
  const [toPath, setToPath] = useState('')
  const [statusCode, setStatusCode] = useState<number>(301)
  const [redirectActive, setRedirectActive] = useState(true)

  // Modal states - Landing Pages
  const [pageModalOpen, setPageModalOpen] = useState(false)
  const [editingPage, setEditingPage] = useState<LandingPage | null>(null)
  const [pageSlug, setPageSlug] = useState('')
  const [pageTitle, setPageTitle] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDesc, setMetaDesc] = useState('')
  const [jsonContent, setJsonContent] = useState(
    '{\n  "heading": "Selamat Datang",\n  "subheading": "Promo Terbatas Minggu Ini"\n}'
  )
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
      setJsonContent(
        '{\n  "heading": "Selamat Datang",\n  "subheading": "Promo Terbatas Minggu Ini"\n}'
      )
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast.error('Format konten JSON tidak valid')
      return
    }

    const payload = {
      slug: pageSlug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, '-'),
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
              <Button
                onClick={() => handleOpenRedirectModal()}
                className="text-xs font-bold uppercase tracking-wider py-2.5 px-4"
              >
                + Tambah Pengalihan
              </Button>
            </div>
            <AdminRedirectsTable
              redirects={redirects}
              isLoading={redirectsLoading}
              onEdit={handleOpenRedirectModal}
              onDelete={handleDeleteRedirect}
            />
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
              <Button
                onClick={() => handleOpenPageModal()}
                className="text-xs font-bold uppercase tracking-wider py-2.5 px-4"
              >
                + Buat Landing Page
              </Button>
            </div>
            <AdminLandingPagesTable
              landingPages={landingPages}
              isLoading={pagesLoading}
              onEdit={handleOpenPageModal}
              onDelete={handleDeletePage}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <RedirectFormModal
        isOpen={redirectModalOpen}
        onClose={() => setRedirectModalOpen(false)}
        onSubmit={handleSaveRedirect}
        editingRedirect={editingRedirect}
        fromPath={fromPath}
        setFromPath={setFromPath}
        toPath={toPath}
        setToPath={setToPath}
        statusCode={statusCode}
        setStatusCode={setStatusCode}
        redirectActive={redirectActive}
        setRedirectActive={setRedirectActive}
        isPending={createRedirectMutation.isPending || updateRedirectMutation.isPending}
      />

      <LandingPageFormModal
        isOpen={pageModalOpen}
        onClose={() => setPageModalOpen(false)}
        onSubmit={handleSavePage}
        editingPage={editingPage}
        pageSlug={pageSlug}
        setPageSlug={setPageSlug}
        pageTitle={pageTitle}
        setPageTitle={setPageTitle}
        metaTitle={metaTitle}
        setMetaTitle={setMetaTitle}
        metaDesc={metaDesc}
        setMetaDesc={setMetaDesc}
        jsonContent={jsonContent}
        setJsonContent={setJsonContent}
        pageActive={pageActive}
        setPageActive={setPageActive}
        isPending={createPageMutation.isPending || updatePageMutation.isPending}
      />
    </div>
  )
}
