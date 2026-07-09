// Spine label sizing — stage-space only. CSS zoom on the stage scales rendered output;
// never pass viewport scale into these functions.

import { titleT } from './geometry.js'

const SPINE_VERT_PAD = 8
const SPINE_HORZ_FILL = 0.9
const SPINE_MIN_PX = 7
const SPINE_MAX_PX = 10
const SPINE_MOBILE_MIN_PX = 5
const SPINE_MOBILE_MAX_PX = 7
const SPINE_MOBILE_ZOOMED_IN_MIN_PX = 6
const SPINE_MOBILE_ZOOMED_IN_MAX_PX = 8

const SPINE_FONT = "'Manrope', sans-serif"
const SPINE_WEIGHT = 600

let probe = null

function getProbe() {
  if (!probe && typeof document !== 'undefined') {
    probe = document.createElement('span')
    probe.style.cssText = [
      'position:fixed',
      'left:-9999px',
      'top:-9999px',
      'visibility:hidden',
      'white-space:nowrap',
      'line-height:1',
      'pointer-events:none',
      'margin:0',
      'padding:0',
      'border:0',
    ].join(';')
    document.body.appendChild(probe)
  }
  return probe
}

function letterSpacingCss(fontPx) {
  return fontPx < 9 ? '0' : '0.03em'
}

function measureTextWidth(text, fontPx, lineHeight = 1) {
  const el = getProbe()
  if (!el) return text.length * fontPx * 0.62
  el.style.fontFamily = SPINE_FONT
  el.style.fontWeight = String(SPINE_WEIGHT)
  el.style.fontSize = `${fontPx}px`
  el.style.letterSpacing = letterSpacingCss(fontPx)
  el.style.lineHeight = String(lineHeight)
  el.textContent = text
  return el.getBoundingClientRect().width
}

function largestFontPx(text, availPx, minPx = SPINE_MIN_PX, maxPx = SPINE_MAX_PX) {
  if (!text || availPx <= 0) return minPx
  let lo = minPx
  let hi = maxPx
  let best = minPx
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    if (measureTextWidth(text, mid) <= availPx) {
      best = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return best
}

function truncateToFit(raw, fontPx, availPx) {
  if (!raw) return ''
  if (measureTextWidth(raw, fontPx) <= availPx) return raw
  for (let i = raw.length - 1; i >= 1; i--) {
    const candidate = `${raw.slice(0, i)}…`
    if (measureTextWidth(candidate, fontPx) <= availPx) return candidate
  }
  return '…'
}

function paintedOverflow(axis, container, label) {
  if (!container || !label) return false
  const cr = container.getBoundingClientRect()
  const lr = label.getBoundingClientRect()
  if (cr.height < 1 || cr.width < 1) return false
  if (axis === 'vertical') {
    return lr.height > cr.height + 0.5 || lr.width > cr.width + 0.5
  }
  return lr.width > cr.width * SPINE_HORZ_FILL + 0.5
}

function shortenPainted(text) {
  if (!text || text === '…') return '…'
  if (text.endsWith('…')) {
    const core = text.slice(0, -1)
    return core.length <= 1 ? '…' : `${core.slice(0, -1)}…`
  }
  return text.length <= 1 ? '…' : `${text.slice(0, -1)}…`
}

function buildLayout(title, { axis, dims, pad = SPINE_VERT_PAD, fillRatio = SPINE_HORZ_FILL, minPx = SPINE_MIN_PX, maxPx = SPINE_MAX_PX } = {}) {
  const raw = (title ?? '').trim()
  if (!dims?.w || !dims?.h) {
    return { fontEm: minPx / 100, fontPx: minPx, text: '', textPx: 0, emBase: dims?.h ?? 100, fitAvailPx: 0 }
  }

  const emBase = dims.h
  if (!raw) {
    return { fontEm: minPx / emBase, fontPx: minPx, text: '', textPx: 0, emBase, fitAvailPx: 0 }
  }

  const availPx = axis === 'vertical'
    ? Math.max(1, dims.h - pad)
    : Math.max(1, dims.w * fillRatio)

  let fontPx = largestFontPx(raw, availPx, minPx, maxPx)
  let text = raw
  if (measureTextWidth(text, fontPx) > availPx) {
    text = truncateToFit(raw, fontPx, availPx)
  }
  if (measureTextWidth(text, fontPx) > availPx) {
    fontPx = minPx
    text = truncateToFit(raw, fontPx, availPx)
  }

  const textPx = measureTextWidth(text, fontPx)
  return { fontEm: fontPx / emBase, fontPx, text, textPx, emBase, fitAvailPx: availPx }
}

function refitSpineLabelFromPainted(title, opts, container, label, seed) {
  const { axis, dims } = opts
  const raw = (title ?? '').trim()
  if (!raw || !container || !label || !dims?.w || !dims?.h) return seed

  let fontPx = seed.fontPx
  let text = seed.text
  const lineHeight = axis === 'horizontal' ? 1.15 : 1

  const apply = () => {
    label.style.fontFamily = SPINE_FONT
    label.style.fontWeight = String(SPINE_WEIGHT)
    label.style.fontSize = `${fontPx}px`
    label.style.letterSpacing = letterSpacingCss(fontPx)
    label.style.lineHeight = String(lineHeight)
    label.textContent = text
  }

  apply()

  let guard = 0
  while (paintedOverflow(axis, container, label) && guard++ < 120) {
    const shortened = shortenPainted(text)
    if (shortened !== text) {
      text = shortened
      apply()
      continue
    }
    const minPx = opts.minPx ?? SPINE_MIN_PX
    if (fontPx > minPx) {
      fontPx--
      text = raw
      apply()
      continue
    }
    break
  }

  const textPx = measureTextWidth(text, fontPx, lineHeight)
  return {
    fontEm: fontPx / dims.h,
    fontPx,
    text,
    textPx,
    emBase: dims.h,
    fitAvailPx: axis === 'vertical' ? 0 : dims.w * SPINE_HORZ_FILL,
  }
}

function getSpineDims({ axis = 'vertical', title, slotW, shelfH, w, h } = {}) {
  const t = titleT(title)
  if (axis === 'vertical') {
    return {
      w: w ?? slotW,
      h: h ?? Math.round(shelfH * (0.72 + t * 0.28)),
    }
  }
  const stackW = w ?? slotW
  return {
    w: w != null && w > 0 ? w : Math.round(stackW * (0.8 + t * 0.2)),
    h: h ?? Math.round(20 + t * 16),
  }
}

function spineFontCaps(isMobile = false, zoomedIn = false) {
  if (!isMobile) {
    return { minPx: SPINE_MIN_PX, maxPx: SPINE_MAX_PX }
  }
  if (zoomedIn) {
    return { minPx: SPINE_MOBILE_ZOOMED_IN_MIN_PX, maxPx: SPINE_MOBILE_ZOOMED_IN_MAX_PX }
  }
  return { minPx: SPINE_MOBILE_MIN_PX, maxPx: SPINE_MOBILE_MAX_PX }
}

function layoutSpineLabel(title, opts = {}) {
  return buildLayout(title, opts)
}

function spineLetterSpacing(fontEm, emBase) {
  return fontEm * emBase < 9 ? '0' : '0.03em'
}

export {
  SPINE_VERT_PAD,
  SPINE_HORZ_FILL,
  SPINE_MIN_PX,
  SPINE_MAX_PX,
  getSpineDims,
  layoutSpineLabel,
  refitSpineLabelFromPainted,
  spineFontCaps,
  spineLetterSpacing,
  measureTextWidth,
}
