// Color variants for placed decor (plant pots, coffee cup, candle, clock frame).
// Mirrors the { key, body, accent, label } shape used by MONSTER_COLORS so the
// existing ColorSwatchRow component works for both without changes.

const DECOR_COLORS = [
  { key: 'cream',      body: '#FDF8EF', accent: '#E8DFC8', label: 'Cream' },
  { key: 'terracotta', body: '#D97B4F', accent: '#B85F38', label: 'Terracotta' },
  { key: 'sage',       body: '#9CAF88', accent: '#7C9268', label: 'Sage' },
  { key: 'navy',       body: '#3A4F6B', accent: '#26374D', label: 'Navy' },
  { key: 'blush',      body: '#F0B8C4', accent: '#D98FA0', label: 'Blush' },
  { key: 'charcoal',   body: '#3C3C3C', accent: '#232323', label: 'Charcoal' },
  { key: 'mustard',    body: '#E0A21C', accent: '#B87F12', label: 'Mustard' },
]

const DECOR_COLOR_DEFAULT = 'cream'

function getDecorColor(key) {
  return DECOR_COLORS.find(c => c.key === key) ?? DECOR_COLORS[0]
}

export { DECOR_COLORS, DECOR_COLOR_DEFAULT, getDecorColor }
