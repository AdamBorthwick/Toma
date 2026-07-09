import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import { colors } from '../lib/uiTokens.js'

/**
 * Scrollable region with edge fades that appear when more content is off-screen.
 * axis="x" — horizontal (hat picker). axis="y" — vertical (panel lists).
 * variant="nested" (default) — inner scroll child. variant="self" — the wrap element scrolls.
 */
export const ScrollFade = forwardRef(function ScrollFade({
  axis = 'y',
  variant = 'nested',
  fadeColor = colors.surface,
  fadeSize = 32,
  bleed = 0,
  disabled = false,
  className = '',
  wrapClassName = '',
  scrollClassName = '',
  style,
  wrapStyle,
  scrollStyle,
  bleedStyle,
  children,
  ...scrollProps
}, ref) {
  const scrollRef = useRef(null)
  const [fade, setFade] = useState({ start: false, end: false })

  const setRefs = useCallback((el) => {
    scrollRef.current = el
    if (typeof ref === 'function') ref(el)
    else if (ref) ref.current = el
  }, [ref])

  const updateFade = useCallback(() => {
    const el = scrollRef.current
    if (!el || disabled) {
      setFade({ start: false, end: false })
      return
    }
    if (axis === 'y') {
      const max = Math.max(0, el.scrollHeight - el.clientHeight)
      setFade({
        start: el.scrollTop > 4,
        end: max > 4 && el.scrollTop < max - 4,
      })
      return
    }
    const max = Math.max(0, el.scrollWidth - el.clientWidth)
    setFade({
      start: el.scrollLeft > 4,
      end: max > 4 && el.scrollLeft < max - 4,
    })
  }, [axis, disabled])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', updateFade, { passive: true })
    const ro = new ResizeObserver(updateFade)
    ro.observe(el)
    updateFade()
    return () => {
      el.removeEventListener('scroll', updateFade)
      ro.disconnect()
    }
  }, [updateFade])

  const fadeVars = {
    '--scroll-fade-color': fadeColor,
    '--scroll-fade-size': `${fadeSize}px`,
    '--fade-start-opacity': disabled ? 0 : (fade.start ? 1 : 0),
    '--fade-end-opacity': disabled ? 0 : (fade.end ? 1 : 0),
  }

  const axisClass = axis === 'x' ? 'scroll-fade-wrap--x' : 'scroll-fade-wrap--y'
  const wrapClasses = [
    'scroll-fade-wrap',
    axisClass,
    variant === 'self' ? 'scroll-fade-wrap--self' : '',
    wrapClassName,
    className,
  ].filter(Boolean).join(' ')

  if (variant === 'self') {
    return (
      <div
        ref={setRefs}
        className={wrapClasses}
        style={{ ...fadeVars, ...wrapStyle, ...style }}
        {...scrollProps}
      >
        {children}
      </div>
    )
  }

  const scrollClasses = [
    'scroll-fade-scroll',
    axis === 'x' ? 'scroll-fade-scroll--x' : '',
    scrollClassName,
  ].filter(Boolean).join(' ')

  const bleedWrapStyle = bleed
    ? { marginLeft: -bleed, marginRight: -bleed, width: `calc(100% + ${bleed * 2}px)`, ...bleedStyle }
    : bleedStyle

  const content = (
    <div className={wrapClasses} style={{ ...fadeVars, ...wrapStyle, ...style }}>
      <div
        ref={setRefs}
        className={scrollClasses}
        style={scrollStyle}
        {...scrollProps}
      >
        {children}
      </div>
    </div>
  )

  if (!bleed && !bleedStyle) return content

  return (
    <div className="scroll-fade-bleed" style={{ position: 'relative', overflow: 'visible', ...bleedWrapStyle }}>
      {content}
    </div>
  )
})
