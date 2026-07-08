import { useId, useState, useEffect, useRef } from 'react'
import { MonsterHatGraphic, TOMA_FACE_VIEWBOX } from './hats.jsx'

// ─── Scene pieces ──────────────────────────────────────────────────────────────

function VerticalBook({ b, active, grabbed, onEnter, onLeave, onClick }) {
  const titleLen = (b.title || '').length
  const spineFontSize = Math.max(7, Math.min(12, Math.floor((b.h - 16) / (titleLen * 0.62))))
  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={{
        height: b.h, width: b.w, flex: '0 0 auto',
        cursor: 'pointer', position: 'relative',
        zIndex: active ? 7 : 1,
        visibility: grabbed ? 'hidden' : 'visible',
      }}
    >
      <div style={{
        width: '100%', height: '100%',
        background: b.spine, borderRadius: '3px 3px 2px 2px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: active
          ? '0 12px 22px rgba(60,30,10,0.32), 0 0 0 3px rgba(253,248,239,0.5)'
          : 'inset -3px 0 6px rgba(0,0,0,0.18), 0 2px 3px rgba(0,0,0,0.12)',
        transform: active ? 'translateY(-14px) scale(1.04)' : 'none',
        transition: 'transform .26s cubic-bezier(.34,1.56,.64,1), box-shadow .2s ease',
      }}>
        <span style={{
          writingMode: 'vertical-rl', textOrientation: 'mixed', whiteSpace: 'nowrap',
          fontFamily: "'Manrope', sans-serif", fontWeight: 600, fontSize: spineFontSize,
          letterSpacing: spineFontSize < 10 ? '0' : '0.3px', color: b.ink,
          padding: '8px 0', maxHeight: b.h - 14, overflow: 'hidden',
          pointerEvents: 'none',
        }}>
          {b.title}
        </span>
      </div>
    </div>
  )
}

function HorizontalBook({ b, active, grabbed, onEnter, onLeave, onClick }) {
  const titleLen = (b.title || '').length
  const spineFontSize = Math.max(7, Math.min(11, Math.floor((b.w * 0.92) / (titleLen * 0.6))))
  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={{
        height: b.h, width: '100%',
        cursor: 'pointer', position: 'relative',
        zIndex: active ? 7 : 1,
        visibility: grabbed ? 'hidden' : 'visible',
      }}
    >
      <div style={{
        width: '100%', height: '100%',
        background: b.spine, borderRadius: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: active
          ? '0 8px 16px rgba(60,30,10,0.3), 0 0 0 3px rgba(253,248,239,0.5)'
          : 'inset 0 -2px 4px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.12)',
        transform: active ? 'translateX(10px) scale(1.02)' : 'none',
        transition: 'transform .24s cubic-bezier(.34,1.56,.64,1), box-shadow .2s ease',
      }}>
        <span style={{
        fontFamily: "'Manrope', sans-serif", fontWeight: 600, fontSize: spineFontSize,
        letterSpacing: spineFontSize < 9 ? '0' : '0.3px', color: b.ink,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        maxWidth: '92%', pointerEvents: 'none',
      }}>
        {b.title}
      </span>
      </div>
    </div>
  )
}


// ─── Cave Background ──────────────────────────────────────────────────────────

