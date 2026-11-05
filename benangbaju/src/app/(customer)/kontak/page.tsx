import React from 'react'
import { Metadata } from 'next'
import { KontakClient } from './KontakClient'

export const metadata: Metadata = {
  title: 'Hubungi Kami — Benangbaju',
  description:
    'Tim customer service Benangbaju siap membantu informasi produk, ukuran, pengiriman domestik & internasional Malaysia, dan layanan purnajual.',
}

export default function KontakPage(): React.JSX.Element {
  return <KontakClient />
}
