import { ImageResponse } from 'next/og'

// Pointy-top hexagon matching the site's hex network animation
const HEX_CLIP =
  'polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

// Satellite hex nodes — stroke border + dark fill (like cluster animation)
const SATELLITES = [
  { x: 0, y: 2, size: 34, stroke: 3, color: '#f87171' }, // red — top-left
  { x: 148, y: 142, size: 26, stroke: 3, color: '#fbbf24' }, // amber — bottom-right
] as const

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        background: 'transparent',
      }}
    >
      {/* Emerald hex border — full size */}
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
          top: 4,
          left: 4,
          right: 4,
          bottom: 4,
          clipPath: HEX_CLIP,
          background: 'linear-gradient(160deg, #111111, #0a0a0a)',
          display: 'flex',
        }}
      />
      {/* Top highlight — glass morphism feel */}
      <div
        style={{
          position: 'absolute',
          top: 4,
          left: 4,
          right: 4,
          height: 28,
          clipPath: HEX_CLIP,
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.07), transparent)',
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
            fontSize: 88,
            color: '#34d399',
            marginRight: 2,
          }}
        >
          &gt;
        </span>
        <span
          style={{
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: 64,
            color: '#f0fdf4',
            letterSpacing: -1,
          }}
        >
          JP
        </span>
      </div>
      {/* Satellite hex nodes — stroke border + dark fill (cluster style) */}
      {SATELLITES.map((sat, i) => (
        <div key={i} style={{ display: 'flex' }}>
          <div
            style={{
              position: 'absolute',
              top: sat.y,
              left: sat.x,
              width: sat.size,
              height: sat.size,
              clipPath: HEX_CLIP,
              background: sat.color,
              display: 'flex',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: sat.y + sat.stroke,
              left: sat.x + sat.stroke,
              width: sat.size - sat.stroke * 2,
              height: sat.size - sat.stroke * 2,
              clipPath: HEX_CLIP,
              background: 'rgba(15, 23, 42, 0.85)',
              display: 'flex',
            }}
          />
        </div>
      ))}
    </div>,
    { ...size },
  )
}
