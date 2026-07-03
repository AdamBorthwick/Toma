import { supabase } from './supabase.js'

// ── Identity ──────────────────────────────────────────────────────────────────

export async function getMyIp() {
  const r = await fetch('https://api.ipify.org?format=json')
  return (await r.json()).ip
}

export async function getOrCreateUser(ip) {
  await supabase.from('users').upsert({ ip }, { onConflict: 'ip', ignoreDuplicates: true })
  const { data } = await supabase.from('users').select('id').eq('ip', ip).single()
  return data.id
}

// ── Book helpers ───────────────────────────────────────────────────────────────

function bookToRow(b) {
  return {
    id: b.id,
    title: b.title,
    author: b.author ?? null,
    spine: b.spine ?? null,
    ink: b.ink ?? null,
    cover_bg: b.coverBg ?? null,
    cover_ink: b.coverInk ?? null,
    thumbnail: b.thumbnail ?? null,
    year: b.year ?? null,
    h: b.h ?? null,
    w: b.w ?? null,
    blurb: b.blurb ?? b.description ?? null,
    category: b.category ?? null,
    first_sentence: b.firstSentence ?? null,
    subjects: b.subjects ?? null,
    series: b.series ?? null,
  }
}

function rowToBook(row) {
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    spine: row.spine,
    ink: row.ink,
    coverBg: row.cover_bg,
    coverInk: row.cover_ink,
    thumbnail: row.thumbnail,
    year: row.year,
    h: row.h,
    w: row.w,
    blurb: row.blurb,
    category: row.category,
    firstSentence: row.first_sentence,
    subjects: row.subjects,
    series: row.series,
  }
}

// ── Load ───────────────────────────────────────────────────────────────────────

export async function loadShelfByUserId(userId) {
  const { data: bs } = await supabase.from('bookshelves')
    .select('id, share_id, name').eq('user_id', userId).maybeSingle()
  if (!bs) return null
  return { shareId: bs.share_id, name: bs.name, ...(await _loadRows(bs.id)) }
}

export async function loadShelfByShareId(shareId) {
  const { data: bs } = await supabase.from('bookshelves')
    .select('id, user_id, name').eq('share_id', shareId).maybeSingle()
  if (!bs) return null
  return { ownerUserId: bs.user_id, name: bs.name, ...(await _loadRows(bs.id)) }
}

async function _loadRows(bookcaseId) {
  const { data: rows } = await supabase.from('shelf_rows')
    .select('id, position, label, color_key')
    .eq('bookshelf_id', bookcaseId).order('position')

  const rowIds = (rows ?? []).map(r => r.id)

  const { data: bookItems } = rowIds.length
    ? await supabase.from('shelf_books')
        .select('id, shelf_row_id, item_type, start_slot, slot_width, book_id')
        .in('shelf_row_id', rowIds)
    : { data: [] }

  const stackIds = (bookItems ?? []).filter(i => i.item_type === 'horizontal-stack').map(i => i.id)
  const { data: stackBooks } = stackIds.length
    ? await supabase.from('stack_books')
        .select('shelf_book_id, book_id, position')
        .in('shelf_book_id', stackIds).order('position')
    : { data: [] }

  const { data: decorItems } = rowIds.length
    ? await supabase.from('shelf_decor')
        .select('id, shelf_row_id, decor_type, start_slot, slot_width')
        .in('shelf_row_id', rowIds)
    : { data: [] }

  const bookIds = [...new Set([
    ...(bookItems ?? []).map(i => i.book_id).filter(Boolean),
    ...(stackBooks ?? []).map(sb => sb.book_id).filter(Boolean),
  ])]
  const { data: bookRows } = bookIds.length
    ? await supabase.from('books').select('*').in('id', bookIds)
    : { data: [] }
  const booksById = new Map((bookRows ?? []).map(b => [b.id, rowToBook(b)]))

  return {
    rows: rows ?? [],
    bookItems: bookItems ?? [],
    stackBooks: stackBooks ?? [],
    decorItems: decorItems ?? [],
    booksById,
  }
}

// ── Save ───────────────────────────────────────────────────────────────────────

