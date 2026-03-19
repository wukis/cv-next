import { ImageResponse } from 'next/og'

// Pointy-top hexagon matching the site's hex network animation
const HEX_CLIP =
  'polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)'

const SIZES = {
  small: {
    dim: 16,
    border: 1,
    chevron: 10,
    initials: 7,
    highlight: 2,
    // Satellite hex nodes — stroke border + dark fill (like the cluster animation)
    red: { x: 0, y: 0, size: 7, stroke: 1 },
    amber: { x: 11, y: 11, size: 5, stroke: 1 },
  },
  medium: {
    dim: 32,
    border: 2,
    chevron: 16,
    initials: 11,
    highlight: 4,
    red: { x: 0, y: 1, size: 13, stroke: 2 },
    amber: { x: 22, y: 22, size: 9, stroke: 1 },
  },
  large: {
    dim: 48,
    border: 3,
    chevron: 24,
    initials: 17,
    highlight: 6,
    red: { x: 0, y: 1, size: 18, stroke: 2 },
    amber: { x: 34, y: 33, size: 13, stroke: 2 },
  },
} as const

export function generateImageMetadata() {
  return [
    { id: 'small', size: { width: 16, height: 16 }, contentType: 'image/png' },
    {
      id: 'medium',
      size: { width: 32, height: 32 },
      contentType: 'image/png',
    },
    { id: 'large', size: { width: 48, height: 48 }, contentType: 'image/png' },
  ] as const
}

export default function Icon({ id }: { id: string }) {
  const s = SIZES[id as keyof typeof SIZES] ?? SIZES.medium

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {/* Emerald hex border — full canvas size */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          clipPath: HEX_CLIP,
          background: 'linear-gradient(160deg, #34d399, #059669)',
          display: 'flex',
        }}
      />
      {/* Dark inner hex */}
      <div
        style={{
          position: 'absolute',
          top: s.border,
          left: s.border,
          right: s.border,
          bottom: s.border,
          clipPath: HEX_CLIP,
          background: 'linear-gradient(160deg, #111111, #0a0a0a)',
          display: 'flex',
        }}
      />
      {/* Top highlight edge — glass feel */}
      <div
        style={{
          position: 'absolute',
          top: s.border,
          left: s.border,
          right: s.border,
          height: s.highlight,
          clipPath: HEX_CLIP,
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.08), transparent)',
          display: 'flex',
        }}
      />
      {/* Terminal prompt + initials */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          position: 'relative',
        }}
      >
        <span
          style={{
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: s.chevron,
            color: '#34d399',
            marginRight: s.dim <= 16 ? -1 : 0,
          }}
        >
          &gt;
        </span>
        <span
          style={{
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: s.initials,
            color: '#f0fdf4',
            letterSpacing: s.dim <= 16 ? -0.5 : 0,
          }}
        >
          JP
        </span>
      </div>
      {/* Red satellite — stroke border + dark fill (cluster animation style) */}
      <div
        style={{
          position: 'absolute',
          top: s.red.y,
          left: s.red.x,
          width: s.red.size,
          height: s.red.size,
          clipPath: HEX_CLIP,
          background: '#f87171',
          display: 'flex',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: s.red.y + s.red.stroke,
          left: s.red.x + s.red.stroke,
          width: s.red.size - s.red.stroke * 2,
          height: s.red.size - s.red.stroke * 2,
          clipPath: HEX_CLIP,
          background: 'rgba(15, 23, 42, 0.85)',
          display: 'flex',
        }}
      />
      {/* Amber satellite — stroke border + dark fill (cluster animation style) */}
      <div
        style={{
          position: 'absolute',
          top: s.amber.y,
          left: s.amber.x,
          width: s.amber.size,
          height: s.amber.size,
          clipPath: HEX_CLIP,
          background: '#fbbf24',
          display: 'flex',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: s.amber.y + s.amber.stroke,
          left: s.amber.x + s.amber.stroke,
          width: s.amber.size - s.amber.stroke * 2,
          height: s.amber.size - s.amber.stroke * 2,
          clipPath: HEX_CLIP,
          background: 'rgba(15, 23, 42, 0.85)',
          display: 'flex',
        }}
      />
    </div>,
    { width: s.dim, height: s.dim },
  )
}
