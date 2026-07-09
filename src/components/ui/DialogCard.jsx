import { colors, dialogCardStyle } from '../../lib/uiTokens.js'
import { Z } from '../../lib/zIndex.js'

export function DialogBackdrop({ onClose, zIndex = Z.dialogHigh, children, style }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: colors.backdropDialog,
        zIndex,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
      onMouseDown={onClose}
    >
      {children}
    </div>
  )
}

export function DialogCard({ children, width, style, onMouseDown }) {
  return (
    <div
      style={{
        ...dialogCardStyle,
        width: width ?? dialogCardStyle.width,
        ...style,
      }}
      onMouseDown={onMouseDown ?? (e => e.stopPropagation())}
    >
      {children}
    </div>
  )
}

export function DialogTitle({ children, style }) {
  return (
    <div style={{ fontSize: 22, fontWeight: 700, color: colors.text, marginBottom: 6, ...style }}>
      {children}
    </div>
  )
}

export function DialogDescription({ children, style }) {
  return (
    <div style={{ fontSize: 14, color: colors.subtitle, marginBottom: 20, ...style }}>
      {children}
    </div>
  )
}

export function DialogActions({ children, style }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', ...style }}>
      {children}
    </div>
  )
}
