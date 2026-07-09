import { useState, useRef } from 'react'
import { SLOT_W, NUM_SLOTS, SHELF_H, SHELF_TAB_FONT_EM, SHELF_EDIT_FONT_EM, SHELF_HINT_FONT_EM, PLATE_EM_BASE, PLATE_TITLE_FONT_EM, PLATE_USER_FONT_EM } from '../lib/layout.js'
import { getSpineDims } from '../lib/spineTypography.js'
import { setGhostPos } from '../lib/geometry.js'
import { IconPencil } from './icons.jsx'
import { PlacedFlower, PlacedFlower2, PlacedCoffeeCup, PlacedLight, PlacedClock } from './decor.jsx'
import { VerticalBook, HorizontalBook } from './scene.jsx'
import { SpineLabel } from './SpineLabel.jsx'

function PlacedVerticalBook({ book, w, h, active, grabbed, onEnter, onLeave, onClick }) {
  const spineDims = getSpineDims({ axis: 'vertical', title: book?.title, slotW: w, shelfH: h })
  return (
    <div
      onMouseEnter={() => { if (book?.thumbnail) { const img = new Image(); img.src = book.thumbnail }; onEnter?.() }}
      onMouseLeave={onLeave}
      onClick={onClick}
      title={book?.title}
      // Keyboard access for clickable books (browse view): Tab to focus, Enter/Space to open
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `Open ${book?.title}` : undefined}
      onKeyDown={onClick ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
      style={{ width: w, height: h, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', cursor: onClick ? 'pointer' : 'default' }}
    >
      <div style={{
        width: '100%', height: spineDims.h,
        background: book?.spine ?? '#555',
        borderRadius: '3px 3px 1px 1px', overflow: 'hidden',
        visibility: grabbed ? 'hidden' : 'visible',
        boxShadow: active
          ? 'inset -2px 0 5px rgba(0,0,0,0.18), 0 0 0 2px rgba(253,248,239,0.85), 0 6px 16px rgba(60,30,10,0.3)'
          : 'inset -2px 0 5px rgba(0,0,0,0.18)',
        transform: active ? 'translateY(-8px)' : 'none',
        transition: 'transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .18s ease',
      }}>
        <SpineLabel axis="vertical" title={book?.title} dims={spineDims} ink={book?.ink ?? '#fff'} />
      </div>
    </div>
  )
}

function PlacedHorizontalStack({ books, w, onBookClick, onBookMouseDown, editMode, grabbedBookId }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  return (
    <div style={{ width: w, height: '100%', display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', gap: 0, paddingTop: 6, boxSizing: 'border-box', justifyContent: 'flex-start' }}>
      {(books || []).map((b, i) => {
        const slabDims = getSpineDims({ axis: 'horizontal', title: b.title, slotW: w })
        // browse: highlight only the hovered slab; edit: highlight hovered slab and everything above it (the grab slice)
        const active = hoveredIdx !== null && (editMode ? i >= hoveredIdx : i === hoveredIdx)
        const grabbed = grabbedBookId && b.id === grabbedBookId
        return (
          <div
            key={i}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            onPointerDown={onBookMouseDown ? e => { e.stopPropagation(); onBookMouseDown(i, e) } : undefined}
            onClick={onBookClick ? e => { e.stopPropagation(); onBookClick(b, e) } : undefined}
            title={b.title}
            role={onBookClick ? 'button' : undefined}
            tabIndex={onBookClick ? 0 : undefined}
            aria-label={onBookClick ? `Open ${b.title}` : undefined}
            onKeyDown={onBookClick ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onBookClick(b) } } : undefined}
            style={{
              width: slabDims.w, height: slabDims.h, background: b.spine, borderRadius: 2, flexShrink: 0,
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
            <SpineLabel axis="horizontal" title={b.title} dims={slabDims} ink={b.ink} />
          </div>
        )
      })}
    </div>
  )
}


// ─── EditableShelfRow ─────────────────────────────────────────────────────────

function EditableShelfRow({ shelf, shelfIdx, items, dragging, dropTarget, innerRef, onPointerMove, onPointerUp, onItemPointerDown, onStackBookPointerDown, grabbedBookId, shelfH = SHELF_H, isMobile = false }) {
  const [hoveredItemId, setHoveredItemId] = useState(null)
  return (
    <>
      <div style={{ position: 'relative', display: 'flex', background: '#E2712C', borderLeft: '16px solid #E2712C', borderRight: '16px solid #E2712C' }}>
        {/* Shelf editing goes through the footer's "Shelves" list */}
        <ShelfLabel label={shelf.label} tabBg={shelf.tabBg} tabInk={shelf.tabInk} />
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
          {/* Empty-shelf hint — invites the first drop, hides while dragging (grid takes over) */}
          {items.length === 0 && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none', opacity: dragging ? 0 : 1, transition: 'opacity .15s ease',
              fontSize: SHELF_H,
            }}>
              <span style={{
                fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: `${SHELF_HINT_FONT_EM}em`,
                letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(60,25,5,0.35)',
                border: '2px dashed rgba(60,25,5,0.22)', borderRadius: 10, padding: '8px 18px',
              }}>Drag books & decor here</span>
            </div>
          )}

          {/* Slot-grid overlay — only meaningful mid-drag, so keep it invisible otherwise */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none', opacity: dragging ? 1 : 0, transition: 'opacity .15s ease' }}>
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
          {items.map(it => {
            const decorHover = hoveredItemId === it.id
              && it.type !== 'vertical-book' && it.type !== 'horizontal-stack'
            return (
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
              {/* Transform on an inner layer so the hover hit box stays put (no bounce). */}
              <div style={{
                width: '100%', height: '100%',
                transform: decorHover ? 'translateY(-6px)' : 'none',
                transition: 'transform .22s cubic-bezier(.34,1.56,.64,1)',
              }}>
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
            </div>
            )
          })}

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
                  onClick={onBookClick ? e => onBookClick(it.book, e) : undefined}
                />
              )}
              {it.type === 'horizontal-stack' && (
                <PlacedHorizontalStack
                  books={it.books}
                  w={it.slotWidth * SLOT_W}
                  onBookClick={onBookClick}
                  grabbedBookId={grabbedBookId}
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


// ─── DragGhost ────────────────────────────────────────────────────────────────
// Shows the dragged item only — Sprout's real arm animates to the cursor position.
// Children use stage-space dimensions; the inner wrapper applies CSS zoom so spine
// typography matches in-stage books (same contract as stageRef zoom).

function DragGhost({ dragging, ghostRef, dragRotated, stageSc = 1, shelfH = SHELF_H, isMobile = false }) {
  const isBook  = dragging?.type === 'vertical-book'
  const isStack = dragging?.type === 'horizontal-stack'
  const sc = stageSc > 0 ? stageSc : 1
  const stackH = 108

  let innerW, innerH, gW, gH, tx, ty, content
  if (isBook && dragRotated) {
    innerW = 5 * SLOT_W
    innerH = stackH
    gW = innerW * sc
    gH = innerH * sc
    tx = -gW / 2
    ty = -gH
    content = <PlacedHorizontalStack books={[dragging.book]} w={innerW} />
  } else if (isBook) {
    innerW = SLOT_W
    innerH = shelfH
    gW = innerW * sc
    gH = innerH * sc
    tx = isMobile ? -gW / 2 : -gW
    ty = -(gH / 2)
    content = <PlacedVerticalBook book={dragging.book} w={innerW} h={innerH} />
  } else if (isStack && dragRotated) {
    const books = dragging.books ?? []
    innerW = books.length * SLOT_W
    innerH = shelfH
    gW = innerW * sc
    gH = innerH * sc
    tx = -gW / 2
    ty = -(gH / 2)
    content = (
      <div style={{ display: 'flex', alignItems: 'flex-end', width: innerW, height: innerH }}>
        {books.map((b, i) => <PlacedVerticalBook key={i} book={b} w={SLOT_W} h={innerH} />)}
      </div>
    )
  } else if (isStack) {
    innerW = (dragging?.slotWidth ?? 1) * SLOT_W
    innerH = stackH
    gW = innerW * sc
    gH = innerH * sc
    tx = -gW / 2
    ty = -gH
    content = <PlacedHorizontalStack books={dragging.books} w={innerW} />
  } else {
    innerW = (dragging?.slotWidth ?? 1) * SLOT_W
    innerH = Math.min(shelfH, 120)
    gW = innerW * sc
    gH = innerH * sc
    tx = -gW / 2
    ty = -(gH / 2)
    content = (
      <>
        {dragging?.type === 'flower'  && <PlacedFlower    w={innerW} />}
        {dragging?.type === 'flower2' && <PlacedFlower2   w={innerW} />}
        {dragging?.type === 'coffee'  && <PlacedCoffeeCup w={innerW} />}
        {dragging?.type === 'light'   && <PlacedLight     w={innerW} />}
        {dragging?.type === 'clock'   && <PlacedClock     w={innerW} />}
      </>
    )
  }

  const setRef = el => {
    if (!el) return
    ghostRef.current = el
    el.dataset.tx = tx
    el.dataset.ty = ty
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
      <div style={{ width: innerW, height: innerH, zoom: sc }}>
        {content}
      </div>
    </div>
  )
}

// ─── EditButton — shared left-column edit button with opacity fade ───────────

function EditButton({ onClick, visible, onMouseDown }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute', right: 'calc(100% + 32px)', top: '50%',
        transform: hovered ? 'translateY(-50%) scale(1.08)' : 'translateY(-50%)',
        padding: '8px 12px', borderRadius: 12, fontSize: 14,
        zIndex: 25, background: hovered ? '#2E5AC0' : '#254CA4', border: 'none',
        fontFamily: "'Manrope',sans-serif",
        fontWeight: 700, color: '#FDF8EF',
        cursor: 'pointer', whiteSpace: 'nowrap',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.2s ease, transform 0.15s cubic-bezier(.34,1.56,.64,1), background 0.15s ease',
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
    <div style={{ position: 'absolute', left: 0, top: 0, zIndex: 20, pointerEvents: 'none', display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: SHELF_H }}>
      <div style={{ background: tabBg, color: tabInk, fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: `${SHELF_TAB_FONT_EM}em`, padding: '5px 12px 5px 8px', borderRadius: '0 0 6px 0', boxShadow: '2px 2px 6px rgba(0,0,0,0.18)' }}>
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
            borderRadius: 7, padding: '4px 8px', fontSize: `${SHELF_EDIT_FONT_EM}em`, fontWeight: 700,
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

function ShelfPlate({ shelfName, username }) {
  return (
    <div style={{ position: 'relative', display: 'inline-block', fontSize: PLATE_EM_BASE }}>
      <div style={{
        background: '#F2EFE8',
        borderRadius: 7,
        padding: '9px 18px 9px 14px',
        boxShadow: '2px 3px 8px rgba(0,0,0,0.4)',
        minWidth: 130,
      }}>
        <div style={{ fontSize: `${PLATE_TITLE_FONT_EM}em`, fontWeight: 800, color: '#1C1C2E', fontFamily: "'Manrope',sans-serif", letterSpacing: '0.2px' }}>
          {shelfName || 'My Shelf'}
        </div>
        {username && (
          <div style={{ fontSize: `${PLATE_USER_FONT_EM}em`, fontWeight: 600, color: '#606078', fontFamily: "'Manrope',sans-serif", marginTop: 2 }}>
            made by {username}
          </div>
        )}
      </div>
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
                onClick={e => onClick(item, e)}
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
                    onClick={e => onClick(b, e)}
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
