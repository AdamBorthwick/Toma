// Stage-zoom math. Both platforms apply the returned scale to the same DOM node
// (`stageRef.style.zoom`); what differs is how the number is chosen.
//
// - Mobile: two-state toggle between a fit-the-whole-bookcase view and a one-shelf
//   detail view, animated via animateMobileScale (see App.jsx). The user drives it
//   with the magnifier button or auto-zooms on drag start.
// - Desktop: scale is a pure function of container width — no user control, no
//   detail mode, no animation. Viewport resize is the only variable.
//
// The `computeStageScale` facade is what App.jsx should call. It picks the right
// formula based on `isMobile` so the two-platform if/else lives here, not at the
// call site.

import { MOBILE_ZOOMED_OUT_FIT, MOBILE_ZOOMED_IN_FIT } from './mobileZoom.js'

function computeMobileScale(zoomedIn, viewportW) {
  const fitW = zoomedIn ? MOBILE_ZOOMED_IN_FIT : MOBILE_ZOOMED_OUT_FIT
  const base = viewportW / fitW
  return Math.max(0.4, Math.min(3.0, zoomedIn ? base * 1.5 : base))
}

function computeDesktopScale(containerW) {
  return Math.max(0.45, Math.min(2.5, containerW / 1080))
}

// Facade — pick the right formula for the platform. Call sites become one line.
function computeStageScale({ isMobile, zoomedIn, viewportW, containerW }) {
  return isMobile ? computeMobileScale(zoomedIn, viewportW) : computeDesktopScale(containerW)
}

export { computeMobileScale, computeDesktopScale, computeStageScale }
