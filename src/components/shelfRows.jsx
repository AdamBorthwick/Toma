import { useState, useRef } from 'react'
import { SLOT_W, NUM_SLOTS, SHELF_H } from '../lib/constants.js'
import { setGhostPos, titleT } from '../lib/geometry.js'
import { IconPencil } from './icons.jsx'
import { PlacedFlower, PlacedFlower2, PlacedCoffeeCup, PlacedLight, PlacedClock } from './decor.jsx'
import { VerticalBook, HorizontalBook } from './scene.jsx'

function PlacedVerticalBook({ book, w, h, active, grabbed, onEnter, onLeave, onClick }) {
  const bookH = Math.round(h * (0.72 + titleT(book?.title) * 0.28))
  const titleLen = (book?.title || '').length
  const spineFontSize = Math.max(7, Math.min(10, Math.floor((bookH - 8) / (titleLen * 0.62))))
  return (
    <div
      onMouseEnter={() => { if (book?.thumbnail) { const img = new Image(); img.src = book.thumbnail }; onEnter?.() }}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={{ width: w, height: h, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', cursor: onClick ? 'pointer' : 'default' }}
    >
      <div style={{
        width: '100%', height: bookH, background: book?.spine ?? '#555',
        borderRadius: '3px 3px 1px 1px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        visibility: grabbed ? 'hidden' : 'visible',
        boxShadow: active
          ? 'inset -2px 0 5px rgba(0,0,0,0.18), 0 0 0 2px rgba(253,248,239,0.85), 0 6px 16px rgba(60,30,10,0.3)'
          : 'inset -2px 0 5px rgba(0,0,0,0.18)',
        transform: active ? 'translateY(-8px)' : 'none',
        transition: 'transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .18s ease',
      }}>
        <span style={{ writingMode: 'vertical-rl', fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: spineFontSize, letterSpacing: spineFontSize < 9 ? '0' : '0.3px', color: book?.ink ?? '#fff', whiteSpace: 'nowrap', padding: '4px 0', pointerEvents: 'none' }}>{book?.title}</span>
      </div>
    </div>
  )
}

function PlacedHorizontalStack({ books, w, onBookClick, onBookMouseDown, editMode, grabbedBookId }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  return (
    <div style={{ width: w, height: '100%', display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', gap: 0, paddingTop: 6, boxSizing: 'border-box', justifyContent: 'flex-start' }}>
      {(books || []).map((b, i) => {
        const t = titleT(b.title)
        const slabH = Math.round(20 + t * 16)
        const slabW = Math.round(w * (0.8 + t * 0.2))
        const slabFontSize = Math.max(7, Math.min(10, Math.floor((slabW * 0.90) / ((b.title || '').length * 0.6))))
        // browse: highlight only the hovered slab; edit: highlight hovered slab and everything above it (the grab slice)
        const active = hoveredIdx !== null && (editMode ? i >= hoveredIdx : i === hoveredIdx)
        const grabbed = grabbedBookId && b.id === grabbedBookId
        return (
          <div
            key={i}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            onPointerDown={onBookMouseDown ? e => { e.stopPropagation(); onBookMouseDown(i, e) } : undefined}
            onClick={onBookClick ? e => { e.stopPropagation(); onBookClick(b) } : undefined}
            style={{
              width: slabW, height: slabH, background: b.spine, borderRadius: 2, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              visibility: grabbed ? 'hidden' : 'visible',
              boxShadow: active
                ? 'inset 0 -2px 3px rgba(0,0,0,0.18), 0 0 0 2px rgba(253,248,239,0.85)'
                : 'inset 0 -2px 3px rgba(0,0,0,0.18)',
              transform: active && !editMode ? 'translateX(5px)' : 'none',
              transition: 'box-shadow .15s ease, transform .15s ease',
              cursor: onBookMouseDown ? 'grab' : onBookClick ? 'pointer' : 'default',
            }}
          >
            <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: slabFontSize, letterSpacing: slabFontSize < 9 ? '0' : '0.3px', color: b.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '90%', pointerEvents: 'none' }}>{b.title}</span>
          </div>
        )
      })}
    </div>
  )
}


// ─── EditableShelfRow ─────────────────────────────────────────────────────────

function EditableShelfRow({ shelf, shelfIdx, items, dragging, dropTarget, innerRef, onPointerMove, onPointerUp, onItemPointerDown, onStackBookPointerDown, onEditClick, grabbedBookId, showEditButton, shelfH = SHELF_H, isMobile = false }) {
  const [hoveredItemId, setHoveredItemId] = useState(null)
  return (
    <>
      <div style={{ position: 'relative', display: 'flex', background: '#E2712C', borderLeft: '16px solid #E2712C', borderRight: '16px solid #E2712C' }}>
        {/* Mobile shelf editing goes through the footer's "Shelves" list instead of per-row chips */}
        <ShelfLabel label={shelf.label} tabBg={shelf.tabBg} tabInk={shelf.tabInk} />
        {onEditClick && !isMobile && <EditButton onClick={onEditClick} visible={showEditButton !== false} onMouseDown={e => e.stopPropagation()} />}
        <div
          ref={innerRef}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{
            position: 'relative', flex: 1, height: shelfH,
            background: 'linear-gradient(180deg,#A4501D 0%,#EA8B50 8%)',
            overflow: 'hidden',
            cursor: dragging ? 'grabbing' : 'default',
          }}
        >
          {/* Slot-grid overlay */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none' }}>
            {Array.from({ length: NUM_SLOTS }, (_, i) => {
              const dt = dropTarget
              let highlighted = false
              let isValid = true
              if (dt && dt.shelfIdx === shelfIdx && dragging) {
                if (dt.mergeStackId) {
                  const stack = items.find(it => it.id === dt.mergeStackId)
                  if (stack) highlighted = i >= stack.startSlot && i < stack.startSlot + stack.slotWidth
                } else {
                  const hw = dt.convertToVertical ? (dragging.books?.length ?? 1) : dt.rotateToHorizontal ? 5 : dragging.slotWidth
                  highlighted = i >= dt.startSlot && i < dt.startSlot + hw
                  isValid = dt.valid
                }
              }
              return (
                <div key={i} style={{
                  flex: `0 0 ${SLOT_W}px`, height: '100%',
                  borderRight: i < NUM_SLOTS - 1 ? '1px dashed rgba(0,0,0,0.35)' : 'none',
                  background: highlighted
                    ? isValid ? 'rgba(80,200,100,0.32)' : 'rgba(220,60,60,0.26)'
                    : 'transparent',
                  transition: 'background .08s',
                }} />
              )
            })}
          </div>

          {/* Placed items */}
          {items.map(it => (
            <div
              key={it.id}
              onMouseEnter={() => setHoveredItemId(it.id)}
              onMouseLeave={() => setHoveredItemId(null)}
              onPointerDown={e => { if (!isMobile) e.preventDefault(); e.stopPropagation(); onItemPointerDown(e, shelfIdx, it) }}
              style={{
                position: 'absolute', left: it.startSlot * SLOT_W, bottom: 0,
                width: it.slotWidth * SLOT_W, height: '100%',
                cursor: 'grab', zIndex: hoveredItemId === it.id ? 5 : 2,
                // 'none' so a touch-drag on the item (in any direction, incl. vertically to
                // another shelf) is captured as a drag, not swallowed by page scrolling.
                touchAction: 'none',
              }}
            >
              {it.type === 'vertical-book' && (
                <PlacedVerticalBook
                  book={it.book} w={it.slotWidth * SLOT_W} h={shelfH}
                  active={hoveredItemId === it.id}
                  grabbed={it.book?.id === grabbedBookId}
                />
              )}
              {it.type === 'horizontal-stack' && (
                <PlacedHorizontalStack
                  books={it.books}
                  w={it.slotWidth * SLOT_W}
                  editMode
                  grabbedBookId={grabbedBookId}
                  onBookMouseDown={onStackBookPointerDown
                    ? (bookIdx, e) => onStackBookPointerDown(e, shelfIdx, it, bookIdx)
                    : undefined}
                />
              )}
              {it.type === 'flower'  && <PlacedFlower     w={it.slotWidth * SLOT_W} />}
              {it.type === 'flower2' && <PlacedFlower2    w={it.slotWidth * SLOT_W} />}
              {it.type === 'coffee'  && <PlacedCoffeeCup  w={it.slotWidth * SLOT_W} />}
              {it.type === 'light'   && <PlacedLight      w={it.slotWidth * SLOT_W} />}
              {it.type === 'clock'   && <PlacedClock       w={it.slotWidth * SLOT_W} />}
              {it.type === 'pot'     && <PlacedFlower     w={it.slotWidth * SLOT_W} />}
              {it.type === 'candle'  && <PlacedLight      w={it.slotWidth * SLOT_W} />}
              {it.type === 'mug'     && <PlacedCoffeeCup  w={it.slotWidth * SLOT_W} />}
            </div>
          ))}

        </div>
      </div>
      <div style={{ height: 20, background: '#E2712C', borderRadius: 0 }} />
    </>
  )
}

// ─── SavedShelfRow — read-only view of placed items after saving ──────────────

function SavedShelfRow({ shelf, items, onBookClick, onEditClick, grabbedBookId, shelfH = SHELF_H }) {
  const [hoveredId, setHoveredId] = useState(null)
  return (
    <>
      <div style={{ position: 'relative', display: 'flex', background: '#E2712C', borderLeft: '16px solid #E2712C', borderRight: '16px solid #E2712C' }}>
        <ShelfLabel label={shelf.label} tabBg={shelf.tabBg} tabInk={shelf.tabInk} />
        {onEditClick && <EditButton onClick={onEditClick} visible={!!onEditClick} />}
        <div style={{
          position: 'relative', flex: 1, height: shelfH,
          background: 'linear-gradient(180deg,#A4501D 0%,#EA8B50 8%)',
          overflow: 'hidden',
        }}>
          {items.map(it => (
            <div
              key={it.id}
              style={{
                position: 'absolute', left: it.startSlot * SLOT_W, bottom: 0,
                width: it.slotWidth * SLOT_W, height: '100%', zIndex: hoveredId === it.id ? 5 : 2,
              }}
            >
              {it.type === 'vertical-book' && (
                <PlacedVerticalBook
                  book={it.book} w={it.slotWidth * SLOT_W} h={shelfH}
                  active={hoveredId === it.id}
                  grabbed={it.book?.id === grabbedBookId}
                  onEnter={() => setHoveredId(it.id)}
                  onLeave={() => setHoveredId(null)}
                  onClick={onBookClick ? () => onBookClick(it.book) : undefined}
                />
              )}
              {it.type === 'horizontal-stack' && <PlacedHorizontalStack books={it.books} w={it.slotWidth * SLOT_W} onBookClick={onBookClick} grabbedBookId={grabbedBookId} />}
              {it.type === 'flower'  && <PlacedFlower     w={it.slotWidth * SLOT_W} />}
              {it.type === 'flower2' && <PlacedFlower2    w={it.slotWidth * SLOT_W} />}
              {it.type === 'coffee'  && <PlacedCoffeeCup  w={it.slotWidth * SLOT_W} />}
              {it.type === 'light'   && <PlacedLight      w={it.slotWidth * SLOT_W} />}
              {it.type === 'clock'   && <PlacedClock       w={it.slotWidth * SLOT_W} />}
              {it.type === 'pot'     && <PlacedFlower     w={it.slotWidth * SLOT_W} />}
              {it.type === 'candle'  && <PlacedLight      w={it.slotWidth * SLOT_W} />}
              {it.type === 'mug'     && <PlacedCoffeeCup  w={it.slotWidth * SLOT_W} />}
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: 20, background: '#E2712C', borderRadius: 0 }} />
    </>
  )
}


// ─── DragGhost ────────────────────────────────────────────────────────────────
// Shows the dragged item only — Sprout's real arm animates to the cursor position.

function DragGhost({ dragging, ghostRef, dragRotated, stageSc = 1, shelfH = SHELF_H, isMobile = false }) {
  const isBook  = dragging?.type === 'vertical-book'
  const isStack = dragging?.type === 'horizontal-stack'
  const slotW  = SLOT_W * stageSc
  const bookH  = shelfH * stageSc
  const stackH = 108 * stageSc

  let gW, gH, tx, ty, content
  if (isBook && dragRotated) {
    gW = 5 * slotW; gH = stackH
    tx = -gW / 2;   ty = -stackH
    content = <PlacedHorizontalStack books={[dragging.book]} w={gW} />
  } else if (isBook) {
    gW = slotW; gH = bookH
    // Mobile: center the ghost on the finger (drop point). Desktop keeps the book to
    // the left of the cursor so the mouse pointer sees the shelf beside the book.
    tx = isMobile ? -gW / 2 : -gW
    ty = -(bookH / 2)
    content = <PlacedVerticalBook book={dragging.book} w={gW} h={bookH} />
  } else if (isStack && dragRotated) {
    const books = dragging.books ?? []
    gW = books.length * slotW; gH = bookH
    tx = -gW / 2; ty = -(bookH / 2)
    content = (
      <div style={{ display: 'flex', alignItems: 'flex-end', width: gW, height: gH }}>
        {books.map((b, i) => <PlacedVerticalBook key={i} book={b} w={slotW} h={bookH} />)}
      </div>
    )
  } else if (isStack) {
    gW = (dragging?.slotWidth ?? 1) * slotW; gH = stackH
    tx = -gW / 2; ty = -stackH
    content = <PlacedHorizontalStack books={dragging.books} w={gW} />
  } else {
    gW = (dragging?.slotWidth ?? 1) * slotW; gH = Math.min(bookH, 120 * stageSc)
    tx = -gW / 2; ty = -(gH / 2)
    content = (
      <>
        {dragging?.type === 'flower'  && <PlacedFlower    w={gW} />}
        {dragging?.type === 'flower2' && <PlacedFlower2   w={gW} />}
        {dragging?.type === 'coffee'  && <PlacedCoffeeCup w={gW} />}
        {dragging?.type === 'light'   && <PlacedLight     w={gW} />}
        {dragging?.type === 'clock'   && <PlacedClock     w={gW} />}
      </>
    )
  }

  // Position is driven entirely by imperative setGhostPos calls (translate3d that folds in
  // the tx/ty centering offset). We deliberately do NOT put transform in the React style
  // prop — that would let React clobber our per-frame position on re-render.
  const setRef = el => {
    if (!el) return
    ghostRef.current = el
    el.dataset.tx = tx
    el.dataset.ty = ty
    // If a position was set on a previous mount, re-apply it. Otherwise seed with tx/ty
    // so a mid-render position update doesn't flash to (0,0).
    const x = parseFloat(el.dataset.x || '0')
    const y = parseFloat(el.dataset.y || '0')
    el.style.transform = `translate3d(${tx + x}px, ${ty + y}px, 0)`
  }
  return (
    <div
      ref={setRef}
      style={{
        position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 55,
        width: gW, height: gH,
        willChange: 'transform',
        opacity: dragging ? 0.88 : 0,
        filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.44))',
        transition: 'opacity .12s, width .15s ease, height .15s ease',
      }}
    >
      {content}
    </div>
  )
}

// ─── EditButton — shared left-column edit button with opacity fade ───────────

function EditButton({ onClick, visible, onMouseDown }) {
  return (
    <button
      onClick={onClick}
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute', right: 'calc(100% + 32px)', top: '50%', transform: 'translateY(-50%)',
        padding: '8px 12px', borderRadius: 12, fontSize: 14,
        zIndex: 25, background: '#254CA4', border: 'none',
        fontFamily: "'Manrope',sans-serif",
        fontWeight: 700, color: '#FDF8EF',
        cursor: 'pointer', whiteSpace: 'nowrap',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.2s ease',
        display: 'flex', alignItems: 'center', gap: 4,
      }}
    >
      Edit <IconPencil size={13} color="currentColor" />
    </button>
  )
}

