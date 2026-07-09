import { colors, fieldLabelStyle, font } from '../../lib/uiTokens.js'

/** Uppercase section label used in panels and dialogs. */
export function FieldLabel({ children, style, sentenceCase = false }) {
  return (
    <div style={{
      ...fieldLabelStyle,
      textTransform: sentenceCase ? 'none' : 'uppercase',
      letterSpacing: sentenceCase ? undefined : fieldLabelStyle.letterSpacing,
      marginBottom: style?.marginBottom ?? 8,
      ...style,
    }}>
      {children}
    </div>
  )
}

/** Sentence-case label for forms like onboarding. */
export function FormLabel({ children, style }) {
  return (
    <div style={{
      fontSize: 12,
      fontWeight: 700,
      color: colors.text,
      fontFamily: font,
      marginBottom: 6,
      ...style,
    }}>
      {children}
    </div>
  )
}
