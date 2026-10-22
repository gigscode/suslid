import Link from 'next/link'
import { brand } from '@/lib/pitchpilot/brand'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  href?: string
  className?: string
}

const sizeMap = {
  sm: { text: 'text-xl',  dot: 'text-2xl', gap: 'tracking-[-0.02em]' },
  md: { text: 'text-2xl', dot: 'text-3xl', gap: 'tracking-[-0.02em]' },
  lg: { text: 'text-4xl', dot: 'text-5xl', gap: 'tracking-[-0.03em]' },
}

export function BrandLogo({ size = 'md', href = '/', className = '' }: Props) {
  const { text, dot, gap } = sizeMap[size]

  const logo = (
    <span className={`inline-flex items-center gap-0 select-none ${className}`}>
      <span className={`font-extrabold ${text} ${gap} text-[#111827] leading-none`}>
        Sus
      </span>
      <span className={`font-extrabold ${text} ${gap} text-[#0B3C37] leading-none`}>
        Lid
      </span>
      <span
        className={`${dot} font-black text-[#E53E3E] leading-none ml-[2px]`}
        aria-hidden="true"
        style={{ lineHeight: 0.7 }}
      >
        .
      </span>
    </span>
  )

  if (!href) return logo

  return (
    <Link href={href} aria-label={`${brand.name} home`} className="inline-flex items-center outline-none focus-visible:ring-2 focus-visible:ring-[#0B3C37] rounded-sm">
      {logo}
    </Link>
  )
}
