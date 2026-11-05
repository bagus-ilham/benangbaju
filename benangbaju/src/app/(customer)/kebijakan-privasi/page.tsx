import React from 'react'
import { Metadata } from 'next'
import { KebijakanPrivasiClient } from './KebijakanPrivasiClient'

export const metadata: Metadata = {
  title: 'Kebijakan Privasi — Benangbaju',
  description:
    'Informasi mengenai bagaimana Benangbaju mengumpulkan, menyimpan, menggunakan, dan melindungi data pribadi pelanggan sesuai regulasi UU PDP Indonesia dan PDPA Malaysia 2010.',
}

export default function KebijakanPrivasiPage(): React.JSX.Element {
  return <KebijakanPrivasiClient />
}
