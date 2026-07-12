import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Button, DialogCard, DialogTitle, DialogDescription, DialogActions } from './ui/index.js'
import { Z } from '../lib/zIndex.js'

// z-index above every panel/dialog but below the toast layer. The onboarding form
// itself sits at Z.onboarding (9999) but by design the tour only starts AFTER
// onboarding submits and unmounts, so we can safely share that layer.
const TOUR_Z = Z.onboarding

const CARD_WIDTH = 320
const CARD_MARGIN = 16      // gap between card and target
const CARD_EDGE_INSET = 12  // don't let the card touch the viewport edge

/**
 * Guided-tour overlay. Shows a full-viewport spotlight with a rounded cut-out around
 * the current step's target element, plus a tooltip card with title/body/actions.
 * Step 2 (`kind: 'demo'`) skips the spotlight and shows a self-contained animated
 * demo of a book sliding between two shelf slots.
 *
 * Props:
 *   step        current 1-indexed step, or null when the tour is inactive
 *   steps       array of step definitions (see App.jsx for shape)
 *   isMobile    passed through so card can dock differently
 *   onNext      advance one step
 *   onFinish    close the tour and persist the "seen it" flag
 */
export function TourOverlay({ step, steps, isMobile = false, onNext, onFinish }) {
  const [rect, setRect] = useState(null)  // target rect in viewport coords, or null
  const rafRef = useRef(null)

  // 1-indexed → array index. `step === null` means "tour inactive, don't render".
  const stepDef = step != null ? steps[step - 1] : null
  const targetKey = stepDef?.target ?? null
  const kind = stepDef?.kind ?? 'spotlight'

  // Measure target rect on step change + on scroll/resize while active. RAF-debounced
  // so a burst of scroll events collapses to at most one re-measurement per frame.
  useLayoutEffect(() => {
    if (!stepDef || kind !== 'spotlight' || !targetKey) { setRect(null); return }

    function measure() {
      rafRef.current = null
      const el = document.querySelector(`[data-tour-target="${targetKey}"]`)
      if (!el) { setRect(null); return }
      const r = el.getBoundingClientRect()
      setRect({ left: r.left, top: r.top, width: r.width, height: r.height })
    }
    function schedule() {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(measure)
    }

    // Kick off an initial measurement after a frame — some targets (edit-mode
    // buttons) are still animating in when the tour step opens.
    schedule()
    // Second attempt after a short delay for buttons whose parent slides in.
    const t = setTimeout(schedule, 320)

    // Capture:true so nested scroll containers (scrollRef) also trigger us.
    window.addEventListener('resize', schedule, { passive: true })
    window.addEventListener('scroll', schedule, { capture: true, passive: true })
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('scroll', schedule, { capture: true })
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        // Clear the ref too — otherwise StrictMode's second effect setup sees the
        // stale (cancelled) id, treats a RAF as already scheduled, and never
        // actually measures the target. The rect stays null → no spotlight.
        rafRef.current = null
      }
    }
  }, [stepDef, targetKey, kind])

  if (!stepDef) return null

  const isLast = step >= steps.length
  const primaryLabel = isLast ? 'Got it' : 'Next'

  // ── Card placement ─────────────────────────────────────────────────────────
  // Mobile: always docked bottom-center. Desktop: flip above/below the target based
  // on which side has more room. Demo step centers regardless (no target).
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  let cardStyle
  if (kind === 'demo' || !rect) {
    // Centered card — used for demo step or before a target is measured.
    cardStyle = {
      position: 'fixed',
      left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: TOUR_Z + 1,
    }
  } else if (isMobile) {
    // Dock at the bottom so the card doesn't cover the top-left zoom button or
    // the header toggle. The spotlight already indicates the target location.
    const bottomFromTop = vh - CARD_EDGE_INSET
    cardStyle = {
      position: 'fixed',
      left: '50%',
      bottom: CARD_EDGE_INSET,
      transform: 'translateX(-50%)',
      zIndex: TOUR_Z + 1,
    }
    void bottomFromTop
  } else {
    // Desktop: choose above or below whichever has more headroom, clamped
    // horizontally near the target's centre-x.
    const spaceAbove = rect.top
    const spaceBelow = vh - (rect.top + rect.height)
    const cardHeightEst = 200  // rough — enough to pick a side
    const above = spaceAbove > spaceBelow && spaceAbove > cardHeightEst + CARD_MARGIN
    const top = above
      ? Math.max(CARD_EDGE_INSET, rect.top - CARD_MARGIN - cardHeightEst)
      : Math.min(vh - cardHeightEst - CARD_EDGE_INSET, rect.top + rect.height + CARD_MARGIN)
    let left = rect.left + rect.width / 2 - CARD_WIDTH / 2
    left = Math.max(CARD_EDGE_INSET, Math.min(vw - CARD_WIDTH - CARD_EDGE_INSET, left))
    cardStyle = {
      position: 'fixed', left, top,
      zIndex: TOUR_Z + 1,
    }
  }

  return (
    <>
      {/* Backdrop + spotlight. Uses SVG with an evenodd cutout so a single element
          handles both the darkening and the target hole. `pointer-events: none` on
          the hole via mask isn't reliable across engines, so we instead render a
          transparent inner rect over the target and let the outer overlay swallow
          all pointer events outside it. */}
      {kind === 'spotlight'
        ? <SpotlightBackdrop rect={rect} />
        : <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: TOUR_Z, pointerEvents: 'auto' }} />}

      {/* Tooltip / demo card */}
      <div style={cardStyle}>
        <DialogCard width={CARD_WIDTH}>
          {kind === 'demo' && <BookMoveDemo />}
          <DialogTitle>{stepDef.title}</DialogTitle>
          <DialogDescription>{stepDef.body}</DialogDescription>
          <DialogActions>
            <Button variant="ghost" size="dialog" onClick={onFinish} style={{ flex: '0 0 auto', padding: '10px 14px' }}>
              Skip tour
            </Button>
            <div style={{ flex: 1 }} />
            <Button variant="primary" size="dialog" onClick={isLast ? onFinish : onNext} style={{ flex: '0 0 auto', padding: '10px 22px' }}>
              {primaryLabel}
            </Button>
          </DialogActions>
        </DialogCard>
      </div>
    </>
  )
}

