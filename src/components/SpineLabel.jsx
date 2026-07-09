import { useState, useLayoutEffect, useRef, useMemo } from 'react'
import {
  layoutSpineLabel,
  refitSpineLabelFromPainted,
  spineFontCaps,
  spineLetterSpacing,
  SPINE_VERT_PAD,
  SPINE_MIN_PX,
} from '../lib/spineTypography.js'
import { useStageLayout } from '../context/StageScale.jsx'

const SPINE_TYPE = {
  fontFamily: "'Manrope', sans-serif",
  fontWeight: 600,
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
}

function SpineLabel({ axis = 'vertical', title, dims, ink = '#fff' }) {
  const { isMobile, zoomedIn, scaleTransitioning } = useStageLayout()
  const layoutOpts = useMemo(
    () => ({ axis, dims, ...spineFontCaps(isMobile, zoomedIn) }),
    [axis, dims?.w, dims?.h, isMobile, zoomedIn],
  )
  const containerRef = useRef(null)
  const labelRef = useRef(null)
  const [layout, setLayout] = useState(() => layoutSpineLabel(title, layoutOpts))

  useLayoutEffect(() => {
    if (scaleTransitioning) return

    const container = containerRef.current
    const label = labelRef.current
    if (!container || !label || !dims?.w || !dims?.h) return

    let cancelled = false
    const run = () => {
      if (cancelled) return
      try {
        const seed = layoutSpineLabel(title, layoutOpts)
        const next = refitSpineLabelFromPainted(title, layoutOpts, container, label, seed)
        setLayout(prev => (
          prev.fontPx === next.fontPx && prev.text === next.text ? prev : next
        ))
      } catch (err) {
        console.error('SpineLabel refit failed:', err)
      }
    }

    setLayout(layoutSpineLabel(title, layoutOpts))

    const frame = requestAnimationFrame(run)
    document.fonts?.ready?.then(() => {
      if (!cancelled) requestAnimationFrame(run)
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [title, layoutOpts, dims?.w, dims?.h, scaleTransitioning])

  if (!dims?.w || !dims?.h) return null

  const fontPx = layout.fontPx || SPINE_MIN_PX
  const textPx = layout.textPx || 0
  const letterSpacing = spineLetterSpacing(layout.fontEm, layout.emBase)
  const noAdjust = { WebkitTextSizeAdjust: 'none', textSizeAdjust: 'none' }

  if (axis === 'vertical') {
    return (
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          fontSize: dims.h,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: `${SPINE_VERT_PAD / dims.h}em 0`,
          boxSizing: 'border-box',
          ...noAdjust,
        }}
      >
        <div style={{
          width: fontPx,
          height: textPx,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span
            ref={labelRef}
            style={{
              ...SPINE_TYPE,
              transform: 'rotate(-90deg)',
              fontSize: fontPx,
              letterSpacing,
              color: ink,
              lineHeight: 1,
            }}
          >
            {layout.text}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        fontSize: dims.h,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        ...noAdjust,
      }}
    >
      <span
        ref={labelRef}
        style={{
          ...SPINE_TYPE,
          fontSize: fontPx,
          letterSpacing,
          color: ink,
          lineHeight: 1.15,
          maxWidth: layout.fitAvailPx,
          textAlign: 'center',
        }}
      >
        {layout.text}
      </span>
    </div>
  )
}

export { SpineLabel }