// ─── ShelfLabel — editable tab shown in all shelf views ──────────────────────

function ShelfLabel({ label, tabBg, tabInk, onEdit = null }) {
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, zIndex: 20, pointerEvents: 'none', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
      <div style={{ background: tabBg, color: tabInk, fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 13, padding: '5px 12px 5px 8px', borderRadius: '0 0 6px 0', boxShadow: '2px 2px 6px rgba(0,0,0,0.18)' }}>
        {label}
      </div>
      {/* small in-shelf-scale edit chip, sits right of the tag (mobile edit mode) */}
      {onEdit && (
        <button
          onClick={onEdit}
          onPointerDown={e => e.stopPropagation()}
          style={{
            pointerEvents: 'auto', marginTop: 3,
            display: 'flex', alignItems: 'center', gap: 3,
            background: '#254CA4', color: '#FDF8EF', border: 'none',
            borderRadius: 7, padding: '4px 8px', fontSize: 11, fontWeight: 700,
            fontFamily: "'Manrope',sans-serif", cursor: 'pointer',
            boxShadow: '1px 2px 5px rgba(0,0,0,0.25)',
          }}
        >
          Edit <IconPencil size={10} color="currentColor" />
        </button>
      )}
    </div>
  )
}


// ─── ShelfPlate — gold nameplate above the bookcase ──────────────────────────

