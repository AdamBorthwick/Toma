// Eye shape variants for Toma's face

import { getEyeColor } from '../data/monster.jsx'

const ROUND_LEFT = 'M63.1562 85.3432C63.1562 85.3432 63.1562 70.4788 94.5741 70.4788C125.992 70.4788 125.992 85.3432 125.992 85.3432C125.992 85.3432 125.992 100.208 94.5741 100.208C63.1562 100.208 63.1562 85.3432 63.1562 85.3432Z'
const ROUND_RIGHT = 'M198.621 85.3432C198.621 85.3432 198.621 70.4788 230.039 70.4788C261.457 70.4788 261.457 85.3432 261.457 85.3432C261.457 85.3432 261.457 100.208 230.039 100.208C198.621 100.208 198.621 85.3432 198.621 85.3432Z'

const EYE_SHAPE_SPECS = {
  round: {
    kind: 'path',
    left: ROUND_LEFT,
    right: ROUND_RIGHT,
    leftIris: { cx: 94.5741, cy: 85.3432, r: 17 },
    rightIris: { cx: 230.039, cy: 85.3432, r: 17 },
    leftMask: { x: 63, y: 70, w: 63, h: 31 },
    rightMask: { x: 198, y: 70, w: 64, h: 31 },
    leftLid: { x: 63, y: 70, w: 63, h: 31 },
    rightLid: { x: 198, y: 70, w: 64, h: 31 },
    preview: '60 72 210 30',
  },
  wide: {
    kind: 'ellipse',
    left: { cx: 94.5, cy: 85.3, rx: 31, ry: 14 },
    right: { cx: 230, cy: 85.3, rx: 31, ry: 14 },
    leftIris: { cx: 94.5, cy: 85.3, r: 14 },
    rightIris: { cx: 230, cy: 85.3, r: 14 },
    leftMask: { x: 62, y: 70, w: 65, h: 31 },
    rightMask: { x: 197, y: 70, w: 66, h: 31 },
    leftLid: { x: 62, y: 70, w: 65, h: 31 },
    rightLid: { x: 197, y: 70, w: 66, h: 31 },
    preview: '58 72 214 30',
  },
  narrow: {
    kind: 'ellipse',
    left: { cx: 94.5, cy: 85.3, rx: 20, ry: 18 },
    right: { cx: 230, cy: 85.3, rx: 20, ry: 18 },
    leftIris: { cx: 94.5, cy: 85.3, r: 15 },
    rightIris: { cx: 230, cy: 85.3, r: 15 },
    leftMask: { x: 72, y: 66, w: 45, h: 38 },
    rightMask: { x: 208, y: 66, w: 45, h: 38 },
    leftLid: { x: 72, y: 66, w: 45, h: 38 },
    rightLid: { x: 208, y: 66, w: 45, h: 38 },
    preview: '68 66 184 38',
  },
  dot: {
    kind: 'circle',
    left: { cx: 94.5, cy: 85.3, r: 14 },
    right: { cx: 230, cy: 85.3, r: 14 },
    leftIris: { cx: 94.5, cy: 85.3, r: 9 },
    rightIris: { cx: 230, cy: 85.3, r: 9 },
    leftMask: { x: 79, y: 70, w: 31, h: 31 },
    rightMask: { x: 214, y: 70, w: 32, h: 31 },
    leftLid: { x: 79, y: 70, w: 31, h: 31 },
    rightLid: { x: 214, y: 70, w: 32, h: 31 },
    preview: '72 68 180 34',
  },
  sleepy: {
    kind: 'ellipse',
    left: { cx: 94.5, cy: 88, rx: 28, ry: 9 },
    right: { cx: 230, cy: 88, rx: 28, ry: 9 },
    leftIris: { cx: 94.5, cy: 88, r: 10 },
    rightIris: { cx: 230, cy: 88, r: 10 },
    leftMask: { x: 64, y: 78, w: 61, h: 20 },
    rightMask: { x: 199, y: 78, w: 62, h: 20 },
    leftLid: { x: 64, y: 78, w: 61, h: 20 },
    rightLid: { x: 199, y: 78, w: 62, h: 20 },
    preview: '60 76 210 24',
  },
}

