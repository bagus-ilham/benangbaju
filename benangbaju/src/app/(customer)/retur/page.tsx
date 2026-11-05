import React from 'react'
import { Metadata } from 'next'
import { ReturClient } from './ReturClient'

export const metadata: Metadata = {
  title: 'Kebijakan Pengembalian (Retur) — Benangbaju',
  description:
    'Syarat dan panduan pengajuan retur barang domestik, tukar ukuran, klaim produk cacat, serta kebijakan Final Sale untuk pesanan internasional Malaysia di Benangbaju.',
}

export default function ReturPage(): React.JSX.Element {
  return <ReturClient />
}
