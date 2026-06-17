'use client'

import React, { useState, useEffect } from 'react'
import {
  useAdminSettings,
  useAdminUpdateSettings,
  useAdminActivityLogs,
} from '@/hooks/useAdmin'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Settings, ClipboardList } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminSettingsPage() {
  const [activeSubTab, setActiveSubTab] = useState<'settings' | 'logs'>('settings')

  // Queries
  const { data: settingsList = [], isLoading: settingsLoading, refetch: refetchSettings } = useAdminSettings()
  const { data: logsList = [], isLoading: logsLoading } = useAdminActivityLogs()

  const updateMutation = useAdminUpdateSettings()

  // Setting fields dictionary
  const [fields, setFields] = useState<Record<string, string>>({})

  // Initialize fields
  useEffect(() => {
    if (settingsList && settingsList.length > 0) {
      const dict: Record<string, string> = {}
      settingsList.forEach((s: any) => {
        dict[s.key] = s.value || ''
      })
      setFields(dict)
    }
  }, [settingsList])

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
      refetchSettings()
    } catch (err) {
      toast.error('Gagal menyimpan pengaturan', { id: 'save-settings' })
    }
  }

  // Group settings
  const settingsByGroup = settingsList.reduce((acc: any, s: any) => {
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
      {/* Header */}
      <div>
        <h2 className="text-2xl font-serif text-neutral-900 tracking-tight">Pengaturan & Log</h2>
        <p className="text-xs text-neutral-400 mt-1">Kelola preferensi situs dan pantau riwayat audit log admin.</p>
      </div>

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
            <p className="text-neutral-400 text-xs tracking-widest uppercase animate-pulse">Memuat pengaturan...</p>
          </div>
        ) : (
          <form onSubmit={handleSaveSettings} className="space-y-8 max-w-3xl">
            {Object.entries(settingsByGroup).map(([group, list]: any) => (
              <div key={group} className="border border-neutral-200 bg-white p-5 rounded-none space-y-4">
                <h3 className="text-xs uppercase font-bold tracking-widest text-neutral-400 border-b border-neutral-100 pb-2">
                  {groupLabels[group] || group}
                </h3>

                <div className="space-y-4">
                  {list.map((setting: any) => (
                    <div key={setting.key} className="space-y-1">
                      <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                        {setting.label || setting.key}
                      </label>
                      {setting.type === 'boolean' ? (
                        <select
                          value={fields[setting.key] || 'false'}
                          onChange={(e) => handleFieldChange(setting.key, e.target.value)}
                          className="w-full px-4 py-3 border border-neutral-200 focus:border-neutral-800 outline-none text-xs rounded-none bg-white font-medium"
                        >
                          <option value="true">Aktif (True)</option>
                          <option value="false">Nonaktif (False)</option>
                        </select>
                      ) : (
                        <input
                          type={setting.type === 'number' ? 'number' : 'text'}
                          value={fields[setting.key] || ''}
                          onChange={(e) => handleFieldChange(setting.key, e.target.value)}
                          placeholder={`Masukkan ${setting.label || setting.key}`}
                          className="w-full px-4 py-3 border border-neutral-200 focus:border-neutral-800 outline-none text-xs rounded-none transition"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-3 border-t border-neutral-100">
              <Button
                type="submit"
                isLoading={updateMutation.isPending}
                className="text-xs uppercase font-bold tracking-widest py-3 px-6"
              >
                Simpan Semua Pengaturan
              </Button>
            </div>
          </form>
        )
      ) : (
        // Logs viewport
        logsLoading ? (
          <div className="py-24 text-center">
            <p className="text-neutral-400 text-xs tracking-widest uppercase animate-pulse">Memuat log...</p>
          </div>
        ) : logsList.length === 0 ? (
          <div className="py-24 text-center text-neutral-400 italic text-xs">
            Belum ada aktivitas admin terekam.
          </div>
        ) : (
          <div className="border border-neutral-200 bg-white rounded-none overflow-hidden max-w-4xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="bg-neutral-50/50 border-b border-neutral-200 text-neutral-400 uppercase tracking-widest font-bold text-[10px]">
                    <th className="py-3 px-5">Waktu Tulis</th>
                    <th className="py-3 px-4">Operator</th>
                    <th className="py-3 px-4">Tindakan / Resource</th>
                    <th className="py-3 px-4 text-center">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-700 font-medium">
                  {logsList.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-50/20 transition">
                      <td className="py-3 px-5 text-neutral-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <p>{log.profiles?.name || 'Administrator'}</p>
                        <p className="text-[10px] text-neutral-400 font-normal">{log.profiles?.email || 'admin@site.com'}</p>
                      </td>
                      <td className="py-3 px-4 leading-relaxed">
                        <span className="font-semibold text-neutral-900 font-mono text-[10px] bg-neutral-100 px-1 py-0.5 select-all">
                          {log.action}
                        </span>
                        <p className="text-[10px] text-neutral-400 font-normal mt-0.5">
                          Tipe: {log.resource_type} | ID: {log.resource_id || '-'}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-center text-neutral-500">
                        {log.ip_address || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  )
}
