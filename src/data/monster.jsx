const MONSTER_COLORS = [
  { key: 'green',  body: '#72FF5D', accent: '#3BD424', label: 'Green' },
  { key: 'lime',   body: '#B8FF72', accent: '#6BC42A', label: 'Lime' },
  { key: 'blue',   body: '#6BC4FF', accent: '#2A8FD4', label: 'Blue' },
  { key: 'purple', body: '#C49CFF', accent: '#8E5BB5', label: 'Purple' },
  { key: 'pink',   body: '#FF9EC4', accent: '#E05588', label: 'Pink' },
  { key: 'orange', body: '#FFB86B', accent: '#E07820', label: 'Orange' },
  { key: 'yellow', body: '#FFE566', accent: '#E0A21C', label: 'Yellow' },
  { key: 'teal',   body: '#6BFFD8', accent: '#2ABFA0', label: 'Teal' },
  { key: 'red',    body: '#FF6B6B', accent: '#E03E3E', label: 'Red' },
]

const MONSTER_HATS = [
  { key: 'none',     label: 'None' },
  { key: 'cap',      label: 'Cap' },
  { key: 'beanie',   label: 'Beanie' },
  { key: 'bucket',   label: 'Bucket' },
  { key: 'straw',    label: 'Straw' },
  { key: 'top',      label: 'Top hat' },
  { key: 'crown',    label: 'Crown' },
  { key: 'headband', label: 'Headband' },
  { key: 'spiky',    label: 'Spiky hair' },
]

const HAT_BAND_KEYS = new Set(['straw', 'top'])

const HAIR_COLORS = [
  { key: 'off-white', body: '#F2EDE3', accent: '#D4CBB8', label: 'Off-white' },
  { key: 'black',     body: '#1C1C1C', accent: '#0A0A0A', label: 'Black' },
  { key: 'brown',     body: '#5C3D2E', accent: '#3D2817', label: 'Brown' },
  { key: 'ginger',    body: '#C45C26', accent: '#9A4520', label: 'Ginger' },
  { key: 'blonde',    body: '#E8C872', accent: '#C9A84E', label: 'Blonde' },
]

const HAIR_COLOR_DEFAULT = 'brown'

const STYLE_ITEM_COLORS = [...HAIR_COLORS, ...MONSTER_COLORS]

const HAT_BODY_DEFAULTS = {
  cap: '#7EC8F0',
  beanie: '#E84545',
  bucket: '#7EC8F0',
  straw: '#E8D4A8',
  top: '#1E1E1E',
  crown: '#C652C6',
  headband: '#FF4949',
  spiky: '#FFFFFF',
}

const LEGACY_HAT_KEYS = {
  party: 'cap',
}

const MONSTER_EYE_COLORS = [
  { key: 'dark',   iris: '#1C1C2E', label: 'Dark' },
  { key: 'brown',  iris: '#4A3728', label: 'Brown' },
  { key: 'blue',   iris: '#254CA4', label: 'Blue' },
  { key: 'green',  iris: '#2D7A3A', label: 'Green' },
  { key: 'purple', iris: '#6B3FA0', label: 'Purple' },
  { key: 'gold',   iris: '#C89B2C', label: 'Gold' },
  { key: 'red',    iris: '#B22234', label: 'Red' },
  { key: 'teal',   iris: '#1A8A8A', label: 'Teal' },
  { key: 'pink',   iris: '#D4608A', label: 'Pink' },
]

const MONSTER_EYE_SHAPES = [
  { key: 'round',  label: 'Round' },
  { key: 'wide',   label: 'Wide' },
  { key: 'narrow', label: 'Narrow' },
  { key: 'dot',    label: 'Dot' },
  { key: 'sleepy', label: 'Sleepy' },
]

const MONSTER_ACCESSORIES = [
  { key: 'none',             label: 'None' },
  { key: 'round',            label: 'Round glasses' },
  { key: 'square',           label: 'Square glasses' },
  { key: 'rectangle',        label: 'Rectangle glasses' },
  { key: 'rectangle-shades', label: 'Rectangle shades' },
  { key: 'sunglasses',       label: 'Sunglasses' },
  { key: 'reading-big',      label: 'Reading glasses' },
  { key: 'monacle',          label: 'Monocle' },
  { key: 'eyepatch',         label: 'Eyepatch' },
  { key: 'moustache',        label: 'Moustache' },
  { key: 'beard',            label: 'Beard' },
  { key: 'goatee',           label: 'Goatee' },
]

