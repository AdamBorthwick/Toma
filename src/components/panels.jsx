import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { mapOpenLibraryBook } from '../lib/openLibrary.js'
import { ROYGBIV } from '../data/shelves.jsx'
import { IconBooks, IconOpenBook, IconTrash, IconPencil, IconClose, IconCheck, IconLeaf, IconPerson, IconArrowUpRight } from './icons.jsx'
import { PlacedFlower, PlacedFlower2, PlacedCoffeeCup, PlacedLight, PlacedClock } from './decor.jsx'
import { TomaHead } from './scene.jsx'
import { MonsterHatGraphic, TOMA_FACE_VIEWBOX, getHatPickerViewBox } from './hats.jsx'
import { AccessoryOnlyPreview, MonsterAccessoryGraphic } from './accessories.jsx'
import { EyeShapeOnlyPreview } from './eyes.jsx'
import { MONSTER_COLORS, MONSTER_HATS, MONSTER_EYE_COLORS, MONSTER_EYE_SHAPES, MONSTER_ACCESSORIES, MONSTER_LOOK_DEFAULTS, getMonsterColors, STYLE_ITEM_COLORS } from '../data/monster.jsx'
import { ScrollFade } from './ScrollFade.jsx'
import {
  BottomSheet,
  SheetHeader,
  Button,
  SearchInput,
  PickerTile,
  PickerSquare,
  FieldLabel,
  DialogBackdrop,
  DialogCard,
  DialogTitle,
  DialogActions,
  TextInput,
  IconCloseButton,
} from './ui/index.js'
import { colors, font, radii } from '../lib/uiTokens.js'
import { Z } from '../lib/zIndex.js'

const STYLE_TABS = [
  { key: 'body', label: 'Body' },
  { key: 'eyes', label: 'Eyes' },
  { key: 'hats', label: 'Hats' },
  { key: 'accessories', label: 'Accessories' },
]

// ─── SidePanelButtons ─────────────────────────────────────────────────────────

function SidePanelButtons({ editDragging, onBook, onDecor, onShelves, onMonster, isEditMode, inventory = [], onInventoryItemPlace, flashInventory = false, isMobile = false, onToggleEdit, onShare, showShare = false }) {
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
  const btnHeight = isMobile ? 62 : 84
  const btnBase = {
    width: btnSize, height: btnHeight, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: isMobile ? '10px 6px' : '16px 8px', border: 'none', borderRadius: 16, cursor: 'pointer',
    fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: isMobile ? 12 : 14,
    transition: 'transform .12s', flexShrink: 0,
    ...(isMobile ? { pointerEvents: 'auto' } : {}),
  }
  const invDecorWrap = {
    width: isMobile ? 24 : 28,
    height: isMobile ? 28 : 32,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  }
  const invSpine = {
    width: isMobile ? 14 : 16,
    height: isMobile ? 28 : 32,
    borderRadius: 2,
    boxShadow: '3px 4px 14px rgba(0,0,0,0.55), -1px 0 0 rgba(0,0,0,0.2)',
  }
  const onHover  = e => { e.currentTarget.style.transform = 'scale(1.06)' }
  const offHover = e => { e.currentTarget.style.transform = '' }

  // Mobile: wraps each footer button so it can slide/collapse as edit mode toggles
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
    // Central footer — horizontally scrollable on small screens.
    position: 'fixed', bottom: 20, left: 12, right: 12,
    display: 'flex', justifyContent: 'center',
    zIndex: 48,
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

  const inventoryTile = inventory.length > 0 ? (() => {
    const topItem = inventory[0]
    const stackFirst = topItem.type === 'stack' ? topItem.books?.[0] : null
    const stackRest  = topItem.type === 'stack' ? (topItem.books?.length ?? 1) - 1 : 0
    return (
      <div
        onClick={() => onInventoryItemPlace(topItem)}
        onMouseEnter={() => setInvHover(true)}
        onMouseLeave={() => setInvHover(false)}
        title={topItem.type === 'book' ? topItem.book?.title : topItem.type === 'stack' ? `${stackFirst?.title ?? 'Stack'} +${stackRest}` : topItem.decorType}
        style={{
          ...btnBase,
          background: 'rgba(253,248,239,0.13)',
          color: 'rgba(253,248,239,0.55)',
          border: '2px dashed currentColor',
          transformOrigin: 'center center',
          animation: flashInventory
            ? 'invShake 0.7s ease-in-out 0.6s 2, invPulse 1.2s ease-in-out 0.4s 3'
            : 'none',
          cursor: 'pointer',
          pointerEvents: 'auto',
          overflow: 'hidden',
        }}
      >
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
          width: '100%', flex: 1, minHeight: 0, overflow: 'hidden',
          transform: invHover ? 'scale(1.14) translateY(-3px)' : 'scale(1) translateY(0)',
          transition: 'transform 0.22s cubic-bezier(0.34,1.6,0.5,1)',
        }}>
          {topItem.type === 'book' && (<>
            <div style={{
              ...invSpine,
              background: topItem.book?.spine ?? '#5A4A3A',
            }} />
            <div style={{
              fontSize: 8, fontWeight: 700, color: '#FDF8EF', opacity: 0.85,
              maxWidth: btnSize - 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              textAlign: 'center', fontFamily: "'Manrope', sans-serif", lineHeight: 1,
            }}>{topItem.book?.title ?? ''}</div>
          </>)}
          {topItem.type === 'stack' && (<>
            <div style={{
              ...invSpine,
              background: stackFirst?.spine ?? '#5A4A3A',
            }} />
            <div style={{
              fontSize: 8, fontWeight: 700, color: '#FDF8EF', opacity: 0.85,
              maxWidth: btnSize - 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              textAlign: 'center', fontFamily: "'Manrope', sans-serif", lineHeight: 1,
            }}>{(stackFirst?.title ?? 'Stack')}{stackRest > 0 ? ` +${stackRest}` : ''}</div>
          </>)}
          {topItem.type === 'decor' && (() => {
            const dt = topItem.decorType
            const decorW = isMobile ? 22 : 26
            const wrap = child => <div style={invDecorWrap}>{child}</div>
            if (dt === 'flower')  return wrap(<PlacedFlower    w={decorW} />)
            if (dt === 'flower2') return wrap(<PlacedFlower2   w={decorW} />)
            if (dt === 'coffee')  return wrap(<PlacedCoffeeCup w={decorW} />)
            if (dt === 'light')   return wrap(<PlacedLight     w={decorW} />)
            if (dt === 'clock')   return wrap(<PlacedClock     w={decorW} />)
            return null
          })()}
        </div>
      </div>
    )
  })() : null

  const buildBtn = isMobile ? (
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
        <span style={{ whiteSpace: 'nowrap', fontSize: isEditMode ? 10 : 12 }}>{isEditMode ? 'Stop edit' : 'Edit'}</span>
      </button>
    </div>
  ) : null

  const editShelfBtn = isMobile ? (
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
  )

  const mobileToolbar = (
    <>
      {buildBtn}
      {inventoryTile && <div style={slide(isEditMode)}>{inventoryTile}</div>}
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
      <div style={isMobile ? slide(isEditMode) : undefined}>
        <button onClick={onMonster} style={{ ...btnBase, background: '#254CA4', color: '#FDF8EF' }}
          onMouseEnter={onHover} onMouseLeave={offHover}>
          <IconPerson size={isMobile ? 22 : 28} color="#FDF8EF" />
          <span style={isMobile ? { fontSize: 11 } : undefined}>Style</span>
        </button>
      </div>
      {editShelfBtn}
    </>
  )

  return (
    <div style={containerStyle}>
      {isMobile ? (
        <div className="mobile-footer-scroll" style={{
          display: 'flex', flexDirection: 'row', alignItems: 'flex-end',
          overflowX: 'auto', maxWidth: '100%',
          padding: '2px 4px',
          pointerEvents: 'auto',
        }}>
          {mobileToolbar}
        </div>
      ) : (
        <>
          <div>
            <button onClick={onBook} style={{ ...btnBase, background: '#254CA4', color: '#FDF8EF' }}
              onMouseEnter={onHover} onMouseLeave={offHover}>
              <IconBooks size={28} color="#FDF8EF" />
              <span>Book</span>
            </button>
          </div>
          <div>
            <button onClick={onDecor} style={{ ...btnBase, background: '#254CA4', color: '#FDF8EF' }}
              onMouseEnter={onHover} onMouseLeave={offHover}>
              <IconLeaf size={28} color="#FDF8EF" />
              <span>Decor</span>
            </button>
          </div>
          <div>
            <button onClick={onMonster} style={{ ...btnBase, background: '#254CA4', color: '#FDF8EF' }}
              onMouseEnter={onHover} onMouseLeave={offHover}>
              <IconPerson size={28} color="#FDF8EF" />
              <span>Style</span>
            </button>
          </div>
          {editShelfBtn}
          {inventoryTile}
        </>
      )}
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
            <ScrollFade
              axis="y"
              fadeColor={colors.surface}
              style={{ flex: 1, minHeight: 0 }}
              scrollStyle={{ fontSize: 12, color: '#1C1C2E', lineHeight: 1.65 }}
            >
              {full.description ?? 'No description available.'}
            </ScrollFade>
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
    <BottomSheet isOpen={isOpen} onClose={onClose} isMobile={isMobile}>
        <SheetHeader title="Add Books" onClose={onClose} isMobile={isMobile} marginBottom={16} />

        <div style={{ fontSize: 13, color: colors.muted, marginBottom: 10, flexShrink: 0 }}>
          {count === 0 ? 'Select up to 5 books' : `${count} of 5 books selected`}
        </div>

        <SearchInput
          type="text"
          placeholder="Search by title or author…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
          style={{ marginBottom: 12, flexShrink: 0 }}
        />

        {/* Book list / states */}
        <ScrollFade
          axis="y"
          style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}
          scrollStyle={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        >
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
              <PickerTile key={b.id} selected={sel} disabled={maxed} onClick={() => !maxed && onToggleBook(b)}>
                <div style={{ width: 36, height: 52, flexShrink: 0, borderRadius: 4, overflow: 'hidden', background: b.spine, boxShadow: '1px 1px 4px rgba(0,0,0,0.18)' }}>
                  {b.thumbnail && (
                    <img src={b.thumbnail} alt="" crossOrigin={b.thumbnail.startsWith('http') ? 'anonymous' : undefined} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</div>
                  <div style={{ fontSize: 12, color: colors.muted, marginTop: 1 }}>{b.author}</div>
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
                {sel && <div style={{ flexShrink: 0 }}><IconCheck size={18} color={colors.success} /></div>}
              </PickerTile>
            )
          })}
          {loadingMore && (
            <div style={{ textAlign: 'center', color: '#606078', fontSize: 13, padding: '12px 0' }}>Loading…</div>
          )}
          {!loading && !loadingMore && loadMoreCount < 3 && results.length > 0 && totalFound > results.length && (
            <Button variant="dashed" fullWidth onClick={handleLoadMore} style={{ marginTop: 4 }}>
              View more
            </Button>
          )}
        </ScrollFade>

        <Button fullWidth disabled={!canPlace} onClick={canPlace ? onConfirm : undefined} style={{ marginTop: 16, flexShrink: 0 }}>
          {count === 0 ? 'Select a book to continue' : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {`Add ${count} book${count === 1 ? '' : 's'}`}
              <IconArrowUpRight size={14} color="currentColor" />
            </span>
          )}
        </Button>
    </BottomSheet>
  )
}

