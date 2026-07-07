// ─── Google Books API helpers ─────────────────────────────────────────────────

function strHash(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

const SPINE_PALETTE = [
  { spine: '#5C3A1E', ink: '#fff' },
  { spine: '#1E3A5C', ink: '#fff' },
  { spine: '#1E5C3A', ink: '#fff' },
  { spine: '#5C1E3A', ink: '#fff' },
  { spine: '#3A1E5C', ink: '#fff' },
  { spine: '#5C5C1E', ink: '#fff' },
  { spine: '#1E5C5C', ink: '#fff' },
  { spine: '#8B4513', ink: '#fff' },
  { spine: '#2C5F2E', ink: '#fff' },
  { spine: '#4A235A', ink: '#fff' },
  { spine: '#1a3a4a', ink: '#fff' },
  { spine: '#6B2D8B', ink: '#fff' },
]

const CATEGORY_MAP = [
  // multi-word / specific labels first so they beat their broader siblings
  { label: 'Science Fiction',    keywords: ['science fiction', 'sci-fi', 'scifi', 'space opera', 'cyberpunk', 'dystopian', 'robot', 'robots', 'alien', 'aliens', 'spaceship', 'spaceships', 'galaxy', 'time travel', 'spacecraft', 'cyborg', 'interstellar', 'starship', 'clone', 'futuristic'] },
  { label: 'Historical Fiction', keywords: ['historical fiction', 'medieval', 'victorian era', 'world war', 'renaissance', 'colonial era', 'crusade'] },
  { label: 'Literary Fiction',   keywords: ['literary fiction', 'general fiction'] },
  { label: 'True Crime',         keywords: ['true crime', 'serial killer', 'criminal investigation'] },
  { label: 'Graphic Novel',      keywords: ['comics', 'graphic novel', 'manga', 'superhero'] },
  { label: 'Political Science',  keywords: ['political science', 'politics', 'government', 'democracy', 'election', 'policy', 'diplomacy', 'senate', 'congress'] },
  { label: 'Self-Help',          keywords: ['self-help', 'self help', 'personal development', 'motivation', 'productivity', 'habits', 'mindset', 'confidence'] },
  { label: 'Art & Design',       keywords: ['fine art', 'graphic design', 'photography', 'architecture', 'illustration', 'art / general', 'performing arts', 'painting', 'sculptor', 'gallery', 'artwork'] },
  { label: 'Young Adult',        keywords: ['young adult', 'ya fiction', 'coming of age', 'teenager'] },
  { label: "Children's",         keywords: ['juvenile fiction', 'juvenile nonfiction', "children's", 'picture book', 'fairy tale', 'bedtime story'] },
  // broader single-concept labels
  { label: 'Fantasy',            keywords: ['fantasy', 'wizard', 'wizards', 'witch', 'witches', 'dragon', 'dragons', 'magic', 'magical', 'sorcerer', 'sorcery', 'enchanted', 'spell', 'spells', 'potion', 'potions', 'fairy', 'fairies', 'goblin', 'goblins', 'elves', 'dwarf', 'mythical'] },
  { label: 'Mystery',            keywords: ['mystery', 'detective', 'whodunit', 'sleuth', 'investigation', 'suspect', 'clue', 'murder mystery'] },
  { label: 'Thriller',           keywords: ['thriller', 'suspense', 'spy', 'assassin', 'conspiracy', 'heist', 'kidnap'] },
  { label: 'Horror',             keywords: ['horror', 'supernatural fiction', 'vampire', 'ghost', 'demon', 'haunted', 'zombie', 'monster', 'werewolf'] },
  { label: 'Romance',            keywords: ['romance', 'love story', 'falling in love', 'heartbreak'] },
  { label: 'Adventure',          keywords: ['adventure', 'expedition', 'explorer'] },
  { label: 'Biography',          keywords: ['biography', 'autobiography', 'memoir', 'life story'] },
  { label: 'History',            keywords: ['history', 'war', 'battle', 'empire', 'civilization', 'revolution', 'ancient'] },
  { label: 'Technology',         keywords: ['technology', 'computers', 'programming', 'software', 'artificial intelligence', 'machine learning', 'algorithm', 'internet', 'hacking', 'silicon valley'] },
  { label: 'Business',           keywords: ['business', 'economics', 'management', 'entrepreneurship', 'investing', 'finance', 'leadership', 'strategy', 'startup', 'wall street', 'stock market'] },
  { label: 'Science',            keywords: ['science', 'physics', 'chemistry', 'biology', 'astronomy', 'evolution', 'quantum', 'laboratory', 'experiment'] },
  { label: 'Psychology',         keywords: ['psychology', 'psychiatry', 'cognitive science', 'behavior', 'mental health', 'emotion', 'therapy', 'trauma', 'consciousness'] },
  { label: 'Philosophy',         keywords: ['philosophy', 'ethics', 'morality', 'existence', 'wisdom', 'virtue'] },
  { label: 'Religion',           keywords: ['religion', 'spirituality', 'theology', 'prayer', 'faith', 'church', 'bible', 'quran', 'monk', 'salvation'] },
  { label: 'Travel',             keywords: ['travel', 'exploration', 'backpacking', 'wanderlust', 'abroad', 'journey'] },
  { label: 'Cooking',            keywords: ['cooking', 'food', 'culinary', 'baking', 'recipe', 'recipes', 'kitchen', 'chef', 'cuisine', 'ingredient'] },
  { label: 'Music',              keywords: ['music', 'musician', 'band', 'album', 'guitar', 'piano', 'singer', 'concert', 'composer', 'jazz', 'classical music'] },
  { label: 'Sports',             keywords: ['sports', 'athletics', 'champion', 'league', 'football', 'basketball', 'baseball', 'soccer', 'tennis', 'olympic', 'athlete'] },
  { label: 'Health',             keywords: ['health', 'medicine', 'medical', 'wellness', 'nutrition', 'diet', 'disease', 'illness', 'treatment', 'healing'] },
  { label: 'Nature',             keywords: ['nature', 'animals', 'ecology', 'environment', 'wildlife', 'forest', 'ocean', 'climate', 'wilderness', 'species'] },
  { label: 'Mathematics',        keywords: ['mathematics', 'statistics', 'calculus', 'geometry', 'algebra', 'theorem', 'probability'] },
  { label: 'Education',          keywords: ['education', 'teaching', 'study aids', 'classroom', 'learning', 'curriculum', 'university'] },
]

function detectCategory(subjects = [], text = '') {
  const haystack = [...subjects, text].join(' ').toLowerCase()
  let best = null, bestScore = 0
  for (const c of CATEGORY_MAP) {
    const score = c.keywords.filter(k =>
      new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(haystack)
    ).length
    if (score > bestScore) { bestScore = score; best = c.label }
  }
  return best
}

async function extractDominantColor(url) {
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 30; canvas.height = 45
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, 30, 45)
        const { data } = ctx.getImageData(0, 0, 30, 45)
        let r = 0, g = 0, b = 0, n = 0
        for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i+1]; b += data[i+2]; n++ }
        resolve({ r: Math.round(r/n), g: Math.round(g/n), b: Math.round(b/n) })
      } catch { resolve(null) }
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

