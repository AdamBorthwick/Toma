import { NUM_SLOTS, MOBILE_ZOOMED_OUT_FIT, MOBILE_ZOOMED_IN_FIT, BOOKCASE_LEFT, MOBILE_ZOOMED_IN_PEEK_LEFT, MOBILE_ZOOMED_IN_RIGHT } from './constants.js'
import { DragGhost } from '../components/shelfRows.jsx'

function mobileShelfScrollBounds(el, scale) {
  const shelfLeft = BOOKCASE_LEFT * scale
  const min = Math.max(0, shelfLeft - MOBILE_ZOOMED_IN_PEEK_LEFT)
  const max = Math.max(min, MOBILE_ZOOMED_IN_RIGHT * scale - el.clientWidth)
  return { min, max }
}

function computeMobileScale(zoomedIn, viewportW) {
  const fitW = zoomedIn ? MOBILE_ZOOMED_IN_FIT : MOBILE_ZOOMED_OUT_FIT
  const base = viewportW / fitW
  return Math.max(0.4, Math.min(3.0, zoomedIn ? base * 1.5 : base))
}
const GHOST_LIFT = 48  // px the drag ghost floats above the finger on touch (thumb hides it otherwise);
                       // drop detection uses the ghost position, so highlight matches what you see

// Set the ghost's position via a single translate3d that also folds in the content-centering
// offsets (stored on the node's data attrs by DragGhost). One transform property is more
// reliable across engines than mixing left/top with a separate transform — iOS Safari
// occasionally desyncs the two when a CSS-zoom subtree exists elsewhere on the page.
function setGhostPos(el, x, y) {
  if (!el) return
  // Persist the raw finger position on the node so the ref callback can re-apply after
  // a React re-render (which resets style.transform when it swaps content).
  el.dataset.x = x
  el.dataset.y = y
  const tx = parseFloat(el.dataset.tx || '0') + x
  const ty = parseFloat(el.dataset.ty || '0') + y
  el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`
}


function slotsOverlap(items, startSlot, slotWidth, excludeId = null) {
  const end = startSlot + slotWidth
  return items.some(it =>
    it.id !== excludeId &&
    startSlot < it.startSlot + it.slotWidth &&
    end > it.startSlot
  )
}

// Returns the contiguous free-slot region that contains `centre` (or length 0 if centre is occupied).
function freeZoneAt(items, centre, excl) {
  if (centre < 0 || centre >= NUM_SLOTS || slotsOverlap(items, centre, 1, excl)) return { start: centre, length: 0 }
  let left = centre
  while (left > 0 && !slotsOverlap(items, left - 1, 1, excl)) left--
  let right = centre
  while (right < NUM_SLOTS - 1 && !slotsOverlap(items, right + 1, 1, excl)) right++
  return { start: left, length: right - left + 1 }
}

// Finds the best free zone for placing an `sw`-wide item near `centre`.
// If cursor is in a free zone ≥ sw → use it (enables edge-snapping within the zone).
// If cursor is on an occupied slot → scan to both edges of the occupied group and
// check the adjacent free zones, returning the closer one that fits.
// If cursor is in a gap smaller than sw → return length 0 (no snapping).
function findFreeZone(items, centre, sw, excl) {
  const here = freeZoneAt(items, centre, excl)
  if (here.length >= sw) return here
  if (slotsOverlap(items, centre, 1, excl)) {
    let l = centre - 1
    while (l >= 0 && slotsOverlap(items, l, 1, excl)) l--
    let r = centre + 1
    while (r < NUM_SLOTS && slotsOverlap(items, r, 1, excl)) r++
    const lz = l >= 0 ? freeZoneAt(items, l, excl) : null
    const rz = r < NUM_SLOTS ? freeZoneAt(items, r, excl) : null
    const lOk = lz && lz.length >= sw
    const rOk = rz && rz.length >= sw
    if (lOk && rOk) return (centre - l) <= (r - centre) ? lz : rz
    if (lOk) return lz
    if (rOk) return rz
  }
  return { start: centre, length: 0 }
}


// ─── Arm math ─────────────────────────────────────────────────────────────────

// retractMode 0→1: unclamps tx upper bound and slides shoulder right so the
// upper arm flattens to horizontal, letting the arm clear past the shelf edge.
// returnProgress 0→1: during 'returning', sweeps elbow leftward into the shelf so the
// whole arm disappears behind it (elbow moves 760 → 300).
function computeArm(target, retractMode = 0, returnProgress = 0, maxElbowY = 9999, minTx = 270, maxTx = 786) {
  const rawTx = target ? target.x : 397
  const tx = retractMode > 0
    ? Math.max(minTx, rawTx)
    : Math.max(minTx, Math.min(maxTx, rawTx))
  const ty = target ? target.y : 500
  const elbowX = 910 - returnProgress * 460  // 910 → 450 as arm sweeps back into shelf
  const elbowY = Math.max(214, Math.min(maxElbowY, ty))
  const L = 98
  // Shoulder slides from behind-shelf position toward elbow, making arm parallel
  const Sx = (elbowX - L) + retractMode * (850 - (elbowX - L))
  const Sy = Math.max(202, elbowY - L) + retractMode * (elbowY - Math.max(202, elbowY - L))
  const handTipX = tx + 20
  const faX1 = handTipX + 92
  const handY = elbowY + 24
  return {
    uaPath: `M ${Sx} ${Sy} L ${elbowX} ${elbowY}`,
    faPath: `M ${faX1} ${handY} L ${elbowX} ${elbowY}`,
    handTransform: `translate(${handTipX} ${handY})`,
    elbowX, elbowY, Sx, Sy,
    handTipX, handY,
  }
}

// Pointer stays fixed (keeps pointing); middle extends most, ring less, pinky least
function computeFingerPaths(extend) {
  const r = n => Math.round(n)
  return {
    index:  `M69 -25 L 2 -24`,                          // pointer — never extends
    middle: `M60 -2  L ${r(37 - extend * 35)} -2`,      // longest
    ring:   `M64 18  L ${r(41 - extend * 28)} 18`,      // second
    pinky:  `M86 36  L ${r(45 - extend * 18)} 36`,      // shortest extension
  }
}


function titleT(title) {
  return Math.min(1, (title ?? '').length / 36)
}


export { mobileShelfScrollBounds, computeMobileScale, GHOST_LIFT, setGhostPos, slotsOverlap, freeZoneAt, findFreeZone, computeArm, computeFingerPaths, titleT }
