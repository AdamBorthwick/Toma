import { IconClose } from '../icons.jsx'

export function IconCloseButton({ onClick, size = 16, color = '#606078', style }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '2px 4px',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        ...style,
      }}
    >
      <IconClose size={size} color={color} />
    </button>
  )
}