function CaveBackground({ stageHeight, bookcaseBottom }) {
  // Designer-provided stalactite paths
  const s0 = "M74.6155 253.62C74.152 255.716 71.1744 255.698 70.7163 253.601C64.4127 224.737 44.6766 134.49 40.2041 115.5C34.8626 92.8196 33.9438 79.4779 26.2041 57.5C19.8108 39.3453 5.1536 11.9488 0.247626 2.96654C-0.48442 1.62625 0.495335 0 2.02251 0L143.976 0C145.328 0 146.294 1.2994 145.886 2.58796C143.193 11.1005 134.42 38.7573 128.204 57.5C120.779 79.8898 113.318 98.0528 105.204 124.5C98.4841 146.404 80.5716 226.683 74.6155 253.62Z" // 146×256
  const s1 = "M102.859 352.074C102.566 354.346 99.284 354.461 98.8697 352.208C91.6238 312.81 69.6964 194.195 62.964 164.771C54.8561 129.337 53.3026 105.384 40.7073 74.3905C30.1389 48.3849 7.39126 13.6463 0.343527 3.13907C-0.55398 1.801 0.412754 0 2.02395 0L200.827 0C202.35 0 203.341 1.59451 202.613 2.9323C194.636 17.5864 158.975 84.0543 142.253 131.4C126.427 176.211 108.321 309.864 102.859 352.074Z" // 203×354
  const s2 = "M73.7044 253.692C73.4097 255.807 70.478 256.063 69.8465 254.022C61.9545 228.526 38.8548 152.966 35.4606 131.25C31.3562 104.99 36.0402 89.1247 28.9832 63.5C23.1289 42.2428 5.96735 12.5552 0.287334 3.05267C-0.51702 1.70701 0.4639 0 2.03163 0L143.449 0C144.897 0 145.88 1.46285 145.297 2.7879C140.344 14.0404 121.938 56.3061 117.438 73C112.224 92.3399 99.4656 100.611 94.438 120C90.2288 136.233 77.6787 225.168 73.7044 253.692Z" // 146×256
  const s3 = "M74.5829 252.363C74.2718 254.539 71.2002 254.656 70.6747 252.521C64.0989 225.813 46.4234 153.287 43.0963 132C38.992 105.74 29.1533 92.6247 22.0963 67C16.1218 45.306 3.77836 12.3229 0.132101 2.71448C-0.366065 1.40174 0.606211 0 2.0103 0L142.906 0C144.603 0 145.544 1.98228 144.471 3.29764C135.402 14.4146 106.483 50.7295 102.096 67C96.8825 86.3398 100.124 103.611 95.0963 123C90.962 138.944 78.781 222.998 74.5829 252.363Z" // 145×255
  const s4 = "M69.5201 263.558C69.2602 265.952 65.7368 265.931 65.4975 263.535C61.3213 221.715 51.5772 125.42 48.3856 105C44.2813 78.7402 41.4427 67.6247 34.3856 42C29.4594 24.1127 11.4324 10.7323 0.995039 4.28278C-0.813389 3.1653 0.00824489 0 2.13408 0L136.399 0C138.215 0 139.133 2.238 137.842 3.51429C129.142 12.1132 107.529 34.6311 103.386 50C98.1718 69.3399 93.4132 93.6109 88.3856 113C84.4823 128.053 74.009 222.203 69.5201 263.558Z" // 139×266
  const r3 = "M50.0688 18.8314L20.462 112.877C20.0505 114.184 19.4559 115.426 18.6959 116.566L2.43548 140.956C-1.39854 146.707 -0.640275 154.365 4.24716 159.252L48.0075 203.013C51.6247 206.63 56.8801 208.073 61.8374 206.812L162.081 181.295C163.25 180.997 164.452 180.847 165.658 180.847H293.842H387.272C393.57 180.847 399.149 176.781 401.076 170.784L410.952 140.059C413.572 131.907 408.595 123.272 400.228 121.453L381.261 117.329C374.596 115.88 369.842 109.982 369.842 103.16V45.8084C369.842 40.3162 366.739 35.2953 361.826 32.8392L317.473 10.6624C312.763 8.30743 307.146 8.69108 302.8 11.6647L240.791 54.0922C236.494 57.0321 230.951 57.4428 226.268 55.1681L166.035 25.9123C164.583 25.207 163.259 24.2641 162.117 23.1225L143.242 4.24703C137.924 -1.0713 129.422 -1.44026 123.663 3.39736L113.939 11.5648C110.703 14.2831 106.442 15.4542 102.272 14.7717L66.2412 8.87587C59.1248 7.71138 52.2341 11.9532 50.0688 18.8314Z" // 412×208
  const rk = "M100.82 21.3417L59.0205 72.3365C57.785 73.8439 56.866 75.5849 56.3185 77.4554L47.446 107.77C46.0198 112.643 42.1486 116.415 37.2403 117.714L20.5847 122.123C14.8799 123.633 10.6593 128.45 9.91194 134.304L0.620187 207.081C-0.611072 216.725 7.81051 224.825 17.399 223.218L181.128 195.792C181.807 195.678 182.494 195.613 183.182 195.596L402.148 190.443L670.055 195.276C679.648 195.449 686.762 186.424 684.351 177.136L684.098 176.161C683.475 173.761 683.479 171.24 684.108 168.841L685.485 163.589C687.511 155.865 682.911 147.957 675.196 145.9L647.265 138.452C645.212 137.905 643.064 137.815 640.973 138.189L583.8 148.429C579.583 149.185 575.248 148.037 571.958 145.293L559.683 135.059C556.197 132.151 551.55 131.045 547.127 132.069L524.762 137.247C523.69 137.495 522.592 137.621 521.491 137.621H479.863C473.985 137.621 468.689 134.072 466.453 128.636L461.014 115.412C459.218 111.043 455.406 107.824 450.798 106.783L433.219 102.814C429.343 101.939 425.996 99.511 423.96 96.0983L416.717 83.9566C413.417 78.4238 406.862 75.7321 400.625 77.3489L371.501 84.8998C363.626 86.9413 355.613 82.1069 353.748 74.189L346.341 42.7522C345.011 37.105 340.442 32.7946 334.727 31.7945L307.02 26.9456C305.124 26.6139 303.313 25.9095 301.697 24.8651C282.49 12.4558 263.287 -0.913907 257.148 0.620778C251.432 2.04974 221.894 24.3233 203.297 38.8047C199.444 41.8042 194.359 42.6911 189.728 41.1472L116.619 16.7777C110.916 14.8766 104.631 16.6921 100.82 21.3417Z" // 687×224

  // Places a stalactite rotated 180° as a stalagmite growing up from the floor
  const stalagmite = (path, x, sc, W, H) => (
    <g transform={`translate(${x},${stageHeight - H * sc}) scale(${sc}) rotate(180,${W / 2},${H / 2})`}>
      <path d={path} fill="#19243D" />
    </g>
  )

  // Per-drip keyframes: each drop fades in, falls to bookcaseBottom, then disappears at splash
  const dripKeyframes = [
    [61, 299], [178, 254], [267, 164], [898, 203], [1003, 238],
  ].map(([cx, cy]) => {
    const travelY = Math.max(1, bookcaseBottom - cy)
    const arr = ((travelY / 2200) * 24).toFixed(2)
    const fade = (parseFloat(arr) + 0.5).toFixed(2)
    const reset = (parseFloat(arr) + 0.6).toFixed(2)
    return `@keyframes drip_${cx}{0%{transform:translateY(0);opacity:0}2%{opacity:0.85}${arr}%{transform:translateY(${travelY}px);opacity:0.85}${fade}%{opacity:0}${reset}%{transform:translateY(0);opacity:0}100%{transform:translateY(0);opacity:0}}`
  }).join('')

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: dripKeyframes }} />
      <svg
        width="1080" height={stageHeight}
        viewBox={`0 0 1080 ${stageHeight}`}
        style={{ position: 'absolute', left: 0, top: 0, zIndex: 0, pointerEvents: 'none', overflow: 'visible' }}
        xmlns="http://www.w3.org/2000/svg"
      >
      {/* ── Cave ceiling — layered rock strata, mostly flat with organic drops ── */}
      {/* back layer: deeper shadow, bumps offset from main layer */}
      <path d="M0,0 H1080 V20 Q920,30 800,20 L560,20 Q460,34 360,20 L160,20 Q80,26 0,20 Z" fill="#151F35" />
      {/* main rock surface: long flat zones with 4 asymmetric drops */}
      <path d="M0,0 H1080 V22 L1040,22 Q1000,30 960,22 L880,22 Q828,56 778,22 L660,22 Q572,36 482,22 L298,22 Q240,46 180,22 L0,22 Z" fill="#19243D" />

      {/* ── Stalactites (ceiling, left cluster) ── */}
      {/* s1 largest, partially off-left */}
      <g transform="translate(-25,0) scale(0.85)"><path d={s1} fill="#19243D" /></g>
      {/* s0 main left */}
      <g transform="translate(105,0)"><path d={s0} fill="#19243D" /></g>
      {/* s3 smaller, overlapping */}
      <g transform="translate(220,0) scale(0.65)"><path d={s3} fill="#19243D" /></g>

      {/* ── Stalactites (ceiling, right cluster) ── */}
      <g transform="translate(840,0) scale(0.8)"><path d={s2} fill="#19243D" /></g>
      <g transform="translate(940,0) scale(0.9)"><path d={s4} fill="#19243D" /></g>
      {/* s1 partially off-right */}
      <g transform="translate(1015,0) scale(0.75)"><path d={s1} fill="#19243D" /></g>

      {/* ── Water drips from stalactite tips ── */}
      {(() => {
        // Each entry: [cx, cy, r, cycle(s), initDelay(s)]
        const drips = [
          [61,   299, 4,   45, 5 ],  // s1 left large
          [178,  254, 3.5, 60, 22],  // s0 main left
          [267,  164, 3,   36, 11],  // s3 small left
          [898,  203, 3,   48, 28],  // s2 right
          [1003, 238, 3.5, 50, 38],  // s4 right
        ]
        return drips.flatMap(([cx, cy, r, cycle, delay]) => {
          // splashDelay: fires when drop reaches bookcaseBottom (arr% into cycle = travelY/2200*24%)
          const splashDelay = (delay + (bookcaseBottom - cy) / 2200 * 0.24 * cycle).toFixed(2)
          const sy = bookcaseBottom
          return [
            // falling drip
            <circle key={`d-${cx}`} cx={cx} cy={cy} r={r} fill="#19243D"
              style={{ animation: `drip_${cx} ${cycle}s linear ${delay}s infinite` }} />,
            // splash droplets — water crown pattern
            ...['splashDrop_C','splashDrop_LC','splashDrop_RC','splashDrop_L1','splashDrop_R1','splashDrop_LS','splashDrop_RS','splashDrop_L2','splashDrop_R2','splashDrop_FL','splashDrop_FR'].map((anim, i) => (
              <circle key={`sp-${cx}-${i}`} cx={cx} cy={sy}
                r={i === 0 ? 3 : i < 3 ? 2.8 : i < 5 ? 2.5 : i < 7 ? 2 : i < 9 ? 2 : 1.5}
                fill="#19243D"
                style={{ animation: `${anim} ${cycle}s linear ${splashDelay}s infinite` }} />
            )),
          ]
        })
      })()}

      {/* ── Stalagmites (floor, left) ── */}
      {stalagmite(s2, -30, 0.65, 146, 256)}
      {stalagmite(s4,  85, 0.55, 139, 266)}

      {/* ── Stalagmites (floor, right) ── */}
      {stalagmite(s3, 918, 0.75, 145, 255)}
      {stalagmite(s0, 1010, 0.6, 146, 256)}

      {/* ── Floor rocks ── */}
      {/* rock-3 at bottom left */}
      <g transform={`translate(-50,${stageHeight - Math.round(208 * 0.6)}) scale(0.6)`}>
        <path d={r3} fill="#19243D" />
      </g>
      {/* Rock mirrored at bottom right */}
      <g transform={`translate(${1080 + 50},${stageHeight - Math.round(224 * 0.5)}) scale(-0.5,0.5)`}>
        <path d={rk} fill="#19243D" />
      </g>
      </svg>
    </>
  )
}


