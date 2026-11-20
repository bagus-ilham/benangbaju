import React from 'react'
import { Select, Input, Button } from '@/shared/components'
import type { SiteSetting } from '@/modules/settings/types'
import { parseMyrExchangeRate } from '@/lib/constants'

interface Collection {
  slug: string
  name: string
  is_active: boolean
}

interface SettingsFormProps {
  settingsByGroup: Record<string, SiteSetting[]>
  groupLabels: Record<string, string>
  fields: Record<string, string>
  collections: Collection[]
  isPending: boolean
  handleFieldChange: (key: string, value: string) => void
  handleSaveSettings: (e: React.FormEvent) => void
}

export function SettingsForm({
  settingsByGroup,
  groupLabels,
  fields,
  collections,
  isPending,
  handleFieldChange,
  handleSaveSettings,
}: SettingsFormProps): React.JSX.Element {
  const currentRate = parseMyrExchangeRate(fields['myr_exchange_rate'])

  return (
    <form onSubmit={handleSaveSettings} className="space-y-8 max-w-3xl font-sans text-xs">
      {Object.entries(settingsByGroup).map(([group, list]) => (
        <div key={group} className="border border-neutral-200 bg-brand-cream p-5 rounded-2xl space-y-4">
          <h3 className="text-xs uppercase font-bold tracking-widest text-neutral-400 border-b border-neutral-100 pb-2">
            {groupLabels[group] || group}
          </h3>

          <div className="space-y-4">
            {list.map((setting) => (
              <div key={setting.key} className="space-y-1">
                {setting.key === 'homepage_spotlight_collection_1' ||
                setting.key === 'homepage_spotlight_collection_2' ? (
                  <Select
                    label={setting.label || setting.key}
                    value={fields[setting.key] || ''}
                    onChange={(val) => handleFieldChange(setting.key, val)}
                    options={[
                      { label: 'Pilih Koleksi (Gunakan Urutan Default)', value: '' },
                      ...collections
                        .filter((col) => col.is_active)
                        .map((col) => ({
                          label: `${col.name} (${col.slug})`,
                          value: col.slug,
                        })),
                    ]}
                  />
                ) : setting.key === 'free_shipping_threshold_idr' ? (
                  <Input
                    label={setting.label || 'Batas Belanja Gratis Ongkir Indonesia (IDR)'}
                    type="number"
                    value={fields[setting.key] ?? '500000'}
                    onChange={(e) => handleFieldChange(setting.key, e.target.value)}
                    placeholder="cth: 500000"
                    helperText="Nominal minimal belanja cart (Rp) untuk memicu progress bar Gratis Ongkir di Indonesia."
                  />
                ) : setting.key === 'free_shipping_threshold_myr' ? (
                  <div>
                    <Input
                      label={setting.label || 'Batas Belanja Gratis Ongkir Malaysia (MYR)'}
                      type="number"
                      value={fields[setting.key] ?? '150'}
                      onChange={(e) => handleFieldChange(setting.key, e.target.value)}
                      placeholder="cth: 150"
                      helperText="Nominal minimal belanja cart dalam Ringgit (RM) untuk memicu progress bar Free Shipping ke Malaysia."
                    />
                    <div className="mt-1 text-[11px] text-neutral-500">
                      ≈ Rp {(Number(fields[setting.key] || 150) * currentRate).toLocaleString('id-ID')} pada kurs saat ini (1 MYR = Rp {currentRate.toLocaleString('id-ID')})
                    </div>
                  </div>
                ) : setting.key === 'enable_malaysia_shipping' ? (
                  <Select
                    label={setting.label || setting.key}
                    value={fields[setting.key] || 'true'}
                    onChange={(val) => handleFieldChange(setting.key, val)}
                    options={[
                      { label: 'Aktif — Buka pengiriman ke Semenanjung Malaysia', value: 'true' },
                      { label: 'Nonaktif — Tutup pengiriman ke Malaysia', value: 'false' },
                    ]}
                  />
                ) : setting.key === 'myr_exchange_rate' ? (
                  <div>
                    <Input
                      label={setting.label || 'Kurs Settlement DOKU QRIS (1 RM ke Rupiah)'}
                      type="number"
                      value={fields[setting.key] || ''}
                      onChange={(e) => handleFieldChange(setting.key, e.target.value)}
                      placeholder="cth: 3600"
                      helperText={`Digunakan khusus untuk menghitung nilai tagihan QRIS Cross-Border (IDR) ke DOKU saat checkout Malaysia. Harga jual Malaysia diatur manual di tiap produk/varian. (Contoh: Total RM 100.00 → Tagihan QRIS Rp ${(100 * currentRate).toLocaleString('id-ID')})`}
                    />
                  </div>
                ) : setting.key === 'shopee_my_url' ? (
                  <Input
                    label={setting.label || 'URL Toko Shopee Malaysia'}
                    type="text"
                    value={fields[setting.key] || ''}
                    onChange={(e) => handleFieldChange(setting.key, e.target.value)}
                    placeholder="https://shopee.com.my/benangbaju"
                    helperText="Tautan toko resmi di Shopee Malaysia. Ikon Shopee di footer akan otomatis mengarah ke URL ini saat mode Malaysia aktif."
                  />
                ) : setting.type === 'boolean' ? (
                  <Select
                    label={setting.label || setting.key}
                    value={fields[setting.key] || 'false'}
                    onChange={(val) => handleFieldChange(setting.key, val)}
                    options={[
                      { label: 'Aktif (True)', value: 'true' },
                      { label: 'Nonaktif (False)', value: 'false' },
                    ]}
                  />
                ) : (
                  <Input
                    label={setting.label || setting.key}
                    type={setting.type === 'number' ? 'number' : 'text'}
                    value={fields[setting.key] || ''}
                    onChange={(e) => handleFieldChange(setting.key, e.target.value)}
                    placeholder={`Masukkan ${setting.label || setting.key}`}
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
          isLoading={isPending}
          className="text-xs uppercase font-bold tracking-widest py-3 px-6"
        >
          Simpan Semua Pengaturan
        </Button>
      </div>
    </form>
  )
}
