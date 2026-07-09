// Accessory overlays for Toma's face (glasses, facial hair, eyepatch, etc.)

import { getAccessoryColors } from '../data/monster.jsx'

const LENS = 'rgba(30,30,50,0.55)'

const PREVIEW_VIEWBOX = {
  round: '50 62 225 48',
  square: '50 62 225 48',
  sunglasses: '50 62 225 48',
  moustache: '118 112 88 32',
  beard: '112 128 98 58',
  eyepatch: '168 58 108 52',
}

function roundGlasses({ compact = false, frame = '#2A2A3E' }) {
  const r = compact ? 14 : 19
  const sw = compact ? 2.8 : 3.5
  return (
    <g>
      <circle cx="94.5" cy="85.3" r={r} fill="none" stroke={frame} strokeWidth={sw} />
      <circle cx="230" cy="85.3" r={r} fill="none" stroke={frame} strokeWidth={sw} />
      <path d="M113.5 85.3 H211" stroke={frame} strokeWidth={sw - 0.5} strokeLinecap="round" />
      <line x1="74" y1="85.3" x2="63" y2="82" stroke={frame} strokeWidth={sw - 0.5} strokeLinecap="round" />
      <line x1="251" y1="85.3" x2="262" y2="82" stroke={frame} strokeWidth={sw - 0.5} strokeLinecap="round" />
    </g>
  )
}

function squareGlasses({ compact = false, frame = '#2A2A3E' }) {
  const w = compact ? 30 : 40
  const h = compact ? 22 : 28
  const sw = compact ? 2.8 : 3.5
  const lx = 94.5 - w / 2
  const rx = 230 - w / 2
  const y = 85.3 - h / 2
  return (
    <g>
      <rect x={lx} y={y} width={w} height={h} rx="5" fill="none" stroke={frame} strokeWidth={sw} />
      <rect x={rx} y={y} width={w} height={h} rx="5" fill="none" stroke={frame} strokeWidth={sw} />
      <path d={`M${lx + w} ${85.3} H${rx}`} stroke={frame} strokeWidth={sw - 0.5} strokeLinecap="round" />
      <line x1={lx - 11} y1="85.3" x2={lx - 2} y2="85.3" stroke={frame} strokeWidth={sw - 0.5} strokeLinecap="round" />
      <line x1={rx + w + 2} y1="85.3" x2={rx + w + 11} y2="85.3" stroke={frame} strokeWidth={sw - 0.5} strokeLinecap="round" />
    </g>
  )
}

function sunglasses({ compact = false, frame = '#2A2A3E' }) {
  const w = compact ? 34 : 44
  const h = compact ? 20 : 26
  const sw = compact ? 2.8 : 3.5
  const lx = 94.5 - w / 2
  const rx = 230 - w / 2
  const y = 85.3 - h / 2
  return (
    <g>
      <rect x={lx} y={y} width={w} height={h} rx="6" fill={LENS} stroke={frame} strokeWidth={sw} />
      <rect x={rx} y={y} width={w} height={h} rx="6" fill={LENS} stroke={frame} strokeWidth={sw} />
      <path d={`M${lx + w} ${85.3} H${rx}`} stroke={frame} strokeWidth={sw - 0.5} strokeLinecap="round" />
      <line x1={lx - 11} y1="85.3" x2={lx - 2} y2="85.3" stroke={frame} strokeWidth={sw - 0.5} strokeLinecap="round" />
      <line x1={rx + w + 2} y1="85.3" x2={rx + w + 11} y2="85.3" stroke={frame} strokeWidth={sw - 0.5} strokeLinecap="round" />
    </g>
  )
}

function moustache({ compact = false, primary = '#2A2A3E', accent = '#1A1A2A' }) {
  const sw = compact ? 5 : 7
  return (
    <g>
      <path
        d="M 138 128 C 148 118 154 116 161 118 C 168 116 174 118 184 128 C 178 134 170 136 161 134 C 152 136 144 134 138 128 Z"
        fill={primary}
      />
      <path
        d="M 142 126 C 150 122 155 121 161 122 C 167 121 172 122 180 126"
        fill="none"
        stroke={accent}
        strokeWidth={sw * 0.35}
        strokeLinecap="round"
        opacity="0.55"
      />
    </g>
  )
}

function beard({ compact = false, primary = '#2A2A3E', accent = '#1A1A2A' }) {
  const w = compact ? 52 : 68
  const h = compact ? 38 : 48
  const x = 161.5 - w / 2
  const y = compact ? 148 : 142
  return (
    <g>
      <ellipse cx="161.5" cy={y + h * 0.42} rx={w * 0.48} ry={h * 0.52} fill={primary} />
      <path
        d={`M ${x + w * 0.18} ${y + h * 0.2} Q 161.5 ${y + h * 0.08} ${x + w * 0.82} ${y + h * 0.2}`}
        fill="none"
        stroke={accent}
        strokeWidth={compact ? 3 : 4}
        strokeLinecap="round"
        opacity="0.45"
      />
      <ellipse cx="148" cy={y + h * 0.55} rx={compact ? 5 : 7} ry={compact ? 7 : 9} fill={accent} opacity="0.35" />
      <ellipse cx="175" cy={y + h * 0.55} rx={compact ? 5 : 7} ry={compact ? 7 : 9} fill={accent} opacity="0.35" />
    </g>
  )
}

function eyepatch({ compact = false, primary = '#2A2A3E', accent = '#1A1A2A' }) {
  const rx = compact ? 20 : 26
  const ry = compact ? 14 : 18
  const sw = compact ? 2.4 : 3
  return (
    <g>
      <path
        d={`M 72 ${compact ? 72 : 68} Q 145 ${compact ? 58 : 52} 222 ${compact ? 72 : 68}`}
        fill="none"
        stroke={accent}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <ellipse cx="230" cy="85.3" rx={rx} ry={ry} fill={primary} stroke={accent} strokeWidth={sw - 0.5} />
      <circle cx={230 - rx * 0.35} cy={85.3 - ry * 0.2} r={compact ? 2.5 : 3.5} fill="rgba(255,255,255,0.22)" />
    </g>
  )
}

function MonsterAccessoryGraphic({ accessory = 'none', accessoryColorKey = 'red', compact = false }) {
  if (accessory === 'none') return null
  const { primary, accent } = getAccessoryColors(accessory, accessoryColorKey)
  if (accessory === 'round') return roundGlasses({ compact, frame: accent })
  if (accessory === 'square') return squareGlasses({ compact, frame: accent })
  if (accessory === 'sunglasses') return sunglasses({ compact, frame: accent })
  if (accessory === 'moustache') return moustache({ compact, primary, accent })
  if (accessory === 'beard') return beard({ compact, primary, accent })
  if (accessory === 'eyepatch') return eyepatch({ compact, primary, accent })
  return null
}

function AccessoryOnlyPreview({ accessory, accessoryColorKey = 'red' }) {
  if (accessory === 'none') {
    return (
      <svg width="100%" height="100%" viewBox="0 0 48 32" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <line x1="10" y1="16" x2="38" y2="16" stroke="#C8C8D8" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    )
  }
  const viewBox = PREVIEW_VIEWBOX[accessory] ?? '50 62 225 48'
  return (
    <svg width="100%" height="100%" viewBox={viewBox} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <MonsterAccessoryGraphic accessory={accessory} accessoryColorKey={accessoryColorKey} compact />
    </svg>
  )
}

export { MonsterAccessoryGraphic, AccessoryOnlyPreview }
