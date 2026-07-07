import { useState, useEffect, useRef } from 'react'
import { mapOpenLibraryBook } from '../lib/openLibrary.js'
import { ROYGBIV } from '../data/shelves.jsx'
import { IconBooks, IconOpenBook, IconTrash, IconPencil, IconClose, IconCheck, IconLeaf } from './icons.jsx'
import { PlacedFlower, PlacedFlower2, PlacedCoffeeCup, PlacedLight, PlacedClock } from './decor.jsx'

// ─── SidePanelButtons ─────────────────────────────────────────────────────────

function SidePanelButtons({ editDragging, onBook, onDecor, onShelves, isEditMode, inventory = [], onInventoryItemPlace, flashInventory = false, isMobile = false, onToggleEdit, onShare, showShare = false }) {
  const [invHover, setInvHover] = useState(false)

  useEffect(() => {
    if (document.getElementById('inv-flash-kf')) return
    const s = document.createElement('style')
    s.id = 'inv-flash-kf'
    s.textContent = `
      @keyframes invShake {
        0%   { transform: rotate(0deg); }
        20%  { transform: rotate(-2deg); }
        40%  { transform: rotate(2deg); }
        60%  { transform: rotate(-1.5deg); }
        80%  { transform: rotate(1deg); }
        100% { transform: rotate(0deg); }
      }
      @keyframes invPulse {
        0%, 100% { background: rgba(253,248,239,0.13); color: rgba(253,248,239,0.55); }
        50%       { background: rgba(114,255,93,0.18);  color: rgba(114,255,93,0.9); }
      }
    `
    document.head.appendChild(s)
  }, [])

  const btnSize = isMobile ? 64 : 88
  const btnBase = {
    width: btnSize, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    padding: isMobile ? '10px 6px' : '16px 8px', border: 'none', borderRadius: 16, cursor: 'pointer',
    fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: isMobile ? 12 : 14,
    transition: 'transform .12s',
    ...(isMobile ? { pointerEvents: 'auto' } : {}),
  }
  const onHover  = e => { e.currentTarget.style.transform = 'scale(1.06)' }
  const offHover = e => { e.currentTarget.style.transform = '' }

  // Mobile: wraps each footer button so it can slide/collapse as build mode toggles
  const slide = show => ({
    width: show ? btnSize : 0,
    marginRight: show ? 12 : 0,
    opacity: show ? 1 : 0,
    transform: show ? 'scale(1) translateY(0)' : 'scale(0.7) translateY(16px)',
    pointerEvents: show ? 'auto' : 'none',
    overflow: show ? 'visible' : 'hidden',
    transition: 'width .35s cubic-bezier(0.22,1,0.36,1), margin .35s cubic-bezier(0.22,1,0.36,1), opacity .25s ease, transform .35s cubic-bezier(0.22,1,0.36,1)',
    flexShrink: 0,
  })

  const containerStyle = isMobile ? {
    // Central footer — always present; individual buttons slide in/out with build mode.
    // Hidden while dragging so it doesn't block the drop area.
    position: 'fixed', bottom: 20, left: '50%',
    display: 'flex', flexDirection: 'row', alignItems: 'flex-end',
    zIndex: 48,
    transform: 'translateX(-50%)',
    opacity: !editDragging ? 1 : 0,
    transition: 'opacity 0.2s ease',
    pointerEvents: 'none',
  } : {
    position: 'fixed', right: 24, top: '50%',
    display: 'flex', flexDirection: 'column', gap: 14,
    zIndex: 48,
    transform: isEditMode ? 'translateY(-50%) translateX(0)' : 'translateY(-50%) translateX(130px)',
    opacity: isEditMode && !editDragging ? 1 : 0,
    transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease',
    pointerEvents: isEditMode && !editDragging ? 'auto' : 'none',
  }

  return (
    <div style={containerStyle}>
      {/* Build / Done — mobile footer only (desktop keeps the header toggle).
          Padding is reduced by the 3px border width so the button matches the height
          of the borderless Book/Decor buttons beside it. */}
      {isMobile && (
        <div style={slide(true)}>
          <button onClick={onToggleEdit} style={{
            ...btnBase,
            padding: '7px 3px',
            background: isEditMode
              ? '#FFD700'
              : 'linear-gradient(#2A2A2A, #2A2A2A) padding-box, repeating-linear-gradient(-45deg, #FFD700, #FFD700 7px, #1C1C1C 7px, #1C1C1C 14px) border-box',
            border: '3px solid transparent',
            color: isEditMode ? '#1C1C2E' : '#FDF8EF',
          }}>
            {isEditMode
              ? <IconCheck size={22} color="#1C1C2E" />
              : <IconPencil size={22} color="#FDF8EF" />}
            <span>{isEditMode ? 'Done' : 'Build'}</span>
          </button>
        </div>
      )}
      <div style={isMobile ? slide(isEditMode) : undefined}>
        <button onClick={onBook} style={{ ...btnBase, background: '#254CA4', color: '#FDF8EF' }}
          onMouseEnter={onHover} onMouseLeave={offHover}>
          <IconBooks size={isMobile ? 22 : 28} color="#FDF8EF" />
          <span>Book</span>
        </button>
      </div>
      <div style={isMobile ? slide(isEditMode) : undefined}>
        <button onClick={onDecor} style={{ ...btnBase, background: '#254CA4', color: '#FDF8EF' }}
          onMouseEnter={onHover} onMouseLeave={offHover}>
          <IconLeaf size={isMobile ? 22 : 28} color="#FDF8EF" />
          <span>Decor</span>
        </button>
      </div>
      {/* Edit shelf — opens the shelf manager overlay (add / rename / delete / reorder).
          Mobile: sits between Decor and Share in the sliding footer.
          Desktop: added as another vertical button in the right-side stack. */}
      {isMobile ? (
        <div style={slide(isEditMode)}>
          <button onClick={onShelves} style={{ ...btnBase, background: '#254CA4', color: '#FDF8EF' }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M3 6.5H19" stroke="#FDF8EF" strokeWidth="2" strokeLinecap="round" />
              <path d="M3 12.5H19" stroke="#FDF8EF" strokeWidth="2" strokeLinecap="round" />
              <path d="M3 18.5H19" stroke="#FDF8EF" strokeWidth="2" strokeLinecap="round" />
              <rect x="5.5" y="8.6" width="2.6" height="3.9" rx="0.6" fill="#FDF8EF" />
              <rect x="9.3" y="8.0" width="2.6" height="4.5" rx="0.6" fill="#FDF8EF" />
              <rect x="6.6" y="2.6" width="2.6" height="3.9" rx="0.6" fill="#FDF8EF" />
              <rect x="12" y="14.6" width="2.6" height="3.9" rx="0.6" fill="#FDF8EF" />
            </svg>
            <span style={{ whiteSpace: 'nowrap', fontSize: 11 }}>Edit shelf</span>
          </button>
        </div>
      ) : (
        <button onClick={onShelves} style={{ ...btnBase, background: '#254CA4', color: '#FDF8EF' }}
          onMouseEnter={onHover} onMouseLeave={offHover}>
          <svg width="28" height="28" viewBox="0 0 22 22" fill="none">
            <path d="M3 6.5H19" stroke="#FDF8EF" strokeWidth="2" strokeLinecap="round" />
            <path d="M3 12.5H19" stroke="#FDF8EF" strokeWidth="2" strokeLinecap="round" />
            <path d="M3 18.5H19" stroke="#FDF8EF" strokeWidth="2" strokeLinecap="round" />
            <rect x="5.5" y="8.6" width="2.6" height="3.9" rx="0.6" fill="#FDF8EF" />
            <rect x="9.3" y="8.0" width="2.6" height="4.5" rx="0.6" fill="#FDF8EF" />
            <rect x="6.6" y="2.6" width="2.6" height="3.9" rx="0.6" fill="#FDF8EF" />
            <rect x="12" y="14.6" width="2.6" height="3.9" rx="0.6" fill="#FDF8EF" />
          </svg>
          <span>Shelves</span>
        </button>
      )}
      {/* Share moved to a dedicated top-right fixed button on mobile — see App root */}
      {inventory.length > 0 && (() => {
        const topItem = inventory[0]
        const stackFirst = topItem.type === 'stack' ? topItem.books?.[0] : null
        const stackRest  = topItem.type === 'stack' ? (topItem.books?.length ?? 1) - 1 : 0
        const tile = (
          <div
            onClick={() => onInventoryItemPlace(topItem)}
            onMouseEnter={() => setInvHover(true)}
            onMouseLeave={() => setInvHover(false)}
            title={topItem.type === 'book' ? topItem.book?.title : topItem.type === 'stack' ? `${stackFirst?.title ?? 'Stack'} +${stackRest}` : topItem.decorType}
            style={{
              width: isMobile ? 64 : 88, height: isMobile ? 60 : 84,
              background: 'rgba(253,248,239,0.13)',
              color: 'rgba(253,248,239,0.55)',
              outline: '2px dashed currentColor',
              outlineOffset: '5px',
              transformOrigin: 'center center',
              animation: flashInventory
                ? 'invShake 0.7s ease-in-out 0.6s 2, invPulse 1.2s ease-in-out 0.4s 3'
                : 'none',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
              pointerEvents: 'auto',
            }}
          >
            {/* Content wrapper — pops out on hover */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
              width: '100%', height: '100%',
              transform: invHover ? 'scale(1.14) translateY(-3px)' : 'scale(1) translateY(0)',
              transition: 'transform 0.22s cubic-bezier(0.34,1.6,0.5,1)',
            }}>
              {topItem.type === 'book' && (<>
                <div style={{
                  width: 16, height: 38, borderRadius: 2,
                  background: topItem.book?.spine ?? '#5A4A3A',
                  boxShadow: '3px 4px 14px rgba(0,0,0,0.55), -1px 0 0 rgba(0,0,0,0.2)',
                }} />
                <div style={{
                  fontSize: 8, fontWeight: 700, color: '#FDF8EF', opacity: 0.85,
                  maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  textAlign: 'center', fontFamily: "'Manrope', sans-serif", lineHeight: 1,
                }}>{topItem.book?.title ?? ''}</div>
              </>)}
              {topItem.type === 'stack' && (<>
                <div style={{
                  width: 16, height: 38, borderRadius: 2,
                  background: stackFirst?.spine ?? '#5A4A3A',
                  boxShadow: '3px 4px 14px rgba(0,0,0,0.55), -1px 0 0 rgba(0,0,0,0.2)',
                }} />
                <div style={{
                  fontSize: 8, fontWeight: 700, color: '#FDF8EF', opacity: 0.85,
                  maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  textAlign: 'center', fontFamily: "'Manrope', sans-serif", lineHeight: 1,
                }}>{(stackFirst?.title ?? 'Stack')}{stackRest > 0 ? ` +${stackRest}` : ''}</div>
              </>)}
              {topItem.type === 'decor' && (() => {
                const dt = topItem.decorType
                if (dt === 'flower')  return <PlacedFlower    w={26} />
                if (dt === 'flower2') return <PlacedFlower2   w={26} />
                if (dt === 'coffee')  return <PlacedCoffeeCup w={26} />
                if (dt === 'light')   return <PlacedLight     w={26} />
                if (dt === 'clock')   return <PlacedClock      w={26} />
                return null
              })()}
            </div>
          </div>
        )
        return isMobile ? <div style={slide(isEditMode)}>{tile}</div> : tile
      })()}
    </div>
  )
}

