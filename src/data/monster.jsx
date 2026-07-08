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
  { key: 'none',   label: 'None' },
  { key: 'cap',    label: 'Cap' },
  { key: 'beanie', label: 'Beanie' },
  { key: 'bucket', label: 'Bucket' },
  { key: 'straw',  label: 'Straw' },
  { key: 'top',    label: 'Top hat' },
  { key: 'crown',  label: 'Crown' },
]

const HAT_BAND_KEYS = new Set(['straw', 'top'])

const HAT_BODY_DEFAULTS = {
  cap: '#7EC8F0',
  beanie: '#E84545',
  bucket: '#7EC8F0',
  straw: '#E8D4A8',
  top: '#1E1E1E',
  crown: '#C652C6',
}

const LEGACY_HAT_KEYS = {
  party: 'cap',
}

function getMonsterColors(key) {
  return MONSTER_COLORS.find(c => c.key === key) ?? MONSTER_COLORS[0]
}

function normalizeHatKey(key) {
  const mapped = LEGACY_HAT_KEYS[key] ?? key
  return MONSTER_HATS.some(h => h.key === mapped) ? mapped : 'none'
}

function getHatColors(hatKey, colorKey) {
  const pick = getMonsterColors(colorKey)
  const body = HAT_BODY_DEFAULTS[hatKey]
  if (HAT_BAND_KEYS.has(hatKey)) {
    return { primary: body, band: pick.body, accent: pick.accent }
  }
  return { primary: pick.body, band: pick.body, accent: pick.accent }
}

function hatUsesBandColor(hatKey) {
  return HAT_BAND_KEYS.has(hatKey)
}

export {
  MONSTER_COLORS,
  MONSTER_HATS,
  HAT_BAND_KEYS,
  getMonsterColors,
  normalizeHatKey,
  getHatColors,
  hatUsesBandColor,
}
