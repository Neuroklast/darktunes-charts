'use client'

import Link from 'next/link'
import { Heart, Disc, UsersThree } from '@phosphor-icons/react'

function PillarCard({
  icon,
  iconColor,
  gradient,
  title,
  description,
  href,
  cta,
}: {
  icon: React.ReactNode
  iconColor: string
  gradient: string
  title: string
  description: string
  href: string
  cta: string
}) {
  return (
    <div className={`relative bg-gradient-to-br ${gradient} border border-white/[0.07] rounded-lg p-6 card-hover flex flex-col gap-4`}>
      <div className={iconColor}>{icon}</div>
      <div>
        <h3 className="font-display text-lg text-white mb-2">{title}</h3>
        <p className="text-sm text-white/50 leading-relaxed">{description}</p>
      </div>
      <Link
        href={href}
        className="mt-auto text-xs uppercase tracking-widest text-white/40 hover:text-white transition-colors"
      >
        {cta} →
      </Link>
    </div>
  )
}

export default function PillarCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <PillarCard
        icon={<Heart className="w-8 h-8" weight="fill" />}
        iconColor="text-primary"
        gradient="from-red-950 via-gray-950 to-black"
        title="Fan Power"
        description="Deine Stimme zählt. 100 Voice Credits, dein Monat, deine Entscheidung. Quadratic Voting verhindert, dass ein einziger Fan alles dominiert."
        href="/vote"
        cta="Jetzt abstimmen"
      />
      <PillarCard
        icon={<Disc className="w-8 h-8" weight="fill" />}
        iconColor="text-accent"
        gradient="from-violet-950 via-gray-950 to-black"
        title="DJ Expertise"
        description="Die DJs der Szene wählen, was im Club funktioniert. Schulze-Methode: die ehrliche Rangliste ist immer die beste Strategie."
        href="/vote"
        cta="DJ Ballot einreichen"
      />
      <PillarCard
        icon={<UsersThree className="w-8 h-8" weight="fill" />}
        iconColor="text-destructive"
        gradient="from-gray-950 via-gray-900 to-black"
        title="Peer Respekt"
        description="Bands bewerten sich gegenseitig. Qualität erkennt Qualität — Voting-Ringe werden automatisch erkannt und neutralisiert."
        href="/how-it-works"
        cta="Mehr erfahren"
      />
    </div>
  )
}
