'use client'

import React, { useState, useEffect } from 'react'
import {
  useAdminSettings,
  useAdminUpdateSettings,
  useAdminActivityLogs,
  useAdminCollections,
  useAdminUpsertSettings,
} from '@/app/admin/hooks/useAdmin'
import type { SiteSetting } from '@/modules/settings/types'
import {
  Button,
  Input,
  AdminPageHeader,
  ClientDateTime,
  Tabs,
  TabsList,
  TabsTrigger,
  DataTable,
  Select,
} from '@/shared/components'
import { Settings, ClipboardList } from 'lucide-react'
import toast from 'react-hot-toast'
import { ActivityLogsTable } from './components/ActivityLogsTable'
import { SettingsForm } from './components/SettingsForm'
import type {} from '@/shared/components/DataTable'

const DEFAULT_SETTINGS: SiteSetting[] = [
  { key: 'store_name', value: 'Benangbaju', type: 'text', group: 'general', label: 'Nama Toko' },
  {
    key: 'store_tagline',
    value: 'Fashion Muslim Premium Indonesia',
    type: 'text',
    group: 'general',
    label: 'Slogan Toko',
  },
  {
    key: 'homepage_spotlight_collection_1',
    value: '',
    type: 'text',
    group: 'general',
    label: 'Koleksi Beranda Utama (Spotlight 1)',
  },
  {
    key: 'homepage_spotlight_collection_2',
    value: '',
    type: 'text',
    group: 'general',
    label: 'Koleksi Beranda Kedua (Spotlight 2)',
  },
  {
    key: 'meta_title',
    value: 'Benangbaju — Fashion Muslim Premium Indonesia',
    type: 'text',
    group: 'seo',
    label: 'Meta Title Default',
  },
  {
    key: 'meta_description',
    value: 'Belanja busana muslim premium dengan desain minimalis dan bahan berkualitas.',
    type: 'text',
    group: 'seo',
    label: 'Meta Description Default',
  },
  {
    key: 'enable_midtrans',
    value: 'true',
    type: 'boolean',
    group: 'payment',
    label: 'Aktifkan Midtrans Sandbox',
  },
  {
    key: 'whatsapp_number',
    value: '6281234567890',
    type: 'text',
    group: 'social',
    label: 'Nomor WhatsApp Chat',
  },
  {
    key: 'instagram_username',
    value: 'benangbaju',
    type: 'text',
    group: 'social',
    label: 'Username Instagram',
  },
  {
    key: 'tiktok_username',
    value: 'benangbaju',
    type: 'text',
    group: 'social',
    label: 'Username TikTok',
  },
  {
    key: 'social_shopee',
    value: 'https://shopee.co.id/benangbaju',
    type: 'text',
    group: 'social',
    label: 'Link Shopee',
  },
  {
    key: 'store_logo_url',
    value: '/logo.PNG',
    type: 'image',
    group: 'general',
    label: 'URL Logo Toko',
  },
]

export default function AdminSettingsPage(): React.JSX.Element {
  const [activeSubTab, setActiveSubTab] = useState<'settings' | 'logs'>('settings')

  // Queries
  const {
    data: settingsRes,
    isLoading: settingsLoading,
    refetch: refetchSettings,
  } = useAdminSettings()
  const settingsList = settingsRes?.data || []
  const { data: logsRes, isLoading: logsLoading } = useAdminActivityLogs()
  const logsList = logsRes?.data || []
  const { data: collectionsRes } = useAdminCollections()
  const collections = collectionsRes?.data || []

  const updateMutation = useAdminUpdateSettings()
  const upsertMutation = useAdminUpsertSettings()

  // Setting fields dictionary
  const [fields, setFields] = useState<Record<string, string>>({})

  // Auto-seed settings if empty, otherwise initialize fields
  useEffect(() => {
    if (settingsLoading) return
    if (settingsList.length === 0) {
      const seedSettings = async () => {
        try {
          await upsertMutation.mutateAsync(DEFAULT_SETTINGS)
          refetchSettings()
        } catch (err) {
          console.error('Failed to seed default settings:', err)
        }
      }
      seedSettings()
    } else {
      setFields((prev) => {
        if (Object.keys(prev).length > 0) return prev
        const dict: Record<string, string> = {}
        settingsList.forEach((s) => {
          dict[s.key] = s.value || ''
        })
        return dict
      })
    }
  }, [settingsList, settingsLoading])

  const handleFieldChange = (key: string, value: string) => {
    setFields((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    toast.loading('Menyimpan pengaturan...', { id: 'save-settings' })
    try {
      await updateMutation.mutateAsync(fields)
      toast.success('Pengaturan berhasil disimpan!', { id: 'save-settings' })
      const updated = await refetchSettings()
      if (updated.data?.success && updated.data.data) {
        const dict: Record<string, string> = {}
        updated.data.data.forEach((s) => {
          dict[s.key] = s.value || ''
        })
        setFields(dict)
      }
    } catch (err) {
      toast.error('Gagal menyimpan pengaturan', { id: 'save-settings' })
    }
  }

  // Group settings
  const settingsByGroup = settingsList.reduce<Record<string, SiteSetting[]>>((acc, s) => {
    if (!acc[s.group]) acc[s.group] = []
    acc[s.group].push(s)
    return acc
  }, {})

  const groupLabels: Record<string, string> = {
    general: 'Pengaturan Umum',
    seo: 'Pengaturan SEO',
    payment: 'Metode Pembayaran',
    social: 'Sosial & Kontak',
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Pengaturan & Log"
        subtitle="Kelola preferensi situs dan pantau riwayat audit log admin."
      />

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 overflow-x-auto space-x-6 text-xs font-sans">
        <button
          onClick={() => setActiveSubTab('settings')}
          className={`pb-3 font-semibold uppercase tracking-wider transition border-b-2 whitespace-nowrap flex items-center ${
            activeSubTab === 'settings'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <Settings size={14} className="mr-1.5" /> Konfigurasi Toko
        </button>
        <button
          onClick={() => setActiveSubTab('logs')}
          className={`pb-3 font-semibold uppercase tracking-wider transition border-b-2 whitespace-nowrap flex items-center ${
            activeSubTab === 'logs'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <ClipboardList size={14} className="mr-1.5" /> Log Aktivitas Audit
        </button>
      </div>

      {activeSubTab === 'settings' ? (
        settingsLoading ? (
          <div className="py-24 text-center">
            <p className="text-neutral-400 text-xs tracking-widest uppercase animate-pulse">
              Memuat pengaturan...
            </p>
          </div>
        ) : (
          <SettingsForm
            settingsByGroup={settingsByGroup}
            groupLabels={groupLabels}
            fields={fields}
            collections={collections}
            isPending={updateMutation.isPending}
            handleFieldChange={handleFieldChange}
            handleSaveSettings={handleSaveSettings}
          />
        )
      ) : // Logs viewport
      logsLoading ? (
        <div className="py-24 text-center">
          <p className="text-neutral-400 text-xs tracking-widest uppercase animate-pulse">
            Memuat log...
          </p>
        </div>
      ) : logsList.length === 0 ? (
        <div className="py-24 text-center text-neutral-400 italic text-xs">
          Belum ada aktivitas admin terekam.
        </div>
      ) : (
        <ActivityLogsTable logsList={logsList} />
      )}
    </div>
  )
}