// ─── DecorAddPanel ────────────────────────────────────────────────────────────

function DecorAddPanel({ isOpen, onSelect, onClose, isMobile = false }) {
  const [picked, setPicked] = useState(null)
  if (!isOpen) return null
  const decorPreviewStyle = {
    height: 72,
    width: '100%',
    maxWidth: 52,
    margin: '0 auto',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  }
  const items = [
    { type: 'flower',  label: 'Plant',   preview: <div style={decorPreviewStyle}><PlacedFlower    w={44} /></div> },
    { type: 'flower2', label: 'Plant 2', preview: <div style={decorPreviewStyle}><PlacedFlower2   w={44} /></div> },
    { type: 'coffee',  label: 'Coffee',  preview: <div style={decorPreviewStyle}><PlacedCoffeeCup w={44} /></div> },
    { type: 'light',   label: 'Candle',  preview: <div style={decorPreviewStyle}><PlacedLight     w={44} /></div> },
    { type: 'clock',   label: 'Clock',   preview: <div style={decorPreviewStyle}><PlacedClock     w={44} /></div> },
  ]
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      isMobile={isMobile}
      sheetStyle={!isMobile ? { maxWidth: 480, padding: 20 } : undefined}
    >
      <SheetHeader title="Add Decoration" onClose={onClose} isMobile={isMobile} marginBottom={16} />

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(4, 1fr)' : 'repeat(5, 1fr)', gap: 6 }}>
          {items.map(({ type, label, preview }) => {
            const sel = picked === type
            return (
              <button key={type} onClick={() => setPicked(sel ? null : type)} style={{
                padding: '10px 4px 8px',
                background: sel ? colors.successBg : '#fff',
                border: `2px solid ${sel ? colors.success : colors.border}`,
                borderRadius: radii.lg, cursor: 'pointer', overflow: 'visible',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                fontFamily: font, fontWeight: 600, fontSize: 11, color: colors.text,
                transition: 'background .12s, border-color .12s, box-shadow .12s',
                boxShadow: sel ? '0 3px 12px rgba(90,158,63,0.2)' : '0 1px 4px rgba(0,0,0,0.07)',
              }}>
                {preview}
                {label}
                <div style={{ visibility: sel ? 'visible' : 'hidden' }}><IconCheck size={14} color={colors.success} /></div>
              </button>
            )
          })}
        </div>

        <Button
          fullWidth
          disabled={!picked}
          onClick={picked ? () => { const p = picked; setPicked(null); onSelect(p) } : undefined}
          style={{ marginTop: 20 }}
        >
          {picked ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {`Place ${items.find(i => i.type === picked)?.label ?? ''}`}
              <IconArrowUpRight size={14} color="currentColor" />
            </span>
          ) : 'Select a decoration'}
        </Button>
    </BottomSheet>
  )
}

// ─── MonsterCustomizeModal ────────────────────────────────────────────────────

const SWAP_DURATION_MS = 1180

