import { useId, useMemo } from 'react'
import { getHatColors } from '../data/monster.jsx'
import capSvg from '../assets/hats/cap.svg?raw'
import beanieSvg from '../assets/hats/beanie.svg?raw'
import bucketSvg from '../assets/hats/bucket.svg?raw'
import strawSvg from '../assets/hats/straw.svg?raw'
import topSvg from '../assets/hats/top.svg?raw'
import crownSvg from '../assets/hats/crown.svg?raw'
import headbandSvg from '../assets/hats/svg/Headband.svg?raw'
import spikySvg from '../assets/hats/svg/Spiky Hair.svg?raw'

// Face layout box — used for on-stage positioning (hats overflow above via SVG overflow).
const TOMA_FACE_VIEWBOX = '0 0 325 331'
// Expanded box for contexts that need explicit hat headroom in the viewBox.
const TOMA_HEAD_VIEWBOX = '0 -44 325 375'

// Native SVG size → scaled to sit on Toma's head (center x≈162).
// anchorY: where the hat brim/base meets the forehead.
const HAT_SPECS = {
  cap:      { raw: capSvg,      w: 142, h: 110, targetW: 148, anchorY: 54 },
  beanie:   { raw: beanieSvg,   w: 136, h: 136, targetW: 215, targetH: 188, anchorY: 56 },
  bucket:   { raw: bucketSvg,   w: 148, h:  99, targetW: 188, anchorY: 46 },
  straw:    { raw: strawSvg,    w: 303, h: 128, targetW: 260, anchorY: 46 },
  top:      { raw: topSvg,      w: 228, h: 148, targetW: 258, anchorY: 26 },
  crown:    { raw: crownSvg,    w: 136, h: 102, targetW: 136, anchorY: 54 },
  headband: { raw: headbandSvg, w: 325, h: 331, faceAligned: true },
  spiky:    { raw: spikySvg,    w: 343, h: 434, targetW: 336, targetH: 402, anchorY: 40, anchorLocalY: 128 },
}

const COLOR_MAPS = {
  cap: (primary, accent) => ({
    '#67B7FF': primary,
    '#59A7ED': accent,
  }),
  beanie: (primary, accent) => ({
    '#C72A2A': primary,
    '#BA2727': accent,
  }),
  bucket: (primary, accent) => ({
    '#67B7FF': primary,
    '#59A7ED': primary,
    '#5EA2E0': accent,
  }),
  straw: (_primary, _accent, band, bandAccent) => ({
    '#FFD177': _primary,
    '#F2C979': _primary,
    '#C72A2A': band,
    '#A21111': bandAccent,
  }),
  top: (_primary, _accent, band) => ({
    '#C72A2A': band,
  }),
  crown: (primary, accent) => ({
    '#D109EC': primary,
    '#B909D4': accent,
  }),
  headband: (primary) => ({
    '#FF4949': primary,
  }),
  spiky: (primary) => ({
    white: primary,
    '#FFFFFF': primary,
    '#ffffff': primary,
  }),
}

function replaceColors(svg, colorMap) {
  let out = svg
  for (const [from, to] of Object.entries(colorMap)) {
    if (!to) continue
    out = out.replaceAll(from, to)
    out = out.replaceAll(from.toLowerCase(), to)
    out = out.replaceAll(from.toUpperCase(), to)
  }
  return out
}

