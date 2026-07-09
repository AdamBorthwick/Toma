/** Shared visual tokens for inline styles and CSS variables. */
export const colors = {
  primary: '#254CA4',
  primaryHover: '#2E5AC0',
  primaryDisabled: 'rgba(37,76,164,0.35)',
  surface: '#FDF8EF',
  surfaceMuted: '#F2EFE8',
  text: '#1C1C2E',
  textBody: '#2C2C3E',
  muted: '#606078',
  subtitle: '#666680',
  tertiary: '#9898B0',
  placeholder: '#8888A0',
  border: '#D0D0DC',
  borderLight: '#E4E4EC',
  borderAlt: '#C4C4D4',
  success: '#5a9e3f',
  successBright: '#3EAF2D',
  successBg: '#d4f0be',
  selectBg: '#e8eef9',
  destructive: '#c0392b',
  destructiveBg: 'rgba(192,57,43,0.08)',
  onPrimary: '#FDF8EF',
  navy: '#19243D',
  navyMid: '#223152',
  backdropSheet: 'rgba(0,0,0,0.45)',
  backdropDialog: 'rgba(25,36,61,0.6)',
  backdropDialogHeavy: 'rgba(25,36,61,0.72)',
  backdropBook: 'rgba(0,0,0,0.54)',
  backdropPreview: 'rgba(0,0,0,0.62)',
}

export const radii = {
  sm: 8,
  md: 10,
  lg: 12,
  sheet: 18,
  dialog: 20,
}

export const shadows = {
  sheet: '0 -4px 24px rgba(0,0,0,0.2)',
  panel: '0 8px 40px rgba(0,0,0,0.28)',
  dialog: '0 16px 48px rgba(0,0,0,0.3)',
  fab: '0 2px 10px rgba(0,0,0,0.35)',
  tile: '0 1px 4px rgba(0,0,0,0.06)',
  tileSelected: '0 3px 12px rgba(37,76,164,0.16)',
  tileSelectedGreen: '0 3px 12px rgba(90,158,63,0.2)',
}

export const font = "'Manrope', sans-serif"

export const sheetStyles = {
  mobile: {
    background: colors.surface,
    borderRadius: `${radii.sheet}px ${radii.sheet}px 0 0`,
    padding: '20px 16px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    boxShadow: shadows.sheet,
    fontFamily: font,
    overflow: 'hidden',
  },
  desktop: {
    background: colors.surface,
    borderRadius: radii.sheet,
    padding: 28,
    maxWidth: 440,
    width: '92%',
    maxHeight: '84vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: shadows.panel,
    fontFamily: font,
  },
}

export const dialogCardStyle = {
  background: colors.surface,
  borderRadius: radii.dialog,
  padding: '28px 32px 24px',
  width: 'min(340px, 92vw)',
  boxShadow: shadows.dialog,
  fontFamily: font,
  boxSizing: 'border-box',
}

export const fieldLabelStyle = {
  fontSize: 13,
  fontWeight: 700,
  color: colors.muted,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
}

export const panelTitleStyle = (isMobile = false) => ({
  fontSize: isMobile ? 20 : 22,
  fontWeight: 700,
  color: colors.text,
  lineHeight: 1.1,
})

export const panelSubtitleStyle = {
  fontSize: 14,
  color: colors.subtitle,
  marginTop: 6,
}
