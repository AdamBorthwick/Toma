import { forwardRef } from 'react'
import { colors, font, radii } from '../../lib/uiTokens.js'

export const TextInput = forwardRef(function TextInput({ style, readOnly, ...props }, ref) {
  return (
    <input
      ref={ref}
      {...props}
      readOnly={readOnly}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        border: `2px solid ${colors.border}`,
        borderRadius: radii.md,
        padding: '9px 13px',
        fontSize: 16,
        fontFamily: font,
        fontWeight: 600,
        background: 'white',
        color: colors.text,
        outline: 'none',
        WebkitAppearance: 'none',
        appearance: 'none',
        cursor: readOnly ? 'text' : undefined,
        ...style,
      }}
    />
  )
})

export function SearchInput({ style, ...props }) {
  return (
    <TextInput
      {...props}
      style={{
        padding: '9px 14px',
        fontSize: 14,
        fontWeight: 400,
        ...style,
      }}
    />
  )
}