function scopeSvgIds(svg, uid) {
  return svg
    .replace(/\bid="([^"]+)"/g, (_, id) => `id="${uid}-${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${uid}-${id})`)
    .replace(/xlink:href="#([^"]+)"/g, (_, id) => `xlink:href="#${uid}-${id}"`)
    .replace(/href="#([^"]+)"/g, (_, id) => `href="#${uid}-${id}"`)
}

function extractSvgInner(raw) {
  return raw
    .replace(/<\?xml[^?]*\?>/i, '')
    .replace(/<svg[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '')
    .trim()
}

function hatScales(spec) {
  if (spec.faceAligned) return { scaleX: 1, scaleY: 1 }
  const scaleX = spec.targetW / spec.w
  const scaleY = spec.targetH != null ? spec.targetH / spec.h : scaleX
  return { scaleX, scaleY }
}

function hatTransform(spec) {
  if (spec.faceAligned) return null
  const { scaleX, scaleY } = hatScales(spec)
  const tx = 162 - (spec.w * scaleX) / 2
  const anchorLocalY = spec.anchorLocalY ?? spec.h
  const ty = spec.anchorY - anchorLocalY * scaleY
  return `translate(${tx} ${ty}) scale(${scaleX} ${scaleY})`
}

function getHatOverhangAboveHeadPx(hatKey, headRenderH = 230, faceVbH = 331) {
  if (!hatKey || hatKey === 'none') return 0
  const spec = HAT_SPECS[hatKey]
  if (!spec) return 0
  if (spec.faceAligned) {
    const hatTopInViewBox = 10
    if (hatTopInViewBox >= 0) return 0
    return Math.ceil(-hatTopInViewBox * (headRenderH / faceVbH))
  }
  const { scaleY } = hatScales(spec)
  const anchorLocalY = spec.anchorLocalY ?? spec.h
  const graphicTop = spec.anchorY - anchorLocalY * scaleY
  if (graphicTop >= 0) return 0
  return Math.ceil(-graphicTop * (headRenderH / faceVbH))
}

// How far below the shelf lip the head should start so tall hats aren't sliced in on rise.
function getHeadIntroStartBelow(hatKey, baseBelow = 380, hiddenPad = 80) {
  return baseBelow + getHatOverhangAboveHeadPx(hatKey) + hiddenPad
}

function getHeadIntroDuration(hatKey, endTop = 108, startTop = null, baseMs = 780, msPerPx = 0.5) {
  const start = startTop ?? getHeadIntroStartBelow(hatKey)
  const travel = Math.abs(start - endTop)
  return Math.round(baseMs + travel * msPerPx)
}

// Bookcase-layer head `top` for intro: vertically centered, but shifted up as needed so
// tall hats (beanie, top hat, etc.) sit fully above the viewport.
function getHeadIntroViewportStartTop(hatKey, {
  viewportCenterY,
  viewportTop,
  stageTop,
  stageSy,
  bookcaseShift = 0,
  headH = 230,
  edgePad = 48,
}) {
  const hatOverhang = getHatOverhangAboveHeadPx(hatKey, headH)
  const centeredTop = (viewportCenterY - stageTop) / stageSy - bookcaseShift - headH * 0.5
  if (hatOverhang <= 0) return Math.round(centeredTop)

  const maxTopForHiddenHat = (viewportTop - edgePad - stageTop) / stageSy - bookcaseShift + hatOverhang
  return Math.round(Math.min(centeredTop, maxTopForHiddenHat))
}

function getHatPickerViewBox(hat) {
  if (!hat || hat === 'none') return '0 0 48 32'
  const spec = HAT_SPECS[hat]
  if (spec.faceAligned) return '10 8 305 78'
  const { scaleX, scaleY } = hatScales(spec)
  const anchorLocalY = spec.anchorLocalY ?? spec.h
  const left = 162 - (spec.w * scaleX) / 2
  const right = 162 + (spec.w * scaleX) / 2
  const top = spec.anchorY - anchorLocalY * scaleY
  const bottom = spec.anchorY + (spec.h - anchorLocalY) * scaleY
  const padX = 10
  const padY = 8
  return `${left - padX} ${top - padY} ${right - left + padX * 2} ${bottom - top + padY * 2}`
}

function HatGraphic({ hat, primary, accent, band, bandAccent }) {
  const uid = useId().replace(/:/g, '')
  const spec = HAT_SPECS[hat]
  const inner = useMemo(() => {
    const mapFn = COLOR_MAPS[hat]
    const colorMap = mapFn(primary, accent, band, bandAccent)
    const colored = replaceColors(spec.raw, colorMap)
    const scoped = scopeSvgIds(colored, uid)
    return extractSvgInner(scoped)
  }, [hat, primary, accent, band, bandAccent, spec.raw, uid])

  return (
    <g transform={hatTransform(spec) ?? undefined} dangerouslySetInnerHTML={{ __html: inner }} />
  )
}

function MonsterHatGraphic({ hat, hatColorKey = 'red' }) {
  if (!hat || hat === 'none') return null
  const { primary, band, accent } = getHatColors(hat, hatColorKey)
  const bandAccent = accent

  return <HatGraphic hat={hat} primary={primary} accent={accent} band={band} bandAccent={bandAccent} />
}

export { MonsterHatGraphic, HAT_SPECS, TOMA_FACE_VIEWBOX, TOMA_HEAD_VIEWBOX, getHatPickerViewBox, getHatOverhangAboveHeadPx, getHeadIntroStartBelow, getHeadIntroDuration, getHeadIntroViewportStartTop }
