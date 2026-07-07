// ─── SVG Icon Components ──────────────────────────────────────────────────────

function IconBooks({ size = 28, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect x="3" y="7" width="7" height="15" rx="1.5" fill={color} opacity="0.65" />
      <rect x="11" y="4" width="8" height="18" rx="1.5" fill={color} />
      <rect x="20" y="8" width="6" height="14" rx="1.5" fill={color} opacity="0.8" />
    </svg>
  )
}
function IconOpenBook({ size = 36, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <path d="M18 30 Q8 25 4 7 L18 9Z" fill={color} opacity="0.65"/>
      <path d="M18 30 Q28 25 32 7 L18 9Z" fill={color} opacity="0.65"/>
      <line x1="18" y1="9" x2="18" y2="30" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
function IconTrash({ size = 28, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <line x1="4" y1="9" x2="24" y2="9" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M11 7 Q11 5 14 5 Q17 5 17 7" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"/>
      <rect x="7" y="11" width="14" height="12" rx="2" stroke={color} strokeWidth="2" fill="none"/>
      <line x1="11" y1="14" x2="11" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="17" y1="14" x2="17" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
function IconPencil({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M9.5 2 L12 4.5 L4.5 12 L2 12.5 L2.5 10 Z" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <line x1="8.5" y1="3" x2="11" y2="5.5" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}
function IconClose({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <line x1="2" y1="2" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="12" y1="2" x2="2" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
function IconCheck({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M3 9 L7 13 L15 5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function IconRotate({ size = 28, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path d="M22 7 A9 9 0 1 0 23 15" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <polyline points="22,3 22,8 17,8" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  )
}
function IconStar({ size = 22, filled = false }) {
  const c = filled ? '#e8a400' : 'none'
  const sc = filled ? '#e8a400' : '#d4c4a8'
  return (
    <svg width={size} height={size} viewBox="0 0 22 22">
      <polygon points="11,2 13.3,8.2 20,8.7 15.2,13 16.9,19.5 11,16.2 5.1,19.5 6.8,13 2,8.7 8.7,8.2"
        fill={c} stroke={sc} strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  )
}
function IconLeaf({ size = 28, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path d="M14 25 C9 22 5 17 5 11 C5 6 9 3 14 3 C19 3 23 6 23 11 C23 17 19 22 14 25Z" fill={color} opacity="0.85"/>
      <line x1="14" y1="25" x2="14" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M14 18 Q9 14 7 9" stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.7"/>
    </svg>
  )
}


export { IconBooks, IconOpenBook, IconTrash, IconPencil, IconClose, IconCheck, IconRotate, IconStar, IconLeaf }