// SVG spotlight — a viewport-sized dark rect with a rounded evenodd cut-out at the
// target rect. The whole SVG has pointer-events: auto so clicks OUTSIDE the target
// are absorbed by the tour; the hole area is left as transparent SVG so mouse
// events pass through to the real UI element (the header toggle, etc.).
function SpotlightBackdrop({ rect }) {
  const [vw, vh] = useViewportSize()
  if (!rect) {
    return <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: TOUR_Z, pointerEvents: 'auto' }} />
  }
  const pad = 10
  const r = 14
  const x = Math.max(0, rect.left - pad)
  const y = Math.max(0, rect.top - pad)
  const w = Math.min(vw, rect.width + pad * 2)
  const h = Math.min(vh, rect.height + pad * 2)
  // Build the evenodd path: outer rect + inner rounded rect (reverse winding
  // handled by SVG's fill-rule: evenodd, so both drawn same direction is fine).
  const outer = `M0 0 H${vw} V${vh} H0 Z`
  const inner = roundedRectPath(x, y, w, h, r)
  return (
    <>
      <svg
        width={vw} height={vh}
        style={{ position: 'fixed', inset: 0, zIndex: TOUR_Z, pointerEvents: 'none' }}
        aria-hidden
      >
        <path d={`${outer} ${inner}`} fillRule="evenodd" fill="rgba(0,0,0,0.62)" style={{ pointerEvents: 'auto' }} />
        {/* Highlight ring around the hole */}
        <rect x={x} y={y} width={w} height={h} rx={r} ry={r}
          fill="none" stroke="rgba(114,255,93,0.85)" strokeWidth={3}
          style={{ pointerEvents: 'none', filter: 'drop-shadow(0 0 8px rgba(114,255,93,0.6))' }} />
      </svg>
    </>
  )
}