function TomaAppearancePreview({
  bodyColor,
  accentColor,
  hat,
  compact = false,
  clipH,
  clipBottom = 0,
  clipScale = 1,
  mouthReactGen = 0,
  shakeGen = 0,
  hatSwapGen = 0,
  hatSwapFrom = 'none',
  hatSwapTo = 'none',
  hatColorKey = 'red',
  hatSwapFromColor = 'red',
  hatSwapToColor = 'red',
  accessorySwapGen = 0,
  accessorySwapFrom = 'none',
  accessorySwapTo = 'none',
  accessoryColorKey = 'red',
  accessorySwapFromColor = 'red',
  accessorySwapToColor = 'red',
  eyeColorKey = 'dark',
  eyeShapeKey = 'round',
  accessory = 'none',
  onHatSwapComplete,
  onAccessorySwapComplete,
}) {
  const headW = compact ? 120 : 140
  const headH = compact ? 122 : 142
  const neckW = compact ? 46 : 54
  const neckH = compact ? 26 : 30
  const [hatSwapP, setHatSwapP] = useState(0)
  const [activeHatSwap, setActiveHatSwap] = useState(null)
  const hatSwapAnimRef = useRef(null)
  const [accessorySwapP, setAccessorySwapP] = useState(0)
  const [activeAccessorySwap, setActiveAccessorySwap] = useState(null)
  const accessorySwapAnimRef = useRef(null)

  useEffect(() => {
    if (hatSwapGen === 0 || hatSwapFrom === hatSwapTo) return
    const swap = { from: hatSwapFrom, to: hatSwapTo, fromColor: hatSwapFromColor, toColor: hatSwapToColor }
    setActiveHatSwap(swap)
    let start = null
    const duration = SWAP_DURATION_MS
    const tick = (now) => {
      if (start === null) start = now
      const t = Math.min(1, (now - start) / duration)
      setHatSwapP(t)
      if (t < 1) {
        hatSwapAnimRef.current = requestAnimationFrame(tick)
      } else {
        setHatSwapP(0)
        setActiveHatSwap(null)
        onHatSwapComplete?.(swap.to, swap.toColor)
      }
    }
    if (hatSwapAnimRef.current) cancelAnimationFrame(hatSwapAnimRef.current)
    setHatSwapP(0.001)
    hatSwapAnimRef.current = requestAnimationFrame(tick)
    return () => { if (hatSwapAnimRef.current) cancelAnimationFrame(hatSwapAnimRef.current) }
  }, [hatSwapGen, hatSwapFrom, hatSwapTo, hatSwapFromColor, hatSwapToColor, onHatSwapComplete])

  useEffect(() => {
    if (accessorySwapGen === 0 || accessorySwapFrom === accessorySwapTo) return
    const swap = { from: accessorySwapFrom, to: accessorySwapTo, fromColor: accessorySwapFromColor, toColor: accessorySwapToColor }
    setActiveAccessorySwap(swap)
    let start = null
    const duration = SWAP_DURATION_MS
    const tick = (now) => {
      if (start === null) start = now
      const t = Math.min(1, (now - start) / duration)
      setAccessorySwapP(t)
      if (t < 1) {
        accessorySwapAnimRef.current = requestAnimationFrame(tick)
      } else {
        setAccessorySwapP(0)
        setActiveAccessorySwap(null)
        onAccessorySwapComplete?.(swap.to, swap.toColor)
      }
    }
    if (accessorySwapAnimRef.current) cancelAnimationFrame(accessorySwapAnimRef.current)
    setAccessorySwapP(0.001)
    accessorySwapAnimRef.current = requestAnimationFrame(tick)
    return () => { if (accessorySwapAnimRef.current) cancelAnimationFrame(accessorySwapAnimRef.current) }
  }, [accessorySwapGen, accessorySwapFrom, accessorySwapTo, accessorySwapFromColor, accessorySwapToColor, onAccessorySwapComplete])

  const smooth = p => p * p * (3 - 2 * p)
  const hatSwapping = hatSwapP > 0 && activeHatSwap !== null
  const accessorySwapping = accessorySwapP > 0 && activeAccessorySwap !== null
  const swapping = hatSwapping || accessorySwapping
  const swapP = Math.max(hatSwapping ? hatSwapP : 0, accessorySwapping ? accessorySwapP : 0)
  const hatSwapFromKey = activeHatSwap?.from ?? hatSwapFrom
  const hatSwapToKey = activeHatSwap?.to ?? hatSwapTo
  const hatSwapFromColorKey = activeHatSwap?.fromColor ?? hatSwapFromColor
  const hatSwapToColorKey = activeHatSwap?.toColor ?? hatSwapToColor
  const accessorySwapFromKey = activeAccessorySwap?.from ?? accessorySwapFrom
  const accessorySwapToKey = activeAccessorySwap?.to ?? accessorySwapTo
  const accessorySwapFromColorKey = activeAccessorySwap?.fromColor ?? accessorySwapFromColor
  const accessorySwapToColorKey = activeAccessorySwap?.toColor ?? accessorySwapToColor

  let lookUp = 0
  if (swapP <= 0.12) lookUp = smooth(swapP / 0.12)
  else if (swapP <= 0.58) lookUp = 1
  else if (swapP <= 0.86) lookUp = 1 - smooth((swapP - 0.58) / 0.28)
  const irisOff = { x: 0, y: -5.8 * lookUp }
  const headTilt = -4.5 * lookUp

  let headHat = hat
  let headHatColor = hatColorKey
  if (hatSwapping) {
    if (hatSwapP < 0.14) {
      headHat = hatSwapFromKey
      headHatColor = hatSwapFromColorKey
    } else if (hatSwapP >= 0.9) {
      headHat = hatSwapToKey
      headHatColor = hatSwapToColorKey
    } else {
      headHat = 'none'
    }
  }

  let headAccessory = accessory
  let headAccessoryColor = accessoryColorKey
  if (accessorySwapping) {
    if (accessorySwapP < 0.14) {
      headAccessory = accessorySwapFromKey
      headAccessoryColor = accessorySwapFromColorKey
    } else if (accessorySwapP >= 0.9) {
      headAccessory = accessorySwapToKey
      headAccessoryColor = accessorySwapToColorKey
    } else {
      headAccessory = 'none'
    }
  }

  const neckOverlap = 12
  const stackH = headH + neckH - neckOverlap
  const spaceAboveStack = clipH != null ? clipH + clipBottom - stackH : (compact ? 40 : 52)

  const showHatFall = hatSwapping && hatSwapFromKey !== 'none' && hatSwapP >= 0.14 && hatSwapP < 0.64
  const hatFallProgress = showHatFall ? smooth(Math.min(1, (hatSwapP - 0.14) / 0.42)) : 0
  const hatFallDistance = clipH != null
    ? clipH - spaceAboveStack + (compact ? 24 : 32)
    : (compact ? 98 : 116)
  const hatFallY = hatFallProgress * hatFallDistance
  const hatFallX = 0
  const hatFallRot = hatFallProgress * (compact ? 14 : 18)

  const showHatIncoming = hatSwapping && hatSwapToKey !== 'none' && hatSwapP >= 0.54 && hatSwapP < 0.9
  const hatInProgress = showHatIncoming ? smooth(Math.min(1, (hatSwapP - 0.54) / 0.3)) : 0
  const hatInStart = clipH != null
    ? -(spaceAboveStack + (compact ? 18 : 24))
    : (compact ? -58 : -68)
  const hatInY = (1 - hatInProgress) * hatInStart

  const showAccessoryFall = accessorySwapping && accessorySwapFromKey !== 'none' && accessorySwapP >= 0.14 && accessorySwapP < 0.64
  const accessoryFallProgress = showAccessoryFall ? smooth(Math.min(1, (accessorySwapP - 0.14) / 0.42)) : 0
  const accessoryFallDistance = clipH != null
    ? clipH - spaceAboveStack + (compact ? 18 : 26)
    : (compact ? 78 : 92)
  const accessoryFallY = accessoryFallProgress * accessoryFallDistance
  const accessoryFallX = 0
  const accessoryFallRot = accessoryFallProgress * (compact ? 12 : 16)

  const showAccessoryIncoming = accessorySwapping && accessorySwapToKey !== 'none' && accessorySwapP >= 0.54 && accessorySwapP < 0.9
  const accessoryInProgress = showAccessoryIncoming ? smooth(Math.min(1, (accessorySwapP - 0.54) / 0.3)) : 0
  const accessoryInStart = clipH != null
    ? -(spaceAboveStack + (compact ? 8 : 12))
    : (compact ? -32 : -38)
  const accessoryInY = (1 - accessoryInProgress) * accessoryInStart

  const hatLayerStyle = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: headW,
    height: headH,
    overflow: 'visible',
    pointerEvents: 'none',
    zIndex: 4,
  }

  const accessoryLayerStyle = {
    ...hatLayerStyle,
    zIndex: 3,
  }

  const previewContent = (
    <div style={{
      animation: swapping ? 'none' : 'tomaBreath 3.5s ease-in-out infinite',
      transformOrigin: 'center bottom',
    }}>
      <div
        key={shakeGen}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: shakeGen > 0 ? 'tomaGentleShake 0.55s ease-in-out' : 'none',
          transformOrigin: 'center bottom',
        }}
      >
        <div style={{
          position: 'relative',
          width: headW,
          height: headH,
          transform: `rotate(${headTilt}deg)`,
          transformOrigin: '50% 88%',
        }}>
          {showHatFall && (
            <svg
              key={`fall-${hatSwapGen}-${hatSwapFromKey}`}
              viewBox={TOMA_FACE_VIEWBOX}
              fill="none"
              style={{
                ...hatLayerStyle,
                transform: `translate(${hatFallX}px, ${hatFallY}px) rotate(${hatFallRot}deg)`,
                transformOrigin: '50% 16%',
              }}
            >
              <MonsterHatGraphic hat={hatSwapFromKey} hatColorKey={hatSwapFromColorKey} />
            </svg>
          )}
          {showHatIncoming && (
            <svg
              key={`in-${hatSwapGen}-${hatSwapToKey}`}
              viewBox={TOMA_FACE_VIEWBOX}
              fill="none"
              style={{
                ...hatLayerStyle,
                transform: `translateY(${hatInY}px)`,
                transformOrigin: '50% 16%',
              }}
            >
              <MonsterHatGraphic hat={hatSwapToKey} hatColorKey={hatSwapToColorKey} />
            </svg>
          )}
          {showAccessoryFall && (
            <svg
              key={`acc-fall-${accessorySwapGen}-${accessorySwapFromKey}`}
              viewBox={TOMA_FACE_VIEWBOX}
              fill="none"
              style={{
                ...accessoryLayerStyle,
                transform: `translate(${accessoryFallX}px, ${accessoryFallY}px) rotate(${accessoryFallRot}deg)`,
                transformOrigin: '50% 55%',
              }}
            >
              <MonsterAccessoryGraphic accessory={accessorySwapFromKey} accessoryColorKey={accessorySwapFromColorKey} />
            </svg>
          )}
          {showAccessoryIncoming && (
            <svg
              key={`acc-in-${accessorySwapGen}-${accessorySwapToKey}`}
              viewBox={TOMA_FACE_VIEWBOX}
              fill="none"
              style={{
                ...accessoryLayerStyle,
                transform: `translateY(${accessoryInY}px)`,
                transformOrigin: '50% 55%',
              }}
            >
              <MonsterAccessoryGraphic accessory={accessorySwapToKey} accessoryColorKey={accessorySwapToColorKey} />
            </svg>
          )}
          <div style={{ width: headW, height: headH, lineHeight: 0, position: 'relative', zIndex: 2 }}>
            <TomaHead
              irisOff={irisOff}
              bodyColor={bodyColor}
              accentColor={accentColor}
              hat={headHat}
              hatColorKey={headHatColor}
              eyeColorKey={eyeColorKey}
              eyeShapeKey={eyeShapeKey}
              accessory={headAccessory}
              accessoryColorKey={headAccessoryColor}
              mouthReactGen={mouthReactGen}
            />
          </div>
        </div>
        <svg
          width={neckW}
          height={neckH}
          viewBox="0 0 54 30"
          fill="none"
          style={{ display: 'block', marginTop: -12 }}
          aria-hidden="true"
        >
          <path
            d="M14 0 C18 6 22 8 27 8 C32 8 36 6 40 0 C43 0 46 3 46 26 C46 28 44 30 27 30 C10 30 8 28 8 26 C8 3 11 0 14 0Z"
            fill={bodyColor}
          />
          <path
            d="M20 8 C23 10 25 10 27 10 C29 10 31 10 34 8"
            stroke={accentColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.55"
          />
        </svg>
      </div>
    </div>
  )

  if (clipH != null) {
    return (
      <div style={{
        position: 'relative',
        width: '100%',
        height: clipH,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute',
          left: '50%',
          bottom: -clipBottom,
          transform: `translateX(-50%) scale(${clipScale})`,
          transformOrigin: 'center bottom',
        }}>
          {previewContent}
        </div>
      </div>
    )
  }

  return previewContent
}

