import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Button, DialogCard, DialogTitle, DialogDescription, DialogActions } from './ui/index.js'
import { Z } from '../lib/zIndex.js'
import { computeFingerPaths } from '../lib/geometry.js'

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
      // Capture the target's own corner radius so the spotlight cutout matches
      // it exactly — otherwise a hardcoded r=14 looks inconsistent against
      // buttons rounded at 11 (edit-mode toggle) or 16 (customization row).
      const cs = window.getComputedStyle(el)
      const rawR = parseFloat(cs.borderTopLeftRadius) || 0
      setRect({ left: r.left, top: r.top, width: r.width, height: r.height, radius: rawR })
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
  } else {
    // Pick whichever side of the target has the most free space so the card
    // never covers the button it's pointing at. Estimated card height is rough
    // — good enough to compare sides. Desktop and mobile share this logic; on
    // mobile the target's on-screen size just means "below" wins by default
    // when the target is at the top, and "above" wins for bottom-docked bars.
    const cardHeightEst = 220
    const spaceAbove = rect.top - CARD_MARGIN - CARD_EDGE_INSET
    const spaceBelow = vh - (rect.top + rect.height) - CARD_MARGIN - CARD_EDGE_INSET
    const spaceLeft  = rect.left - CARD_MARGIN - CARD_EDGE_INSET
    const spaceRight = vw - (rect.left + rect.width) - CARD_MARGIN - CARD_EDGE_INSET
    // A side is viable only if the card actually fits there. Prefer above/below
    // when they fit — they read as more natural for a tooltip; fall back to
    // left/right for tall targets like the desktop customization column.
    const fitsAbove = spaceAbove >= cardHeightEst
    const fitsBelow = spaceBelow >= cardHeightEst
    const fitsLeft  = spaceLeft  >= CARD_WIDTH
    const fitsRight = spaceRight >= CARD_WIDTH
    let side
    if (fitsAbove || fitsBelow) side = spaceAbove > spaceBelow && fitsAbove ? 'above' : 'below'
    else if (fitsLeft || fitsRight) side = spaceLeft > spaceRight && fitsLeft ? 'left' : 'right'
    else side = spaceAbove >= spaceBelow ? 'above' : 'below'  // best-effort

    let top, bottom, left
    if (side === 'above') {
      // Anchor by `bottom` (distance up from the target's top edge) instead of
      // computing `top` from an estimated card height. Steps whose body copy is a
      // different length render at different actual heights, so anchoring by top
      // with a fixed height guess left inconsistent gaps above different targets
      // (e.g. the edit-mode-toggle step sat closer to its target than the
      // customization step). Anchoring by bottom keeps the gap-to-target — and
      // since both targets dock at the same screen height, the gap-to-screen-bottom
      // too — identical regardless of actual card height.
      bottom = Math.max(CARD_EDGE_INSET, vh - rect.top + CARD_MARGIN)
      left = rect.left + rect.width / 2 - CARD_WIDTH / 2
      left = Math.max(CARD_EDGE_INSET, Math.min(vw - CARD_WIDTH - CARD_EDGE_INSET, left))
    } else if (side === 'below') {
      top = Math.min(vh - cardHeightEst - CARD_EDGE_INSET, rect.top + rect.height + CARD_MARGIN)
      left = rect.left + rect.width / 2 - CARD_WIDTH / 2
      left = Math.max(CARD_EDGE_INSET, Math.min(vw - CARD_WIDTH - CARD_EDGE_INSET, left))
    } else {
      left = side === 'left'
        ? Math.max(CARD_EDGE_INSET, rect.left - CARD_MARGIN - CARD_WIDTH)
        : Math.min(vw - CARD_WIDTH - CARD_EDGE_INSET, rect.left + rect.width + CARD_MARGIN)
      top = rect.top + rect.height / 2 - cardHeightEst / 2
      top = Math.max(CARD_EDGE_INSET, Math.min(vh - cardHeightEst - CARD_EDGE_INSET, top))
    }
    cardStyle = {
      position: 'fixed', left,
      ...(bottom != null ? { bottom } : { top }),
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
  // Cutout radius follows the target's own border-radius (plus the pad) so the
  // spotlight matches whatever the highlighted button uses — pill toggle (11),
  // customization tile (16), etc. Fall back to a modest default if the target
  // has no radius or wasn't measurable.
  const targetR = Number.isFinite(rect.radius) ? rect.radius : 12
  const r = targetR > 0 ? targetR + pad : 12
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

// Demo hand's grip — reuses the real finger-path generator from lib/geometry.js
// (the same function that drives the actual grab hand in App.jsx) so the open
// and gripping states are the exact same shapes, just pre-computed once since
// this demo doesn't have a live gripExtend value to animate against.
const DEMO_HAND_COLOR = '#72FF5D'   // tour's own accent green — matches the spotlight ring
const DEMO_FINGERS_OPEN = computeFingerPaths(0)
const DEMO_FINGERS_GRIP = computeFingerPaths(1)

// ─── Book-move demo (step 2) ─────────────────────────────────────────────────
// Purely decorative: a mini-shelf with three slots and a book that slides from
// slot 0 to slot 2 on a loop, with the real grab-hand asset attached to its right
// edge (no dependency on the real shelf/arm *state* — just the same shapes).
// Book proportions match the real shelf: SLOT_W=37, SHELF_H=168, ~1:3.9 aspect
// ratio (see lib/layout.js).
function BookMoveDemo() {
  return (
    <div style={{ margin: '4px 0 18px', display: 'flex', justifyContent: 'center' }}>
      <style>{demoKeyframes}</style>
      <div style={{
        position: 'relative',
        width: 260, height: 170,
        borderRadius: 10,
        background: 'linear-gradient(180deg, #A4501D 0%, #EA8B50 12%)',
        overflow: 'hidden',
        boxShadow: 'inset 0 -6px 8px rgba(0,0,0,0.18)',
      }}>
        {/* Row of three faint slot outlines to hint at the destination */}
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            position: 'absolute',
            left: DEMO_BOOK_LEFT + i * 70,
            bottom: DEMO_BOOK_BOTTOM,
            width: DEMO_BOOK_W, height: DEMO_BOOK_H,
            border: '1.5px dashed rgba(0,0,0,0.15)',
            borderRadius: '3px 3px 2px 2px',
          }} />
        ))}
        {/* The moving book — matches PlacedVerticalBook proportions and styling */}
        <div style={{
          position: 'absolute',
          left: DEMO_BOOK_LEFT, bottom: DEMO_BOOK_BOTTOM,
          width: DEMO_BOOK_W, height: DEMO_BOOK_H,
          background: '#254CA4',
          borderRadius: '3px 3px 2px 2px',
          boxShadow: 'inset -3px 0 6px rgba(0,0,0,0.18), 0 2px 3px rgba(0,0,0,0.12)',
          animation: 'tourBookSlide 2.8s ease-in-out infinite',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            writingMode: 'vertical-rl', fontFamily: "'Manrope', sans-serif",
            fontWeight: 700, fontSize: 10, color: '#FDF8EF', letterSpacing: '0.5px',
          }}>Sample</span>
        </div>
        <DemoHand />
      </div>
    </div>
  )
}

