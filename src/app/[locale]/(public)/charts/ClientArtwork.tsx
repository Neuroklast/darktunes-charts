'use client'

import { useState } from 'react'
import { Music2 } from 'lucide-react'
import Image from 'next/image'

export function ClientArtwork({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false)

  return (
    <div className={`shrink-0 w-12 h-12 mt-1 rounded-sm overflow-hidden relative ${error ? 'flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]' : 'bg-white/5'}`}>
      {!error ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <Music2 size={20} className="text-white/30" />
      )}
    </div>
  )
}
