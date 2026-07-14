/** Browser-cached book cover preloads — share one Image request across hover/open. */

const coverPromises = new Map()

/** Same CORS mode Overlay uses, so preload and display share one cache entry. */
function coverNeedsCors(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url)
}

/** Start (or reuse) a cover fetch. Resolves when the image is in cache — even on error. */
function preloadCover(url) {
  if (!url) return Promise.resolve()
  const existing = coverPromises.get(url)
  if (existing) return existing

  const promise = new Promise(resolve => {
    const img = new Image()
    if (coverNeedsCors(url)) img.crossOrigin = 'anonymous'
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = url
    // Already cached: some browsers fire load sync, others leave complete=true with naturalWidth.
    if (img.complete && img.naturalWidth > 0) resolve()
  })
  coverPromises.set(url, promise)
  return promise
}

/** Wait for a cover, but never stall the UI past `timeoutMs`. */
function awaitCover(url, timeoutMs = 2500) {
  if (!url) return Promise.resolve()
  const ready = preloadCover(url)
  return Promise.race([
    ready,
    new Promise(resolve => setTimeout(resolve, timeoutMs)),
  ])
}

function preloadCoversFromBooks(books) {
  if (!books) return
  for (const b of books) {
    if (b?.thumbnail) preloadCover(b.thumbnail)
  }
}

function booksFromShelfItem(item) {
  if (!item) return []
  if (item.type === 'vertical-book' || item.type === 'book') return item.book ? [item.book] : []
  if (item.type === 'stack' || item.type === 'horizontal-stack') return item.books ?? []
  return []
}

function preloadCoversFromShelfContents(shelfContents) {
  if (!shelfContents) return
  for (const row of shelfContents) {
    for (const item of row) preloadCoversFromBooks(booksFromShelfItem(item))
  }
}

function preloadCoversFromInventory(inventory) {
  if (!inventory) return
  for (const item of inventory) {
    if (item.type === 'book' && item.book) preloadCover(item.book.thumbnail)
    else if (item.type === 'stack') preloadCoversFromBooks(item.books)
  }
}

export {
  preloadCover,
  awaitCover,
  preloadCoversFromBooks,
  preloadCoversFromShelfContents,
  preloadCoversFromInventory,
  coverNeedsCors,
}
