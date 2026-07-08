import { useState, useEffect, useRef } from 'react'
import { MonsterHatGraphic, TOMA_FACE_VIEWBOX } from './scene.jsx'

// ─── TitleScreen ──────────────────────────────────────────────────────────────

function StalactitePreview({ scale, viewOffset = 0, clipH = 320 }) {
  const _s0 = "M74.6155 253.62C74.152 255.716 71.1744 255.698 70.7163 253.601C64.4127 224.737 44.6766 134.49 40.2041 115.5C34.8626 92.8196 33.9438 79.4779 26.2041 57.5C19.8108 39.3453 5.1536 11.9488 0.247626 2.96654C-0.48442 1.62625 0.495335 0 2.02251 0L143.976 0C145.328 0 146.294 1.2994 145.886 2.58796C143.193 11.1005 134.42 38.7573 128.204 57.5C120.779 79.8898 113.318 98.0528 105.204 124.5C98.4841 146.404 80.5716 226.683 74.6155 253.62Z"
  const _s1 = "M102.859 352.074C102.566 354.346 99.284 354.461 98.8697 352.208C91.6238 312.81 69.6964 194.195 62.964 164.771C54.8561 129.337 53.3026 105.384 40.7073 74.3905C30.1389 48.3849 7.39126 13.6463 0.343527 3.13907C-0.55398 1.801 0.412754 0 2.02395 0L200.827 0C202.35 0 203.341 1.59451 202.613 2.9323C194.636 17.5864 158.975 84.0543 142.253 131.4C126.427 176.211 108.321 309.864 102.859 352.074Z"
  const _s2 = "M73.7044 253.692C73.4097 255.807 70.478 256.063 69.8465 254.022C61.9545 228.526 38.8548 152.966 35.4606 131.25C31.3562 104.99 36.0402 89.1247 28.9832 63.5C23.1289 42.2428 5.96735 12.5552 0.287334 3.05267C-0.51702 1.70701 0.4639 0 2.03163 0L143.449 0C144.897 0 145.88 1.46285 145.297 2.7879C140.344 14.0404 121.938 56.3061 117.438 73C112.224 92.3399 99.4656 100.611 94.438 120C90.2288 136.233 77.6787 225.168 73.7044 253.692Z"
  const _s3 = "M74.5829 252.363C74.2718 254.539 71.2002 254.656 70.6747 252.521C64.0989 225.813 46.4234 153.287 43.0963 132C38.992 105.74 29.1533 92.6247 22.0963 67C16.1218 45.306 3.77836 12.3229 0.132101 2.71448C-0.366065 1.40174 0.606211 0 2.0103 0L142.906 0C144.603 0 145.544 1.98228 144.471 3.29764C135.402 14.4146 106.483 50.7295 102.096 67C96.8825 86.3398 100.124 103.611 95.0963 123C90.962 138.944 78.781 222.998 74.5829 252.363Z"
  const _s4 = "M69.5201 263.558C69.2602 265.952 65.7368 265.931 65.4975 263.535C61.3213 221.715 51.5772 125.42 48.3856 105C44.2813 78.7402 41.4427 67.6247 34.3856 42C29.4594 24.1127 11.4324 10.7323 0.995039 4.28278C-0.813389 3.1653 0.00824489 0 2.13408 0L136.399 0C138.215 0 139.133 2.238 137.842 3.51429C129.142 12.1132 107.529 34.6311 103.386 50C98.1718 69.3399 93.4132 93.6109 88.3856 113C84.4823 128.053 74.009 222.203 69.5201 263.558Z"
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: '50%',
      transform: 'translateX(-50%)',
      width: 1080 * scale, height: clipH * scale,
      overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
    }}>
      <svg width={1080 * scale} height={clipH * scale}
           viewBox={`0 ${viewOffset} 1080 ${clipH}`}
           style={{ display: 'block' }}>
        <path d={_s1} fill="#19243D" transform="translate(-25,0) scale(0.85)" />
        <path d={_s0} fill="#19243D" transform="translate(105,0)" />
        <path d={_s3} fill="#19243D" transform="translate(220,0) scale(0.65)" />
        <path d={_s2} fill="#19243D" transform="translate(840,0) scale(0.8)" />
        <path d={_s4} fill="#19243D" transform="translate(940,0) scale(0.9)" />
        <path d={_s1} fill="#19243D" transform="translate(1015,0) scale(0.75)" />
      </svg>
    </div>
  )
}

