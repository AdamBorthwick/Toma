import { useState, useEffect, useRef } from 'react'
import { saveReview, deleteReview, addInventoryBook } from '../db.js'
import { getShelfColors, findShelf } from '../data/shelves.jsx'
import { IconPencil, IconClose, IconStar } from './icons.jsx'

function Overlay({ selected, openPhase, onClose, shelfConfigs, descCache, userId, reviewsRef, isViewOnly, ownerName, viewerUserId, isMobile = false }) {
  // step 0 = below screen  |  step 1 = portrait risen  |  step 2 = spread open
  const [step, setStep] = useState(0)
  const [bookOpen, setBookOpen] = useState(false)
  const [overlayPage, setOverlayPage] = useState(0)   // navigation — drives controls + dots
  const [displayPage, setDisplayPage] = useState(0)   // rendered content — lags during transitions
  const [rightDP, setRightDP] = useState(0)             // right page rendered content
  const [turnerVisible, setTurnerVisible] = useState(false)
  const [turnerRotated, setTurnerRotated] = useState(false)
  const [turnerFromPage, setTurnerFromPage] = useState(0)
  const [turnerDir, setTurnerDir] = useState('forward') // 'forward'|'backward'
  const [hoverArea, setHoverArea] = useState(null)
  const [paginationHover, setPaginationHover] = useState(false)
  const [bookAnimDone, setBookAnimDone] = useState(false)
  const [showCloseWarning, setShowCloseWarning] = useState(false)
  const pageTimerRef = useRef(null)
  const bookAnimTimerRef = useRef(null)

  const handleClose = () => {
    if (reviewMode === 'edit') { setShowCloseWarning(true) } else { onClose() }
  }

  function goToPage(p) {
    if (p === overlayPage) return
    const prev = overlayPage
    if (pageTimerRef.current) clearTimeout(pageTimerRef.current)
    // Mobile: sequential single pages, no spread/turner — displayPage/rightDP stay 0
    if (isMobile) {
      if (prev === 0 && p > 0) { setOverlayPage(p); setBookOpen(true); return }
      if (prev > 0 && p === 0) { setOverlayPage(0); setBookOpen(false); return }
      setOverlayPage(p); return
    }
    // Cover → Spread
    if (prev === 0 && p > 0) {
      setOverlayPage(p); setDisplayPage(p); setRightDP(p); setBookOpen(true); return
    }
    // Spread → Cover
    if (prev > 0 && p === 0) {
      setOverlayPage(0); setBookOpen(false); setTurnerVisible(false)
      pageTimerRef.current = setTimeout(() => { setDisplayPage(0); setRightDP(0) }, 840); return
    }
    // Forward: turner mounts on the right at 0°, sweeps left to -158°
    // Left page (displayPage) holds old content; right page (rightDP) preloads new content behind turner
    if (p > prev) {
      setTurnerFromPage(prev); setTurnerDir('forward')
      setTurnerRotated(false); setTurnerVisible(true)
      setOverlayPage(p); setRightDP(p)
      pageTimerRef.current = setTimeout(() => {
        setDisplayPage(p); setTurnerVisible(false); setTurnerRotated(false)
      }, 780); return
    }
    // Backward: turner mounts on the left at -158°, sweeps right to 0°
    // Left page (displayPage) preloads new content immediately (hidden under turner at start)
    // Right page (rightDP) holds old content until turner covers it
    setTurnerFromPage(prev); setTurnerDir('backward')
    setTurnerRotated(false); setTurnerVisible(true)
    setOverlayPage(p); setDisplayPage(p)
    pageTimerRef.current = setTimeout(() => {
      setRightDP(p); setTurnerVisible(false); setTurnerRotated(false)
    }, 780)
  }
  const [fetchedDescription, setFetchedDescription] = useState(null)
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewMode, setReviewMode] = useState('view')
  const [draftText, setDraftText] = useState('')
  const [draftRating, setDraftRating] = useState(0)

  // Load persisted review whenever the selected book changes
  useEffect(() => {
    if (!selected?.id) return
    const saved = reviewsRef?.current?.get(selected.id)
    setReviewText(saved?.text ?? '')
    setReviewRating(saved?.rating ?? 0)
    setReviewMode('view')
  }, [selected?.id])

  // Let the cover finish its opening animation before promoting the overlay to interactive z-index
  useEffect(() => {
    if (bookAnimTimerRef.current) clearTimeout(bookAnimTimerRef.current)
    if (bookOpen) {
      bookAnimTimerRef.current = setTimeout(() => setBookAnimDone(true), 840)
    } else {
      setBookAnimDone(false)
    }
  }, [bookOpen])

  useEffect(() => {
    if (pageTimerRef.current) clearTimeout(pageTimerRef.current)
    setOverlayPage(0); setDisplayPage(0); setRightDP(0); setBookOpen(false)
    setTurnerVisible(false); setTurnerRotated(false); setTurnerDir('forward')
    if (!selected?.id || selected.description || !selected.id.startsWith('OL')) return
    setFetchedDescription(null)
    const id = selected.id
    let cancelled = false
    const promise = descCache?.current?.[id]
      ?? fetch(`https://openlibrary.org/works/${id}.json`)
          .then(r => r.json())
          .then(data => {
            const extract = v => typeof v === 'string' ? v : (v?.value ?? null)
            const desc = extract(data.description)
            if (desc) return { text: desc, type: 'description' }
            const fs = extract(data.first_sentence)
            if (fs) return { text: fs, type: 'firstSentence' }
            if (data.subjects?.length) return { text: data.subjects.slice(0, 6).join(' · '), type: 'subjects' }
            return null
          })
          .catch(() => null)
    if (descCache && !descCache.current[id]) descCache.current[id] = promise
    promise.then(desc => { if (!cancelled) setFetchedDescription(desc) })
    return () => { cancelled = true }
  }, [selected?.id])

  useEffect(() => {
    if (openPhase === 'open') { setStep(1); return }
    if (openPhase === 'closing') {
      setStep(0)
      const t = setTimeout(() => { setBookOpen(false); setOverlayPage(0); setDisplayPage(0); setRightDP(0); setTurnerVisible(false); setTurnerRotated(false) }, 360)
      return () => clearTimeout(t)
    }
    setStep(0); setBookOpen(false); setOverlayPage(0); setShowCloseWarning(false)
  }, [openPhase])

  // One frame after the turner mounts at its start rotation, kick off the transition
  useEffect(() => {
    if (!turnerVisible || turnerRotated) return
    const id = requestAnimationFrame(() => setTurnerRotated(true))
    return () => cancelAnimationFrame(id)
  }, [turnerVisible, turnerRotated])

  if (!selected) return null
  const { shelf: sh, idx: shIdx } = findShelf(selected.id, shelfConfigs)
  const colors = shIdx >= 0 ? getShelfColors(sh?.colorKey) : null
  const accent = colors?.accent ?? sh?.accent ?? '#888'
  const shelfLabel = sh?.label ?? ''
  // genre: prefer book's own category tag, fall back to shelf label
  const genre = selected.category || shelfLabel
  const yearGenre = [selected.year, genre].filter(Boolean).join(' • ')
  const LABELS = { description: 'About', firstSentence: 'Opening Line', subjects: 'Subjects' }
  let bodyText = '', bodyLabel = null
  if (selected.description) {
    bodyText = selected.description; bodyLabel = 'About'
  } else if (fetchedDescription) {
    bodyText = fetchedDescription.text; bodyLabel = LABELS[fetchedDescription.type] ?? 'About'
  } else if (selected.firstSentence) {
    bodyText = selected.firstSentence; bodyLabel = 'Opening Line'
  } else if (selected.blurb) {
    bodyText = selected.blurb; bodyLabel = 'About'
  }

  const iconAmazon     = <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" style={{color:'#606078',flexShrink:0}}><path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.525.13.12.174.09.336-.12.48-.256.19-.6.41-1.006.654-1.244.743-2.64 1.316-4.185 1.726a17.617 17.617 0 01-10.951-.577 17.88 17.88 0 01-5.43-3.35c-.1-.074-.151-.15-.151-.22 0-.047.021-.09.051-.13zm6.565-6.218c0-1.005.247-1.863.743-2.577.495-.71 1.17-1.25 2.04-1.615.796-.335 1.756-.575 2.912-.72.39-.046 1.033-.103 1.92-.174v-.37c0-.93-.105-1.558-.3-1.875-.302-.43-.78-.65-1.44-.65h-.182c-.48.046-.896.196-1.246.46-.35.27-.575.63-.675 1.096-.06.3-.206.465-.435.51l-2.52-.315c-.248-.06-.372-.18-.372-.39 0-.046.007-.09.022-.15.247-1.29.855-2.25 1.82-2.88.976-.616 2.1-.975 3.39-1.05h.54c1.65 0 2.957.434 3.888 1.29.135.15.27.3.405.48.12.165.224.314.283.45.075.134.15.33.195.57.06.254.105.42.135.51.03.104.062.3.076.615.01.313.02.493.02.553v5.28c0 .376.06.72.165 1.036.105.313.21.54.315.674l.51.674c.09.136.136.256.136.36 0 .12-.06.226-.18.314-1.2 1.05-1.86 1.62-1.963 1.71-.165.135-.375.15-.63.045a6.062 6.062 0 01-.526-.496l-.31-.347a9.391 9.391 0 01-.317-.42l-.3-.435c-.81.886-1.603 1.44-2.4 1.665-.494.15-1.093.227-1.83.227-1.11 0-2.04-.343-2.76-1.034-.72-.69-1.08-1.665-1.08-2.94l-.05-.076zm3.753-.438c0 .566.14 1.02.425 1.364.285.34.675.512 1.155.512.045 0 .106-.007.195-.02.09-.016.134-.023.166-.023.614-.16 1.08-.553 1.424-1.178.165-.28.285-.58.36-.91.09-.32.12-.59.135-.8.015-.195.015-.54.015-1.005v-.54c-.84 0-1.484.06-1.92.18-1.275.36-1.92 1.17-1.92 2.43l-.035-.02zm9.162 7.027c.03-.06.075-.11.132-.17.362-.243.714-.41 1.05-.5a8.094 8.094 0 011.612-.24c.14-.012.28 0 .41.03.65.06 1.05.168 1.172.33.063.09.099.228.099.39v.15c0 .51-.149 1.11-.424 1.8-.278.69-.664 1.248-1.156 1.68-.073.06-.14.09-.197.09-.03 0-.06 0-.09-.012-.09-.044-.107-.12-.064-.24.54-1.26.806-2.143.806-2.64 0-.15-.03-.27-.087-.344-.145-.166-.55-.257-1.224-.257-.243 0-.533.016-.87.046-.363.045-.7.09-1 .135-.09 0-.148-.014-.18-.044-.03-.03-.036-.047-.02-.077 0-.017.006-.03.02-.063v-.06z"/></svg>
  const iconBookshop   = <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{color:'#606078',flexShrink:0}}><path d="M2 7C4 6 7 6.5 9.5 8L12 9.5L14.5 8C17 6.5 20 6 22 7V20C20 19 17 19.5 14.5 21L12 22L9.5 21C7 19.5 4 19 2 20V7Z"/><line x1="12" y1="9.5" x2="12" y2="22"/></svg>
  const iconWorldCat   = <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{color:'#606078',flexShrink:0}}><circle cx="12" cy="12" r="9"/><path d="M12 3C10.5 7 10 10 10 12s.5 5 2 9"/><path d="M12 3C13.5 7 14 10 14 12s-.5 5-2 9"/><line x1="3" y1="12" x2="21" y2="12"/></svg>
  const iconOpenLib    = <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{color:'#606078',flexShrink:0}}><line x1="12" y1="1.5" x2="12" y2="4.5"/><line x1="9.5" y1="2.5" x2="10.5" y2="5"/><line x1="14.5" y1="2.5" x2="13.5" y2="5"/><path d="M3 9C5 8 7.5 8.5 10 10L12 11.5V22C10 21 7.5 20.5 3 21V9Z"/><path d="M21 9C19 8 16.5 8.5 14 10L12 11.5V22C14 21 16.5 20.5 21 21V9Z"/></svg>
  const iconGoogleBks  = <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" style={{color:'#606078',flexShrink:0}}><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>
  const iconKindle     = <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{color:'#606078',flexShrink:0}}><rect x="4" y="1" width="16" height="22" rx="2"/><line x1="4" y1="17" x2="20" y2="17" strokeWidth="1.3"/><circle cx="12" cy="19.5" r="1.5" fill="currentColor" stroke="none"/></svg>

  const searchQ = encodeURIComponent(`${selected.title} ${selected.author}`)
  const bookLinks = [
    { section: 'Online', items: [
      { label: 'Amazon',       icon: iconAmazon,    url: `https://www.amazon.com/s?k=${searchQ}&i=stripbooks` },
      { label: 'Bookshop.org', icon: iconBookshop,  url: `https://bookshop.org/search?keywords=${searchQ}` },
      { label: 'WorldCat',     icon: iconWorldCat,  url: `https://www.worldcat.org/search?q=${searchQ}` },
    ]},
    { section: 'Digital', items: [
      { label: 'Open Library', icon: iconOpenLib,   url: selected.id?.startsWith('OL') ? `https://openlibrary.org/works/${selected.id}` : `https://openlibrary.org/search?q=${searchQ}` },
      { label: 'Google Books', icon: iconGoogleBks, url: `https://books.google.com/books?q=${searchQ}` },
      { label: 'Kindle',       icon: iconKindle,    url: `https://www.amazon.com/s?k=${searchQ}&i=digital-text` },
    ]},
  ]

  const BW = isMobile ? Math.min(window.innerWidth, 340) : 280
  const BH = isMobile ? Math.round(BW * 1.5) : 420
  // Mobile: sequential single pages (0 cover, 1 info, 2 review, 3 links) — the 3D
  // spread/turner is desktop-only. Desktop: 0 cover, 1-2 spreads.
  const MAX_PAGE = isMobile ? 3 : 2

  const linksPageContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#606078' }}>Find This Book</div>
      {bookLinks.map(({ section, items }) => (
        <div key={section} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', color: '#8888A0', marginBottom: 2 }}>{section}</div>
          {items.map(({ label, icon, url }) => (
            <a key={label} href={url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: "'Manrope', sans-serif", fontSize: isMobile ? 14 : 12, color: '#2C2C3E', textDecoration: 'none', padding: isMobile ? '8px 0' : '2px 0', borderBottom: '1px solid rgba(100,100,140,0.15)' }}>
              {icon}<span>{label}</span>
            </a>
          ))}
        </div>
      ))}
    </div>
  )

  // Single source of truth for the review page content.
  // isInteractive=true  → live overlay (buttons, textarea, click handlers)
  // isInteractive=false → static copy used in turner face and right static page
  // Both render the EXACT same flex structure so no layout shift occurs on page turn.
  const reviewPageContent = (isInteractive) => (
    <>
      {(reviewMode === 'edit' || reviewText || reviewRating > 0) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#606078' }}>
            {isViewOnly && ownerName ? `${ownerName}'s review` : 'Review'}
          </div>
          {reviewMode === 'view' && (reviewText || reviewRating > 0) && !isViewOnly && (
            isInteractive
              ? <button onClick={e => { e.stopPropagation(); setDraftText(reviewText); setDraftRating(reviewRating); setReviewMode('edit') }} style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: 700, color: '#606078', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: 3, pointerEvents: 'auto' }}>edit <IconPencil size={11} color="currentColor" style={{ marginLeft: 2, verticalAlign: 'middle' }} /></button>
              : <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: 700, color: '#606078', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: 3 }}>edit <IconPencil size={11} color="currentColor" style={{ marginLeft: 2, verticalAlign: 'middle' }} /></span>
          )}
        </div>
      )}
      {reviewMode === 'view' && !reviewText && reviewRating === 0 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          {isInteractive
            ? <button onClick={e => { e.stopPropagation(); setDraftText(''); setDraftRating(0); setReviewMode('edit') }} onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,76,164,0.45)' }} onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }} style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 600, color: '#FDF8EF', background: '#254CA4', border: 'none', borderRadius: 8, padding: '9px 20px', cursor: 'pointer', pointerEvents: 'auto', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}>Write a Review</button>
            : isViewOnly
              ? <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 500, color: '#8888A0', fontStyle: 'italic', textAlign: 'center' }}>{ownerName ? `${ownerName} hasn't left a review` : 'No review yet'}</div>
              : <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 600, color: '#FDF8EF', background: '#254CA4', borderRadius: 8, padding: '9px 20px' }}>Write a Review</div>
          }
        </div>
      )}
      {reviewMode === 'view' && (reviewText || reviewRating > 0) && (
        <>
          <div style={{ flex: 1, fontFamily: "'Manrope', sans-serif", fontSize: 12, lineHeight: 1.65, color: '#2C2C3E', overflowY: 'auto', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{reviewText}</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1,2,3,4,5].map(s => <IconStar key={s} size={isMobile ? 26 : 22} filled={s <= reviewRating} />)}
          </div>
        </>
      )}
      {reviewMode === 'edit' && (
        <>
          {isInteractive
            ? <textarea value={draftText} onChange={e => setDraftText(e.target.value.slice(0, 600))} placeholder="Write your thoughts…" maxLength={600} autoFocus style={{ flex: 1, fontFamily: "'Manrope', sans-serif", fontSize: 12, lineHeight: 1.65, color: '#2C2C3E', background: 'transparent', border: 'none', outline: 'none', resize: 'none', padding: 0, wordBreak: 'break-word' }} />
            : <div style={{ flex: 1, fontFamily: "'Manrope', sans-serif", fontSize: 12, lineHeight: 1.65, color: '#2C2C3E', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{draftText || <span style={{ color: '#8888A0', fontStyle: 'italic' }}>Write your thoughts…</span>}</div>
          }
          <div style={{ display: 'flex', gap: 0, margin: '2px -4px' }}>
            {[1,2,3,4,5].map(star => (
              <span key={star} onClick={isInteractive ? () => setDraftRating(star === draftRating ? 0 : star) : undefined} style={{ cursor: isInteractive ? 'pointer' : 'default', userSelect: 'none', padding: isMobile ? '8px 8px' : '5px 4px', display: 'inline-block' }}><IconStar size={isMobile ? 32 : 24} filled={star <= draftRating} /></span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {isInteractive
              ? <>
                  <button onClick={() => { if (userId) { saveReview(userId, selected.id, draftText, draftRating, selected); if (reviewsRef) reviewsRef.current.set(selected.id, { text: draftText, rating: draftRating }) } setReviewText(draftText); setReviewRating(draftRating); setReviewMode('view') }} style={{ flex: 1, fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 600, color: '#FDF8EF', background: '#254CA4', border: 'none', borderRadius: 8, padding: '9px 0', cursor: 'pointer' }}>Save</button>
                  <button onClick={() => { if (userId) { deleteReview(userId, selected.id); if (reviewsRef) reviewsRef.current.delete(selected.id) } setReviewText(''); setReviewRating(0); setDraftText(''); setDraftRating(0); setReviewMode('view') }} style={{ flex: 1, fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 600, color: '#606078', background: 'transparent', border: '1.5px solid #C4C4D4', borderRadius: 8, padding: '8px 0', cursor: 'pointer' }}>Delete</button>
                </>
              : <>
                  <div style={{ flex: 1, fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 600, color: '#FDF8EF', background: '#254CA4', borderRadius: 8, padding: '9px 0', textAlign: 'center' }}>Save</div>
                  <div style={{ flex: 1, fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 600, color: '#606078', background: 'transparent', border: '1.5px solid #C4C4D4', borderRadius: 8, padding: '8px 0', textAlign: 'center' }}>Delete</div>
                </>
            }
          </div>
        </>
      )}
    </>
  )

  return (
    <div onClick={handleClose} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: step === 0 ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0.54)',
      backdropFilter: step > 0 ? 'blur(5px)' : 'blur(0px)',
      WebkitBackdropFilter: step > 0 ? 'blur(5px)' : 'blur(0px)',
      transition: 'background .45s ease, backdrop-filter .45s ease',
      cursor: 'pointer',
      pointerEvents: step === 0 ? 'none' : 'auto',
    }}>
      {/* Content wrapper: rises from below (step 0→1), then spreads open (step 1→2) */}
      <div onClick={e => e.stopPropagation()} style={{
        position: 'relative',
        cursor: 'default',
        width: isMobile ? BW : (bookOpen ? BW * 2 : BW),
        transform: step > 0 ? (isMobile ? 'translateY(0)' : 'translateY(-24px)') : 'translateY(115vh)',
        transition: [
          'width .62s cubic-bezier(.34,1.2,.5,1)',
          step === 0
            ? 'transform .34s cubic-bezier(.4,0,1,1)'
            : 'transform .56s cubic-bezier(.22,1,.36,1)',
        ].join(', '),
      }}>

        {/* Book container */}
        <div style={{ position: 'relative', width: '100%', height: BH, perspective: '1700px' }}>

          {/* Right page — desktop: static right-half content (preloaded behind the turner).
              Mobile: THE page — renders the current single page's content, interactive. */}
          <div style={{
            position: 'absolute', right: 0, top: 0, width: BW, height: BH,
            background: '#FDF8EF',
            borderRadius: isMobile ? 10 : '0 10px 10px 0',
            boxShadow: isMobile ? '0 22px 56px rgba(0,0,0,0.4)' : 'inset 14px 0 22px -12px rgba(0,0,0,0.08)',
            padding: '24px', zIndex: 1,
            display: 'flex', flexDirection: 'column', gap: 10,
            opacity: bookOpen ? 1 : 0,
            cursor: 'default',
            transition: isMobile ? 'opacity .3s ease' : (bookOpen ? 'opacity 0s' : 'opacity 0s .84s'),
          }}>
            {isMobile ? <>
              {overlayPage === 1 && <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
                <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 28, fontWeight: 700, lineHeight: 1.12, color: '#1C1C2E' }}>{selected.title}</div>
                <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 16, fontWeight: 700, color: accent }}>{selected.author}</div>
                {yearGenre ? <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, color: '#606078' }}>{yearGenre}</div> : null}
                {shelfLabel ? <div style={{ fontFamily: "'Manrope', sans-serif", fontStyle: 'italic', fontSize: 13, color: '#8888A0' }}>From the {shelfLabel} shelf</div> : null}
                {isViewOnly && (
                  <button
                    onClick={async e => {
                      e.stopPropagation()
                      if (!viewerUserId || !selected) return
                      await addInventoryBook(viewerUserId, selected)
                      window.location.href = window.location.origin + window.location.pathname + '?skipIntro=1&edit=1'
                    }}
                    style={{
                      alignSelf: 'flex-start', background: '#254CA4', color: '#FDF8EF',
                      border: 'none', borderRadius: 8, padding: '10px 16px',
                      fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 14,
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                    }}
                  >Add to my shelf →</button>
                )}
                {bodyLabel && <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#606078', marginTop: 8 }}>{bodyLabel}</div>}
                <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, lineHeight: 1.65, color: bodyText ? '#2C2C3E' : '#8888A0', fontStyle: bodyText ? 'normal' : 'italic' }}>{bodyText || 'No description provided.'}</div>
              </div>}
              {overlayPage === 2 && reviewPageContent(!isViewOnly)}
              {overlayPage === 3 && linksPageContent}
            </> : <>
              {rightDP === 1 && reviewPageContent(false)}
              {rightDP === 2 && linksPageContent}
            </>}
          </div>

          {/* Cover — portrait: fills left:0; spread: slides to right half (left:BW) and flips
               around its LEFT edge (spine at x=BW) so the inner left page lands on the left. */}
          <div style={{
            position: 'absolute', left: (bookOpen && !isMobile) ? BW : 0, top: 0, width: BW, height: BH,
            transformStyle: 'preserve-3d',
            transformOrigin: 'left center',
            transform: (bookOpen && !isMobile) ? 'rotateY(-158deg)' : 'rotateY(0deg)',
            // Mobile: no spread — the cover cross-fades out and the single page shows beneath
            opacity: (bookOpen && isMobile) ? 0 : 1,
            pointerEvents: (bookOpen && isMobile) ? 'none' : 'auto',
            transition: 'left .62s cubic-bezier(.34,1.2,.5,1), transform .70s cubic-bezier(.5,0,.3,1) .14s, opacity .3s ease',
            zIndex: 3,
          }}>
            {/* Cover face — thumbnail if available, otherwise styled colour cover. Spine colour shows as placeholder while img loads. */}
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: '10px 4px 4px 10px', overflow: 'hidden', boxShadow: '0 22px 56px rgba(0,0,0,0.4)', background: selected.spine ?? selected.coverBg ?? '#1C1C2E' }}>
              {selected.thumbnail ? (
                <img src={selected.thumbnail} alt="" crossOrigin={selected.thumbnail?.startsWith('http') ? 'anonymous' : undefined} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: selected.coverBg ?? selected.spine ?? '#1C1C2E', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 24px', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: selected.coverInk ?? selected.ink ?? '#fff', opacity: 0.8 }}>{selected.author}</div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Manrope', sans-serif", fontSize: 27, fontWeight: 700, lineHeight: 1.1, color: selected.coverInk ?? selected.ink ?? '#fff' }}>{selected.title}</div>
                  <div style={{ width: 46, height: 46, borderRadius: '50%', border: `2px solid ${selected.coverInk ?? selected.ink ?? '#fff'}`, opacity: 0.55, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: selected.coverInk ?? selected.ink ?? '#fff' }}>✦</div>
                </div>
              )}
            </div>
            {/* Inner left page (back face) */}
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderRadius: '10px 0 0 10px', background: '#FDF8EF', boxShadow: 'inset -14px 0 22px -12px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px', gap: 10 }}>
              {displayPage === 1 && <>
                <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 28, fontWeight: 700, lineHeight: 1.12, color: '#1C1C2E' }}>{selected.title}</div>
                <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 16, fontWeight: 700, color: accent }}>{selected.author}</div>
                {yearGenre ? <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, color: '#606078' }}>{yearGenre}</div> : null}
                {shelfLabel ? <div style={{ fontFamily: "'Manrope', sans-serif", fontStyle: 'italic', fontSize: 13, color: '#8888A0', marginTop: 4 }}>From the {shelfLabel} shelf</div> : null}
                {isViewOnly && (
                  <button
                    onClick={async e => {
                      e.stopPropagation()
                      if (!viewerUserId || !selected) return
                      await addInventoryBook(viewerUserId, selected)
                      window.location.href = window.location.origin + window.location.pathname + '?skipIntro=1&edit=1'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,76,164,0.45)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
                    style={{
                      alignSelf: 'flex-start',
                      background: '#254CA4', color: '#FDF8EF',
                      border: 'none', borderRadius: 8,
                      padding: '8px 14px',
                      fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 13,
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                      marginTop: 4,
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                  >
                    Add to my shelf →
                  </button>
                )}
              </>}
              {displayPage === 2 && <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {bodyLabel && <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#606078' }}>{bodyLabel}</div>}
                <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, lineHeight: 1.65, color: bodyText ? '#2C2C3E' : '#8888A0', fontStyle: bodyText ? 'normal' : 'italic', overflow: 'hidden' }}>{bodyText || 'No description provided.'}</div>
              </div>}
            </div>
          </div>

          {/* 3D page-turn overlay — pivots from the spine, mirrors the cover animation. Desktop only. */}
          {!isMobile && turnerVisible && (() => {
            const frontPage = turnerDir === 'forward' ? turnerFromPage : overlayPage
            const backPage  = turnerDir === 'forward' ? overlayPage    : turnerFromPage
            const turnerTransform = turnerDir === 'forward'
              ? (turnerRotated ? 'rotateY(-158deg)' : 'rotateY(0deg)')
              : (turnerRotated ? 'rotateY(0deg)'    : 'rotateY(-158deg)')
            return (
              <div style={{
                position: 'absolute', left: BW, top: 0, width: BW, height: BH,
                transformStyle: 'preserve-3d',
                transformOrigin: 'left center',
                transform: turnerTransform,
                transition: 'transform .78s cubic-bezier(.4,0,.2,1.06)',
                zIndex: 4,
              }}>
                {/* Front face — right-page parchment */}
                <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: '0 10px 10px 0', background: '#FDF8EF', boxShadow: 'inset 14px 0 22px -12px rgba(0,0,0,0.08)', padding: '24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {frontPage === 1 && reviewPageContent(false)}
                  {frontPage === 2 && <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#606078' }}>Find This Book</div>
                    {bookLinks.map(({ section, items }) => (
                      <div key={section} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', color: '#8888A0', marginBottom: 2 }}>{section}</div>
                        {items.map(({ label, icon, url }) => (
                          <a key={label} href={url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: "'Manrope', sans-serif", fontSize: 12, color: '#2C2C3E', textDecoration: 'none', padding: '2px 0', borderBottom: '1px solid rgba(100,100,140,0.15)' }}>
                            {icon}<span>{label}</span>
                          </a>
                        ))}
                      </div>
                    ))}
                  </div>}
                </div>
                {/* Back face — left-page parchment */}
                <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderRadius: '10px 0 0 10px', background: '#FDF8EF', boxShadow: 'inset -14px 0 22px -12px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px', gap: 10 }}>
                  {backPage === 1 && <>
                    <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 28, fontWeight: 700, lineHeight: 1.12, color: '#1C1C2E' }}>{selected.title}</div>
                    <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 16, fontWeight: 700, color: accent }}>{selected.author}</div>
                    {yearGenre ? <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, color: '#606078' }}>{yearGenre}</div> : null}
                    {shelfLabel ? <div style={{ fontFamily: "'Manrope', sans-serif", fontStyle: 'italic', fontSize: 13, color: '#8888A0', marginTop: 4 }}>From the {shelfLabel} shelf</div> : null}
                  </>}
                  {backPage === 2 && <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {bodyLabel && <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#606078' }}>{bodyLabel}</div>}
                    <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, lineHeight: 1.65, color: bodyText ? '#2C2C3E' : '#8888A0', fontStyle: bodyText ? 'normal' : 'italic', overflow: 'hidden' }}>{bodyText || 'No description provided.'}</div>
                  </div>}
                </div>
              </div>
            )
          })()}

          {/* Arms + hands — behind book pages (z=0), pivot at book bottom (top: BH).
               Palm sits at the book bottom edge; thumb hides behind the book; fingers hang
               below the book following the arm direction. */}
          <div style={{
            position: 'absolute', left: 0, top: BH,
            width: 50, height: 310, background: '#72FF5D', borderRadius: 25,
            transformOrigin: 'top center',
            transform: bookOpen ? 'rotate(-2deg)' : 'rotate(-3deg)',
            transition: 'transform .62s cubic-bezier(.34,1.2,.5,1)',
            zIndex: 0,
          }} />
          <div style={{
            position: 'absolute', right: 0, top: BH,
            width: 50, height: 310, background: '#72FF5D', borderRadius: 25,
            transformOrigin: 'top center',
            transform: bookOpen ? 'rotate(2deg)' : 'rotate(3deg)',
            transition: 'transform .62s cubic-bezier(.34,1.2,.5,1)',
            zIndex: 0,
          }} />
          {/*
            ── Hand SVG coordinate system ──────────────────────────────────────
            Origin (0,0) = palm centre = arm pivot, sitting at the book's bottom edge.
            +x  → right   |  −x → left
            +y  → DOWN (below book, VISIBLE)  |  −y → UP (inside book, HIDDEN)

            Each finger is a <line>:
              x1, y1  = finger BASE  — the visible root below the book
                         x1 controls left/right spread; y1 controls how far below the
                         book edge the base sits (larger y1 = more finger visible)
              x2, y2  = finger TIP   — hidden behind the book pages
                         x2 controls the lean direction; y2 controls tip depth into book
                         (more negative = longer finger hidden behind book)
              strokeWidth = finger thickness in px

            Palm circle:  r controls how much the palm bulges past the arm width (arm = 50px / r=25).
            Thumb path:   M = start point, C = cubic bezier curve control points + end.
            ────────────────────────────────────────────────────────────────── */}

          {/* ── Left hand ── */}
          <svg style={{
            position: 'absolute', left: 25, top: BH,
            overflow: 'visible', width: 1, height: 1, zIndex: 0, pointerEvents: 'none',
            transformOrigin: '0px 0px',
            transform: `rotate(${bookOpen ? 8 : 7}deg)`,
            transition: 'transform .62s cubic-bezier(.34,1.2,.5,1)',
          }}>
            {/* palm — r=25 matches arm width flush; increase r to bulge past arm edges */}
            <circle cx="0" cy="0" r="36" fill="#72FF5D" />
            {/* thumb — curves outward-left; start point then two bezier controls then end */}
            <path d="M -20 20 C -45 5, -42 -15, -52 -40" stroke="#72FF5D" strokeWidth="18" strokeLinecap="round" fill="none" />
            {/* pinky  (outermost left, shortest) */}
            <line x1="24" y1="10"  x2="34" y2="-62"  stroke="#72FF5D" strokeWidth="18" strokeLinecap="round" />
            {/* ring */}
            <line x1="0"  y1="30"  x2="-12" y2="-74"  stroke="#72FF5D" strokeWidth="18" strokeLinecap="round" />
            {/* middle (longest) */}
            <line x1="8"   y1="40"  x2="12"  y2="-80"  stroke="#72FF5D" strokeWidth="18" strokeLinecap="round" />
            {/* index (innermost right) */}
            <line x1="-12"  y1="24"  x2="-34"  y2="-62"  stroke="#72FF5D" strokeWidth="18" strokeLinecap="round" />
          </svg>

          {/* ── Right hand — mirror of left (x signs flipped) ── */}
          <svg style={{
            position: 'absolute', right: 25, top: BH,
            overflow: 'visible', width: 1, height: 1, zIndex: 0, pointerEvents: 'none',
            transformOrigin: '0px 0px',
            transform: `rotate(${bookOpen ? -8 : -7}deg)`,
            transition: 'transform .62s cubic-bezier(.34,1.2,.5,1)',
          }}>
            {/* palm */}
            <circle cx="0" cy="0" r="36" fill="#72FF5D" />
            {/* thumb — curves outward-right */}
            <path d="M 20 20 C 45 5, 42 -15, 52 -40" stroke="#72FF5D" strokeWidth="18" strokeLinecap="round" fill="none" />
            {/* pinky  (outermost right, shortest) */}
            <line x1="-24" y1="10"  x2="-34" y2="-62"  stroke="#72FF5D" strokeWidth="18" strokeLinecap="round" />
            {/* ring */}
            <line x1="0"   y1="30"  x2="12"  y2="-74"  stroke="#72FF5D" strokeWidth="18" strokeLinecap="round" />
            {/* middle (longest) */}
            <line x1="-8"  y1="40"  x2="-12" y2="-80"  stroke="#72FF5D" strokeWidth="18" strokeLinecap="round" />
            {/* index (innermost left) */}
            <line x1="12"  y1="24"  x2="34"  y2="-62"  stroke="#72FF5D" strokeWidth="18" strokeLinecap="round" />
          </svg>

          {/* Left click zone — previous page (bottom strip only, clears content area). Desktop only —
              on mobile the full-width single page owns these areas; flipping uses the arrow buttons. */}
          <div
            onMouseEnter={() => setHoverArea('left')}
            onMouseLeave={() => setHoverArea(null)}
            onClick={e => { e.stopPropagation(); if (overlayPage > 0 && !turnerVisible) goToPage(overlayPage - 1) }}
            style={{ position: 'absolute', left: 0, bottom: 0, width: '50%', height: '26%', zIndex: 25, cursor: overlayPage > 0 && !turnerVisible ? 'pointer' : 'default', pointerEvents: !isMobile && overlayPage > 0 ? 'auto' : 'none' }}
          />

          {/* Right click zone — next page (bottom strip only). Desktop only. */}
          <div
            onMouseEnter={() => setHoverArea('right')}
            onMouseLeave={() => setHoverArea(null)}
            onClick={e => { e.stopPropagation(); if (overlayPage < MAX_PAGE && !turnerVisible) goToPage(overlayPage + 1) }}
            style={{ position: 'absolute', right: 0, bottom: 0, width: '50%', height: '40%', zIndex: 25, pointerEvents: !isMobile && overlayPage < MAX_PAGE && !turnerVisible && !(overlayPage === 1 && reviewMode === 'edit') ? 'auto' : 'none', cursor: overlayPage < MAX_PAGE && !turnerVisible ? 'pointer' : 'default' }}
          />

          {/* Arrow indicators — desktop: hover-revealed hints; mobile: always-visible tap buttons */}
          <div
            onClick={isMobile ? (e => { e.stopPropagation(); if (overlayPage > 0) goToPage(overlayPage - 1) }) : undefined}
            style={{ position: 'absolute', bottom: isMobile ? 10 : (bookOpen ? -2 : 12), left: isMobile ? 10 : (bookOpen ? 16 : 12), width: isMobile ? 44 : 32, height: isMobile ? 44 : 32, borderRadius: '50%', background: bookOpen ? 'rgba(0,0,0,0.10)' : 'rgba(0,0,0,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: bookOpen ? '#1C1C2E' : 'rgba(255,255,255,0.9)', cursor: isMobile ? 'pointer' : 'default', pointerEvents: isMobile && overlayPage > 0 && reviewMode !== 'edit' ? 'auto' : 'none', zIndex: 27, opacity: (isMobile ? overlayPage > 0 : hoverArea === 'left' && overlayPage > 0) && !turnerVisible && reviewMode !== 'edit' ? 1 : 0, transition: 'opacity .18s ease' }}>
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><polyline points="6,1 1,7 6,13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div
            onClick={isMobile ? (e => { e.stopPropagation(); if (overlayPage < MAX_PAGE) goToPage(overlayPage + 1) }) : undefined}
            style={{ position: 'absolute', bottom: isMobile ? 10 : 12, right: isMobile ? 10 : 12, width: isMobile ? 44 : 32, height: isMobile ? 44 : 32, borderRadius: '50%', background: bookOpen ? 'rgba(0,0,0,0.10)' : 'rgba(0,0,0,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: bookOpen ? '#1C1C2E' : 'rgba(255,255,255,0.9)', cursor: isMobile ? 'pointer' : 'default', pointerEvents: isMobile && overlayPage < MAX_PAGE && reviewMode !== 'edit' ? 'auto' : 'none', zIndex: 27, opacity: (isMobile ? overlayPage < MAX_PAGE : hoverArea === 'right' && overlayPage < MAX_PAGE) && !turnerVisible && reviewMode !== 'edit' ? 1 : 0, transition: 'opacity .18s ease' }}>
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><polyline points="2,1 7,7 2,13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>

          {/* Interactive review panel — hidden during any turner animation; single source via reviewPageContent.
               zIndex:2 during initial book-open (behind cover), 26 once animation completes. */}
          {!isMobile && displayPage === 1 && bookOpen && !turnerVisible && (
            <div style={{
              position: 'absolute', right: 0, top: 0, width: '50%', height: '100%',
              zIndex: bookAnimDone ? 26 : 2,
              background: '#FDF8EF',
              borderRadius: '0 10px 10px 0',
              boxShadow: 'inset 14px 0 22px -12px rgba(0,0,0,0.08)',
              padding: '24px', display: 'flex', flexDirection: 'column', gap: 10, cursor: 'default',
              pointerEvents: reviewMode === 'edit' ? 'auto' : 'none',
            }}>

              {reviewPageContent(!isViewOnly)}
            </div>
          )}
        </div>

        {/* Page controls */}
        <div
          onMouseEnter={() => setPaginationHover(true)}
          onMouseLeave={() => setPaginationHover(false)}
          style={{ position: 'absolute', bottom: -44, left: 0, right: 0, display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center', zIndex: 20, padding: '8px 0' }}
        >
          <button onClick={() => { if (!turnerVisible) goToPage(Math.max(0, overlayPage - 1)) }} style={{ background: 'none', border: 'none', cursor: overlayPage > 0 && !turnerVisible ? 'pointer' : 'default', color: 'rgba(253,248,239,0.85)', padding: isMobile ? '13px 16px' : '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (isMobile || paginationHover) && overlayPage > 0 ? 1 : 0, transition: 'opacity .25s ease' }}>
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><polyline points="6,1 1,7 6,13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          {Array.from({ length: MAX_PAGE + 1 }, (_, p) => (
            <button key={p} onClick={() => { if (!turnerVisible) goToPage(p) }} style={{ width: isMobile ? 40 : 9, height: isMobile ? 40 : 9, background: 'none', border: 'none', padding: 0, cursor: !turnerVisible ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ width: isMobile ? 12 : 9, height: isMobile ? 12 : 9, borderRadius: '50%', background: p === overlayPage ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.32)', transition: 'background .15s' }} />
            </button>
          ))}
          <button onClick={() => { if (!turnerVisible) goToPage(Math.min(MAX_PAGE, overlayPage + 1)) }} style={{ background: 'none', border: 'none', cursor: overlayPage < MAX_PAGE && !turnerVisible ? 'pointer' : 'default', color: 'rgba(253,248,239,0.85)', padding: isMobile ? '13px 16px' : '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (isMobile || paginationHover) && overlayPage < MAX_PAGE ? 1 : 0, transition: 'opacity .25s ease' }}>
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><polyline points="2,1 7,7 2,13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>

        {/* Close button */}
        <div onClick={handleClose} style={{ position: 'absolute', right: -14, top: -14, width: 44, height: 44, borderRadius: '50%', background: 'white', boxShadow: '0 6px 16px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 30 }}><IconClose size={20} color="#606078" /></div>
      </div>

      {/* Discard-review confirmation — outside the content wrapper so it covers close button + all overlays */}
      {showCloseWarning && (
        <div onClick={e => e.stopPropagation()} style={{
          position: 'absolute', inset: 0, zIndex: 200,
          background: 'rgba(40,24,10,0.60)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#FDF8EF', borderRadius: 14,
            padding: '28px 24px 22px', width: 'min(228px, 88vw)', textAlign: 'center',
            boxShadow: '0 8px 32px rgba(25,36,61,0.6)',
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 18, fontWeight: 700, color: '#1C1C2E' }}>Discard review?</div>
            <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, color: '#4C4C64', lineHeight: 1.5 }}>Your unsaved changes will be lost.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowCloseWarning(false)}
                style={{ flex: 1, fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 600, color: '#254CA4', background: '#FDF8EF', border: '2px solid #254CA4', borderRadius: 8, padding: '9px 0', cursor: 'pointer' }}
              >Keep editing</button>
              <button
                onClick={() => { setShowCloseWarning(false); setReviewMode('view'); onClose() }}
                style={{ flex: 1, fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 600, color: '#FDF8EF', background: '#254CA4', border: 'none', borderRadius: 8, padding: '9px 0', cursor: 'pointer' }}
              >Discard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


export { Overlay }
