import React from 'react'
import { Metadata } from 'next'
import { TentangClient } from './TentangClient'

export const metadata: Metadata = {
  title: 'Tentang Kami — Benangbaju',
  description:
    'Kami adalah brand fashion asal Bandung yang berdiri tahun 2021. Benangbaju hadir untuk membantu kamu menunjukkan bahwa kamu dapat mengekspresikan diri lewat sepotong pakaian yang sederhana namun unik.',
}

export default function TentangPage(): React.JSX.Element {
  return <TentangClient />
}