function TitleScreen({ onDismiss, onReveal, scale, fromSurface = false, bodyColor = '#72FF5D', accentColor = '#3BD424', hat = 'none', hatColorKey = 'red' }) {
  const faceRef = useRef(null)
  const [irisOff, setIrisOff] = useState({ x: 0, y: 0 })
  const [exitPhase, setExitPhase] = useState(null) // null | 'duck' | 'reveal'
  const [hoveredLetter, setHoveredLetter] = useState(null)
  const [btnHover, setBtnHover] = useState(false)
  const [isNear, setIsNear] = useState(false)
  const [contentReady, setContentReady] = useState(!fromSurface)
  const [contentEntered, setContentEntered] = useState(false)
  const [monsterReady, setMonsterReady] = useState(!fromSurface)

  useEffect(() => {
    const MAX = 7
    function onMove(e) {
      const el = faceRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const cx = r.left + 162 * (r.width / 325)
      const cy = r.top + 85 * (r.height / 331)
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (!dist) return
      const t = Math.min(dist, 100) / 100
      setIrisOff({ x: (dx / dist) * t * MAX, y: (dy / dist) * t * MAX })
      setIsNear(dist < 220)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useEffect(() => {
    if (fromSurface) {
      const t1 = setTimeout(() => { setContentReady(true); setContentEntered(true) }, 500)
      const t2 = setTimeout(() => setMonsterReady(true), 700)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
    // Startup: slide content in from above immediately on mount
    const raf = requestAnimationFrame(() => setContentEntered(true))
    return () => cancelAnimationFrame(raf)
  }, []) // eslint-disable-line

  function handleClick() {
    if (exitPhase) return
    setExitPhase('duck')
    setTimeout(() => { setExitPhase('reveal'); onReveal() }, 420)
    // Dismiss timing is delegated to onReveal (fires after scroll completes)
  }

  const LETTERS = [
    { ch: 'T', r: -5, dy:  6 },
    { ch: 'O', r:  4, dy: -5 },
    { ch: 'M', r: -3, dy:  7 },
    { ch: 'A', r:  6, dy: -4 },
    { ch: '!', r: -7, dy:  3 },
  ]

  const BODY = "M322.183 170.001C323.757 173.831 324.319 177.661 323.87 181.491C323.42 185.321 322.295 188.926 320.496 192.306C318.697 195.685 317.347 199.177 316.448 202.782C315.548 206.387 315.211 210.217 315.435 214.272C315.66 218.328 314.873 222.045 313.074 225.425C311.275 228.804 308.688 231.733 305.315 234.212C301.941 236.69 300.142 240.069 299.917 244.35C299.692 248.631 297.893 251.785 294.519 253.813C291.145 255.841 288.671 258.657 287.097 262.262C285.523 265.866 284.173 269.697 283.049 273.752C281.924 277.807 278.775 279.835 273.602 279.835C268.429 279.835 264.269 280.849 261.12 282.877C257.971 284.904 255.497 287.721 253.698 291.326C251.899 294.93 248.862 296.733 244.589 296.733C240.316 296.733 237.055 298.31 234.805 301.464C232.556 304.618 229.52 306.533 225.697 307.209C221.873 307.885 218.724 310.138 216.25 313.968C213.776 317.799 210.628 319.826 206.804 320.052C202.981 320.277 199.27 320.84 195.671 321.741C192.073 322.643 188.474 323.656 184.876 324.783C181.277 325.909 177.678 327.487 174.08 329.514C170.481 331.542 166.77 330.19 162.947 325.459C159.123 320.727 155.3 320.277 151.477 324.107C147.653 327.937 144.055 328.162 140.681 324.783C137.307 321.403 133.821 319.376 130.223 318.7C126.624 318.024 123.363 316.447 120.439 313.968C117.515 311.49 114.366 309.688 110.993 308.561C107.619 307.435 103.796 307.322 99.5224 308.223C95.2492 309.124 92.1004 307.66 90.0762 303.83C88.052 300 84.6784 298.535 79.9553 299.436C75.2322 300.338 71.971 298.761 70.1717 294.705C68.3725 290.65 65.1113 288.735 60.3882 288.96C55.6651 289.185 52.6288 287.27 51.2794 283.215C49.9299 279.159 46.8936 276.794 42.1705 276.118C37.4474 275.442 35.3108 272.513 35.7606 267.331C36.2104 262.149 35.8731 257.756 34.7485 254.151C33.624 250.546 29.8005 248.631 23.2781 248.406C16.7558 248.18 15.0689 245.139 18.2177 239.281C21.3664 233.423 21.9287 229.03 19.9045 226.101C17.8803 223.172 14.7316 220.468 10.4583 217.99C6.18501 215.512 3.93592 212.357 3.71101 208.527C3.4861 204.697 4.16082 200.754 5.73519 196.699C7.30956 192.643 7.75938 188.926 7.08465 185.546C6.40992 182.167 5.06046 178.675 3.03628 175.07C1.01209 171.465 0.224909 167.86 0.674728 164.255C1.12455 160.651 1.12455 156.933 0.674728 153.103C0.224909 149.273 0 145.555 0 141.951C0 138.346 0 134.628 0 130.798C0 126.968 1.57437 123.476 4.7231 120.322C7.87183 117.167 9.89602 113.788 10.7957 110.183C11.6953 106.578 13.607 103.537 16.5308 101.058C19.4547 98.58 20.4668 94.9752 19.5671 90.2439C18.6675 85.5125 20.1294 82.2457 23.9529 80.4432C27.7763 78.6408 29.688 75.374 29.688 70.6426C29.688 65.9113 32.2745 63.433 37.4474 63.2077C42.6203 62.9824 45.8815 60.9547 47.231 57.1245C48.5804 53.2944 49.9299 49.3516 51.2794 45.2962C52.6288 41.2408 54.8779 38.0865 58.0266 35.8335C61.1754 33.5805 64.7739 32.2287 68.8223 31.7781C72.8707 31.3275 76.8066 30.8769 80.63 30.4263C84.4535 29.9757 87.9396 28.9618 91.0883 27.3847C94.2371 25.8076 97.1609 23.6672 99.8598 20.9636C102.559 18.26 105.145 14.6552 107.619 10.1491C110.093 5.6431 113.242 3.27743 117.065 3.05213C120.889 2.82683 124.825 2.71418 128.873 2.71418C132.921 2.71418 136.857 4.17864 140.681 7.10756C144.504 10.0365 148.215 10.825 151.814 9.47323C155.412 8.12142 159.123 5.75575 162.947 2.37623C166.77 -1.0033 170.369 -0.777995 173.743 3.05213C177.116 6.88226 180.715 8.34672 184.538 7.44552C188.362 6.54431 192.185 6.20636 196.009 6.43166C199.832 6.65696 203.768 6.31901 207.816 5.4178C211.865 4.51659 215.238 5.8684 217.937 9.47323C220.636 13.0781 224.01 15.2184 228.058 15.8943C232.107 16.5702 234.918 19.1612 236.492 23.6672C238.067 28.1733 240.653 30.9895 244.252 32.116C247.85 33.2426 251.786 34.0311 256.059 34.4817C260.333 34.9323 263.706 36.6221 266.18 39.551C268.654 42.4799 270.679 45.8594 272.253 49.6896C273.827 53.5197 276.976 55.7727 281.699 56.4486C286.422 57.1245 288.896 59.7155 289.121 64.2215C289.346 68.7276 291.82 71.7691 296.543 73.3462C301.266 74.9234 303.965 77.7396 304.64 81.7951C305.315 85.8505 305.989 89.7933 306.664 93.6234C307.339 97.4535 308.126 101.171 309.026 104.776C309.925 108.381 311.837 111.648 314.761 114.576C317.685 117.505 318.472 121.11 317.122 125.391C315.773 129.672 314.536 133.727 313.411 137.557C312.287 141.387 313.074 144.992 315.773 148.372C318.472 151.751 319.821 155.243 319.821 158.848C319.821 162.453 320.608 166.171 322.183 170.001Z"
  const EYE   = "M63.1562 85.3432C63.1562 85.3432 63.1562 70.4788 94.5741 70.4788C125.992 70.4788 125.992 85.3432 125.992 85.3432C125.992 85.3432 125.992 100.208 94.5741 100.208C63.1562 100.208 63.1562 85.3432 63.1562 85.3432Z"
  const EYE_R = "M198.621 85.3432C198.621 85.3432 198.621 70.4788 230.039 70.4788C261.457 70.4788 261.457 85.3432 261.457 85.3432C261.457 85.3432 261.457 100.208 230.039 100.208C198.621 100.208 198.621 85.3432 198.621 85.3432Z"
  const ox = irisOff.x * (325 / 226)
  const oy = irisOff.y * (331 / 230)

  const ducking = exitPhase === 'duck' || exitPhase === 'reveal' || !monsterReady
  const isMobileTitle = window.innerWidth < 768
  const outerStyle = (z) => ({
    position: 'absolute', bottom: 0, left: '50%',
    width: 'min(100vw, 96vh)',
    transform: ducking
      ? 'translateX(-50%) translateY(110%)'
      : isNear
        ? `translateX(-50%) translateY(${isMobileTitle ? 55 : 74}%)`
        : `translateX(-50%) translateY(${isMobileTitle ? 38 : 66}%)`,
    transition: 'transform 0.42s cubic-bezier(.34,1,.5,1)',
    pointerEvents: 'none', zIndex: z,
  })
  const breathStyle = { animation: 'tomaBreath 3.5s ease-in-out infinite', transformOrigin: 'center bottom' }

  return (
    <div className="fill-viewport" style={{
      position: 'relative',
      background: '#254CA4',
      overflow: 'hidden',
      fontFamily: "'Manrope', sans-serif",
    }}>
      {/* z:0 — cave mouth rings, arcs exit the screen at the bottom */}
      <svg width="100%" height="160" viewBox="0 0 1280 160"
        style={{ position: 'absolute', bottom: 0, left: 0, zIndex: 0, display: 'block', overflow: 'visible', pointerEvents: 'none' }}
      >
        <ellipse cx="640" cy="280" rx="1160" ry="220" fill="#1A3280" />
        <ellipse cx="640" cy="310" rx="1100" ry="210" fill="#223152" />
      </svg>

      {/* z:1 — body blob (behind title text), breathes */}
      <div style={outerStyle(1)}>
        <div style={breathStyle}>
          <svg width="100%" viewBox="0 0 325 331" fill="none">
            <path d={BODY} fill={bodyColor} />
          </svg>
        </div>
      </div>

      {/* z:2 — TOMA! letters + subtitle */}
      <div style={{
        position: 'absolute', top: '4vh', left: 0, right: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 14, zIndex: 2,
        opacity: (contentReady && !exitPhase) ? 1 : 0,
        transform: contentEntered ? 'translateY(0)' : 'translateY(-80px)',
        transition: 'opacity 0.4s ease, transform 0.65s cubic-bezier(0.22,1,0.36,1)',
        pointerEvents: 'none',
      }}>
        {/* Letter row in a fixed-height container so hover pops don't shift subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.01em', height: 'clamp(72px, 15.5vw, 215px)' }}>
          {LETTERS.map((l, i) => (
            <span
              key={i}
              onMouseEnter={() => setHoveredLetter(i)}
              onMouseLeave={() => setHoveredLetter(null)}
              style={{
                fontFamily: "'Gasoek One', sans-serif",
                fontSize: 'clamp(64px, 14vw, 200px)',
                color: '#FFFFFF', lineHeight: 1,
                display: 'inline-block', userSelect: 'none', cursor: 'default',
                pointerEvents: 'auto',
                transform: hoveredLetter === i
                  ? `rotate(${l.r * 2.8}deg) translateY(-14px) scale(1.3)`
                  : `rotate(${l.r}deg) translateY(${l.dy}px)`,
                transition: 'transform 0.18s cubic-bezier(.34,1.6,.5,1)',
              }}
            >{l.ch}</span>
          ))}
        </div>
        <div style={{
          fontSize: 13, fontWeight: 700,
          color: 'rgba(255,255,255,0.6)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>Create a Personal Collection</div>
      </div>

      {/* z:4 — Start button always above Toma's face */}
      <div style={{
        position: 'absolute', top: '4vh', left: 0, right: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        zIndex: 4, pointerEvents: 'none',
        opacity: (contentReady && !exitPhase) ? 1 : 0,
        transform: contentEntered ? 'translateY(0)' : 'translateY(-80px)',
        transition: 'opacity 0.4s ease, transform 0.65s cubic-bezier(0.22,1,0.36,1)',
      }}>
        <div style={{ height: 'clamp(72px, 15.5vw, 215px)' }} />
        <div style={{ height: 14 }} />
        <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4, visibility: 'hidden' }} aria-hidden>
          Create a Personal Collection
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); handleClick() }}
          onMouseEnter={() => setBtnHover(true)}
          onMouseLeave={() => setBtnHover(false)}
          style={{
            marginTop: 8, background: '#0F1E4A', color: '#FFFFFF',
            border: 'none', borderRadius: 14, padding: '13px 36px',
            fontSize: 14, fontWeight: 700,
            fontFamily: "'Manrope', sans-serif",
            letterSpacing: '0.06em', cursor: 'pointer',
            pointerEvents: 'auto',
            transform: btnHover ? 'scale(1.1) translateY(-3px)' : 'scale(1) translateY(0)',
            boxShadow: btnHover ? '0 10px 28px rgba(0,0,0,0.45)' : '0 4px 12px rgba(0,0,0,0.25)',
            transition: 'transform 0.18s cubic-bezier(.34,1.6,.5,1), box-shadow 0.18s ease',
          }}
        >Start</button>
      </div>

      {/* z:3 — face / eyes (in front of title text), breathes in sync */}
      <div ref={faceRef} style={outerStyle(3)}>
        <div style={breathStyle}>
          <svg width="100%" viewBox={TOMA_FACE_VIEWBOX} fill="none" style={{ overflow: 'visible' }}>
            <rect x="158.348" y="116.244" width="5.49186" height="9.15309" fill="#FDF8EF" />
            <line x1="166.586" y1="129.974" x2="155.602" y2="129.974" stroke={accentColor} strokeWidth="9.15309" />
            <path d={EYE} fill="#FDF8EF" />
            <mask id="ts-eye-l" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="63" y="70" width="63" height="31">
              <path d={EYE} fill="white" />
            </mask>
            <g mask="url(#ts-eye-l)">
              <circle cx={94.5741 + ox} cy={85.3432 + oy} r="17" fill="#1C1C2E" />
            </g>
            <path d={EYE_R} fill="#FDF8EF" />
            <mask id="ts-eye-r" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="198" y="70" width="64" height="31">
              <path d={EYE_R} fill="white" />
            </mask>
            <g mask="url(#ts-eye-r)">
              <circle cx={230.039 + ox} cy={85.3432 + oy} r="17" fill="#1C1C2E" />
            </g>
            <rect x="133.881" y="99.7687" width="54.0033" height="25.6287" rx="12.8143" fill={accentColor} />
            <line x1="161.433" y1="123.285" x2="140.381" y2="142.507" stroke={accentColor} strokeWidth="9.15309" />
            <line y1="-4.57655" x2="28.5072" y2="-4.57655" transform="matrix(0.738486 0.674269 0.674269 -0.738486 163.84 119.906)" stroke={accentColor} strokeWidth="9.15309" />
            <MonsterHatGraphic hat={hat} hatColorKey={hatColorKey} />
          </svg>
        </div>
      </div>
    </div>
  )
}


export { TitleScreen }
