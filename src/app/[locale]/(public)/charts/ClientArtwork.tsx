'use client'

import { useState } from 'react'
import { Music2 } from 'lucide-react'

export function ClientArtwork({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false)

  return (
    <div className={`shrink-0 w-12 h-12 mt-1 rounded-sm overflow-hidden bg-white/5 relative ${error ? 'flex items-center justify-center' : ''}`}>
      {!error ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <Music2 size={20} className="text-white/20" />
      )}
    </div>
  )
}
