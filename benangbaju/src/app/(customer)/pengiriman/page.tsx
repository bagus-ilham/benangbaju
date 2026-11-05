import React from 'react'
import { Metadata } from 'next'
import { PengirimanClient } from './PengirimanClient'

export const metadata: Metadata = {
  title: 'Informasi Pengiriman — Benangbaju',
  description:
    'Informasi lengkap tarif, jadwal, cakupan daerah domestik Indonesia & internasional Semenanjung Malaysia, ekspedisi pengiriman, dan kebijakan berat paket Benangbaju.',
}

export default function PengirimanPage(): React.JSX.Element {
  return <PengirimanClient />
}