export async function persistShelf(userId, shelfName, shelfConfigs, shelfContents) {
  // 1. Upsert all books referenced on this shelf
  const booksToUpsert = []
  for (const row of shelfContents) {
    for (const item of row) {
      if (item.type === 'vertical-book' && item.book) booksToUpsert.push(item.book)
      if (item.type === 'horizontal-stack') booksToUpsert.push(...(item.books ?? []))
    }
  }
  if (booksToUpsert.length) {
    await supabase.from('books').upsert(booksToUpsert.map(bookToRow), { onConflict: 'id' })
  }

  // 2. Upsert bookshelf row
  const { data: bs } = await supabase.from('bookshelves').upsert(
    { user_id: userId, name: shelfName, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  ).select('id').single()

  // 3. Delete old rows (cascades to shelf_books, stack_books, shelf_decor)
  await supabase.from('shelf_rows').delete().eq('bookshelf_id', bs.id)
  if (!shelfConfigs.length) return

  // 4. Insert shelf_rows
  const { data: savedRows } = await supabase.from('shelf_rows').insert(
    shelfConfigs.map((cfg, i) => ({
      bookshelf_id: bs.id, position: i, label: cfg.label, color_key: cfg.colorKey,
    }))
  ).select('id, position')

  // 5. Insert shelf_books, stack_books, shelf_decor per row
  for (const row of savedRows ?? []) {
    const items = shelfContents[row.position] ?? []
    const bookItemsForRow  = items.filter(i => i.type === 'vertical-book' || i.type === 'horizontal-stack')
    const decorItemsForRow = items.filter(i => i.type !== 'vertical-book' && i.type !== 'horizontal-stack')

    if (bookItemsForRow.length) {
      const { data: savedBooks } = await supabase.from('shelf_books').insert(
        bookItemsForRow.map(item => ({
          shelf_row_id: row.id,
          item_type:    item.type,
          start_slot:   item.startSlot,
          slot_width:   item.slotWidth,
          book_id:      item.type === 'vertical-book' ? (item.book?.id ?? null) : null,
        }))
      ).select('id, start_slot, item_type')

      const stackInserts = []
      for (const si of (savedBooks ?? []).filter(i => i.item_type === 'horizontal-stack')) {
        const orig = bookItemsForRow.find(i => i.startSlot === si.start_slot)
        orig?.books?.forEach((b, pos) =>
          stackInserts.push({ shelf_book_id: si.id, book_id: b.id, position: pos })
        )
      }
      if (stackInserts.length) await supabase.from('stack_books').insert(stackInserts)
    }

    if (decorItemsForRow.length) {
      await supabase.from('shelf_decor').insert(
        decorItemsForRow.map(item => ({
          shelf_row_id: row.id,
          decor_type:   item.type,
          start_slot:   item.startSlot,
          slot_width:   item.slotWidth,
        }))
      )
    }
  }
}

export async function getShareId(userId) {
  const { data } = await supabase.from('bookshelves').select('share_id').eq('user_id', userId).maybeSingle()
  return data?.share_id ?? null
}

// ── Reviews ────────────────────────────────────────────────────────────────────

export async function loadReviews(userId) {
  const { data } = await supabase.from('reviews')
    .select('book_id, review_text, rating').eq('user_id', userId)
  return new Map((data ?? []).map(r => [r.book_id, { text: r.review_text, rating: r.rating }]))
}

export async function saveReview(userId, bookId, text, rating, book = null) {
  if (book) {
    await supabase.from('books').upsert(bookToRow(book), { onConflict: 'id' })
  }
  await supabase.from('reviews').upsert(
    { user_id: userId, book_id: bookId, review_text: text, rating, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,book_id' }
  )
}

export async function deleteReview(userId, bookId) {
  await supabase.from('reviews').delete().eq('user_id', userId).eq('book_id', bookId)
}

export async function setUsername(userId, username) {
  await supabase.from('users').update({ username }).eq('id', userId)
}

export async function getUsername(userId) {
  const { data } = await supabase.from('users').select('username').eq('id', userId).single()
  return data?.username ?? null
}
