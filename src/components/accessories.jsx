// Accessory overlays for Toma's face — loaded from src/assets/accessories SVGs.

import { useId, useMemo } from 'react'
import { getAccessoryColors } from '../data/monster.jsx'

import roundGlassesSvg from '../assets/accessories/Round Glasses.svg?raw'
import roundGlassesPreview from '../assets/accessories/Round Glasses, preview.svg?raw'
import squareGlassesSvg from '../assets/accessories/Square Glasses.svg?raw'
import squareGlassesPreview from '../assets/accessories/Square Glasses, preview.svg?raw'
import rectangleGlassesSvg from '../assets/accessories/Rectangle Glasses.svg?raw'
import rectangleGlassesPreview from '../assets/accessories/Rectangle Glasses, preview.svg?raw'
import rectangleShadesSvg from '../assets/accessories/Rectangle Shades.svg?raw'
import rectangleShadesPreview from '../assets/accessories/Rectangle Glasses Shades, preview.svg?raw'
import sunglassesSvg from '../assets/accessories/sunglasses.svg?raw'
import sunglassesPreview from '../assets/accessories/sunglasses preview.svg?raw'
import readingBigSvg from '../assets/accessories/Reading Glasses Big.svg?raw'
import readingBigPreview from '../assets/accessories/Reading Glasses Big, preview.svg?raw'
import monacleSvg from '../assets/accessories/Monacle.svg?raw'
import monaclePreview from '../assets/accessories/Monacle, preview.svg?raw'
import moustacheSvg from '../assets/accessories/moustache.svg?raw'
import moustachePreview from '../assets/accessories/moustache preview.svg?raw'
import beardSvg from '../assets/accessories/beard.svg?raw'
import goateeSvg from '../assets/accessories/Goutee.svg?raw'
import goateePreview from '../assets/accessories/Goutee preview.svg?raw'
import eyepatchSvg from '../assets/accessories/eyepatch 1.svg?raw'
import eyepatchPreview from '../assets/accessories/eyepatch preview.svg?raw'

const ACCESSORY_PICKER_VIEWBOX = '0 0 325 331'

const PREVIEW_CLEAR_LENS_FILL = '#FDF8EF'
const PREVIEW_SHADE_LENS_FILL = '#141A2E'
const PREVIEW_FRAME_COLOR = '#3A3A52'

const ACCESSORY_SPECS = {
  round:            { raw: roundGlassesSvg,    preview: roundGlassesPreview, clearGlasses: true },
  square:           { raw: squareGlassesSvg,   preview: squareGlassesPreview, clearGlasses: true },
  rectangle:        { raw: rectangleGlassesSvg, preview: rectangleGlassesPreview, clearGlasses: true },
  'rectangle-shades': { raw: rectangleShadesSvg, preview: rectangleShadesPreview, shades: true },
  sunglasses:       { raw: sunglassesSvg,      preview: sunglassesPreview, shades: true },
  'reading-big':    { raw: readingBigSvg,    preview: readingBigPreview, clearGlasses: true },
  monacle:          { raw: monacleSvg,         preview: monaclePreview, clearGlasses: true },
  eyepatch:         { raw: eyepatchSvg,        preview: eyepatchPreview, rawPatchScale: 1.34, patchOriginX: 231.5, patchOriginY: 81.6 },
  moustache:        { raw: moustacheSvg,       preview: moustachePreview, scale: 1.38, originX: 162.5, originY: 95, offsetY: 8 },
  beard:            { raw: beardSvg,           preview: beardSvg, offsetY: 24, originX: 162, originY: 160 },
  goatee:           {
    raw: goateeSvg,
    preview: goateePreview,
    moustacheScale: 1.38,
    moustacheOriginX: 162.5,
    moustacheOriginY: 95,
    chinScale: 1.42,
    chinOriginX: 163.5,
    chinOriginY: 164,
    offsetY: 8,
  },
}

function accessoryTransform(spec, preview = false) {
  const scale = preview ? (spec.previewScale ?? spec.scale ?? 1) : (spec.rawScale ?? spec.scale ?? 1)
  const offsetX = spec.offsetX ?? 0
  const offsetY = spec.offsetY ?? 0
  if (scale === 1 && offsetX === 0 && offsetY === 0) return null
  const cx = spec.originX ?? 162.5
  const cy = spec.originY ?? 165
  return `translate(${offsetX} ${offsetY}) translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`
}

function accessoryColorMap(primary, accent) {
  return {
    black: accent,
    '#000000': accent,
    '#E69A52': accent,
  }
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

function addClearLensFills(svg) {
  return svg
    .replace(/<circle\b([^>]*?)\/>/g, (match, attrs) => {
      if (/fill=/.test(attrs) || !/stroke=/.test(attrs)) return match
      return `<circle${attrs} fill="${PREVIEW_CLEAR_LENS_FILL}"/>`
    })
    .replace(/<rect\b([^>]*?)\/>/g, (match, attrs) => {
      if (/fill=/.test(attrs) || !/stroke=/.test(attrs)) return match
      return `<rect${attrs} fill="${PREVIEW_CLEAR_LENS_FILL}"/>`
    })
    .replace(/<path\b([^>]*?)\/>/g, (match, attrs) => {
      if (/fill=/.test(attrs) || !/stroke=/.test(attrs)) return match
      if (!/\bd="[^"]*[Zz]/.test(attrs)) return match
      return `<path${attrs} fill="${PREVIEW_CLEAR_LENS_FILL}"/>`
    })
}

