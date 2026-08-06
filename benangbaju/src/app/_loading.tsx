import React from 'react'
import Image from 'next/image'

export default function RootLoading(): React.JSX.Element {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-cream font-heading p-4">
      <div className="flex flex-col items-center space-y-4">
        {/* Rotating Needle & Thread Icon */}
        <div className="relative w-12 h-12 md:w-14 md:h-14">
          <Image
            src="/svg/logo-jarum-benang.svg"
            alt="Loading..."
            fill
            className="object-contain animate-[spin_4s_linear_infinite]"
          />
        </div>
        {/* Brand Logotype SVG */}
        <div className="relative h-7 md:h-9 w-44 md:w-56 select-none">
          <Image
            src="/svg/logo-benangbaju.svg"
            alt="Benangbaju"
            fill
            className="object-contain text-brand-black"
          />
        </div>
        <div className="w-16 h-[1px] bg-neutral-200 overflow-hidden relative mt-1">
          <div className="absolute inset-y-0 left-0 bg-brand-plum w-1/2 animate-[shimmer-sweep_1.2s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  )
}
