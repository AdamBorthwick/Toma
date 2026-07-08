// Horizontal pan bounds for the stage.
//
// - Mobile: the zoomed stage is wider than the viewport, so scroll left/right is a
//   real pan. We clamp scrollLeft to keep the bookshelf in view (with a small peek
//   past the left edge and Toma's head reachable on the right). Enforced in
//   App.jsx as soft-during-momentum + hard-settle on touchend/scrollend.
// - Desktop: the stage fits the container, so there's no horizontal scroll to clamp.
//   The bounds facade below returns { min: 0, max: 0 } so a common clamping
//   implementation degenerates to `scrollLeft = 0` without a special-case branch.

import { BOOKCASE_LEFT } from './layout.js'
import { MOBILE_ZOOMED_IN_PEEK_LEFT, MOBILE_ZOOMED_IN_RIGHT } from './mobileZoom.js'

function mobileShelfScrollBounds(el, scale) {
  const shelfLeft = BOOKCASE_LEFT * scale
  const min = Math.max(0, shelfLeft - MOBILE_ZOOMED_IN_PEEK_LEFT)
  const max = Math.max(min, MOBILE_ZOOMED_IN_RIGHT * scale - el.clientWidth)
  return { min, max }
}

// Facade — desktop has no horizontal scroll, so both bounds are 0. Callers can
// use one clamp implementation on both platforms.
function computeScrollBounds({ isMobile, el, scale }) {
  if (!isMobile || !el) return { min: 0, max: 0 }
  return mobileShelfScrollBounds(el, scale)
}

export { mobileShelfScrollBounds, computeScrollBounds }