function ShelfPlate({ shelfName, username, onEdit, showEditButton, isMobile = false }) {
  const [hovered, setHovered] = useState(false)
  const ref = useRef()
  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={e => { if (!ref.current?.contains(e.relatedTarget)) setHovered(false) }}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      {/* invisible hover zone extending left to cover the edit button area */}
      {showEditButton && (
        <div style={{ position: 'absolute', right: '100%', top: 0, bottom: 0, width: 130 }} />
      )}
      <div style={{
        background: '#F2EFE8',
        borderRadius: 7,
        padding: '9px 18px 9px 14px',
        boxShadow: '2px 3px 8px rgba(0,0,0,0.4)',
        minWidth: 130,
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#1C1C2E', fontFamily: "'Manrope',sans-serif", letterSpacing: '0.2px' }}>
          {shelfName || 'My Shelf'}
        </div>
        {username && (
          <div style={{ fontSize: 10.5, fontWeight: 600, color: '#606078', fontFamily: "'Manrope',sans-serif", marginTop: 2 }}>
            made by {username}
          </div>
        )}
      </div>
      {/* Desktop: hover-reveal Edit button. Mobile edits the plate via the Shelves overlay. */}
      {showEditButton && !isMobile && <EditButton onClick={onEdit} visible={hovered} />}
    </div>
  )
}


// ─── ShelfRow (read-only display) ─────────────────────────────────────────────

function ShelfRow({ shelf, hoveredId, grabbedId, onEnter, onLeave, onClick, onEditClick, shelfH = SHELF_H }) {
  return (
    <>
      <div style={{ position: 'relative', display: 'flex', background: '#E2712C', borderLeft: '16px solid #E2712C', borderRight: '16px solid #E2712C' }}>
        <ShelfLabel label={shelf.label} tabBg={shelf.tabBg} tabInk={shelf.tabInk} />
        {onEditClick && <EditButton onClick={onEditClick} visible={!!onEditClick} />}
        <div style={{ position: 'relative', flex: 1, height: shelfH, display: 'flex', alignItems: 'flex-end', gap: 4, padding: '0 14px 0 16px', background: 'linear-gradient(180deg,#A4501D 0%,#EA8B50 8%)', overflow: 'visible' }}>
          {shelf.items.map((item, i) => {
            if (item.type === 'book') return (
              <VerticalBook key={item.id} b={item}
                active={hoveredId === item.id}
                grabbed={item.id === grabbedId}
                onEnter={() => onEnter(item)}
                onLeave={() => onLeave(item)}
                onClick={() => onClick(item)}
              />
            )
            if (item.type === 'stack') return (
              <div key={item.id} style={{ display: 'flex', flexDirection: 'column-reverse', gap: 3, width: 252, flex: '0 0 auto', alignSelf: 'flex-end' }}>
                {item.books.map(b => (
                  <HorizontalBook key={b.id} b={b}
                    active={hoveredId === b.id}
                    grabbed={b.id === grabbedId}
                    onEnter={() => onEnter(b)}
                    onLeave={() => onLeave(b)}
                    onClick={() => onClick(b)}
                  />
                ))}
              </div>
            )
            if (item.type === 'flower')  return <div key={item.id} style={{ width: 74, height: '100%', flexShrink: 0 }}><PlacedFlower w={74} /></div>
            if (item.type === 'flower2') return <div key={item.id} style={{ width: 74, height: '100%', flexShrink: 0 }}><PlacedFlower2 w={74} /></div>
            if (item.type === 'coffee')  return <div key={item.id} style={{ width: 74, height: '100%', flexShrink: 0 }}><PlacedCoffeeCup w={74} /></div>
            if (item.type === 'light')   return <div key={item.id} style={{ width: 74, height: '100%', flexShrink: 0 }}><PlacedLight w={74} /></div>
            if (item.type === 'clock')   return <div key={item.id} style={{ width: 74, height: '100%', flexShrink: 0 }}><PlacedClock w={74} /></div>
            return null
          })}
        </div>
      </div>
      <div style={{ height: 20, background: '#E2712C', borderRadius: 0 }} />
    </>
  )
}


export { PlacedVerticalBook, PlacedHorizontalStack, EditableShelfRow, SavedShelfRow, DragGhost, EditButton, ShelfLabel, ShelfPlate, ShelfRow }