// ─── PoofSmoke — cartoon SVG smoke cloud that covers the bookshelf ───────────

function PoofSmoke({ top, h }) {
  const W = 624
  // Merged into one shape via SVG filter — single animation instead of 13
  const circles = [
    { cx: W*.50, cy: h*.18, r: 215 },
    { cx: W*.16, cy: h*.20, r: 195 },
    { cx: W*.84, cy: h*.20, r: 200 },
    { cx: W*.30, cy: h*.46, r: 205 },
    { cx: W*.72, cy: h*.44, r: 198 },
    { cx: W*.50, cy: h*.56, r: 210 },
    { cx: W*.10, cy: h*.66, r: 188 },
    { cx: W*.90, cy: h*.64, r: 192 },
    { cx: W*.38, cy: h*.76, r: 200 },
    { cx: W*.68, cy: h*.78, r: 194 },
    { cx: W*.23, cy: h*.36, r: 180 },
    { cx: W*.77, cy: h*.34, r: 182 },
    { cx: W*.50, cy: h*.36, r: 190 },
  ]
  return (
    <svg width={W} height={h} viewBox={`0 0 ${W} ${h}`}
      style={{ position: 'absolute', left: 228, top, zIndex: 100, pointerEvents: 'none', overflow: 'visible' }}>
      <defs>
        {/* Blur + threshold the alpha to weld all circles into one solid blob */}
        <filter id="poof-merge" x="-20%" y="-40%" width="140%" height="180%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="16" result="blur" />
          <feColorMatrix in="blur" type="matrix"
            values="0 0 0 0 0.957  0 0 0 0 0.929  0 0 0 0 0.878  0 0 0 22 -10" />
        </filter>
      </defs>
      <g filter="url(#poof-merge)"
        style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'smokePuff 1080ms ease-in-out both' }}>
        {circles.map((c, i) => <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill="#f4ede0" />)}
      </g>
    </svg>
  )
}