function prepareAccessorySvg(source, colorMap, { preview = false, shades = false, clearGlasses = false } = {}) {
  let out = source
  if (preview && (clearGlasses || shades)) {
    out = replaceColors(out, {
      black: PREVIEW_FRAME_COLOR,
      '#000000': PREVIEW_FRAME_COLOR,
      '#E69A52': PREVIEW_FRAME_COLOR,
    })
  } else {
    out = replaceColors(out, colorMap)
  }

  if (preview && clearGlasses) {
    out = addClearLensFills(out)
  }

  if (preview && shades) {
    out = out
      .replace(/fill="#1E1E32"\s+fill-opacity="0.55"/g, `fill="${PREVIEW_SHADE_LENS_FILL}"`)
      .replace(/fill="#1E1E32"/g, `fill="${PREVIEW_SHADE_LENS_FILL}"`)
      .replace(/\sfill-opacity="0.55"/g, '')
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

function splitEyepatchLayers(inner) {
  const paths = inner.match(/<path[^>]*\/?>/g) ?? []
  if (paths.length < 3) return { strings: inner, patch: '' }
  return {
    strings: paths.slice(0, 2).join(''),
    patch: paths[2],
  }
}

function splitGoateeLayers(inner) {
  const paths = inner.match(/<path[^>]*\/?>/g) ?? []
  if (paths.length < 2) return { moustache: inner, chin: '' }
  return {
    moustache: paths[0],
    chin: paths[1],
  }
}

function layerTransform({ scale = 1, originX = 162.5, originY = 165, offsetX = 0, offsetY = 0 }) {
  if (scale === 1 && offsetX === 0 && offsetY === 0) return null
  return `translate(${offsetX} ${offsetY}) translate(${originX} ${originY}) scale(${scale}) translate(${-originX} ${-originY})`
}

function patchScaleTransform(scale, cx, cy) {
  return `translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`
}

function AccessoryGraphic({ accessory, primary, accent, preview = false }) {
  const uid = useId().replace(/:/g, '')
  const spec = ACCESSORY_SPECS[accessory]
  const inner = useMemo(() => {
    const source = preview ? spec.preview : spec.raw
    const colored = prepareAccessorySvg(source, accessoryColorMap(primary, accent), {
      preview,
      shades: spec.shades,
      clearGlasses: spec.clearGlasses,
    })
    const scoped = scopeSvgIds(colored, uid)
    return extractSvgInner(scoped)
  }, [accessory, primary, accent, preview, spec.preview, spec.raw, spec.shades, spec.clearGlasses, uid])

  if (accessory === 'eyepatch' && !preview && spec.rawPatchScale) {
    const { strings, patch } = splitEyepatchLayers(inner)
    return (
      <g>
        <g dangerouslySetInnerHTML={{ __html: strings }} />
        <g
          transform={patchScaleTransform(spec.rawPatchScale, spec.patchOriginX, spec.patchOriginY)}
          dangerouslySetInnerHTML={{ __html: patch }}
        />
      </g>
    )
  }

  if (accessory === 'goatee' && spec.moustacheScale != null) {
    const { moustache, chin } = splitGoateeLayers(inner)
    const baseOffsetY = spec.offsetY ?? 0
    return (
      <g>
        <g
          transform={layerTransform({
            scale: spec.moustacheScale,
            originX: spec.moustacheOriginX,
            originY: spec.moustacheOriginY,
            offsetY: baseOffsetY,
          }) ?? undefined}
          dangerouslySetInnerHTML={{ __html: moustache }}
        />
        <g
          transform={layerTransform({
            scale: spec.chinScale,
            originX: spec.chinOriginX,
            originY: spec.chinOriginY,
            offsetY: baseOffsetY,
          }) ?? undefined}
          dangerouslySetInnerHTML={{ __html: chin }}
        />
      </g>
    )
  }

  return (
    <g transform={accessoryTransform(spec, preview) ?? undefined} dangerouslySetInnerHTML={{ __html: inner }} />
  )
}

function MonsterAccessoryGraphic({ accessory = 'none', accessoryColorKey = 'red' }) {
  if (accessory === 'none' || !ACCESSORY_SPECS[accessory]) return null
  const { primary, accent } = getAccessoryColors(accessory, accessoryColorKey)
  return <AccessoryGraphic accessory={accessory} primary={primary} accent={accent} />
}

function AccessoryOnlyPreview({ accessory, accessoryColorKey = 'red' }) {
  if (accessory === 'none') {
    return (
      <svg width="100%" height="100%" viewBox="0 0 48 32" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <line x1="10" y1="16" x2="38" y2="16" stroke="#C8C8D8" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    )
  }
  if (!ACCESSORY_SPECS[accessory]) return null
  const { primary, accent } = getAccessoryColors(accessory, accessoryColorKey)
  return (
    <svg
      width="100%"
      height="100%"
      viewBox={ACCESSORY_PICKER_VIEWBOX}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      style={{ display: 'block', overflow: 'hidden' }}
    >
      <AccessoryGraphic accessory={accessory} primary={primary} accent={accent} preview />
    </svg>
  )
}

export { MonsterAccessoryGraphic, AccessoryOnlyPreview, ACCESSORY_SPECS }
