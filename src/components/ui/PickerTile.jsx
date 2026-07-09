import { colors, font, radii, shadows } from '../../lib/uiTokens.js'

const VARIANTS = {
  green: {
    selectedBg: colors.successBg,
    selectedBorder: colors.success,
    selectedShadow: shadows.tileSelectedGreen,
  },
  blue: {
    selectedBg: colors.selectBg,
    selectedBorder: colors.primary,
    selectedShadow: shadows.tileSelected,
  },
}

export function PickerTile({
  selected = false,
  variant = 'green',
  disabled = false,
  onClick,
  children,
  style,
  ...props
}) {
  const v = VARIANTS[variant] ?? VARIANTS.green

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      style={{
        background: selected ? v.selectedBg : 'white',
        border: `2px solid ${selected ? v.selectedBorder : colors.border}`,
        borderRadius: radii.md,
        padding: '10px 14px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        textAlign: 'left',
        fontFamily: font,
        opacity: disabled ? 0.4 : 1,
        transition: 'all .12s',
        width: '100%',
        flexShrink: 0,
        boxShadow: selected ? v.selectedShadow : shadows.tile,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}

/** Compact square tile for hat/accessory pickers. */
export function PickerSquare({ selected = false, onClick, title, children, style }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        width: 76,
        minWidth: 76,
        padding: '8px 6px',
        background: selected ? colors.selectBg : '#fff',
        border: `2px solid ${selected ? colors.primary : colors.border}`,
        borderRadius: radii.lg,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background .12s, border-color .12s, box-shadow .12s',
        boxShadow: selected ? shadows.tileSelected : shadows.tile,
        ...style,
      }}
    >
      {children}
    </button>
  )
}