// ─── TomaHead — inline SVG so irises can be driven by React state ────────────

function TomaHead({ irisOff, style, onMouseEnter, bodyColor = '#72FF5D', accentColor = '#3BD424', hat = 'none', hatColorKey = 'red', mouthReactGen = 0, blinkAnim = 'none' }) {
  const uid = useId().replace(/:/g, '')
  const maskL = `toma-eye-l-${uid}`
  const maskR = `toma-eye-r-${uid}`
  const [cornerLift, setCornerLift] = useState(0)
  const mouthAnimRef = useRef(null)

  useEffect(() => {
    if (mouthReactGen === 0) return
    let start = null
    const duration = 1500
    const mouthLiftAt = (t) => {
      const riseEnd = 0.16
      const holdEnd = 0.8
      const smooth = p => p * p * (3 - 2 * p)
      if (t < riseEnd) return smooth(t / riseEnd)
      if (t < holdEnd) return 1
      return 1 - smooth((t - holdEnd) / (1 - holdEnd))
    }
    const tick = (now) => {
      if (start === null) start = now
      const t = Math.min(1, (now - start) / duration)
      setCornerLift(mouthLiftAt(t))
      if (t < 1) mouthAnimRef.current = requestAnimationFrame(tick)
      else setCornerLift(0)
    }
    if (mouthAnimRef.current) cancelAnimationFrame(mouthAnimRef.current)
    mouthAnimRef.current = requestAnimationFrame(tick)
    return () => { if (mouthAnimRef.current) cancelAnimationFrame(mouthAnimRef.current) }
  }, [mouthReactGen])

  const l = cornerLift
  const mouthApex = { x: 161.433, y: 123.285 }
  const mouthLeft = { x: 140.381, y: 142.507 }
  const mouthRight = { x: 182.485, y: 142.507 }
  const centerDip = 5.2 * l
  const mouthOpen = 4.2 * l
  const leftCorner = {
    x: mouthLeft.x + 2.5 * l,
    y: mouthLeft.y - 3.2 * l,
  }
  const rightCorner = {
    x: mouthRight.x - 2.5 * l,
    y: mouthRight.y - 3.2 * l,
  }
  const dipL = {
    x: mouthLeft.x + 0.45 * (mouthApex.x - mouthLeft.x),
    y: mouthLeft.y + 0.45 * (mouthApex.y - mouthLeft.y) + centerDip,
  }
  const dipR = {
    x: mouthRight.x + 0.45 * (mouthApex.x - mouthRight.x),
    y: mouthRight.y + 0.45 * (mouthApex.y - mouthRight.y) + centerDip,
  }
  const mouthCenterY = 129.974 + mouthOpen
  const mouthPath = `M ${leftCorner.x} ${leftCorner.y} L ${dipL.x} ${dipL.y} L ${mouthApex.x} ${mouthApex.y} L ${dipR.x} ${dipR.y} L ${rightCorner.x} ${rightCorner.y}`
  const ox = irisOff.x * (325 / 226)
  const oy = irisOff.y * (331 / 230)
  const EYE = "M63.1562 85.3432C63.1562 85.3432 63.1562 70.4788 94.5741 70.4788C125.992 70.4788 125.992 85.3432 125.992 85.3432C125.992 85.3432 125.992 100.208 94.5741 100.208C63.1562 100.208 63.1562 85.3432 63.1562 85.3432Z"
  const EYE_R = "M198.621 85.3432C198.621 85.3432 198.621 70.4788 230.039 70.4788C261.457 70.4788 261.457 85.3432 261.457 85.3432C261.457 85.3432 261.457 100.208 230.039 100.208C198.621 100.208 198.621 85.3432 198.621 85.3432Z"
  const blinkClass = blinkAnim === 'squint' ? 'toma-eye-lid--squint' : blinkAnim === 'blink' ? 'toma-eye-lid--blink' : ''
  return (
    <svg width="100%" height="100%" viewBox={TOMA_FACE_VIEWBOX} fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', overflow: 'visible', ...style }} onMouseEnter={onMouseEnter}>
      <path d="M322.183 170.001C323.757 173.831 324.319 177.661 323.87 181.491C323.42 185.321 322.295 188.926 320.496 192.306C318.697 195.685 317.347 199.177 316.448 202.782C315.548 206.387 315.211 210.217 315.435 214.272C315.66 218.328 314.873 222.045 313.074 225.425C311.275 228.804 308.688 231.733 305.315 234.212C301.941 236.69 300.142 240.069 299.917 244.35C299.692 248.631 297.893 251.785 294.519 253.813C291.145 255.841 288.671 258.657 287.097 262.262C285.523 265.866 284.173 269.697 283.049 273.752C281.924 277.807 278.775 279.835 273.602 279.835C268.429 279.835 264.269 280.849 261.12 282.877C257.971 284.904 255.497 287.721 253.698 291.326C251.899 294.93 248.862 296.733 244.589 296.733C240.316 296.733 237.055 298.31 234.805 301.464C232.556 304.618 229.52 306.533 225.697 307.209C221.873 307.885 218.724 310.138 216.25 313.968C213.776 317.799 210.628 319.826 206.804 320.052C202.981 320.277 199.27 320.84 195.671 321.741C192.073 322.643 188.474 323.656 184.876 324.783C181.277 325.909 177.678 327.487 174.08 329.514C170.481 331.542 166.77 330.19 162.947 325.459C159.123 320.727 155.3 320.277 151.477 324.107C147.653 327.937 144.055 328.162 140.681 324.783C137.307 321.403 133.821 319.376 130.223 318.7C126.624 318.024 123.363 316.447 120.439 313.968C117.515 311.49 114.366 309.688 110.993 308.561C107.619 307.435 103.796 307.322 99.5224 308.223C95.2492 309.124 92.1004 307.66 90.0762 303.83C88.052 300 84.6784 298.535 79.9553 299.436C75.2322 300.338 71.971 298.761 70.1717 294.705C68.3725 290.65 65.1113 288.735 60.3882 288.96C55.6651 289.185 52.6288 287.27 51.2794 283.215C49.9299 279.159 46.8936 276.794 42.1705 276.118C37.4474 275.442 35.3108 272.513 35.7606 267.331C36.2104 262.149 35.8731 257.756 34.7485 254.151C33.624 250.546 29.8005 248.631 23.2781 248.406C16.7558 248.18 15.0689 245.139 18.2177 239.281C21.3664 233.423 21.9287 229.03 19.9045 226.101C17.8803 223.172 14.7316 220.468 10.4583 217.99C6.18501 215.512 3.93592 212.357 3.71101 208.527C3.4861 204.697 4.16082 200.754 5.73519 196.699C7.30956 192.643 7.75938 188.926 7.08465 185.546C6.40992 182.167 5.06046 178.675 3.03628 175.07C1.01209 171.465 0.224909 167.86 0.674728 164.255C1.12455 160.651 1.12455 156.933 0.674728 153.103C0.224909 149.273 0 145.555 0 141.951C0 138.346 0 134.628 0 130.798C0 126.968 1.57437 123.476 4.7231 120.322C7.87183 117.167 9.89602 113.788 10.7957 110.183C11.6953 106.578 13.607 103.537 16.5308 101.058C19.4547 98.58 20.4668 94.9752 19.5671 90.2439C18.6675 85.5125 20.1294 82.2457 23.9529 80.4432C27.7763 78.6408 29.688 75.374 29.688 70.6426C29.688 65.9113 32.2745 63.433 37.4474 63.2077C42.6203 62.9824 45.8815 60.9547 47.231 57.1245C48.5804 53.2944 49.9299 49.3516 51.2794 45.2962C52.6288 41.2408 54.8779 38.0865 58.0266 35.8335C61.1754 33.5805 64.7739 32.2287 68.8223 31.7781C72.8707 31.3275 76.8066 30.8769 80.63 30.4263C84.4535 29.9757 87.9396 28.9618 91.0883 27.3847C94.2371 25.8076 97.1609 23.6672 99.8598 20.9636C102.559 18.26 105.145 14.6552 107.619 10.1491C110.093 5.6431 113.242 3.27743 117.065 3.05213C120.889 2.82683 124.825 2.71418 128.873 2.71418C132.921 2.71418 136.857 4.17864 140.681 7.10756C144.504 10.0365 148.215 10.825 151.814 9.47323C155.412 8.12142 159.123 5.75575 162.947 2.37623C166.77 -1.0033 170.369 -0.777995 173.743 3.05213C177.116 6.88226 180.715 8.34672 184.538 7.44552C188.362 6.54431 192.185 6.20636 196.009 6.43166C199.832 6.65696 203.768 6.31901 207.816 5.4178C211.865 4.51659 215.238 5.8684 217.937 9.47323C220.636 13.0781 224.01 15.2184 228.058 15.8943C232.107 16.5702 234.918 19.1612 236.492 23.6672C238.067 28.1733 240.653 30.9895 244.252 32.116C247.85 33.2426 251.786 34.0311 256.059 34.4817C260.333 34.9323 263.706 36.6221 266.18 39.551C268.654 42.4799 270.679 45.8594 272.253 49.6896C273.827 53.5197 276.976 55.7727 281.699 56.4486C286.422 57.1245 288.896 59.7155 289.121 64.2215C289.346 68.7276 291.82 71.7691 296.543 73.3462C301.266 74.9234 303.965 77.7396 304.64 81.7951C305.315 85.8505 305.989 89.7933 306.664 93.6234C307.339 97.4535 308.126 101.171 309.026 104.776C309.925 108.381 311.837 111.648 314.761 114.576C317.685 117.505 318.472 121.11 317.122 125.391C315.773 129.672 314.536 133.727 313.411 137.557C312.287 141.387 313.074 144.992 315.773 148.372C318.472 151.751 319.821 155.243 319.821 158.848C319.821 162.453 320.608 166.171 322.183 170.001Z" fill={bodyColor} />
      <rect x="158.348" y="116.244" width="5.49186" height="9.15309" fill="#FDF8EF" />
      <line x1="166.586" y1={mouthCenterY} x2="155.602" y2={mouthCenterY} stroke={accentColor} strokeWidth="9.15309" strokeLinecap="round" />
      {/* left eye */}
      <path d={EYE} fill="#FDF8EF" />
      <mask id={maskL} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="63" y="70" width="63" height="31">
        <path d={EYE} fill="white" />
      </mask>
      <g mask={`url(#${maskL})`}>
        <circle cx={94.5741 + ox} cy={85.3432 + oy} r="17" fill="#1C1C2E" />
      </g>
      {/* right eye */}
      <path d={EYE_R} fill="#FDF8EF" />
      <mask id={maskR} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="198" y="70" width="64" height="31">
        <path d={EYE_R} fill="white" />
      </mask>
      <g mask={`url(#${maskR})`}>
        <circle cx={230.039 + ox} cy={85.3432 + oy} r="17" fill="#1C1C2E" />
      </g>
      <rect x="133.881" y="99.7687" width="54.0033" height="25.6287" rx="12.8143" fill={accentColor} />
      <path
        d={mouthPath}
        stroke={accentColor}
        strokeWidth="9.15309"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {blinkAnim !== 'none' && (
        <>
          <g className={`toma-eye-lid ${blinkClass}`}>
            <rect x="63" y="70" width="63" height="31" fill={bodyColor} />
          </g>
          <g className={`toma-eye-lid ${blinkClass}`}>
            <rect x="198" y="70" width="64" height="31" fill={bodyColor} />
          </g>
        </>
      )}
      <MonsterHatGraphic hat={hat} hatColorKey={hatColorKey} />
    </svg>
  )
}


export { VerticalBook, HorizontalBook, CaveBackground, PoofSmoke, TomaHead }
export { MonsterHatGraphic, TOMA_FACE_VIEWBOX, TOMA_HEAD_VIEWBOX } from './hats.jsx'