// ─── BookPreviewModal ─────────────────────────────────────────────────────────

function BookPreviewModal({ book, isSelected, onToggle, onClose }) {
  const [opened, setOpened] = useState(false)
  const [full, setFull] = useState({ description: book.description, publisher: book.publisher })

  useEffect(() => {
    const t = setTimeout(() => setOpened(true), 60)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    fetch(`https://www.googleapis.com/books/v1/volumes/${book.id}`)
      .then(r => r.json())
      .then(data => {
        const vi = data.volumeInfo ?? {}
        setFull({
          description: vi.description ?? book.description,
          publisher: vi.publisher ?? book.publisher,
        })
      })
      .catch(() => {})
  }, [book.id])

  const pageBase = {
    position: 'absolute', top: 0, height: 300, boxSizing: 'border-box',
    fontFamily: "'Manrope',sans-serif",
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(0,0,0,0.62)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseDown={onClose}
    >
      <div onMouseDown={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

        {/* Open book spread */}
        <div style={{ position: 'relative', width: 480, height: 300, perspective: '1200px' }}>

          {/* Left page — date + publisher */}
          <div style={{ ...pageBase, left: 0, width: 240, background: '#FDF8EF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '20px 24px', boxShadow: 'inset -5px 0 10px rgba(0,0,0,0.07)', borderRadius: '6px 0 0 6px' }}>
            <div style={{ width: 76, height: 108, borderRadius: 4, overflow: 'hidden', background: book.spine, boxShadow: '2px 4px 14px rgba(0,0,0,0.28)', flexShrink: 0 }}>
              {book.thumbnail && <img src={book.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
            </div>
            {book.year && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#8888A0', textTransform: 'uppercase', letterSpacing: 1.2 }}>Published</div>
                <div style={{ fontSize: 16, color: '#1C1C2E', fontWeight: 700, marginTop: 2 }}>{book.year}</div>
              </div>
            )}
            {full.publisher && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#8888A0', textTransform: 'uppercase', letterSpacing: 1.2 }}>Publisher</div>
                <div style={{ fontSize: 13, color: '#1C1C2E', fontWeight: 600, marginTop: 2, lineHeight: 1.3 }}>{full.publisher}</div>
              </div>
            )}
          </div>

          {/* Right page — description */}
          <div style={{ ...pageBase, right: 0, width: 240, background: '#FDF8EF', padding: '20px 20px 20px 18px', display: 'flex', flexDirection: 'column', gap: 6, borderRadius: '0 6px 6px 0' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1C1C2E', lineHeight: 1.25 }}>{book.title}</div>
            <div style={{ fontSize: 12, color: '#606078' }}>{book.author}</div>
            {book.category && <div style={{ fontSize: 10, color: '#8888A0', textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 2 }}>{book.category}</div>}
            <div style={{ fontSize: 12, color: '#1C1C2E', lineHeight: 1.65, overflowY: 'auto', flex: 1 }}>
              {full.description ?? 'No description available.'}
            </div>
          </div>

          {/* Spine shadow */}
          <div style={{ position: 'absolute', left: '50%', top: 0, width: 4, height: '100%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.12)', zIndex: 5, pointerEvents: 'none' }} />

          {/* Outer shadow ring */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: 6, boxShadow: '0 12px 48px rgba(0,0,0,0.4)', pointerEvents: 'none', zIndex: 5 }} />

          {/* Cover — folds open */}
          <div style={{
            position: 'absolute', left: 0, top: 0, width: 240, height: 300,
            transformOrigin: 'right center',
            transform: opened ? 'rotateY(-175deg)' : 'rotateY(0deg)',
            transition: opened ? 'transform 0.7s cubic-bezier(0.645,0.045,0.355,1.000)' : 'none',
            transformStyle: 'preserve-3d',
            zIndex: 4,
            pointerEvents: 'none',
          }}>
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', overflow: 'hidden', borderRadius: '6px 0 0 6px' }}>
              {book.thumbnail
                ? <img src={book.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <div style={{ width: '100%', height: '100%', background: book.spine, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, boxSizing: 'border-box' }}>
                    <div style={{ color: book.ink, textAlign: 'center', fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>{book.title}</div>
                  </div>
              }
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{
            padding: '10px 22px', borderRadius: 10, border: '2px solid #254CA4',
            background: '#FDF8EF', color: '#254CA4', cursor: 'pointer',
            fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 14,
          }}>Close</button>
          <button onClick={() => { onToggle(book); onClose() }} style={{
            padding: '10px 24px', borderRadius: 10, border: 'none',
            background: isSelected ? '#c0392b' : '#5a9e3f', color: '#FDF8EF', cursor: 'pointer',
            fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 14,
          }}>
            {isSelected ? <><IconClose size={12} color="currentColor" style={{ marginRight: 4, verticalAlign: 'middle' }} />Remove</> : '+ Add to shelf'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── BookAddPanel ─────────────────────────────────────────────────────────────

function BookAddPanel({ isOpen, selectedBooks, onToggleBook, onConfirm, onClose, isMobile = false }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [totalFound, setTotalFound] = useState(0)
  const [loadMoreCount, setLoadMoreCount] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const debounceRef = useRef(null)
  const colorGenRef = useRef(0)

  const applyColors = (books, gen) => {
    books.forEach(async (book) => {
      if (!book.thumbnail) return
      const rgb = await extractDominantColor(book.thumbnail)
      if (!rgb || colorGenRef.current !== gen) return
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b)
      const ink = spineInkFromRGB(rgb.r, rgb.g, rgb.b)
      setResults(prev => {
        if (colorGenRef.current !== gen) return prev
        return prev.map(b => b.id === book.id ? { ...b, spine: hex, coverBg: hex, ink, coverInk: ink } : b)
      })
    })
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const q = query.trim()
    if (q.length < 2) { setResults([]); setLoading(false); setTotalFound(0); setLoadMoreCount(0); return }
    setLoading(true)
    setSearchError(null)
    setLoadMoreCount(0)
    const controller = new AbortController()
    debounceRef.current = setTimeout(async () => {
      try {
        const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&fields=key,title,author_name,first_publish_year,cover_i,subject,first_sentence,subtitle,series_name,series_position&limit=20&offset=0`
        const r = await fetch(url, { signal: controller.signal })
        if (!r.ok) throw new Error('API error')
        const data = await r.json()
        setTotalFound(data.numFound ?? 0)
        const seen = new Set()
        const mapped = (data.docs ?? []).filter(i => i.title && i.key && !seen.has(i.key) && seen.add(i.key)).map(mapOpenLibraryBook)
        const gen = ++colorGenRef.current
        setResults(mapped)
        setLoading(false)
        applyColors(mapped, gen)
      } catch (e) {
        if (e.name !== 'AbortError') { setSearchError('Could not reach the book search. Check your connection.'); setLoading(false) }
      }
    }, 400)
    return () => { clearTimeout(debounceRef.current); controller.abort() }
  }, [query])

  const handleLoadMore = async () => {
    if (loadingMore || loadMoreCount >= 3) return
    const q = query.trim()
    setLoadingMore(true)
    try {
      const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&fields=key,title,author_name,first_publish_year,cover_i,subject,first_sentence,subtitle,series_name,series_position&limit=20&offset=${results.length}`
      const r = await fetch(url)
      if (!r.ok) throw new Error('API error')
      const data = await r.json()
      const existingIds = new Set(results.map(b => b.id))
      const newBooks = (data.docs ?? []).filter(i => i.title && i.key && !existingIds.has(i.key.replace('/works/', ''))).map(mapOpenLibraryBook)
      const gen = ++colorGenRef.current
      setResults(prev => [...prev, ...newBooks])
      setLoadMoreCount(c => c + 1)
      setLoadingMore(false)
      applyColors(newBooks, gen)
    } catch { setLoadingMore(false) }
  }

  if (!isOpen) return null
  const count = selectedBooks.length
  const canPlace = count > 0
  const hasQuery = query.trim().length >= 2

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 62 }}
      onMouseDown={onClose}
    >
      <div
        className={isMobile ? 'sheet-max-viewport' : undefined}
        style={isMobile
          ? { background: '#FDF8EF', borderRadius: '18px 18px 0 0', padding: '20px 16px', width: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 -4px 24px rgba(0,0,0,0.2)', fontFamily: "'Manrope',sans-serif", overflowY: 'auto' }
          : { background: '#FDF8EF', borderRadius: 18, padding: 28, maxWidth: 440, width: '92%', maxHeight: '84vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 40px rgba(0,0,0,0.28)', fontFamily: "'Manrope',sans-serif" }}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1C1C2E' }}>Add Books</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center' }}><IconClose size={16} color="#606078" /></button>
        </div>

        <div style={{ fontSize: 13, color: '#606078', marginBottom: 10 }}>
          {count === 0 ? 'Select up to 5 books' : `${count} of 5 books selected`}
        </div>

        {/* Search bar */}
        <input
          type="text"
          placeholder="Search by title or author…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
          style={{
            marginBottom: 12, padding: '9px 14px', borderRadius: 10,
            border: '2px solid #D0D0DC', background: 'white',
            fontFamily: "'Manrope',sans-serif", fontSize: 14, color: '#1C1C2E',
            outline: 'none', width: '100%', boxSizing: 'border-box',
            WebkitAppearance: 'none', appearance: 'none',
          }}
        />

        {/* Book list / states */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!hasQuery && (
            <div style={{ textAlign: 'center', color: '#9898B0', fontSize: 14, padding: '32px 0 16px' }}>
              <div style={{ marginBottom: 10 }}><IconOpenBook size={36} color="#9898B0" /></div>
              Search for any book to add it to your shelf
            </div>
          )}
          {hasQuery && loading && (
            <div style={{ textAlign: 'center', color: '#606078', fontSize: 14, padding: '32px 0' }}>Searching…</div>
          )}
          {hasQuery && searchError && (
            <div style={{ textAlign: 'center', color: '#c0392b', fontSize: 13, padding: '24px 0' }}>{searchError}</div>
          )}
          {hasQuery && !loading && !searchError && results.length === 0 && (
            <div style={{ textAlign: 'center', color: '#606078', fontSize: 14, padding: '24px 0' }}>No books found for "{query}"</div>
          )}
          {results.map(b => {
            const sel = selectedBooks.some(s => s.id === b.id)
            const maxed = !sel && count >= 5
            return (
              <button key={b.id} onClick={() => !maxed && onToggleBook(b)} style={{
                background: sel ? '#d4f0be' : 'white',
                border: `2px solid ${sel ? '#5a9e3f' : '#D0D0DC'}`,
                borderRadius: 10, padding: '10px 14px',
                cursor: maxed ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                fontFamily: "'Manrope',sans-serif", opacity: maxed ? 0.4 : 1,
                transition: 'all .12s', width: '100%', flexShrink: 0,
              }}>
                <div style={{ width: 36, height: 52, flexShrink: 0, borderRadius: 4, overflow: 'hidden', background: b.spine, boxShadow: '1px 1px 4px rgba(0,0,0,0.18)' }}>
                  {b.thumbnail && (
                    <img src={b.thumbnail} alt="" crossOrigin={b.thumbnail.startsWith('http') ? 'anonymous' : undefined} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1C1C2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</div>
                  <div style={{ fontSize: 12, color: '#606078', marginTop: 1 }}>{b.author}</div>
                  {(b.year || b.category) && (
                    <div style={{ fontSize: 11, color: '#c9b89a', marginTop: 2 }}>
                      {[b.year, b.category].filter(Boolean).join(' • ')}
                    </div>
                  )}
                  {b.series && (
                    <div style={{ fontSize: 10, color: '#b8a080', marginTop: 2, fontStyle: 'italic' }}>
                      {b.series.num ? `Book ${b.series.num} of ${b.series.name}` : `${b.series.name} series`}
                    </div>
                  )}
                </div>
                {sel && <div style={{ flexShrink: 0 }}><IconCheck size={18} color="#5a9e3f" /></div>}
              </button>
            )
          })}
          {loadingMore && (
            <div style={{ textAlign: 'center', color: '#606078', fontSize: 13, padding: '12px 0' }}>Loading…</div>
          )}
          {!loading && !loadingMore && loadMoreCount < 3 && results.length > 0 && totalFound > results.length && (
            <button onClick={handleLoadMore} style={{
              width: '100%', padding: '10px 0', marginTop: 4,
              background: 'none', border: '2px dashed #D0D0DC', borderRadius: 10,
              color: '#606078', fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 14,
              cursor: 'pointer', transition: 'border-color .12s, color .12s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#254CA4'; e.currentTarget.style.color = '#254CA4' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#D0D0DC'; e.currentTarget.style.color = '#606078' }}
            >View more</button>
          )}
        </div>

        {/* Confirm */}
        <button onClick={canPlace ? onConfirm : undefined} style={{
          marginTop: 16, width: '100%', padding: '12px 0',
          background: canPlace ? '#254CA4' : 'rgba(37,76,164,0.35)', color: '#FDF8EF',
          border: 'none', borderRadius: 10, cursor: canPlace ? 'pointer' : 'default',
          fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 15,
          transition: 'background .15s',
        }}>
          {count === 0 ? 'Select a book to continue' : `Add ${count} book${count === 1 ? '' : 's'} ↗`}
        </button>
      </div>
    </div>
  )
}

// ─── DecorAddPanel ────────────────────────────────────────────────────────────

function DecorAddPanel({ isOpen, onSelect, onClose, isMobile = false }) {
  const [picked, setPicked] = useState(null)
  if (!isOpen) return null
  const items = [
    { type: 'flower',  label: 'Plant',   preview: <div style={{ height: 90, position: 'relative', width: 52, overflow: 'visible' }}><PlacedFlower    w={52} /></div> },
    { type: 'flower2', label: 'Plant 2', preview: <div style={{ height: 90, position: 'relative', width: 52, overflow: 'visible' }}><PlacedFlower2   w={52} /></div> },
    { type: 'coffee',  label: 'Coffee',  preview: <div style={{ height: 90, position: 'relative', width: 52, overflow: 'visible' }}><PlacedCoffeeCup w={52} /></div> },
    { type: 'light',   label: 'Candle',  preview: <div style={{ height: 90, position: 'relative', width: 52, overflow: 'visible' }}><PlacedLight     w={52} /></div> },
    { type: 'clock',   label: 'Clock',   preview: <div style={{ height: 90, position: 'relative', width: 52, overflow: 'visible' }}><PlacedClock     w={52} /></div> },
  ]
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 62 }}
      onMouseDown={onClose}
    >
      <div
        style={isMobile
          ? { background: '#FDF8EF', borderRadius: '18px 18px 0 0', padding: '20px 16px', width: '100%', boxShadow: '0 -4px 24px rgba(0,0,0,0.2)', fontFamily: "'Manrope',sans-serif" }
          : { background: '#FDF8EF', borderRadius: 18, padding: 20, maxWidth: 480, width: '92%', boxShadow: '0 8px 40px rgba(0,0,0,0.28)', fontFamily: "'Manrope',sans-serif" }}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1C1C2E' }}>Add Decoration</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center' }}><IconClose size={16} color="#606078" /></button>
        </div>

        {/* Cards — grid wraps automatically as more items are added */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(4, 1fr)' : 'repeat(5, 1fr)', gap: 6 }}>
          {items.map(({ type, label, preview }) => {
            const sel = picked === type
            return (
              <button key={type} onClick={() => setPicked(sel ? null : type)} style={{
                padding: '10px 4px 8px',
                background: sel ? '#d4f0be' : '#fff',
                border: `2px solid ${sel ? '#5a9e3f' : '#D0D0DC'}`,
                borderRadius: 12, cursor: 'pointer', overflow: 'visible',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 11, color: '#1C1C2E',
                transition: 'background .12s, border-color .12s, box-shadow .12s',
                boxShadow: sel ? '0 3px 12px rgba(90,158,63,0.2)' : '0 1px 4px rgba(0,0,0,0.07)',
              }}>
                {preview}
                {label}
                <div style={{ visibility: sel ? 'visible' : 'hidden' }}><IconCheck size={14} color="#5a9e3f" /></div>
              </button>
            )
          })}
        </div>

        {/* Place button */}
        <button onClick={picked ? () => { const p = picked; setPicked(null); onSelect(p) } : undefined} style={{
          marginTop: 20, width: '100%', padding: '12px 0',
          background: picked ? '#254CA4' : 'rgba(37,76,164,0.35)', color: '#FDF8EF',
          border: 'none', borderRadius: 10, cursor: picked ? 'pointer' : 'default',
          fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 15,
          transition: 'background .15s',
        }}>
          {picked ? `Place ${items.find(i => i.type === picked)?.label ?? ''} ↗` : 'Select a decoration'}
        </button>
      </div>
    </div>
  )
}

// ─── ShelfListModal — mobile bottom sheet listing shelves (edit / delete / add) ─

function ShelfListModal({ shelfConfigs, getColors, shelfName, username, onEditPlate, onEditShelf, onDeleteShelf, onAddShelf, onReorder, onClose }) {
  const canDelete = shelfConfigs.length > 2
  const ROW_H = 62  // row height + gap; used to translate rows during drag and to compute drop index
  const listRef = useRef(null)
  const rowRefs = useRef([])
  // Drag state — refs are the source of truth (event handlers close over them),
  // React state mirrors the refs to drive per-frame styling.
  const dragFromRef = useRef(-1)
  const dragOverRef = useRef(-1)
  const [dragFrom, setDragFrom] = useState(-1)
  const [dragOver, setDragOver] = useState(-1)
  // pointerOffset = how far (px) the finger has moved from the row's original position;
  // drives the dragged row's translateY so it sticks to the finger.
  const [pointerOffset, setPointerOffset] = useState(0)

  function startDrag(idx, e) {
    dragFromRef.current = idx
    dragOverRef.current = idx
    setDragFrom(idx); setDragOver(idx); setPointerOffset(0)
    const startY = e.clientY
    const list = listRef.current
    const listRect = list.getBoundingClientRect()
    const rowTopWithinList = idx * ROW_H  // where the row's origin sits inside the list
    const listInnerH = shelfConfigs.length * ROW_H
    function onMove(ev) {
      const dy = ev.clientY - startY
      // clamp the offset so the dragged row can't leave the list bounds
      const minDy = -rowTopWithinList
      const maxDy = (listInnerH - ROW_H) - rowTopWithinList
      setPointerOffset(Math.max(minDy, Math.min(maxDy, dy)))
      // Drop index: use the row's current visual centre to pick the slot
      const visualCentre = rowTopWithinList + dy + ROW_H / 2
      const target = Math.max(0, Math.min(shelfConfigs.length - 1, Math.floor(visualCentre / ROW_H)))
      if (target !== dragOverRef.current) {
        dragOverRef.current = target
        setDragOver(target)
      }
      ev.preventDefault()
    }
    function onUp() {
      const from = dragFromRef.current
      const to = dragOverRef.current !== -1 ? dragOverRef.current : from
      dragFromRef.current = -1
      dragOverRef.current = -1
      setDragFrom(-1); setDragOver(-1); setPointerOffset(0)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onUp)
      if (from !== -1 && to !== from) onReorder(from, to)
    }
    document.addEventListener('pointermove', onMove, { passive: false })
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointercancel', onUp)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 62 }}
      onMouseDown={onClose}
    >
      <div
        className="sheet-max-viewport"
        style={{ background: '#FDF8EF', borderRadius: '18px 18px 0 0', padding: '20px 16px', width: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 -4px 24px rgba(0,0,0,0.2)', fontFamily: "'Manrope',sans-serif", overflowY: 'auto' }}
        onMouseDown={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1C1C2E' }}>Shelves</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center' }}><IconClose size={16} color="#606078" /></button>
        </div>

        {/* Shelf name + username — tap to open the plate edit modal */}
        <button
          onClick={onEditPlate}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
            background: '#F2EFE8', border: '2px solid #E4E4EC', borderRadius: 10,
            padding: '10px 14px', cursor: 'pointer', fontFamily: "'Manrope',sans-serif",
            marginBottom: 18, width: '100%',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9898B0', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>Collection</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1C1C2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {shelfName || 'My Shelf'}
            </div>
            {username && (
              <div style={{ fontSize: 12, color: '#606078', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                made by {username}
              </div>
            )}
          </div>
          <IconPencil size={15} color="#9898B0" />
        </button>

        <div style={{ fontSize: 13, color: '#606078', marginBottom: 10 }}>Tap a shelf to rename · drag the handle to reorder</div>

        <div ref={listRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {shelfConfigs.map((cfg, idx) => {
            const colors = getColors(cfg.colorKey)
            const isBeingDragged = dragFrom === idx
            // Dragged row follows the pointer via pointerOffset. Other rows animate into
            // the slot the dragged row is currently occupying, revealing the drop location.
            let translate = 0
            if (isBeingDragged) {
              translate = pointerOffset
            } else if (dragFrom !== -1) {
              if (dragFrom < idx && dragOver >= idx) translate = -ROW_H     // rows above the target close up
              else if (dragFrom > idx && dragOver <= idx) translate = ROW_H // rows below the target push down
            }
            return (
              <div
                key={cfg.id}
                ref={el => { rowRefs.current[idx] = el }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  height: 46, marginBottom: 8,
                  transform: `translateY(${translate}px)${isBeingDragged ? ' scale(1.02)' : ''}`,
                  // Dragged row updates every pointermove (no transition), others glide.
                  transition: isBeingDragged ? 'none' : 'transform .2s cubic-bezier(0.22,1,0.36,1)',
                  opacity: isBeingDragged ? 0.92 : 1,
                  boxShadow: isBeingDragged ? '0 10px 24px rgba(0,0,0,0.2)' : 'none',
                  borderRadius: isBeingDragged ? 10 : 0,
                  zIndex: isBeingDragged ? 5 : 1,
                  // Prevent the dragged row from being covered by later siblings
                  position: 'relative',
                }}
              >
                {/* Drag handle — press-and-drag anywhere on it to reorder */}
                <button
                  onPointerDown={e => { e.preventDefault(); startDrag(idx, e) }}
                  aria-label="Drag to reorder"
                  style={{
                    width: 30, height: 46, borderRadius: 8, border: 'none',
                    background: 'transparent', color: '#9898B0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'grab', touchAction: 'none', flexShrink: 0,
                  }}
                >
                  <svg width="16" height="20" viewBox="0 0 16 20" fill="currentColor">
                    <circle cx="5" cy="4" r="1.6" /><circle cx="11" cy="4" r="1.6" />
                    <circle cx="5" cy="10" r="1.6" /><circle cx="11" cy="10" r="1.6" />
                    <circle cx="5" cy="16" r="1.6" /><circle cx="11" cy="16" r="1.6" />
                  </svg>
                </button>
                <button
                  onClick={() => dragFrom === -1 && onEditShelf(idx)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                    background: 'white', border: '2px solid #D0D0DC', borderRadius: 10,
                    padding: '12px 14px', cursor: 'pointer', fontFamily: "'Manrope',sans-serif",
                    height: 46, boxSizing: 'border-box',
                  }}
                >
                  <span style={{ width: 18, height: 18, borderRadius: 5, background: colors.tabBg, flexShrink: 0, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)' }} />
                  <span style={{ flex: 1, fontWeight: 700, fontSize: 15, color: '#1C1C2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cfg.label}</span>
                  <IconPencil size={15} color="#9898B0" />
                </button>
                <button
                  onClick={() => canDelete && onDeleteShelf(idx)}
                  style={{
                    width: 46, height: 46, borderRadius: 10, border: `2px solid ${canDelete ? '#e3b6b0' : '#E4E4EC'}`,
                    background: 'white', cursor: canDelete ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: canDelete ? 1 : 0.45, flexShrink: 0,
                  }}
                >
                  <IconTrash size={18} color={canDelete ? '#c0392b' : '#9898B0'} />
                </button>
              </div>
            )
          })}
        </div>

        <button
          onClick={onAddShelf}
          style={{
            marginTop: 6, width: '100%', padding: '12px 0',
            background: 'none', border: '2px dashed #D0D0DC', borderRadius: 10,
            color: '#606078', fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 14,
            cursor: 'pointer',
          }}
        >+ Add Shelf</button>
      </div>
    </div>
  )
}


// ─── ShelfPlateEditModal ──────────────────────────────────────────────────────

function ShelfPlateEditModal({ shelfName, username, onSave, onClose }) {
  const [newShelfName, setNewShelfName] = useState(shelfName)
  const [newUsername, setNewUsername] = useState(username)
  const nameRef = useRef(null)
  useEffect(() => { nameRef.current?.focus(); nameRef.current?.select() }, [])
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(25,36,61,0.6)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#FDF8EF', borderRadius: 20, padding: '28px 32px 24px', width: 'min(340px, 92vw)', boxShadow: '0 16px 48px rgba(0,0,0,0.3)', fontFamily: "'Manrope',sans-serif" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1C1C2E', marginBottom: 22 }}>Edit label</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#606078', marginBottom: 8, letterSpacing: '0.04em' }}>YOUR NAME</div>
        <input
          ref={nameRef}
          value={newUsername}
          onChange={e => setNewUsername(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onSave(newShelfName.trim() || shelfName, newUsername.trim()) }}
          style={{ width: '100%', boxSizing: 'border-box', border: '2px solid #D0D0DC', borderRadius: 10, padding: '9px 13px', fontSize: 16, fontFamily: "'Manrope',sans-serif", fontWeight: 600, background: 'white', color: '#1C1C2E', outline: 'none', marginBottom: 18 }}
        />
        <div style={{ fontSize: 13, fontWeight: 700, color: '#606078', marginBottom: 8, letterSpacing: '0.04em' }}>SHELF NAME</div>
        <input
          value={newShelfName}
          onChange={e => setNewShelfName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onSave(newShelfName.trim() || shelfName, newUsername.trim()) }}
          style={{ width: '100%', boxSizing: 'border-box', border: '2px solid #D0D0DC', borderRadius: 10, padding: '9px 13px', fontSize: 16, fontFamily: "'Manrope',sans-serif", fontWeight: 600, background: 'white', color: '#1C1C2E', outline: 'none', marginBottom: 28 }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => onSave(newShelfName.trim() || shelfName, newUsername.trim())}
            style={{ flex: 1, background: '#254CA4', border: 'none', borderRadius: 10, padding: '11px 0', fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 15, color: '#FDF8EF', cursor: 'pointer' }}
          >Save</button>
          <button
            onClick={onClose}
            style={{ flex: 1, background: 'transparent', border: '2px solid #D0D0DC', borderRadius: 10, padding: '11px 0', fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 15, color: '#606078', cursor: 'pointer' }}
          >Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─── ShelfEditModal ───────────────────────────────────────────────────────────

function ShelfEditModal({ cfg, onSave, onDelete, onClose, canDelete = true, showDelete = true, title = 'Edit Shelf' }) {
  const [label, setLabel] = useState(cfg.label)
  const [colorKey, setColorKey] = useState(cfg.colorKey)
  const [showMinWarning, setShowMinWarning] = useState(false)
  const inputRef = useRef(null)
  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select() }, [])

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(25,36,61,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#FDF8EF', borderRadius: 20, padding: '28px 32px 24px', width: 'min(340px, 92vw)', boxShadow: '0 16px 48px rgba(0,0,0,0.3)', fontFamily: "'Manrope',sans-serif" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1C1C2E', marginBottom: 22 }}>{title}</div>

        <div style={{ fontSize: 13, fontWeight: 700, color: '#606078', marginBottom: 8, letterSpacing: '0.04em' }}>SHELF NAME</div>
        <input
          ref={inputRef}
          value={label}
          onChange={e => setLabel(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onSave(label.trim() || cfg.label, colorKey) }}
          style={{ width: '100%', boxSizing: 'border-box', border: '2px solid #D0D0DC', borderRadius: 10, padding: '9px 13px', fontSize: 16, fontFamily: "'Manrope',sans-serif", fontWeight: 600, background: 'white', color: '#1C1C2E', outline: 'none', marginBottom: 22, WebkitAppearance: 'none', appearance: 'none' }}
        />

        <div style={{ fontSize: 13, fontWeight: 700, color: '#606078', marginBottom: 12, letterSpacing: '0.04em' }}>SHELF COLOR</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
          {ROYGBIV.map(c => (
            <div
              key={c.key}
              onClick={() => setColorKey(c.key)}
              style={{
                width: 34, height: 34, borderRadius: '50%', background: c.tabBg,
                border: colorKey === c.key ? `3px solid ${c.tabInk}` : '3px solid transparent',
                cursor: 'pointer', boxSizing: 'border-box',
                boxShadow: colorKey === c.key ? `0 0 0 2px ${c.tabBg}` : 'none',
                transition: 'border .12s, box-shadow .12s',
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <button
            onClick={() => onSave(label.trim() || cfg.label, colorKey)}
            style={{ flex: 1, background: '#254CA4', border: 'none', borderRadius: 10, padding: '11px 0', fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 15, color: '#FDF8EF', cursor: 'pointer' }}
          >Save</button>
          <button
            onClick={onClose}
            style={{ flex: 1, background: '#FDF8EF', border: '2px solid #254CA4', borderRadius: 10, padding: '11px 0', fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 15, color: '#254CA4', cursor: 'pointer' }}
          >Cancel</button>
        </div>
        {showDelete && (
          <>
            <button
              onClick={canDelete ? onDelete : () => setShowMinWarning(true)}
              style={{ width: '100%', background: 'none', border: `2px solid ${canDelete ? '#c0392b' : '#C4C4D4'}`, borderRadius: 10, padding: '9px 0', fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 14, color: canDelete ? '#c0392b' : '#9090A8', cursor: canDelete ? 'pointer' : 'default' }}
            >Delete Shelf</button>
            {showMinWarning && (
              <div style={{ marginTop: 8, fontSize: 13, fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: '#b05a30', textAlign: 'center' }}>
                A minimum of 2 shelves is required.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}


export { SidePanelButtons, BookPreviewModal, BookAddPanel, DecorAddPanel, ShelfListModal, ShelfPlateEditModal, ShelfEditModal }
