import { supabase } from './supabase.js'
import { normalizeHatKey } from './data/monster.jsx'

// ── Errors ────────────────────────────────────────────────────────────────────

export class DbError extends Error {
  constructor(message, cause = null) {
    super(message)
    this.name = 'DbError'
    this.cause = cause
  }
}

function check(result, context) {
  if (result?.error) throw new DbError(`${context}: ${result.error.message}`, result.error)
  return result?.data
}

// ── Identity ──────────────────────────────────────────────────────────────────

export async function getMyIp() {
  let r
  try {
    r = await fetch('https://api.ipify.org?format=json')
  } catch (e) {
    throw new DbError('Could not reach identity service', e)
  }
  if (!r.ok) throw new DbError(`Identity service returned ${r.status}`)
  const json = await r.json()
  if (!json?.ip) throw new DbError('Identity service returned no IP')
  return json.ip
}

export async function getOrCreateUser(ip) {
  check(
    await supabase.from('users').upsert({ ip }, { onConflict: 'ip', ignoreDuplicates: true }),
    'create user'
  )
  const data = check(
    await supabase.from('users').select('id').eq('ip', ip).single(),
    'lookup user'
  )
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

function dedupeBooks(books) {
  const seen = new Set()
  return books.filter(b => {
    if (!b?.id || seen.has(b.id)) return false
    seen.add(b.id)
    return true
  })
}

// ── Load ───────────────────────────────────────────────────────────────────────

export async function loadShelfByUserId(userId) {
  const bs = check(
    await supabase.from('bookshelves')
      .select('id, share_id, name').eq('user_id', userId).maybeSingle(),
    'load bookshelf'
  )
  if (!bs) return null
  return { shareId: bs.share_id, name: bs.name, ...(await _loadRows(bs.id)) }
}

export async function loadShelfByShareId(shareId) {
  const bs = check(
    await supabase.from('bookshelves')
      .select('id, user_id, name').eq('share_id', shareId).maybeSingle(),
    'load shared bookshelf'
  )
  if (!bs) return null
  return { ownerUserId: bs.user_id, name: bs.name, ...(await _loadRows(bs.id)) }
}

async function _loadRows(bookcaseId) {
  const rows = check(
    await supabase.from('shelf_rows')
      .select('id, position, label, color_key')
      .eq('bookshelf_id', bookcaseId).order('position'),
    'load shelf rows'
  ) ?? []

  const rowIds = rows.map(r => r.id)

  const bookItems = rowIds.length
    ? check(
        await supabase.from('shelf_books')
          .select('id, shelf_row_id, item_type, start_slot, slot_width, book_id')
          .in('shelf_row_id', rowIds),
        'load shelf books'
      ) ?? []
    : []

  const stackIds = bookItems.filter(i => i.item_type === 'horizontal-stack').map(i => i.id)
  const stackBooks = stackIds.length
    ? check(
        await supabase.from('stack_books')
          .select('shelf_book_id, book_id, position')
          .in('shelf_book_id', stackIds).order('position'),
        'load stack books'
      ) ?? []
    : []

  const decorItems = rowIds.length
    ? check(
        await supabase.from('shelf_decor')
          .select('id, shelf_row_id, decor_type, start_slot, slot_width')
          .in('shelf_row_id', rowIds),
        'load shelf decor'
      ) ?? []
    : []

  const bookIds = [...new Set([
    ...bookItems.map(i => i.book_id).filter(Boolean),
    ...stackBooks.map(sb => sb.book_id).filter(Boolean),
  ])]
  const bookRows = bookIds.length
    ? check(
        await supabase.from('books').select('*').in('id', bookIds),
        'load books'
      ) ?? []
    : []
  const booksById = new Map(bookRows.map(b => [b.id, rowToBook(b)]))

  return { rows, bookItems, stackBooks, decorItems, booksById }
}

// ── Save ───────────────────────────────────────────────────────────────────────

async function _insertShelfContents(savedRows, shelfContents) {
  for (const row of savedRows) {
    const items = shelfContents[row.position] ?? []
    const bookItemsForRow  = items.filter(i => i.type === 'vertical-book' || i.type === 'horizontal-stack')
    const decorItemsForRow = items.filter(i => i.type !== 'vertical-book' && i.type !== 'horizontal-stack')

    if (bookItemsForRow.length) {
      const savedBooks = check(
        await supabase.from('shelf_books').insert(
          bookItemsForRow.map(item => ({
            shelf_row_id: row.id,
            item_type:    item.type,
            start_slot:   item.startSlot,
            slot_width:   item.slotWidth,
            book_id:      item.type === 'vertical-book' ? (item.book?.id ?? null) : null,
          }))
        ).select('id, start_slot, item_type'),
        'insert shelf books'
      ) ?? []

      const stackInserts = []
      for (const si of savedBooks.filter(i => i.item_type === 'horizontal-stack')) {
        const orig = bookItemsForRow.find(i => i.startSlot === si.start_slot)
        orig?.books?.forEach((b, pos) =>
          stackInserts.push({ shelf_book_id: si.id, book_id: b.id, position: pos })
        )
      }
      if (stackInserts.length) {
        check(await supabase.from('stack_books').insert(stackInserts), 'insert stack books')
      }
    }

    if (decorItemsForRow.length) {
      check(
        await supabase.from('shelf_decor').insert(
          decorItemsForRow.map(item => ({
            shelf_row_id: row.id,
            decor_type:   item.type,
            start_slot:   item.startSlot,
            slot_width:   item.slotWidth,
          }))
        ),
        'insert shelf decor'
      )
    }
  }
}

// Insert new rows first, then delete stale rows — so a failed insert never wipes data.
export async function persistShelf(userId, shelfName, shelfConfigs, shelfContents) {
  const booksToUpsert = dedupeBooks(
    shelfContents.flatMap(row => row.flatMap(item => {
      if (item.type === 'vertical-book' && item.book) return [item.book]
      if (item.type === 'horizontal-stack') return item.books ?? []
      return []
    }))
  )
  if (booksToUpsert.length) {
    check(
      await supabase.from('books').upsert(booksToUpsert.map(bookToRow), { onConflict: 'id' }),
      'upsert books'
    )
  }

  const bs = check(
    await supabase.from('bookshelves').upsert(
      { user_id: userId, name: shelfName, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    ).select('id').single(),
    'upsert bookshelf'
  )

  const existingRows = check(
    await supabase.from('shelf_rows').select('id').eq('bookshelf_id', bs.id),
    'load existing shelf rows'
  ) ?? []
  const oldRowIds = existingRows.map(r => r.id)

  if (!shelfConfigs.length) {
    if (oldRowIds.length) {
      check(
        await supabase.from('shelf_rows').delete().in('id', oldRowIds),
        'clear shelf rows'
      )
    }
    return
  }

  const savedRows = check(
    await supabase.from('shelf_rows').insert(
      shelfConfigs.map((cfg, i) => ({
        bookshelf_id: bs.id, position: i, label: cfg.label, color_key: cfg.colorKey,
      }))
    ).select('id, position'),
    'insert shelf rows'
  ) ?? []

  await _insertShelfContents(savedRows, shelfContents)

  if (oldRowIds.length) {
    check(
      await supabase.from('shelf_rows').delete().in('id', oldRowIds),
      'remove stale shelf rows'
    )
  }
}

export async function getShareId(userId) {
  const data = check(
    await supabase.from('bookshelves').select('share_id').eq('user_id', userId).maybeSingle(),
    'load share id'
  )
  return data?.share_id ?? null
}

// ── Reviews ────────────────────────────────────────────────────────────────────

export async function loadReviews(userId) {
  const data = check(
    await supabase.from('reviews')
      .select('book_id, review_text, rating').eq('user_id', userId),
    'load reviews'
  ) ?? []
  return new Map(data.map(r => [r.book_id, { text: r.review_text, rating: r.rating }]))
}

export async function saveReview(userId, bookId, text, rating, book = null) {
  if (book) {
    check(
      await supabase.from('books').upsert(bookToRow(book), { onConflict: 'id' }),
      'upsert review book'
    )
  }
  check(
    await supabase.from('reviews').upsert(
      { user_id: userId, book_id: bookId, review_text: text, rating, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,book_id' }
    ),
    'save review'
  )
}

export async function deleteReview(userId, bookId) {
  check(
    await supabase.from('reviews').delete().eq('user_id', userId).eq('book_id', bookId),
    'delete review'
  )
}

export async function setUsername(userId, username) {
  check(
    await supabase.from('users').update({ username }).eq('id', userId),
    'set username'
  )
}

export async function getUsername(userId) {
  const data = check(
    await supabase.from('users').select('username').eq('id', userId).single(),
    'get username'
  )
  return data?.username ?? null
}

export async function getMonsterLook(userId) {
  try {
    const data = check(
      await supabase.from('users').select('monster_color, monster_hat, monster_hat_color').eq('id', userId).single(),
      'get monster look'
    )
    return {
      colorKey: data?.monster_color ?? 'green',
      hatKey: normalizeHatKey(data?.monster_hat ?? 'none'),
      hatColorKey: data?.monster_hat_color ?? 'red',
    }
  } catch {
    return { colorKey: 'green', hatKey: 'none', hatColorKey: 'red' }
  }
}

export async function setMonsterLook(userId, colorKey, hatKey, hatColorKey) {
  check(
    await supabase.from('users').update({
      monster_color: colorKey,
      monster_hat: hatKey,
      monster_hat_color: hatColorKey,
    }).eq('id', userId),
    'set monster look'
  )
}

// ── Inventory ──────────────────────────────────────────────────────────────────

export async function loadInventory(userId) {
  const data = check(
    await supabase
      .from('inventory_items')
      .select('id, item_type, book_id, book_ids, decor_type, books(*)')
      .eq('user_id', userId)
      .order('added_at'),
    'load inventory'
  ) ?? []

  const allStackBookIds = [...new Set(
    data.filter(r => r.item_type === 'stack').flatMap(r => r.book_ids ?? [])
  )]
  let stackBooksById = new Map()
  if (allStackBookIds.length) {
    const bRows = check(
      await supabase.from('books').select('*').in('id', allStackBookIds),
      'load inventory stack books'
    ) ?? []
    stackBooksById = new Map(bRows.map(b => [b.id, rowToBook(b)]))
  }

  return data.map(r => ({
    id: r.id,
    type: r.item_type,
    book: r.item_type === 'book' ? rowToBook(r.books) : null,
    books: r.item_type === 'stack'
      ? (r.book_ids ?? []).map(id => stackBooksById.get(id)).filter(Boolean)
      : null,
    decorType: r.decor_type ?? null,
  }))
}

export async function addInventoryBook(userId, book) {
  check(
    await supabase.from('books').upsert(bookToRow(book), { onConflict: 'id' }),
    'upsert inventory book'
  )
  const data = check(
    await supabase
      .from('inventory_items')
      .insert({ user_id: userId, item_type: 'book', book_id: book.id })
      .select('id').single(),
    'add inventory book'
  )
  return data.id
}

export async function addInventoryStack(userId, books) {
  const unique = dedupeBooks(books)
  check(
    await supabase.from('books').upsert(unique.map(bookToRow), { onConflict: 'id' }),
    'upsert inventory stack books'
  )
  const data = check(
    await supabase
      .from('inventory_items')
      .insert({ user_id: userId, item_type: 'stack', book_ids: unique.map(b => b.id) })
      .select('id').single(),
    'add inventory stack'
  )
  return data.id
}

export async function addInventoryDecor(userId, decorType) {
  const data = check(
    await supabase
      .from('inventory_items')
      .insert({ user_id: userId, item_type: 'decor', decor_type: decorType })
      .select('id').single(),
    'add inventory decor'
  )
  return data.id
}

export async function removeInventoryItem(userId, inventoryItemId) {
  check(
    await supabase
      .from('inventory_items')
      .delete()
      .eq('id', inventoryItemId)
      .eq('user_id', userId),
    'remove inventory item'
  )
}
