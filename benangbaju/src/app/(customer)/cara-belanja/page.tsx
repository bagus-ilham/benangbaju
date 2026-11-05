import React from 'react'
import { Metadata } from 'next'
import { CaraBelanjaClient } from './CaraBelanjaClient'

export const metadata: Metadata = {
  title: 'Cara Belanja — Benangbaju',
  description: 'Ikuti panduan mudah cara berbelanja produk dari Benangbaju secara online.',
}

export default function CaraBelanjaPage(): React.JSX.Element {
  return <CaraBelanjaClient />
}