function getEyeShapeSpec(shapeKey) {
  return EYE_SHAPE_SPECS[shapeKey] ?? EYE_SHAPE_SPECS.round
}

function renderEyeWhite(spec, side) {
  const shape = side === 'left' ? spec.left : spec.right
  if (spec.kind === 'path') return <path d={shape} fill="#FDF8EF" />
  if (spec.kind === 'circle') return <circle cx={shape.cx} cy={shape.cy} r={shape.r} fill="#FDF8EF" />
  return <ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} fill="#FDF8EF" />
}

function renderEyeMaskShape(spec, side) {
  const shape = side === 'left' ? spec.left : spec.right
  if (spec.kind === 'path') return <path d={shape} fill="white" />
  if (spec.kind === 'circle') return <circle cx={shape.cx} cy={shape.cy} r={shape.r} fill="white" />
  return <ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} fill="white" />
}

function MonsterEyes({
  eyeShapeKey = 'round',
  eyeColorKey = 'dark',
  irisOff = { x: 0, y: 0 },
  maskIdPrefix = 'toma-eye',
  blinkAnim = 'none',
  blinkPulse = 0,
  bodyColor = '#72FF5D',
}) {
  const spec = getEyeShapeSpec(eyeShapeKey)
  const irisColor = getEyeColor(eyeColorKey).iris
  const maskL = `${maskIdPrefix}-l`
  const maskR = `${maskIdPrefix}-r`
  const ox = irisOff.x * (325 / 226)
  const oy = irisOff.y * (331 / 230)
  const blinkClass = blinkAnim === 'squint'
    ? 'toma-eye-lid--squint'
    : blinkAnim === 'blink'
      ? 'toma-eye-lid--blink-once'
      : ''

  return (
    <>
      {renderEyeWhite(spec, 'left')}
      <mask id={maskL} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x={spec.leftMask.x} y={spec.leftMask.y} width={spec.leftMask.w} height={spec.leftMask.h}>
        {renderEyeMaskShape(spec, 'left')}
      </mask>
      <g mask={`url(#${maskL})`}>
        <circle cx={spec.leftIris.cx + ox} cy={spec.leftIris.cy + oy} r={spec.leftIris.r} fill={irisColor} />
      </g>

      {renderEyeWhite(spec, 'right')}
      <mask id={maskR} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x={spec.rightMask.x} y={spec.rightMask.y} width={spec.rightMask.w} height={spec.rightMask.h}>
        {renderEyeMaskShape(spec, 'right')}
      </mask>
      <g mask={`url(#${maskR})`}>
        <circle cx={spec.rightIris.cx + ox} cy={spec.rightIris.cy + oy} r={spec.rightIris.r} fill={irisColor} />
      </g>

      {blinkAnim !== 'none' && (
        <>
          <g key={`l-${blinkPulse}`} className={`toma-eye-lid ${blinkClass}`}>
            <rect x={spec.leftLid.x} y={spec.leftLid.y} width={spec.leftLid.w} height={spec.leftLid.h} fill={bodyColor} />
          </g>
          <g key={`r-${blinkPulse}`} className={`toma-eye-lid ${blinkClass}`}>
            <rect x={spec.rightLid.x} y={spec.rightLid.y} width={spec.rightLid.w} height={spec.rightLid.h} fill={bodyColor} />
          </g>
        </>
      )}
    </>
  )
}

function EyeShapeOnlyPreview({ eyeShape = 'round', eyeColorKey = 'dark' }) {
  const spec = getEyeShapeSpec(eyeShape)
  const irisColor = getEyeColor(eyeColorKey).iris
  const { x, y, w, h } = spec.leftMask
  const pad = 6
  const viewBox = `${x - pad} ${y - pad} ${w + pad * 2} ${h + pad * 2}`

  return (
    <svg width="100%" height="100%" viewBox={viewBox} preserveAspectRatio="xMidYMid meet" aria-hidden="true" className="picker-preview-svg picker-preview-shadow">
      {renderEyeWhite(spec, 'left')}
      <circle cx={spec.leftIris.cx} cy={spec.leftIris.cy} r={spec.leftIris.r} fill={irisColor} />
    </svg>
  )
}

export { MonsterEyes, EyeShapeOnlyPreview, getEyeShapeSpec, EYE_SHAPE_SPECS }
