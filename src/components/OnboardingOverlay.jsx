import { useState } from 'react'

// ─── Onboarding overlay ────────────────────────────────────────────────────────

function OnboardingOverlay({ onSubmit }) {
  const [name, setName] = useState('')
  const [shelfName, setShelfName] = useState('')
  const [loading, setLoading] = useState(false)
  const canSubmit = name.trim() && shelfName.trim() && !loading

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(25,36,61,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Manrope', sans-serif" }}>
      <div style={{ background: '#FDF8EF', borderRadius: 20, padding: '40px min(36px, 6vw)', width: 'min(360px, 92vw)', boxSizing: 'border-box', boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#1C1C2E', marginBottom: 6 }}>Welcome to TOMA!</div>
        <div style={{ fontSize: 14, color: '#666680', marginBottom: 28 }}>Let's set up your bookshelf.</div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1C1C2E', marginBottom: 6 }}>Bookshelf name</div>
          {/* 16px inputs: below 16px, iOS Safari auto-zooms the page on focus */}
          <input value={shelfName} onChange={e => setShelfName(e.target.value)} placeholder="e.g. My Reading Nook"
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #C4C4D4', fontSize: 16, fontFamily: "'Manrope', sans-serif", color: '#1C1C2E', background: '#FDF8EF', outline: 'none' }} />
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1C1C2E', marginBottom: 6 }}>Your name</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Alex"
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #C4C4D4', fontSize: 16, fontFamily: "'Manrope', sans-serif", color: '#1C1C2E', background: '#FDF8EF', outline: 'none' }} />
        </div>

        <button
          disabled={!canSubmit}
          onClick={async () => {
            if (!canSubmit) return
            setLoading(true)
            await onSubmit(name.trim(), shelfName.trim())
          }}
          style={{ width: '100%', padding: '12px 0', background: canSubmit ? '#254CA4' : '#C4C4D4', color: '#FDF8EF', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'default', fontFamily: "'Manrope', sans-serif", transition: 'background 0.15s' }}
        >
          {loading ? 'Setting up your shelf…' : 'Create my shelf'}
        </button>
      </div>
    </div>
  )
}


export { OnboardingOverlay }
