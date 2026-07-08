import { useId, useMemo } from 'react'
import { getHatColors } from '../data/monster.jsx'
import capSvg from '../assets/hats/cap.svg?raw'
import beanieSvg from '../assets/hats/beanie.svg?raw'
import bucketSvg from '../assets/hats/bucket.svg?raw'
import strawSvg from '../assets/hats/straw.svg?raw'
import topSvg from '../assets/hats/top.svg?raw'
import crownSvg from '../assets/hats/crown.svg?raw'

// Face layout box — used for on-stage positioning (hats overflow above via SVG overflow).
const TOMA_FACE_VIEWBOX = '0 0 325 331'
// Expanded box for contexts that need explicit hat headroom in the viewBox.
const TOMA_HEAD_VIEWBOX = '0 -44 325 375'

// Native SVG size → scaled to sit on Toma's head (center x≈162).
// anchorY: where the hat brim/base meets the forehead.
const HAT_SPECS = {
  cap:    { raw: capSvg,    w: 142, h: 110, targetW: 148, anchorY: 54 },
  beanie: { raw: beanieSvg, w: 136, h: 136, targetW: 215, targetH: 188, anchorY: 56 },
  bucket: { raw: bucketSvg, w: 148, h:  99, targetW: 188, anchorY: 46 },
  straw:  { raw: strawSvg,  w: 303, h: 128, targetW: 260, anchorY: 46 },
  top:    { raw: topSvg,    w: 228, h: 148, targetW: 258, anchorY: 26 },
  crown:  { raw: crownSvg,  w: 136, h: 102, targetW: 136, anchorY: 54 },
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
  const scaleX = spec.targetW / spec.w
  const scaleY = spec.targetH != null ? spec.targetH / spec.h : scaleX
  return { scaleX, scaleY }
}

function hatTransform(spec) {
  const { scaleX, scaleY } = hatScales(spec)
  const tx = 162 - (spec.w * scaleX) / 2
  const ty = spec.anchorY - spec.h * scaleY
  return `translate(${tx} ${ty}) scale(${scaleX} ${scaleY})`
}

function getHatPickerViewBox(hat) {
  if (!hat || hat === 'none') return '0 0 48 32'
  const spec = HAT_SPECS[hat]
  const { scaleX, scaleY } = hatScales(spec)
  const left = 162 - (spec.w * scaleX) / 2
  const right = 162 + (spec.w * scaleX) / 2
  const top = spec.anchorY - spec.h * scaleY
  const bottom = spec.anchorY
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
    <g transform={hatTransform(spec)} dangerouslySetInnerHTML={{ __html: inner }} />
  )
}

function MonsterHatGraphic({ hat, hatColorKey = 'red' }) {
  if (!hat || hat === 'none') return null
  const { primary, band, accent } = getHatColors(hat, hatColorKey)
  const bandAccent = accent

  return <HatGraphic hat={hat} primary={primary} accent={accent} band={band} bandAccent={bandAccent} />
}

export { MonsterHatGraphic, HAT_SPECS, TOMA_FACE_VIEWBOX, TOMA_HEAD_VIEWBOX, getHatPickerViewBox }