function HatOnlyPreview({ hat, hatColorKey = 'red' }) {
  if (hat === 'none') {
    return (
      <svg width="100%" height="100%" viewBox="0 0 48 32" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <line x1="10" y1="16" x2="38" y2="16" stroke="#C8C8D8" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg
      width="100%"
      height="100%"
      viewBox={getHatPickerViewBox(hat)}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      style={{ display: 'block', overflow: 'hidden' }}
    >
      <MonsterHatGraphic hat={hat} hatColorKey={hatColorKey} />
    </svg>
  )
}

function HatScrollRow({ children, bleed = 0 }) {
  const rowRef = useRef(null)
  const dragRef = useRef({
    active: false,
    pending: false,
    startX: 0,
    scrollLeft: 0,
    pointerId: null,
  })
  const draggedRef = useRef(false)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    const el = rowRef.current
    if (!el) return
    function onWheel(e) {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (delta === 0) return
      el.scrollLeft += delta
      e.preventDefault()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  function startDrag(el, e) {
    dragRef.current.active = true
    draggedRef.current = true
    setDragging(true)
    el.setPointerCapture(e.pointerId)
  }

  function endDrag(e) {
    const el = rowRef.current
    const drag = dragRef.current
    if (!drag.pending && !drag.active) return
    if (drag.pointerId !== e.pointerId) return
    drag.pending = false
    drag.active = false
    drag.pointerId = null
    setDragging(false)
    if (el?.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
  }

  return (
    <div className="style-hat-bleed" style={{
      marginLeft: -bleed,
      marginRight: -bleed,
      width: bleed ? `calc(100% + ${bleed * 2}px)` : '100%',
    }}>
      <ScrollFade
        ref={rowRef}
        axis="x"
        fadeColor={colors.surface}
        scrollClassName={dragging ? 'is-dragging' : ''}
        style={{ flex: 'none', minHeight: 'auto' }}
        scrollStyle={{ flex: 'none', minHeight: 'auto' }}
        onPointerDown={(e) => {
          if (e.pointerType === 'mouse' && e.button !== 0) return
          const el = rowRef.current
          if (!el) return
          draggedRef.current = false
          dragRef.current = {
            active: false,
            pending: true,
            startX: e.clientX,
            scrollLeft: el.scrollLeft,
            pointerId: e.pointerId,
          }
        }}
        onPointerMove={(e) => {
          const drag = dragRef.current
          if (!drag.pending && !drag.active) return
          if (drag.pointerId !== e.pointerId) return
          const el = rowRef.current
          if (!el) return
          const dx = e.clientX - drag.startX
          if (!drag.active) {
            if (Math.abs(dx) < 8) return
            startDrag(el, e)
          }
          el.scrollLeft = drag.scrollLeft - dx
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(e) => {
          if (!draggedRef.current) return
          e.preventDefault()
          e.stopPropagation()
          draggedRef.current = false
        }}
      >
        {children}
      </ScrollFade>
    </div>
  )
}

function ColorSwatchRow({ value, onChange, disabled = false, colors: palette = MONSTER_COLORS, getFill = c => c.body, getRing = c => c.accent, scrollable = false, bleed = 0 }) {
  const swatches = palette.map(c => (
    <button
      key={c.key}
      onClick={() => !disabled && onChange(c.key)}
      title={c.label}
      disabled={disabled}
      style={{
        width: scrollable ? 36 : '100%',
        height: scrollable ? 36 : undefined,
        aspectRatio: scrollable ? undefined : '1',
        flexShrink: scrollable ? 0 : undefined,
        borderRadius: '50%',
        background: getFill(c),
        border: value === c.key ? `3px solid ${getRing(c)}` : '3px solid transparent',
        cursor: disabled ? 'default' : 'pointer',
        boxSizing: 'border-box',
        opacity: disabled ? 0.35 : 1,
        boxShadow: value === c.key ? `0 0 0 2px ${getFill(c)}` : 'inset 0 0 0 1px rgba(0,0,0,0.12)',
        transition: 'border .12s, box-shadow .12s, opacity .12s',
      }}
    />
  ))

  if (scrollable) {
    return <HatScrollRow bleed={bleed}>{swatches}</HatScrollRow>
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${palette.length}, 1fr)`,
      gap: 8,
      width: '100%',
      marginBottom: 20,
    }}>
      {swatches}
    </div>
  )
}

function StyleTabBar({ activeTab, onChange }) {
  return (
    <div style={{
      display: 'flex',
      gap: 2,
      marginBottom: 16,
      borderBottom: '2px solid #E8E8F0',
    }}>
      {STYLE_TABS.map(tab => {
        const sel = activeTab === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            style={{
              flex: 1,
              padding: '10px 4px',
              background: 'none',
              border: 'none',
              borderBottom: sel ? '2px solid #254CA4' : '2px solid transparent',
              color: sel ? '#254CA4' : '#606078',
              fontFamily: "'Manrope',sans-serif",
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              marginBottom: -2,
              transition: 'color .12s, border-color .12s',
            }}
          >{tab.label}</button>
        )
      })}
    </div>
  )
}

function MonsterCustomizeModal({ isOpen, colorKey, hatKey, hatColorKey, eyeColorKey, eyeShapeKey, accessoryKey, accessoryColorKey, onSave, onClose, isMobile = false }) {
  const [draftColor, setDraftColor] = useState(colorKey)
  const [draftHat, setDraftHat] = useState(hatKey)
  const [draftHatColor, setDraftHatColor] = useState(hatColorKey)
  const [draftEyeColor, setDraftEyeColor] = useState(eyeColorKey)
  const [draftEyeShape, setDraftEyeShape] = useState(eyeShapeKey)
  const [draftAccessory, setDraftAccessory] = useState(accessoryKey)
  const [draftAccessoryColor, setDraftAccessoryColor] = useState(accessoryColorKey)
  const [activeTab, setActiveTab] = useState('body')
  const [shakeGen, setShakeGen] = useState(0)
  const [mouthReactGen, setMouthReactGen] = useState(0)
  const [hatSwapGen, setHatSwapGen] = useState(0)
  const [hatSwapFrom, setHatSwapFrom] = useState('none')
  const [hatSwapTo, setHatSwapTo] = useState('none')
  const [hatSwapFromColor, setHatSwapFromColor] = useState('red')
  const [hatSwapToColor, setHatSwapToColor] = useState('red')
  const [accessorySwapGen, setAccessorySwapGen] = useState(0)
  const [accessorySwapFrom, setAccessorySwapFrom] = useState('none')
  const [accessorySwapTo, setAccessorySwapTo] = useState('none')
  const [accessorySwapFromColor, setAccessorySwapFromColor] = useState('red')
  const [accessorySwapToColor, setAccessorySwapToColor] = useState('red')
  const colorReadyRef = useRef(false)
  const hatReadyRef = useRef(false)
  const hatColorReadyRef = useRef(false)
  const eyeReadyRef = useRef(false)
  const eyeShapeReadyRef = useRef(false)
  const accessoryReadyRef = useRef(false)
  const accessoryColorReadyRef = useRef(false)
  const visualHatRef = useRef(hatKey)
  const visualHatColorRef = useRef(hatColorKey)
  const visualAccessoryRef = useRef(accessoryKey)
  const visualAccessoryColorRef = useRef(accessoryColorKey)

  const handleHatSwapComplete = useCallback((hat, color) => {
    visualHatRef.current = hat
    visualHatColorRef.current = color
  }, [])

  const handleAccessorySwapComplete = useCallback((accessory, color) => {
    visualAccessoryRef.current = accessory
    visualAccessoryColorRef.current = color
  }, [])

  useLayoutEffect(() => {
    if (!isOpen) return
    setDraftColor(colorKey)
    setDraftHat(hatKey)
    setDraftHatColor(hatColorKey)
    setDraftEyeColor(eyeColorKey)
    setDraftEyeShape(eyeShapeKey)
    setDraftAccessory(accessoryKey)
    setDraftAccessoryColor(accessoryColorKey)
    setActiveTab('body')
    colorReadyRef.current = false
    hatReadyRef.current = false
    hatColorReadyRef.current = false
    eyeReadyRef.current = false
    eyeShapeReadyRef.current = false
    accessoryReadyRef.current = false
    accessoryColorReadyRef.current = false
    visualHatRef.current = hatKey
    visualHatColorRef.current = hatColorKey
    visualAccessoryRef.current = accessoryKey
    visualAccessoryColorRef.current = accessoryColorKey
    setShakeGen(0)
    setMouthReactGen(0)
    setHatSwapGen(0)
    setHatSwapFrom(hatKey)
    setHatSwapTo(hatKey)
    setHatSwapFromColor(hatColorKey)
    setHatSwapToColor(hatColorKey)
    setAccessorySwapGen(0)
    setAccessorySwapFrom(accessoryKey)
    setAccessorySwapTo(accessoryKey)
    setAccessorySwapFromColor(accessoryColorKey)
    setAccessorySwapToColor(accessoryColorKey)
  }, [isOpen, colorKey, hatKey, hatColorKey, eyeColorKey, eyeShapeKey, accessoryKey, accessoryColorKey])

  useEffect(() => {
    if (!isOpen) return
    if (!colorReadyRef.current) {
      colorReadyRef.current = true
      return
    }
    setShakeGen(g => g + 1)
  }, [draftColor, isOpen])

  useEffect(() => {
    if (!isOpen) return
    if (!hatReadyRef.current) {
      hatReadyRef.current = true
      return
    }
    if (visualHatRef.current === draftHat) return
    setHatSwapFrom(visualHatRef.current)
    setHatSwapTo(draftHat)
    setHatSwapFromColor(visualHatColorRef.current)
    setHatSwapToColor(draftHatColor)
    setHatSwapGen(g => g + 1)
    setMouthReactGen(g => g + 1)
  }, [draftHat, draftHatColor, isOpen])

  useEffect(() => {
    if (!isOpen) return
    if (!hatColorReadyRef.current) {
      hatColorReadyRef.current = true
      return
    }
    visualHatColorRef.current = draftHatColor
  }, [draftHatColor, isOpen])

  useEffect(() => {
    if (!isOpen) return
    if (!eyeReadyRef.current) {
      eyeReadyRef.current = true
      return
    }
    setShakeGen(g => g + 1)
  }, [draftEyeColor, isOpen])

  useEffect(() => {
    if (!isOpen) return
    if (!eyeShapeReadyRef.current) {
      eyeShapeReadyRef.current = true
      return
    }
    setShakeGen(g => g + 1)
  }, [draftEyeShape, isOpen])

  useEffect(() => {
    if (!isOpen) return
    if (!accessoryReadyRef.current) {
      accessoryReadyRef.current = true
      return
    }
    if (visualAccessoryRef.current === draftAccessory) return
    setAccessorySwapFrom(visualAccessoryRef.current)
    setAccessorySwapTo(draftAccessory)
    setAccessorySwapFromColor(visualAccessoryColorRef.current)
    setAccessorySwapToColor(draftAccessoryColor)
    setAccessorySwapGen(g => g + 1)
    setMouthReactGen(g => g + 1)
  }, [draftAccessory, draftAccessoryColor, isOpen])

  useEffect(() => {
    if (!isOpen) return
    if (!accessoryColorReadyRef.current) {
      accessoryColorReadyRef.current = true
      return
    }
    visualAccessoryColorRef.current = draftAccessoryColor
  }, [draftAccessoryColor, isOpen])

  function handleDismiss() {
    onSave(draftColor, draftHat, draftHatColor, draftEyeColor, draftEyeShape, draftAccessory, draftAccessoryColor)
    onClose()
  }

  function handleReturnToDefault() {
    const d = MONSTER_LOOK_DEFAULTS
    setDraftColor(d.colorKey)
    setDraftHat(d.hatKey)
    setDraftHatColor(d.hatColorKey)
    setDraftEyeColor(d.eyeColorKey)
    setDraftEyeShape(d.eyeShapeKey)
    setDraftAccessory(d.accessoryKey)
    setDraftAccessoryColor(d.accessoryColorKey)
    onSave(d.colorKey, d.hatKey, d.hatColorKey, d.eyeColorKey, d.eyeShapeKey, d.accessoryKey, d.accessoryColorKey)
  }

  if (!isOpen) return null

  const preview = getMonsterColors(draftColor)
  const SheetTag = isMobile ? ScrollFade : 'div'

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 62 }}
      onMouseDown={handleDismiss}
    >
      <SheetTag
        {...(isMobile ? {
          variant: 'self',
          axis: 'y',
          fadeColor: colors.surface,
          className: 'sheet-max-viewport',
        } : {})}
        style={isMobile
          ? { background: '#FDF8EF', borderRadius: '18px 18px 0 0', padding: '20px 16px', width: '100%', minWidth: 0, boxShadow: '0 -4px 24px rgba(0,0,0,0.2)', fontFamily: "'Manrope',sans-serif", overflowX: 'visible' }
          : { background: '#FDF8EF', borderRadius: 18, padding: '24px 28px', maxWidth: 440, width: '92%', minWidth: 0, boxShadow: '0 8px 40px rgba(0,0,0,0.28)', fontFamily: "'Manrope',sans-serif", overflowX: 'visible' }}
        onMouseDown={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: isMobile ? 20 : 22, fontWeight: 700, color: '#1C1C2E' }}>Style</div>
            <div style={{ fontSize: 13, color: '#606078', marginTop: 4 }}>Customize your monster&apos;s look.</div>
          </div>
          <IconCloseButton onClick={handleDismiss} />
        </div>

        <div style={{
          position: 'relative',
          height: isMobile ? 132 : 148,
          width: '100%',
          background: 'linear-gradient(180deg, #223152 0%, #19243D 100%)',
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: 20,
        }}>
          <TomaAppearancePreview
            bodyColor={preview.body}
            accentColor={preview.accent}
            hat={draftHat}
            hatColorKey={draftHatColor}
            compact={isMobile}
            clipH={isMobile ? 132 : 148}
            clipBottom={isMobile ? 40 : 64}
            clipScale={isMobile ? 0.92 : 0.96}
            mouthReactGen={mouthReactGen}
            shakeGen={shakeGen}
            hatSwapGen={hatSwapGen}
            hatSwapFrom={hatSwapFrom}
            hatSwapTo={hatSwapTo}
            hatSwapFromColor={hatSwapFromColor}
            hatSwapToColor={hatSwapToColor}
            eyeColorKey={draftEyeColor}
            eyeShapeKey={draftEyeShape}
            accessory={draftAccessory}
            accessoryColorKey={draftAccessoryColor}
            accessorySwapGen={accessorySwapGen}
            accessorySwapFrom={accessorySwapFrom}
            accessorySwapTo={accessorySwapTo}
            accessorySwapFromColor={accessorySwapFromColor}
            accessorySwapToColor={accessorySwapToColor}
            onHatSwapComplete={handleHatSwapComplete}
            onAccessorySwapComplete={handleAccessorySwapComplete}
          />
        </div>

        <StyleTabBar activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === 'body' && (
          <>
            <FieldLabel style={{ marginBottom: 10 }}>Body color</FieldLabel>
            <ColorSwatchRow value={draftColor} onChange={setDraftColor} />
          </>
        )}

        {activeTab === 'eyes' && (
          <>
            <FieldLabel style={{ marginBottom: 10 }}>Eye shape</FieldLabel>
            <HatScrollRow bleed={isMobile ? 16 : 28}>
              {MONSTER_EYE_SHAPES.map(s => {
                const sel = draftEyeShape === s.key
                return (
                  <PickerSquare
                    key={s.key}
                    selected={sel}
                    onClick={() => setDraftEyeShape(s.key)}
                    title={s.label}
                  >
                    <div style={{ width: '100%', height: 56, pointerEvents: 'none', overflow: 'hidden' }}>
                      <EyeShapeOnlyPreview eyeShape={s.key} eyeColorKey={sel ? draftEyeColor : 'dark'} />
                    </div>
                  </PickerSquare>
                )
              })}
            </HatScrollRow>

            <FieldLabel style={{ marginBottom: 10 }}>Eye color</FieldLabel>
            <ColorSwatchRow
              value={draftEyeColor}
              onChange={setDraftEyeColor}
              colors={MONSTER_EYE_COLORS}
              getFill={c => c.iris}
              getRing={c => c.iris}
            />
          </>
        )}

        {activeTab === 'hats' && (
          <>
            <FieldLabel style={{ marginBottom: 10 }}>Hat</FieldLabel>
            <HatScrollRow bleed={isMobile ? 16 : 28}>
              {MONSTER_HATS.map(h => {
                const sel = draftHat === h.key
                return (
                  <PickerSquare
                    key={h.key}
                    selected={sel}
                    onClick={() => setDraftHat(h.key)}
                    title={h.label}
                  >
                    <div style={{ width: '100%', height: 56, pointerEvents: 'none', overflow: 'hidden' }}>
                      <HatOnlyPreview hat={h.key} hatColorKey={sel ? draftHatColor : 'red'} />
                    </div>
                  </PickerSquare>
                )
              })}
            </HatScrollRow>

            <FieldLabel style={{ marginBottom: 10 }}>Hat color</FieldLabel>
            <ColorSwatchRow
              value={draftHatColor}
              onChange={setDraftHatColor}
              disabled={draftHat === 'none'}
              colors={STYLE_ITEM_COLORS}
              scrollable
              bleed={isMobile ? 16 : 28}
            />
          </>
        )}

        {activeTab === 'accessories' && (
          <>
            <FieldLabel style={{ marginBottom: 10 }}>Accessory</FieldLabel>
            <HatScrollRow bleed={isMobile ? 16 : 28}>
              {MONSTER_ACCESSORIES.map(a => {
                const sel = draftAccessory === a.key
                return (
                  <PickerSquare
                    key={a.key}
                    selected={sel}
                    onClick={() => setDraftAccessory(a.key)}
                    title={a.label}
                  >
                    <div style={{ width: '100%', height: 56, pointerEvents: 'none', overflow: 'hidden' }}>
                      <AccessoryOnlyPreview accessory={a.key} accessoryColorKey={sel ? draftAccessoryColor : 'red'} />
                    </div>
                  </PickerSquare>
                )
              })}
            </HatScrollRow>

            <FieldLabel style={{ marginBottom: 10 }}>Accessory color</FieldLabel>
            <ColorSwatchRow
              value={draftAccessoryColor}
              onChange={setDraftAccessoryColor}
              disabled={draftAccessory === 'none'}
              colors={STYLE_ITEM_COLORS}
              scrollable
              bleed={isMobile ? 16 : 28}
            />
          </>
        )}

        <Button variant="ghost" fullWidth size="sm" onClick={handleReturnToDefault} style={{ marginBottom: 10 }}>
          Return to default
        </Button>

        <Button fullWidth onClick={handleDismiss}>
          Done
        </Button>
      </SheetTag>
    </div>
  )
}

// ─── ShelfListModal — shelf manager (edit / delete / add / reorder) ──────────
// Mobile: bottom sheet. Desktop: centered modal like the other panels.

function ShelfListModal({ shelfConfigs, getColors, shelfName, username, onEditPlate, onEditShelf, onDeleteShelf, onAddShelf, onReorder, onClose, isMobile = false }) {
  const canDelete = shelfConfigs.length > 2
  const CARD_H = 52
  const CARD_GAP = 10
  const ROW_H = CARD_H + CARD_GAP  // used to translate rows during drag and to compute drop index
  const listRef = useRef(null)
  const rowRefs = useRef([])
  // Drag state — refs are the source of truth (event handlers close over them),
  // React state mirrors the refs to drive per-frame styling.
  const dragFromRef = useRef(-1)
  const dragOverRef = useRef(-1)
  const [dragFrom, setDragFrom] = useState(-1)
  const isDragging = dragFrom !== -1

  function clearRowTransforms() {
    rowRefs.current.forEach(el => {
      if (!el) return
      el.style.transform = ''
      el.style.transition = ''
      el.style.willChange = ''
    })
  }

  // Imperative transforms keep drag at pointer speed — React state on every move was laggy.
  function applyRowTransforms(from, over, draggedDy) {
    rowRefs.current.forEach((el, idx) => {
      if (!el) return
      if (idx === from) {
        el.style.transform = `translate3d(0, ${draggedDy}px, 0)`
        el.style.transition = 'none'
        el.style.willChange = 'transform'
        return
      }
      let ty = 0
      if (from < idx && over >= idx) ty = -ROW_H
      else if (from > idx && over <= idx) ty = ROW_H
      el.style.transform = ty ? `translate3d(0, ${ty}px, 0)` : ''
      el.style.transition = 'transform 0.11s cubic-bezier(0.22, 1, 0.36, 1)'
      el.style.willChange = ty ? 'transform' : ''
    })
  }

  useEffect(() => () => clearRowTransforms(), [])

  function startDrag(idx, e) {
    dragFromRef.current = idx
    dragOverRef.current = idx
    setDragFrom(idx)
    const startY = e.clientY
    const rowTopWithinList = rowRefs.current[idx]?.offsetTop ?? idx * ROW_H
    const listInnerH = shelfConfigs.length * ROW_H
    applyRowTransforms(idx, idx, 0)
    function onMove(ev) {
      const dy = ev.clientY - startY
      const minDy = -rowTopWithinList
      const maxDy = (listInnerH - ROW_H) - rowTopWithinList
      const clamped = Math.max(minDy, Math.min(maxDy, dy))
      const visualCentre = rowTopWithinList + clamped + ROW_H / 2
      const target = Math.max(0, Math.min(shelfConfigs.length - 1, Math.floor(visualCentre / ROW_H)))
      dragOverRef.current = target
      applyRowTransforms(idx, target, clamped)
      ev.preventDefault()
    }
    function onUp() {
      const from = dragFromRef.current
      const to = dragOverRef.current !== -1 ? dragOverRef.current : from
      clearRowTransforms()
      dragFromRef.current = -1
      dragOverRef.current = -1
      setDragFrom(-1)
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
      style={{
        position: 'fixed', inset: 0, zIndex: 62,
        background: isMobile ? 'rgba(0,0,0,0.45)' : 'rgba(25,36,61,0.6)',
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? 0 : 24,
      }}
      onMouseDown={onClose}
    >
      <div
        className={isMobile ? 'sheet-max-viewport' : undefined}
        style={isMobile
          ? { background: '#FDF8EF', borderRadius: '18px 18px 0 0', padding: '20px 16px', width: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, boxShadow: '0 -4px 24px rgba(0,0,0,0.2)', fontFamily: "'Manrope',sans-serif", overflow: isDragging ? 'visible' : 'hidden' }
          : {
              background: '#FDF8EF', borderRadius: 20, padding: '28px 32px 24px',
              width: 'min(520px, 92vw)', maxHeight: 'min(84vh, 720px)',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 16px 48px rgba(0,0,0,0.3)', fontFamily: "'Manrope',sans-serif",
              overflow: isDragging ? 'visible' : 'hidden',
            }}
        onMouseDown={e => e.stopPropagation()}
      >
        <SheetHeader
          title="Edit bookcase"
          subtitle={!isMobile ? 'Rename shelves, reorder rows, and update your collection label.' : undefined}
          onClose={onClose}
          isMobile={isMobile}
        />

        {/* Shelf name + username — tap to open the plate edit modal */}
        <button
          onClick={onEditPlate}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
            background: isMobile ? '#F2EFE8' : 'white',
            border: `2px solid ${isMobile ? '#E4E4EC' : '#D0D0DC'}`, borderRadius: 12,
            padding: isMobile ? '10px 14px' : '14px 16px', cursor: 'pointer', fontFamily: "'Manrope',sans-serif",
            marginBottom: isMobile ? 18 : 20, width: '100%', flexShrink: 0,
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseEnter={e => { if (!isMobile) { e.currentTarget.style.borderColor = '#254CA4'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,76,164,0.12)' } }}
          onMouseLeave={e => { if (!isMobile) { e.currentTarget.style.borderColor = '#D0D0DC'; e.currentTarget.style.boxShadow = 'none' } }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9898B0', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>Collection</div>
            <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 700, color: '#1C1C2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {shelfName || 'My Shelf'}
            </div>
            {username && (
              <div style={{ fontSize: 12, color: '#606078', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                made by {username}
              </div>
            )}
          </div>
          <IconPencil size={15} color="#9898B0" />
        </button>

        <div style={{ fontSize: 13, color: '#606078', marginBottom: 10, flexShrink: 0 }}>
          {isMobile ? 'Tap a shelf to rename · drag the handle to reorder' : 'Click a shelf to rename · drag the handle to reorder'}
        </div>

        <ScrollFade
          ref={listRef}
          axis="y"
          disabled={isDragging}
          style={{ flex: 1, minHeight: 0, margin: '0 -10px' }}
          scrollStyle={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            padding: '4px 10px',
            overflowX: 'visible',
            ...(isDragging ? { overflow: 'visible', overflowY: 'visible' } : null),
          }}
        >
          {shelfConfigs.map((cfg, idx) => {
            const colors = getColors(cfg.colorKey)
            const isBeingDragged = dragFrom === idx
            return (
              <div
                key={cfg.id}
                ref={el => { rowRefs.current[idx] = el }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  height: CARD_H, marginBottom: CARD_GAP, padding: '0 8px 0 2px',
                  boxSizing: 'border-box',
                  background: '#FFFFFF',
                  border: `2px solid ${isBeingDragged ? '#254CA4' : '#D0D0DC'}`,
                  borderRadius: 12,
                  transition: 'box-shadow .12s ease, border-color .12s ease',
                  boxShadow: isBeingDragged
                    ? '0 14px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(37,76,164,0.08)'
                    : '0 1px 3px rgba(0,0,0,0.05)',
                  zIndex: isBeingDragged ? 5 : 1,
                  position: 'relative',
                }}
              >
                {/* Drag handle — press-and-drag to reorder the whole card */}
                <button
                  onPointerDown={e => { e.preventDefault(); startDrag(idx, e) }}
                  aria-label="Drag to reorder"
                  style={{
                    width: 28, height: 40, borderRadius: 8, border: 'none',
                    background: isBeingDragged ? 'rgba(37,76,164,0.08)' : 'transparent',
                    color: isBeingDragged ? '#254CA4' : '#9898B0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: isBeingDragged ? 'grabbing' : 'grab', touchAction: 'none', flexShrink: 0,
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
                    flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                    background: 'none', border: 'none', borderRadius: 8,
                    padding: '8px 10px', cursor: 'pointer', fontFamily: "'Manrope',sans-serif",
                    height: 40,
                  }}
                >
                  <span style={{ width: 16, height: 16, borderRadius: 4, background: colors.tabBg, flexShrink: 0, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)' }} />
                  <span style={{ flex: 1, fontWeight: 700, fontSize: 15, color: '#1C1C2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cfg.label}</span>
                  <IconPencil size={15} color="#9898B0" />
                </button>
                <button
                  onClick={() => canDelete && dragFrom === -1 && onDeleteShelf(idx)}
                  aria-label="Delete shelf"
                  style={{
                    width: 36, height: 36, borderRadius: 8, border: 'none',
                    background: canDelete ? 'rgba(192,57,43,0.08)' : 'rgba(0,0,0,0.04)',
                    cursor: canDelete ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: canDelete ? 1 : 0.45, flexShrink: 0,
                  }}
                >
                  <IconTrash size={17} color={canDelete ? '#c0392b' : '#9898B0'} />
                </button>
              </div>
            )
          })}
        </ScrollFade>

        <Button
          variant={isMobile ? 'dashed' : 'dashedPrimary'}
          hoverFill={!isMobile}
          fullWidth
          onClick={onAddShelf}
          style={{
            marginTop: isMobile ? 10 : 14,
            flexShrink: 0,
            ...(isMobile ? { padding: '12px 0 calc(12px + env(safe-area-inset-bottom, 0px))' } : null),
          }}
        >
          + Add Shelf
        </Button>
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
    <DialogBackdrop onClose={e => { if (e.target === e.currentTarget) onClose() }}>
      <DialogCard>
        <DialogTitle style={{ marginBottom: 22 }}>Edit label</DialogTitle>
        <FieldLabel>Your name</FieldLabel>
        <TextInput
          ref={nameRef}
          value={newUsername}
          onChange={e => setNewUsername(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onSave(newShelfName.trim() || shelfName, newUsername.trim()) }}
          style={{ marginBottom: 18 }}
        />
        <FieldLabel>Shelf name</FieldLabel>
        <TextInput
          value={newShelfName}
          onChange={e => setNewShelfName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onSave(newShelfName.trim() || shelfName, newUsername.trim()) }}
          style={{ marginBottom: 28 }}
        />
        <DialogActions>
          <Button size="dialog" fullWidth onClick={() => onSave(newShelfName.trim() || shelfName, newUsername.trim())}>Save</Button>
          <Button variant="ghost" size="dialog" fullWidth onClick={onClose}>Cancel</Button>
        </DialogActions>
      </DialogCard>
    </DialogBackdrop>
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
    <DialogBackdrop zIndex={Z.shelfEdit} onClose={e => { if (e.target === e.currentTarget) onClose() }}>
      <DialogCard>
        <DialogTitle style={{ marginBottom: 22 }}>{title}</DialogTitle>

        <FieldLabel>Shelf name</FieldLabel>
        <TextInput
          ref={inputRef}
          value={label}
          onChange={e => setLabel(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onSave(label.trim() || cfg.label, colorKey) }}
          style={{ marginBottom: 22 }}
        />

        <FieldLabel style={{ marginBottom: 12 }}>Shelf color</FieldLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 8, marginBottom: 28 }}>
          {ROYGBIV.map(c => (
            <div
              key={c.key}
              onClick={() => setColorKey(c.key)}
              style={{
                width: '100%', aspectRatio: '1', borderRadius: '50%', background: c.tabBg,
                border: colorKey === c.key ? `3px solid ${c.tabInk}` : '3px solid transparent',
                cursor: 'pointer', boxSizing: 'border-box',
                boxShadow: colorKey === c.key ? `0 0 0 2px ${c.tabBg}` : 'none',
                transition: 'border .12s, box-shadow .12s',
              }}
            />
          ))}
        </div>

        <DialogActions style={{ marginBottom: 12 }}>
          <Button size="dialog" fullWidth onClick={() => onSave(label.trim() || cfg.label, colorKey)}>Save</Button>
          <Button variant="secondaryPrimary" size="dialog" fullWidth onClick={onClose}>Cancel</Button>
        </DialogActions>
        {showDelete && (
          <>
            <Button
              variant="destructive"
              fullWidth
              size="sm"
              disabled={!canDelete}
              onClick={canDelete ? onDelete : () => setShowMinWarning(true)}
              style={{ color: canDelete ? colors.destructive : '#9090A8', borderColor: canDelete ? colors.destructive : colors.borderAlt }}
            >
              Delete Shelf
            </Button>
            {showMinWarning && (
              <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: '#b05a30', textAlign: 'center' }}>
                A minimum of 2 shelves is required.
              </div>
            )}
          </>
        )}
      </DialogCard>
    </DialogBackdrop>
  )
}


export { SidePanelButtons, BookPreviewModal, BookAddPanel, DecorAddPanel, MonsterCustomizeModal, ShelfListModal, ShelfPlateEditModal, ShelfEditModal }
