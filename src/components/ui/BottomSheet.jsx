import { Z } from '../../lib/zIndex.js'
import { colors, sheetStyles, panelTitleStyle, panelSubtitleStyle } from '../../lib/uiTokens.js'
import { IconCloseButton } from './IconCloseButton.jsx'

export function BottomSheet({ isOpen, onClose, isMobile, children, style, sheetStyle }) {
  if (!isOpen) return null

  const baseSheet = isMobile ? sheetStyles.mobile : sheetStyles.desktop

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: colors.backdropSheet,
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        zIndex: Z.panel,
      }}
      onMouseDown={onClose}
    >
      <div
        className={isMobile ? 'sheet-max-viewport' : undefined}
        style={{
          ...baseSheet,
          ...sheetStyle,
          ...style,
          ...(isMobile ? { minHeight: 0 } : null),
        }}
        onMouseDown={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

export function SheetHeader({ title, subtitle, onClose, isMobile, marginBottom }) {
  const mb = marginBottom ?? (isMobile ? 12 : 18)
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: mb,
      flexShrink: 0,
    }}>
      <div>
        <div style={panelTitleStyle(isMobile)}>{title}</div>
        {subtitle && <div style={panelSubtitleStyle}>{subtitle}</div>}
      </div>
      {onClose && <IconCloseButton onClick={onClose} />}
    </div>
  )
}
