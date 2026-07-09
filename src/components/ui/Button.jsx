import { colors, font, radii } from '../../lib/uiTokens.js'

const VARIANTS = {
  primary: {
    background: colors.primary,
    color: colors.onPrimary,
    border: 'none',
    hoverBackground: colors.primaryHover,
  },
  success: {
    background: colors.successBright,
    color: colors.onPrimary,
    border: 'none',
  },
  secondary: {
    background: 'transparent',
    color: colors.muted,
    border: `2px solid ${colors.border}`,
  },
  secondaryPrimary: {
    background: colors.surface,
    color: colors.primary,
    border: `2px solid ${colors.primary}`,
  },
  dashed: {
    background: 'none',
    color: colors.muted,
    border: `2px dashed ${colors.border}`,
    hoverColor: colors.primary,
  },
  dashedPrimary: {
    background: 'none',
    color: colors.primary,
    border: `2px solid ${colors.primary}`,
  },
  destructive: {
    background: 'none',
    color: colors.destructive,
    border: `2px solid ${colors.destructive}`,
  },
  ghost: {
    background: 'none',
    color: colors.muted,
    border: `2px solid ${colors.border}`,
  },
}

export function Button({
  variant = 'primary',
  disabled = false,
  fullWidth = false,
  size = 'md',
  hoverFill = false,
  style,
  children,
  ...props
}) {
  const v = VARIANTS[variant] ?? VARIANTS.primary
  const isPrimary = variant === 'primary' || variant === 'success'
  const padding = size === 'sm' ? '10px 0' : (size === 'dialog' ? '11px 0' : '12px 0')
  const fontSize = size === 'sm' ? 14 : 15

  const base = {
    width: fullWidth ? '100%' : undefined,
    flex: fullWidth ? 1 : undefined,
    padding,
    background: disabled && isPrimary ? colors.primaryDisabled : v.background,
    color: disabled && !isPrimary ? colors.tertiary : v.color,
    border: v.border,
    borderRadius: radii.md,
    fontFamily: font,
    fontWeight: 700,
    fontSize,
    cursor: disabled ? 'default' : 'pointer',
    transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
    flexShrink: 0,
    ...style,
  }

  const canHover = !disabled && (hoverFill || variant === 'dashedPrimary' || variant === 'dashed')

  return (
    <button
      {...props}
      disabled={disabled}
      style={base}
      onMouseEnter={canHover ? (e) => {
        if (hoverFill || variant === 'dashedPrimary') {
          e.currentTarget.style.background = colors.primary
          e.currentTarget.style.color = colors.onPrimary
        } else if (variant === 'dashed') {
          e.currentTarget.style.borderColor = colors.primary
          e.currentTarget.style.color = colors.primary
        }
        props.onMouseEnter?.(e)
      } : props.onMouseEnter}
      onMouseLeave={canHover ? (e) => {
        e.currentTarget.style.background = v.background
        e.currentTarget.style.color = v.color
        if (variant === 'dashed') e.currentTarget.style.borderColor = colors.border
        props.onMouseLeave?.(e)
      } : props.onMouseLeave}
    >
      {children}
    </button>
  )
}
