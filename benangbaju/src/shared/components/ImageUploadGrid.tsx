/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useEffect, useMemo } from 'react'
import { HandDrawnIcon } from './HandDrawnIcon'
import { cn } from '@/lib/utils'

interface ImageUploadGridProps {
  files: File[]
  maxFiles?: number
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveFile: (index: number) => void
  addLabel?: string
  tileSize?: 'sm' | 'md'
}

/**
 * Reusable image attachment picker with automatic ObjectURL lifecycle management.
 */
export function ImageUploadGrid({
  files,
  maxFiles = 2,
  onFileChange,
  onRemoveFile,
  addLabel = 'Tambah',
  tileSize = 'sm',
}: ImageUploadGridProps): React.JSX.Element {
  const previewUrls = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files]
  )

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [previewUrls])

  const sizeClass = tileSize === 'md' ? 'w-24 h-24' : 'w-20 h-20'

  return (
    <div className="flex flex-wrap gap-3">
      {previewUrls.map((previewUrl, idx) => (
        <div
          key={previewUrl}
          className={cn(
            'relative border border-brand-plum/15 rounded-xl group',
            sizeClass
          )}
        >
          <img
            src={previewUrl}
            alt={`Preview ${idx + 1}`}
            className="w-full h-full object-cover rounded-xl"
          />
          <button
            type="button"
            onClick={() => onRemoveFile(idx)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-sm cursor-pointer"
            aria-label={`Remove photo ${idx + 1}`}
          >
            <HandDrawnIcon name="close" className="h-3 w-3" />
          </button>
        </div>
      ))}

      {files.length < maxFiles && (
        <label
          className={cn(
            'border-2 border-dashed border-brand-plum/20 bg-brand-gold/30 rounded-xl flex flex-col items-center justify-center text-neutral-500 hover:text-brand-plum hover:border-brand-blue-stroke cursor-pointer transition-colors',
            sizeClass
          )}
        >
          <HandDrawnIcon name="image" className="h-5 w-5 mb-1" />
          <span className="text-[9px] uppercase tracking-wider font-semibold">{addLabel}</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onFileChange}
          />
        </label>
      )}
    </div>
  )
}
