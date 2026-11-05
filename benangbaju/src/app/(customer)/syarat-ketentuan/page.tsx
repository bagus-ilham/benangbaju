import React from 'react'
import { Metadata } from 'next'
import { SyaratKetentuanClient } from './SyaratKetentuanClient'

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan — Benangbaju',
  description:
    'Syarat dan ketentuan umum penggunaan situs, pendaftaran akun, pembelian produk, pembayaran QRIS Cross-Border, pengiriman internasional Malaysia, dan kebijakan retur di Benangbaju.',
}

export default function SyaratKetentuanPage(): React.JSX.Element {
  return <SyaratKetentuanClient />
}