// Book geometry, shared with the placement math below so the hand always locks
// onto the book's actual right edge / vertical center rather than duplicated
// magic numbers drifting apart from it.
const DEMO_BOOK_LEFT = 45, DEMO_BOOK_BOTTOM = 8, DEMO_BOOK_W = 30, DEMO_BOOK_H = 118
const DEMO_BOOK_RIGHT = DEMO_BOOK_LEFT + DEMO_BOOK_W
const DEMO_BOOK_CENTER_Y = DEMO_BOOK_BOTTOM + DEMO_BOOK_H / 2

// Grabbing hand attached to the book's right edge, vertically centered on it —
// same palm/thumb/finger shapes as the real arm asset in App.jsx (path literals
// copied verbatim from the hand group there, fingers from the shared
// computeFingerPaths helper, rescaled via viewBox), with the real asset's
// forearm reaching in from the right rather than from above, matching how the
// real arm grabs a book by its side rather than its top.
const DEMO_HAND_W = 70, DEMO_HAND_H = 54
const DEMO_HAND_LEFT = DEMO_BOOK_RIGHT - 16   // fingers overlap the book edge for a gripped look
const DEMO_HAND_BOTTOM = DEMO_BOOK_CENTER_Y - DEMO_HAND_H / 2
const DEMO_FOREARM_LEFT = DEMO_HAND_LEFT + 40  // reaches well under the palm so the two visibly overlap
const DEMO_FOREARM_H = 24
const DEMO_FOREARM_BOTTOM = DEMO_BOOK_CENTER_Y - DEMO_FOREARM_H / 2
const DEMO_FOREARM_OVERSHOOT = 40  // extends past the shelf's right edge, clipped by its overflow:hidden