// Rounded-rect SVG subpath. Points are drawn in the same winding as the outer rect
// so the evenodd rule carves them out.
function roundedRectPath(x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2))
  return `M${x + rr} ${y}
    H${x + w - rr}
    A${rr} ${rr} 0 0 1 ${x + w} ${y + rr}
    V${y + h - rr}
    A${rr} ${rr} 0 0 1 ${x + w - rr} ${y + h}
    H${x + rr}
    A${rr} ${rr} 0 0 1 ${x} ${y + h - rr}
    V${y + rr}
    A${rr} ${rr} 0 0 1 ${x + rr} ${y}
    Z`.replace(/\s+/g, ' ')
}

function useViewportSize() {
  const [size, setSize] = useState(() => (typeof window === 'undefined'
    ? [1200, 800]
    : [window.innerWidth, window.innerHeight]))
  useEffect(() => {
    function onResize() { setSize([window.innerWidth, window.innerHeight]) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

// ─── Book-move demo (step 2) ─────────────────────────────────────────────────
// Purely decorative: a mini-shelf with three slots and a book that slides from
// slot 0 to slot 2 on a loop, with a hand icon riding above it. No dependency
// on the real shelf/arm state.
function BookMoveDemo() {
  return (
    <div style={{ margin: '4px 0 18px', display: 'flex', justifyContent: 'center' }}>
      <style>{demoKeyframes}</style>
      <div style={{
        position: 'relative',
        width: 260, height: 96,
        borderRadius: 10,
        background: 'linear-gradient(180deg, #A4501D 0%, #EA8B50 12%)',
        overflow: 'hidden',
        boxShadow: 'inset 0 -6px 8px rgba(0,0,0,0.18)',
      }}>
        {/* Row of three faint slot outlines to hint at the destination */}
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            position: 'absolute',
            left: 20 + i * 76,
            bottom: 6,
            width: 44, height: 66,
            border: '1.5px dashed rgba(0,0,0,0.15)',
            borderRadius: 3,
          }} />
        ))}
        {/* The moving book */}
        <div style={{
          position: 'absolute',
          left: 20, bottom: 6,
          width: 44, height: 66,
          background: '#254CA4',
          borderRadius: '3px 3px 1px 1px',
          boxShadow: 'inset -2px 0 5px rgba(0,0,0,0.22), 0 6px 12px rgba(0,0,0,0.28)',
          animation: 'tourBookSlide 2.8s ease-in-out infinite',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            writingMode: 'vertical-rl', fontFamily: "'Manrope', sans-serif",
            fontWeight: 700, fontSize: 9, color: '#FDF8EF', letterSpacing: '0.5px',
          }}>Sample</span>
        </div>
        {/* The hand cursor above the book */}
        <div style={{
          position: 'absolute',
          left: 44, bottom: 66,
          width: 22, height: 22,
          animation: 'tourHandSlide 2.8s ease-in-out infinite',
          pointerEvents: 'none',
        }}>
          <svg viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="7" fill="#72FF5D" stroke="#3BD424" strokeWidth="1.5" />
            <circle cx="11" cy="11" r="2" fill="#1C1C2E" />
          </svg>
        </div>
      </div>
    </div>
  )
}

const demoKeyframes = `
@keyframes tourBookSlide {
  0%, 12%   { transform: translate(0, 0); }
  20%       { transform: translate(0, -14px); }
  50%       { transform: translate(152px, -14px); }
  60%, 100% { transform: translate(152px, 0); }
}
@keyframes tourHandSlide {
  0%, 12%   { transform: translate(0, 0); opacity: 1; }
  20%       { transform: translate(0, -14px); }
  50%       { transform: translate(152px, -14px); }
  60%, 100% { transform: translate(152px, 0); opacity: 1; }
}
`