function spineInkFromRGB(r, g, b) {
  return (0.299 * r + 0.587 * g + 0.114 * b) > 140 ? '#1c1c1c' : '#ffffff'
}

function parseSeries(doc, rawTitle) {
  // Prefer explicit OL fields
  if (doc.series_name?.length) {
    const name = doc.series_name[0]
    const num = doc.series_position?.[0] ? parseFloat(doc.series_position[0]) : null
    return { name, num: Number.isInteger(num) ? num : null }
  }
  // Fall back to parsing title parenthetical
  const m = rawTitle.match(/\(([^)]+?)[,\s]+(?:book\s*|vol(?:ume)?\.?\s*)?#?(\d+)\s*\)$/i)
    ?? rawTitle.match(/\(([^)]+?)\s+book\s+(\d+)\s*\)$/i)
  if (m) return { name: m[1].trim(), num: parseInt(m[2]) }
  return null
}

function stripSeriesFromTitle(rawTitle) {
  return rawTitle.replace(/\s*\([^)]+?[,\s]+(?:book\s*|vol(?:ume)?\.?\s*)?#?\d+\s*\)$/i, '').trim()
}

function mapOpenLibraryBook(doc) {
  const id = doc.key?.replace('/works/', '') ?? ''
  const hash = strHash(id)
  const c = SPINE_PALETTE[hash % SPINE_PALETTE.length]
  const rawTitle = doc.title ?? 'Unknown Title'
  const series = parseSeries(doc, rawTitle)
  const title = series ? stripSeriesFromTitle(rawTitle) : rawTitle
  const titleBonus = Math.min(Math.max(title.length - 10, 0), 18)
  const h = 142 + (hash % 20) + titleBonus
  const w = 24 + ((hash >> 4) % 13)
  const thumb = doc.cover_i
    ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
    : null
  const year = doc.first_publish_year?.toString() ?? null
  const category = detectCategory(
    doc.subject ?? [],
    [doc.first_sentence?.value ?? '', doc.subtitle ?? ''].join(' ')
  )
  return {
    id,
    title,
    author: doc.author_name?.[0] ?? 'Unknown Author',
    spine: c.spine,
    ink: c.ink,
    h,
    w,
    coverBg: c.spine,
    coverInk: c.ink,
    thumbnail: thumb,
    year,
    category,
    description: null,
    firstSentence: typeof doc.first_sentence === 'string' ? doc.first_sentence : (doc.first_sentence?.value ?? null),
    subjects: (doc.subject ?? []).slice(0, 8),
    publisher: null,
    series,
  }
}

const DEFAULT_QUERIES = [
  ['pride and prejudice jane austen', 0],
  ['1984 george orwell', 0],
  ['to kill a mockingbird harper lee', 0],
  ['the great gatsby fitzgerald', 0],
  ['wuthering heights emily bronte', 0],
  ['the hobbit tolkien', 1],
  ['harry potter philosophers stone rowling', 1],
  ['a game of thrones george martin', 1],
  ['the alchemist paulo coelho', 2],
  ['fahrenheit 451 bradbury', 2],
  ['the kite runner hosseini', 2],
  ['gone girl gillian flynn', 2],
]

async function fetchDefaultShelfData() {
  const FIELDS = 'key,title,author_name,cover_i,first_publish_year,subject,first_sentence'
  const docs = await Promise.all(
    DEFAULT_QUERIES.map(([q]) =>
      fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=1&fields=${FIELDS}`)
        .then(r => r.json()).then(d => d.docs?.[0] ?? null).catch(() => null)
    )
  )
  const byShelf = [[], [], []]
  DEFAULT_QUERIES.forEach(([, shelf], i) => { if (docs[i]) byShelf[shelf].push(mapOpenLibraryBook(docs[i])) })

  let uid = 0
  const it = (type, startSlot, slotWidth, extras = {}) => ({ id: `def_${uid++}`, type, startSlot, slotWidth, ...extras })
  const configs = [
    { id: 'shelf_0', label: 'Classics', colorKey: 'yellow', items: [] },
    { id: 'shelf_1', label: 'Fantasy',  colorKey: 'green',  items: [] },
    { id: 'shelf_2', label: 'Modern',   colorKey: 'blue',   items: [] },
  ]
  const contents = [
    [...byShelf[0].slice(0, 5).map((book, i) => it('vertical-book', i, 1, { book })), it('coffee', 7, 2)],
    [...byShelf[1].slice(0, 3).map((book, i) => it('vertical-book', i, 1, { book })), it('flower', 5, 2)],
    [it('light', 0, 2), ...byShelf[2].slice(0, 4).map((book, i) => it('vertical-book', i + 2, 1, { book })), it('flower2', 9, 2)],
  ]
  return { configs, contents }
}


export { mapOpenLibraryBook, DEFAULT_QUERIES }