const LEGACY_ACCESSORY_KEYS = {}

const MONSTER_LOOK_DEFAULTS = {
  colorKey: 'green',
  hatKey: 'none',
  hatColorKey: 'red',
  eyeColorKey: 'dark',
  eyeShapeKey: 'round',
  accessoryKey: 'none',
  accessoryColorKey: 'red',
}

function getMonsterColors(key) {
  return MONSTER_COLORS.find(c => c.key === key) ?? MONSTER_COLORS[0]
}

function getHairColor(key) {
  return HAIR_COLORS.find(c => c.key === key) ?? HAIR_COLORS.find(c => c.key === HAIR_COLOR_DEFAULT)
}

function getStyleItemColor(key) {
  const hair = HAIR_COLORS.find(c => c.key === key)
  if (hair) return { body: hair.body, accent: hair.accent }
  return getMonsterColors(key)
}

function coerceStyleItemColorKey(colorKey, fallback = MONSTER_LOOK_DEFAULTS.hatColorKey) {
  return STYLE_ITEM_COLORS.some(c => c.key === colorKey) ? colorKey : fallback
}

function coerceHatColorKey(_hatKey, colorKey) {
  return coerceStyleItemColorKey(colorKey, MONSTER_LOOK_DEFAULTS.hatColorKey)
}

function coerceAccessoryColorKey(_accessoryKey, colorKey) {
  return coerceStyleItemColorKey(colorKey, MONSTER_LOOK_DEFAULTS.accessoryColorKey)
}

function normalizeHatKey(key) {
  const mapped = LEGACY_HAT_KEYS[key] ?? key
  return MONSTER_HATS.some(h => h.key === mapped) ? mapped : 'none'
}

function normalizeEyeColorKey(key) {
  return MONSTER_EYE_COLORS.some(c => c.key === key) ? key : MONSTER_LOOK_DEFAULTS.eyeColorKey
}

function normalizeEyeShapeKey(key) {
  return MONSTER_EYE_SHAPES.some(s => s.key === key) ? key : MONSTER_LOOK_DEFAULTS.eyeShapeKey
}

function normalizeAccessoryKey(key) {
  const mapped = LEGACY_ACCESSORY_KEYS[key] ?? key
  return MONSTER_ACCESSORIES.some(a => a.key === mapped) ? mapped : 'none'
}

function normalizeAccessoryColorKey(key, accessoryKey = 'none') {
  return coerceAccessoryColorKey(normalizeAccessoryKey(accessoryKey), key)
}

function normalizeHatColorKey(key, hatKey = 'none') {
  return coerceHatColorKey(normalizeHatKey(hatKey), key)
}

function getEyeColor(key) {
  return MONSTER_EYE_COLORS.find(c => c.key === key) ?? MONSTER_EYE_COLORS[0]
}

function getHatColors(hatKey, colorKey) {
  const pick = getStyleItemColor(colorKey)
  const body = HAT_BODY_DEFAULTS[hatKey]
  if (HAT_BAND_KEYS.has(hatKey)) {
    return { primary: body, band: pick.body, accent: pick.accent }
  }
  return { primary: pick.body, band: pick.body, accent: pick.accent }
}

function hatUsesBandColor(hatKey) {
  return HAT_BAND_KEYS.has(hatKey)
}

function getAccessoryColors(_accessoryKey, colorKey) {
  const pick = getStyleItemColor(colorKey)
  return { primary: pick.body, accent: pick.accent }
}

export {
  MONSTER_COLORS,
  HAIR_COLORS,
  STYLE_ITEM_COLORS,
  MONSTER_HATS,
  MONSTER_EYE_COLORS,
  MONSTER_EYE_SHAPES,
  MONSTER_ACCESSORIES,
  MONSTER_LOOK_DEFAULTS,
  HAT_BAND_KEYS,
  HAIR_COLOR_DEFAULT,
  getMonsterColors,
  getHairColor,
  getStyleItemColor,
  getEyeColor,
  normalizeHatKey,
  normalizeHatColorKey,
  normalizeEyeColorKey,
  normalizeEyeShapeKey,
  normalizeAccessoryKey,
  normalizeAccessoryColorKey,
  coerceHatColorKey,
  coerceAccessoryColorKey,
  getHatColors,
  getAccessoryColors,
  hatUsesBandColor,
}
