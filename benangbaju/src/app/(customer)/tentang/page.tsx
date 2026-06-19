import React from 'react'
import { Metadata } from 'next'
import { TentangClient } from './TentangClient'

export const metadata: Metadata = {
  title: 'Tentang Kami — Benangbaju',
  description: 'Kenali kisah di balik Benangbaju, produsen fashion muslim premium modern dengan desain minimalis, bahan berkualitas tinggi, dan kenyamanan terbaik.',
}

export default function TentangPage() : React.JSX.Element {
  return <TentangClient />
}

