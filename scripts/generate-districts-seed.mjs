/**
 * Generate supabase/seeds/seed_districts.sql from Emsifa Wilayah Indonesia API.
 *
 * Usage: node scripts/generate-districts-seed.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUTPUT = join(ROOT, 'supabase', 'seeds', 'seed_districts.sql')
const API_BASE = 'https://www.emsifa.com/api-wilayah-indonesia/api'

const PROVINCE_ZONE_MAP = {
  'DKI Jakarta': 'e1000000-0000-0000-0000-000000000001',
  'Jawa Barat': 'e1000000-0000-0000-0000-000000000001',
  'Jawa Tengah': 'e1000000-0000-0000-0000-000000000001',
  'Jawa Timur': 'e1000000-0000-0000-0000-000000000001',
  'DI Yogyakarta': 'e1000000-0000-0000-0000-000000000001',
  Banten: 'e1000000-0000-0000-0000-000000000001',
  'Sumatera Utara': 'e1000000-0000-0000-0000-000000000002',
  'Sumatera Barat': 'e1000000-0000-0000-0000-000000000002',
  'Sumatera Selatan': 'e1000000-0000-0000-0000-000000000002',
  Riau: 'e1000000-0000-0000-0000-000000000002',
  Lampung: 'e1000000-0000-0000-0000-000000000002',
  Aceh: 'e1000000-0000-0000-0000-000000000002',
  Jambi: 'e1000000-0000-0000-0000-000000000002',
  Bengkulu: 'e1000000-0000-0000-0000-000000000002',
  'Kepulauan Riau': 'e1000000-0000-0000-0000-000000000002',
  'Kepulauan Bangka Belitung': 'e1000000-0000-0000-0000-000000000002',
  'Kalimantan Barat': 'e1000000-0000-0000-0000-000000000003',
  'Kalimantan Timur': 'e1000000-0000-0000-0000-000000000003',
  'Kalimantan Selatan': 'e1000000-0000-0000-0000-000000000003',
  'Kalimantan Tengah': 'e1000000-0000-0000-0000-000000000003',
  'Kalimantan Utara': 'e1000000-0000-0000-0000-000000000003',
  'Sulawesi Selatan': 'e1000000-0000-0000-0000-000000000004',
  'Sulawesi Utara': 'e1000000-0000-0000-0000-000000000004',
  'Sulawesi Tengah': 'e1000000-0000-0000-0000-000000000004',
  'Sulawesi Tenggara': 'e1000000-0000-0000-0000-000000000004',
  Gorontalo: 'e1000000-0000-0000-0000-000000000004',
  'Sulawesi Barat': 'e1000000-0000-0000-0000-000000000004',
  Bali: 'e1000000-0000-0000-0000-000000000004',
  'Nusa Tenggara Barat': 'e1000000-0000-0000-0000-000000000004',
  'Nusa Tenggara Timur': 'e1000000-0000-0000-0000-000000000004',
  Papua: 'e1000000-0000-0000-0000-000000000005',
  'Papua Barat': 'e1000000-0000-0000-0000-000000000005',
  Maluku: 'e1000000-0000-0000-0000-000000000005',
  'Maluku Utara': 'e1000000-0000-0000-0000-000000000005',
}

function titleCase(value) {
  return value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatProvince(name) {
  if (name.startsWith('DKI ')) return `DKI ${titleCase(name.slice(4))}`
  if (name.startsWith('DI ')) return `DI ${titleCase(name.slice(3))}`
  return titleCase(name)
}

function formatCity(name) {
  if (name.startsWith('KOTA ')) return titleCase(name.slice(5))
  if (name.startsWith('KABUPATEN ')) return titleCase(name.slice(10))
  return titleCase(name)
}

function sqlLiteral(value) {
  return `'${value.replace(/'/g, "''")}'`
}

async function fetchJson(path) {
  const response = await fetch(`${API_BASE}${path}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`)
  }
  return response.json()
}

async function main() {
  console.log('Fetching provinces...')
  const provinces = await fetchJson('/provinces.json')
  const rows = []

  for (const province of provinces) {
    const provinceName = formatProvince(province.name)
    const zoneId = PROVINCE_ZONE_MAP[provinceName] ?? null
    const regencies = await fetchJson(`/regencies/${province.id}.json`)

    for (const regency of regencies) {
      const cityName = formatCity(regency.name)
      const districts = await fetchJson(`/districts/${regency.id}.json`)

      for (const district of districts) {
        rows.push({
          provinceName,
          cityName,
          districtName: titleCase(district.name),
          zoneId,
        })
      }
    }

    console.log(`  ${provinceName}: ${rows.length} districts total so far`)
  }

  // De-duplicate rows based on unique constraint (province_name, city_name, district_name)
  const uniqueRows = []
  const seen = new Set()
  for (const row of rows) {
    const key = `${row.provinceName}|${row.cityName}|${row.districtName}`.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      uniqueRows.push(row)
    }
  }
  console.log(`De-duplicated from ${rows.length} to ${uniqueRows.length} districts`)

  const chunks = []
  const batchSize = 250

  for (let i = 0; i < uniqueRows.length; i += batchSize) {
    const batch = uniqueRows.slice(i, i + batchSize)
    const values = batch
      .map((row) => {
        const zoneValue = row.zoneId ? `'${row.zoneId}'` : 'NULL'
        return `  (${sqlLiteral(row.provinceName)}, ${sqlLiteral(row.cityName)}, ${sqlLiteral(row.districtName)}, NULL, ${zoneValue})`
      })
      .join(',\n')

    chunks.push(
      `INSERT INTO districts (province_name, city_name, district_name, postal_code, zone_id) VALUES\n${values}\nON CONFLICT (province_name, city_name, district_name) DO UPDATE SET\n  zone_id = EXCLUDED.zone_id;`
    )
  }

  const header = `-- =============================================================
-- Seed: Indonesian Districts (Kecamatan)
-- Generated by scripts/generate-districts-seed.mjs
-- Source: https://www.emsifa.com/api-wilayah-indonesia
-- Total rows: ${uniqueRows.length}
-- Run automatically after seed.sql via supabase db reset
-- =============================================================

`

  mkdirSync(dirname(OUTPUT), { recursive: true })
  writeFileSync(OUTPUT, header + chunks.join('\n\n') + '\n', 'utf8')
  console.log(`Wrote ${uniqueRows.length} districts to ${OUTPUT}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
