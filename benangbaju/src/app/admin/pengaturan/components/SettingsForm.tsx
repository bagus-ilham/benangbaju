import React from 'react'
import { Select, Input, Button } from '@/shared/components'
import type { SiteSetting } from '@/modules/settings/types'

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
  return (
    <form onSubmit={handleSaveSettings} className="space-y-8 max-w-3xl">
      {Object.entries(settingsByGroup).map(([group, list]) => (
        <div key={group} className="border border-neutral-200 bg-white p-5 rounded-none space-y-4">
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
