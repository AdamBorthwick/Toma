import { useState, useEffect } from 'react'

// Loader wordmark — stays fully hidden until Gasoek One is ready (so the fallback
// sans-serif never flashes), then each letter pops in with a short stagger.
const LETTERS = ['T', 'O', 'M', 'A', '!']
const FONT_WAIT_MS = 2500 // don't hold the loader hostage if the font never arrives

function LoaderWordmark() {
  const [fontReady, setFontReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const timeout = new Promise(resolve => setTimeout(resolve, FONT_WAIT_MS))
    const font = document.fonts?.load("42px 'Gasoek One'").catch(() => {}) ?? Promise.resolve()
    Promise.race([font, timeout]).then(() => {
      if (!cancelled) setFontReady(true)
    })
    return () => { cancelled = true }
  }, [])

  return (
    <div aria-label="TOMA!" role="img" style={{ fontFamily: "'Gasoek One', sans-serif", fontSize: 42, letterSpacing: 1, display: 'flex' }}>
      {LETTERS.map((ch, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            display: 'inline-block',
            opacity: 0,
            animation: fontReady
              ? `loaderLetterIn 0.6s ${i * 0.09}s ease-out both`
              : 'none',
          }}
        >{ch}</span>
      ))}
    </div>
  )
}

export { LoaderWordmark }