function DemoHand() {
  return (
    <>
      {/* Forearm — a straight rounded bar reaching in from off-shelf on the right,
          echoing the real upper-arm/forearm strokes drawn in App.jsx. Slides with
          the hand and book as one rigid unit via the shared tourHandSlide keyframes. */}
      <div style={{
        position: 'absolute',
        left: DEMO_FOREARM_LEFT, bottom: DEMO_FOREARM_BOTTOM,
        width: 260 + DEMO_FOREARM_OVERSHOOT - DEMO_FOREARM_LEFT, height: DEMO_FOREARM_H,
        background: DEMO_HAND_COLOR,
        borderRadius: DEMO_FOREARM_H / 2,
        animation: 'tourHandSlide 2.8s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        left: DEMO_HAND_LEFT, bottom: DEMO_HAND_BOTTOM,
        width: DEMO_HAND_W, height: DEMO_HAND_H,
        animation: 'tourHandSlide 2.8s ease-in-out infinite',
        pointerEvents: 'none',
      }}>
        <svg viewBox="-10 -60 150 115" width={DEMO_HAND_W} height={DEMO_HAND_H} style={{ overflow: 'visible' }}>
          <path d="M86 -40 C 72 -55, 44 -53, 33 -45" stroke={DEMO_HAND_COLOR} strokeWidth="23" strokeLinecap="round" fill="none" />
          <circle cx="92" cy="0" r="44" fill={DEMO_HAND_COLOR} />
          <path d={DEMO_FINGERS_OPEN.index} stroke={DEMO_HAND_COLOR} strokeWidth="23" strokeLinecap="round" fill="none" />
          <g style={{ animation: 'tourGripOpen 2.8s ease-in-out infinite' }}>
            <path d={DEMO_FINGERS_OPEN.middle} stroke={DEMO_HAND_COLOR} strokeWidth="23" strokeLinecap="round" fill="none" />
            <path d={DEMO_FINGERS_OPEN.ring}   stroke={DEMO_HAND_COLOR} strokeWidth="23" strokeLinecap="round" fill="none" />
            <path d={DEMO_FINGERS_OPEN.pinky}  stroke={DEMO_HAND_COLOR} strokeWidth="23" strokeLinecap="round" fill="none" />
          </g>
          <g style={{ animation: 'tourGripClosed 2.8s ease-in-out infinite' }}>
            <path d={DEMO_FINGERS_GRIP.middle} stroke={DEMO_HAND_COLOR} strokeWidth="23" strokeLinecap="round" fill="none" />
            <path d={DEMO_FINGERS_GRIP.ring}   stroke={DEMO_HAND_COLOR} strokeWidth="23" strokeLinecap="round" fill="none" />
            <path d={DEMO_FINGERS_GRIP.pinky}  stroke={DEMO_HAND_COLOR} strokeWidth="23" strokeLinecap="round" fill="none" />
          </g>
        </svg>
      </div>
    </>
  )
}

const demoKeyframes = `
@keyframes tourBookSlide {
  0%, 12%   { transform: translate(0, 0); }
  20%       { transform: translate(0, -14px); }
  50%       { transform: translate(140px, -14px); }
  60%, 100% { transform: translate(140px, 0); }
}
@keyframes tourHandSlide {
  0%, 12%   { transform: translate(0, 0); opacity: 1; }
  20%       { transform: translate(0, -14px); }
  50%       { transform: translate(140px, -14px); }
  60%, 100% { transform: translate(140px, 0); opacity: 1; }
}
@keyframes tourGripOpen {
  0%, 8%    { opacity: 1; }
  16%, 54%  { opacity: 0; }
  62%, 100% { opacity: 1; }
}
@keyframes tourGripClosed {
  0%, 8%    { opacity: 0; }
  16%, 54%  { opacity: 1; }
  62%, 100% { opacity: 0; }
}
`
