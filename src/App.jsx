import { useState, useEffect, useRef, useCallback, Fragment } from 'react'
import './App.css'
import { getMyIp, getOrCreateUser, loadShelfByUserId, loadShelfByShareId, loadReviews, persistShelf, getShareId, saveReview, deleteReview, setUsername as saveUsername, getUsername, loadInventory, addInventoryBook, addInventoryStack, addInventoryDecor, removeInventoryItem } from './db.js'

const publicPath = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`

// ─── Data ─────────────────────────────────────────────────────────────────────

function book(id, title, author, spine, ink, h, w, coverBg, coverInk, blurb) {
  return { id, title, author, spine, ink, h, w, coverBg, coverInk, blurb }
}

const SHELVES = [
  {
    label: 'Classics', accent: '#E0A21C', tabBg: '#F4C24B', tabInk: '#6b4e10',
    items: [
      { type: 'book', ...book('dracula', 'Dracula', 'Bram Stoker', '#1c1c1c', '#d94f3d', 150, 30, '#1c1c1c', '#f4ede0', 'A Transylvanian count, a trail of letters, and a creeping dread that has never quite left the genre.'), thumbnail: publicPath('/covers/dracula.jpg'), year: '1897' },
      { type: 'book', ...book('sherlock', 'Sherlock Holmes', 'A. C. Doyle', '#c9b184', '#1C1C2E', 158, 32, '#c9b184', '#1C1C2E', 'The world\'s most famous detective and twelve cases that made deduction look like magic.'), thumbnail: publicPath('/covers/sherlock.jpg'), year: '1892' },
      { type: 'book', ...book('animalfarm', 'Animal Farm', 'George Orwell', '#7d1f1f', '#f4ede0', 142, 26, '#7d1f1f', '#f4ede0', 'All animals are equal—until a fable about a farmyard revolution proves some are more equal than others.'), thumbnail: publicPath('/covers/animalfarm.jpg'), year: '1945' },
      { type: 'book', ...book('journey', 'Journey to the Centre of the Earth', 'Jules Verne', '#bcd9e0', '#234a52', 168, 30, '#bcd9e0', '#234a52', 'Down a volcano and into the impossible—Verne\'s grand subterranean expedition.'), thumbnail: publicPath('/covers/journey.jpg'), year: '1864' },
      { type: 'book', ...book('mockingbird', 'To Kill a Mockingbird', 'Harper Lee', '#2f7d6e', '#f4ede0', 162, 34, '#2f7d6e', '#f4ede0', 'A small Southern town, a wrongful trial, and a childhood that learns what courage costs.'), thumbnail: publicPath('/covers/mockingbird.jpg'), year: '1960' },
      { type: 'stack', id: 'classics-stack', books: [
        { ...book('littlewomen', 'Little Women', 'L. M. Alcott', '#ece3cf', '#7a3a6e', 26, 232, '#ece3cf', '#7a3a6e', 'Four March sisters grow up amid love, loss and ambition in Civil-War New England.'), thumbnail: publicPath('/covers/littlewomen.jpg'), year: '1868' },
        { ...book('twocities', 'A Tale of Two Cities', 'Charles Dickens', '#e9dfc6', '#9a2f2f', 26, 232, '#e9dfc6', '#9a2f2f', 'London and Paris, sacrifice and resurrection, in Dickens\' great novel of revolution.'), thumbnail: publicPath('/covers/twocities.jpg'), year: '1859' },
        { ...book('mobydick', 'Moby Dick', 'Herman Melville', '#1b1b1b', '#7fb8d6', 30, 232, '#1b1b1b', '#7fb8d6', 'One captain\'s obsession with a white whale becomes literature\'s deepest dive.'), thumbnail: publicPath('/covers/mobydick.jpg'), year: '1851' },
      ] },
    ],
  },
  {
    label: 'Fantasy', accent: '#5a9e3f', tabBg: '#88c46a', tabInk: '#2c4a18',
    items: [
      { type: 'book', ...book('got', 'A Game of Thrones', 'G. R. R. Martin', '#161616', '#e8e8e8', 168, 32, '#161616', '#e8e8e8', 'Winter is coming—and so are the schemes of every house clawing toward the Iron Throne.'), thumbnail: publicPath('/covers/got.jpg'), year: '1996' },
      { type: 'book', ...book('namewind', 'The Name of the Wind', 'Patrick Rothfuss', '#1f3a5f', '#dfe7ef', 162, 30, '#1f3a5f', '#dfe7ef', 'A gifted, haunted young man tells the story of how legend and ruin became the same thing.'), thumbnail: publicPath('/covers/namewind.jpg'), year: '2007' },
      { type: 'book', ...book('poppywar', 'The Poppy War', 'R. F. Kuang', '#5a1a1a', '#e8a23d', 150, 28, '#5a1a1a', '#e8a23d', 'A war orphan claws into an elite academy and discovers a terrible, godlike power.'), thumbnail: publicPath('/covers/poppywar.jpg'), year: '2018' },
      { type: 'book', ...book('fellowship', 'The Fellowship of the Ring', 'J. R. R. Tolkien', '#efe6cf', '#5a3210', 170, 32, '#efe6cf', '#5a3210', 'One ring, nine companions, and the long road that begins all modern fantasy.'), thumbnail: publicPath('/covers/fellowship.jpg'), year: '1954' },
      { type: 'stack', id: 'fantasy-stack', books: [
        { ...book('dragonreborn', 'The Dragon Reborn', 'Robert Jordan', '#103022', '#d9b860', 24, 250, '#103022', '#d9b860', 'The Wheel turns and a reluctant hero edges closer to a prophecy he can\'t outrun.'), thumbnail: publicPath('/covers/dragonreborn.jpg'), year: '1991' },
        { ...book('fourthwing', 'Fourth Wing', 'Rebecca Yarros', '#d9cdb6', '#5a3a1a', 24, 250, '#d9cdb6', '#5a3a1a', 'Bond with a dragon or die trying—war college has never been this lethal.'), thumbnail: publicPath('/covers/fourthwing.jpg'), year: '2023' },
        { ...book('hp', 'Harry Potter & the Sorcerer\'s Stone', 'J. K. Rowling', '#0d1b3a', '#e8b84b', 24, 250, '#0d1b3a', '#e8b84b', 'A boy learns he\'s a wizard and steps through the wall into a hidden world.'), thumbnail: publicPath('/covers/hp.jpg'), year: '1997' },
        { ...book('finalempire', 'The Final Empire', 'Brandon Sanderson', '#cfe0ee', '#1c3a52', 28, 250, '#cfe0ee', '#1c3a52', 'In a world of ash and mist, a street thief learns to swallow metal and move mountains.'), thumbnail: publicPath('/covers/finalempire.jpg'), year: '2006' },
      ] },
      { type: 'plant', id: 'plant1' },
    ],
  },
  {
    label: 'Sci-Fi', accent: '#3a86c2', tabBg: '#5fa9d6', tabInk: '#123a52',
    items: [
      { type: 'light', id: 'light1' },
      { type: 'stack', id: 'scifi-stack', books: [
        { ...book('redrising', 'Red Rising', 'Pierce Brown', '#161616', '#d94f3d', 24, 240, '#161616', '#d94f3d', 'A lowborn miner infiltrates the gilded elite to burn their society down from inside.'), thumbnail: publicPath('/covers/redrising.jpg'), year: '2014' },
        { ...book('f451', 'Fahrenheit 451', 'Ray Bradbury', '#e74c3c', '#1c1c1c', 24, 240, '#e74c3c', '#1c1c1c', 'A fireman whose job is burning books begins, dangerously, to read them.'), thumbnail: publicPath('/covers/f451.jpg'), year: '1953' },
        { ...book('axiom', 'Axiom\'s End', 'Lindsay Ellis', '#161616', '#d94f3d', 24, 240, '#161616', '#d94f3d', 'First contact arrives messy, political and far stranger than the movies promised.'), thumbnail: publicPath('/covers/axiom.jpg'), year: '2020' },
      ] },
      { type: 'book', ...book('dune', 'Dune', 'Frank Herbert', '#0a0a0a', '#e8a23d', 168, 32, '#0a0a0a', '#e8a23d', 'Spice, sandworms and a desert messiah—the epic that defined science fiction.'), thumbnail: publicPath('/covers/dune.jpg'), year: '1965' },
      { type: 'book', ...book('frankenstein', 'Frankenstein', 'Mary Shelley', '#6b1414', '#e8ddc8', 158, 28, '#6b1414', '#e8ddc8', 'A scientist gives life to a creature—and learns too late what he owes it.'), thumbnail: publicPath('/covers/frankenstein.jpg'), year: '1818' },
      { type: 'book', ...book('martian', 'The Martian', 'Andy Weir', '#b23b2e', '#f4ede0', 164, 30, '#b23b2e', '#f4ede0', 'Stranded on Mars with duct tape and stubbornness, one astronaut science-es his way home.'), thumbnail: publicPath('/covers/martian.jpg'), year: '2011' },
      { type: 'book', ...book('2001', '2001: A Space Odyssey', 'Arthur C. Clarke', '#1b1b1b', '#e8c84b', 170, 28, '#1b1b1b', '#e8c84b', 'A black monolith nudges humanity from the bone to the stars—and beyond.'), thumbnail: publicPath('/covers/2001.jpg'), year: '1968' },
      { type: 'book', ...book('phm', 'Project Hail Mary', 'Andy Weir', '#0e1a3a', '#5fc8e0', 156, 30, '#0e1a3a', '#5fc8e0', 'A lone amnesiac wakes light-years from home as Earth\'s last, unlikely hope.'), thumbnail: publicPath('/covers/phm.jpg'), year: '2021' },
    ],
  },
  {
    label: 'Mystery', accent: '#8E5BB5', tabBg: '#B98AD6', tabInk: '#3d2354',
    items: [
      { type: 'book', ...book('gonegirl', 'Gone Girl', 'Gillian Flynn', '#e9e2d0', '#b8302a', 150, 28, '#e9e2d0', '#b8302a', 'A wife vanishes on her anniversary, and every clue makes her husband look guiltier.'), thumbnail: publicPath('/covers/gonegirl.jpg'), year: '2012' },
      { type: 'book', ...book('dragontattoo', 'The Girl with the Dragon Tattoo', 'Stieg Larsson', '#161616', '#e8a23d', 168, 30, '#161616', '#e8a23d', 'A disgraced journalist and a feral hacker dig into a family\'s decades-old disappearance.'), thumbnail: publicPath('/covers/dragontattoo.jpg'), year: '2005' },
      { type: 'book', ...book('andthen', 'And Then There Were None', 'Agatha Christie', '#1a3a2e', '#e8ddc8', 160, 28, '#1a3a2e', '#e8ddc8', 'Ten strangers, one island, and a nursery rhyme that keeps coming true.'), thumbnail: publicPath('/covers/andthen.jpg'), year: '1939' },
      { type: 'book', ...book('silentpatient', 'The Silent Patient', 'Alex Michaelides', '#2a5a8a', '#f0e8d8', 156, 30, '#2a5a8a', '#f0e8d8', 'She shot her husband, then never spoke again. One therapist is sure he can reach her.'), thumbnail: publicPath('/covers/silentpatient.jpg'), year: '2019' },
      { type: 'stack', id: 'mystery-stack', books: [
        { ...book('rebecca', 'Rebecca', 'Daphne du Maurier', '#3a2a4a', '#d9b860', 26, 240, '#3a2a4a', '#d9b860', 'A new bride is haunted by the memory of the first Mrs de Winter at Manderley.'), thumbnail: publicPath('/covers/rebecca.jpg'), year: '1938' },
        { ...book('davinci', 'The Da Vinci Code', 'Dan Brown', '#161616', '#b8302a', 26, 240, '#161616', '#b8302a', 'A murder in the Louvre unspools a centuries-old secret hidden in plain sight.'), thumbnail: publicPath('/covers/davinci.jpg'), year: '2003' },
      ] },
      { type: 'flower', id: 'flower1' },
    ],
  },
]

const ROYGBIV = [
  { key: 'red',    tabBg: '#F07070', tabInk: '#5c0f0f', accent: '#e05555' },
  { key: 'orange', tabBg: '#FFA040', tabInk: '#5c2a00', accent: '#e07820' },
  { key: 'yellow', tabBg: '#F4C24B', tabInk: '#6b4e10', accent: '#E0A21C' },
  { key: 'green',  tabBg: '#88c46a', tabInk: '#2c4a18', accent: '#5a9e3f' },
  { key: 'blue',   tabBg: '#5fa9d6', tabInk: '#123a52', accent: '#3a86c2' },
  { key: 'indigo', tabBg: '#7B8FD6', tabInk: '#1a1f4a', accent: '#4a5bbf' },
  { key: 'violet', tabBg: '#B98AD6', tabInk: '#3d2354', accent: '#8E5BB5' },
]

function getShelfColors(colorKey) {
  return ROYGBIV.find(c => c.key === colorKey) ?? ROYGBIV[2]
}

function findShelf(bookId, configs) {
  if (!configs) return { shelf: null, idx: -1 }
  for (let i = 0; i < configs.length; i++) {
    const cfg = configs[i]
    for (const it of (cfg.items || [])) {
      if (it.type === 'book' && it.id === bookId) return { shelf: cfg, idx: i }
      if (it.type === 'stack' && it.books?.some(b => b.id === bookId)) return { shelf: cfg, idx: i }
    }
  }
  return { shelf: null, idx: -1 }
}

// ─── Edit-mode constants & helpers ────────────────────────────────────────────
const SLOT_W    = 37   // logical px per slot — (624 shelf - 16 left border - 16 right border) / 16 slots = 37
const NUM_SLOTS = 16   // slots per shelf row
const SHELF_H   = 168  // inner content height

const BOOK_CATALOG = SHELVES.flatMap(sh =>
  sh.items.flatMap(it =>
    it.type === 'book'  ? [it] :
    it.type === 'stack' ? it.books : []
  )
)

// Reconstructs shelfConfigs + shelfContents from raw Supabase DB rows
function reconstructShelf({ rows, bookItems = [], stackBooks = [], decorItems = [], booksById = new Map() }) {
  const shelfConfigs = rows.map(row => ({
    id: `shelf_${row.position}`, label: row.label, colorKey: row.color_key, items: [],
  }))
  const shelfContents = rows.map(row => {
    const rowBookItems = bookItems
      .filter(i => i.shelf_row_id === row.id)
      .sort((a, b) => a.start_slot - b.start_slot)
      .map(item => {
        if (item.item_type === 'vertical-book') {
          const book = booksById.get(item.book_id) ?? BOOK_CATALOG.find(b => b.id === item.book_id) ?? null
          return { id: item.id, type: 'vertical-book', startSlot: item.start_slot, slotWidth: item.slot_width, book }
        }
        if (item.item_type === 'horizontal-stack') {
          const books = stackBooks
            .filter(sb => sb.shelf_book_id === item.id)
            .sort((a, b) => a.position - b.position)
            .map(sb => booksById.get(sb.book_id) ?? BOOK_CATALOG.find(b => b.id === sb.book_id))
            .filter(Boolean)
          return { id: item.id, type: 'horizontal-stack', startSlot: item.start_slot, slotWidth: item.slot_width, books }
        }
        return null
      }).filter(Boolean)

    const rowDecorItems = decorItems
      .filter(i => i.shelf_row_id === row.id)
      .sort((a, b) => a.start_slot - b.start_slot)
      .map(item => ({ id: item.id, type: item.decor_type, startSlot: item.start_slot, slotWidth: item.slot_width }))

    return [...rowBookItems, ...rowDecorItems].sort((a, b) => a.startSlot - b.startSlot)
  })
  return { shelfConfigs, shelfContents }
}

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

const INVENTORY_ITEMS = [
  { type: 'vertical-book',    label: 'Book (upright)', slotWidth: 1, needsPicker: true  },
  { type: 'horizontal-stack', label: 'Book stack',     slotWidth: 5, needsPicker: true  },
  { type: 'flower',           label: 'Plant',          slotWidth: 2, needsPicker: false },
  { type: 'flower2',          label: 'Plant 2',        slotWidth: 2, needsPicker: false },
  { type: 'coffee',           label: 'Coffee',         slotWidth: 2, needsPicker: false },
  { type: 'light',            label: 'Candle',         slotWidth: 2, needsPicker: false },
  { type: 'clock',            label: 'Clock',          slotWidth: 2, needsPicker: false },
]

function buildInitialContents() {
  const byId = id => BOOK_CATALOG.find(b => b.id === id)
  let uid = 0
  const it = (type, startSlot, slotWidth, extras = {}) => ({ id: `init_${uid++}`, type, startSlot, slotWidth, ...extras })
  return [
    // Classics — yellow
    [
      it('vertical-book', 0, 1, { book: byId('dracula') }),
      it('vertical-book', 1, 1, { book: byId('sherlock') }),
      it('vertical-book', 2, 1, { book: byId('animalfarm') }),
      it('vertical-book', 3, 1, { book: byId('journey') }),
      it('vertical-book', 4, 1, { book: byId('mockingbird') }),
      it('horizontal-stack', 10, 5, { books: [byId('mobydick'), byId('twocities'), byId('littlewomen')] }),
    ],
    // Fantasy — green
    [
      it('vertical-book', 0, 1, { book: byId('got') }),
      it('vertical-book', 1, 1, { book: byId('namewind') }),
      it('vertical-book', 2, 1, { book: byId('poppywar') }),
      it('vertical-book', 3, 1, { book: byId('fellowship') }),
      it('flower', 7, 2),
      it('horizontal-stack', 10, 5, { books: [byId('finalempire'), byId('hp'), byId('fourthwing'), byId('dragonreborn')] }),
    ],
    // Sci-Fi — blue
    [
      it('light', 0, 2),
      it('vertical-book', 2, 1, { book: byId('dune') }),
      it('vertical-book', 3, 1, { book: byId('frankenstein') }),
      it('vertical-book', 4, 1, { book: byId('martian') }),
      it('vertical-book', 5, 1, { book: byId('2001') }),
      it('vertical-book', 6, 1, { book: byId('phm') }),
      it('horizontal-stack', 10, 5, { books: [byId('redrising'), byId('f451'), byId('axiom')] }),
    ],
    // Mystery — violet
    [
      it('vertical-book', 0, 1, { book: byId('gonegirl') }),
      it('vertical-book', 1, 1, { book: byId('dragontattoo') }),
      it('vertical-book', 2, 1, { book: byId('andthen') }),
      it('vertical-book', 3, 1, { book: byId('silentpatient') }),
      it('coffee', 6, 2),
      it('horizontal-stack', 10, 5, { books: [byId('rebecca'), byId('davinci')] }),
    ],
  ]
}

function slotsOverlap(items, startSlot, slotWidth, excludeId = null) {
  const end = startSlot + slotWidth
  return items.some(it =>
    it.id !== excludeId &&
    startSlot < it.startSlot + it.slotWidth &&
    end > it.startSlot
  )
}

// Returns the contiguous free-slot region that contains `centre` (or length 0 if centre is occupied).
function freeZoneAt(items, centre, excl) {
  if (centre < 0 || centre >= NUM_SLOTS || slotsOverlap(items, centre, 1, excl)) return { start: centre, length: 0 }
  let left = centre
  while (left > 0 && !slotsOverlap(items, left - 1, 1, excl)) left--
  let right = centre
  while (right < NUM_SLOTS - 1 && !slotsOverlap(items, right + 1, 1, excl)) right++
  return { start: left, length: right - left + 1 }
}

// Finds the best free zone for placing an `sw`-wide item near `centre`.
// If cursor is in a free zone ≥ sw → use it (enables edge-snapping within the zone).
// If cursor is on an occupied slot → scan to both edges of the occupied group and
// check the adjacent free zones, returning the closer one that fits.
// If cursor is in a gap smaller than sw → return length 0 (no snapping).
function findFreeZone(items, centre, sw, excl) {
  const here = freeZoneAt(items, centre, excl)
  if (here.length >= sw) return here
  if (slotsOverlap(items, centre, 1, excl)) {
    let l = centre - 1
    while (l >= 0 && slotsOverlap(items, l, 1, excl)) l--
    let r = centre + 1
    while (r < NUM_SLOTS && slotsOverlap(items, r, 1, excl)) r++
    const lz = l >= 0 ? freeZoneAt(items, l, excl) : null
    const rz = r < NUM_SLOTS ? freeZoneAt(items, r, excl) : null
    const lOk = lz && lz.length >= sw
    const rOk = rz && rz.length >= sw
    if (lOk && rOk) return (centre - l) <= (r - centre) ? lz : rz
    if (lOk) return lz
    if (rOk) return rz
  }
  return { start: centre, length: 0 }
}

// ─── Arm math ─────────────────────────────────────────────────────────────────

// retractMode 0→1: unclamps tx upper bound and slides shoulder right so the
// upper arm flattens to horizontal, letting the arm clear past the shelf edge.
// returnProgress 0→1: during 'returning', sweeps elbow leftward into the shelf so the
// whole arm disappears behind it (elbow moves 760 → 300).
function computeArm(target, retractMode = 0, returnProgress = 0, maxElbowY = 9999, minTx = 270) {
  const rawTx = target ? target.x : 397
  const tx = retractMode > 0
    ? Math.max(minTx, rawTx)
    : Math.max(minTx, Math.min(786, rawTx))
  const ty = target ? target.y : 500
  const elbowX = 910 - returnProgress * 460  // 910 → 450 as arm sweeps back into shelf
  const elbowY = Math.max(214, Math.min(maxElbowY, ty))
  const L = 98
  // Shoulder slides from behind-shelf position toward elbow, making arm parallel
  const Sx = (elbowX - L) + retractMode * (850 - (elbowX - L))
  const Sy = Math.max(202, elbowY - L) + retractMode * (elbowY - Math.max(202, elbowY - L))
  const handTipX = tx + 20
  const faX1 = handTipX + 92
  const handY = elbowY + 24
  return {
    uaPath: `M ${Sx} ${Sy} L ${elbowX} ${elbowY}`,
    faPath: `M ${faX1} ${handY} L ${elbowX} ${elbowY}`,
    handTransform: `translate(${handTipX} ${handY})`,
    elbowX, elbowY, Sx, Sy,
    handTipX, handY,
  }
}

// Pointer stays fixed (keeps pointing); middle extends most, ring less, pinky least
function computeFingerPaths(extend) {
  const r = n => Math.round(n)
  return {
    index:  `M69 -25 L 2 -24`,                          // pointer — never extends
    middle: `M60 -2  L ${r(37 - extend * 35)} -2`,      // longest
    ring:   `M64 18  L ${r(41 - extend * 28)} 18`,      // second
    pinky:  `M86 36  L ${r(45 - extend * 18)} 36`,      // shortest extension
  }
}

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
        background: b.spine, borderRadius: '3px 3px 2px 2px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', position: 'relative',
        boxShadow: active
          ? '0 12px 22px rgba(60,30,10,0.32), 0 0 0 3px rgba(253,248,239,0.5)'
          : 'inset -3px 0 6px rgba(0,0,0,0.18), 0 2px 3px rgba(0,0,0,0.12)',
        transform: active ? 'translateY(-14px) scale(1.04)' : 'none',
        transition: 'transform .26s cubic-bezier(.34,1.56,.64,1), box-shadow .2s ease',
        zIndex: active ? 7 : 1,
        visibility: grabbed ? 'hidden' : 'visible',
      }}
    >
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
        background: b.spine, borderRadius: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', position: 'relative',
        boxShadow: active
          ? '0 8px 16px rgba(60,30,10,0.3), 0 0 0 3px rgba(253,248,239,0.5)'
          : 'inset 0 -2px 4px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.12)',
        transform: active ? 'translateX(10px) scale(1.02)' : 'none',
        transition: 'transform .24s cubic-bezier(.34,1.56,.64,1), box-shadow .2s ease',
        zIndex: active ? 7 : 1,
        visibility: grabbed ? 'hidden' : 'visible',
      }}
    >
      <span style={{
        fontFamily: "'Manrope', sans-serif", fontWeight: 600, fontSize: spineFontSize,
        letterSpacing: spineFontSize < 9 ? '0' : '0.3px', color: b.ink,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        maxWidth: '92%', pointerEvents: 'none',
      }}>
        {b.title}
      </span>
    </div>
  )
}

function PlacedFlower({ w }) {
  const [hov, setHov] = useState(false)
  const sw = Number.isFinite(w) ? w : 74
  const plantW = Math.round(sw * 1.28)
  const plantH = Math.round(plantW * 201 / 197)
  const potH   = Math.round(sw * 82 / 197)
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ position: 'relative', width: sw, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', overflow: 'visible' }}
    >
      {/* Plant only — scaled up, sways on hover */}
      <div style={{ flexShrink: 0, width: plantW, overflow: 'visible', position: 'relative', zIndex: 0, transformOrigin: 'bottom center', animation: hov ? 'plantSway 1.4s ease-in-out infinite' : 'none', transition: hov ? 'none' : 'transform 0.4s ease-out' }}>
        <svg width={plantW} height={plantH} viewBox="0 0 197 201" fill="none" overflow="visible">
          <path d="M102.7 225.425C108.196 223.018 113.692 220.611 119.188 218.204C117.912 215.629 116.572 212.735 115.308 209.945C104.746 185.962 94.7588 160.711 92.466 135.2C89.6311 106.828 116.951 83.9701 123.369 54.4264C124.109 51.3211 124.646 48.2441 125.004 45.0839C124.35 48.1964 123.523 51.1893 122.505 54.1767C113.764 82.6992 84.0448 100.825 83.0475 135.358C82.9497 163.71 90.8602 190.232 99.4032 216.225C100.455 219.29 101.503 222.277 102.7 225.425Z" fill="#3BD424"/>
          <path d="M25.639 137.925C25.4418 132.552 31.4158 129.584 36.6369 130.868C40.1032 131.72 43.9274 132.392 47.0796 132.276C55.0224 131.985 71.7328 125.686 75.629 135.644C79.5251 145.602 77.3967 155.566 69.3111 162.391C61.2255 169.215 51.9925 169.281 42.3577 164.258C32.7229 159.235 25.7843 141.884 25.639 137.925Z" fill="#3EAF2D"/>
          <path d="M159.356 134.493C162.395 138.845 159.219 144.525 154.251 146.396C149.109 148.333 142.947 150.842 139.155 153.035C131.697 157.349 121.445 167.947 112.647 162.005C103.848 156.063 100.815 147.019 105.085 137.42C109.355 127.82 118.163 123.022 129.945 122.077C141.728 121.133 157.202 131.409 159.356 134.493Z" fill="#3EAF2D"/>
          <path d="M114.062 6.09586L119.011 24.5648L137.48 19.6161L142.429 38.0851L160.898 33.1363C160.898 33.1363 153.929 102.885 122.073 105.1C101.004 106.566 84.8344 96.8733 75.2373 78.0599C60.7266 49.6143 114.062 6.09586 114.062 6.09586Z" fill="#FF8411"/>
          <path d="M114.062 6.09586C114.062 6.09586 118.115 17.1518 119.011 24.5648C119.908 31.9778 108.953 69.0256 108.953 69.0256C108.953 69.0256 135.561 41.0153 142.429 38.0851C149.297 35.1548 160.898 33.1363 160.898 33.1363C160.898 33.1363 153.929 102.885 122.073 105.1C101.004 106.566 84.8344 96.8733 75.2373 78.0599C60.7266 49.6143 114.062 6.09586 114.062 6.09586Z" fill="#DF2C2C"/>
          <path d="M94.3657 193.671C94.7733 194.651 95.5502 195.414 96.5457 195.782C97.54 196.15 98.6715 196.094 99.6708 195.634C100.67 195.175 101.45 194.353 101.817 193.358C102.186 192.363 102.113 191.277 101.634 190.329C101.117 189.303 100.599 188.277 100.081 187.25C98.0537 183.231 96.0262 179.211 93.9987 175.191C89.1151 165.377 80.6094 157.609 70.6788 153.652C65.0555 151.404 59.4323 149.156 53.8091 146.908C52.7417 146.482 51.6743 146.055 50.6069 145.628C50.2503 145.486 49.8449 145.493 49.4831 145.64C49.1211 145.788 48.8324 146.064 48.6771 146.415C48.5219 146.766 48.5119 147.165 48.6461 147.532C48.7804 147.899 49.048 148.204 49.3931 148.372C50.4268 148.875 51.4605 149.378 52.4942 149.88C57.9398 152.53 63.3854 155.179 68.831 157.828C77.4613 162.02 84.3152 169.391 87.8468 178.02C89.5777 182.175 91.3087 186.331 93.0397 190.487C93.4817 191.548 93.9237 192.61 94.3657 193.671Z" fill="#3BD424"/>
          <path d="M98.6368 174.665C98.2455 175.653 97.4829 176.423 96.4877 176.792C95.4942 177.162 94.3495 177.102 93.3346 176.637C92.3196 176.172 91.5259 175.345 91.157 174.351C90.7865 173.356 90.8711 172.276 91.3632 171.335C91.7377 170.617 92.1121 169.899 92.4866 169.182C93.2612 167.697 94.0357 166.213 94.8103 164.728C99.8444 154.919 108.469 147.269 118.404 143.462C120.977 142.475 123.551 141.487 126.124 140.499C126.88 140.209 127.635 139.919 128.391 139.629C128.744 139.494 129.147 139.507 129.505 139.655C129.864 139.804 130.149 140.076 130.302 140.422C130.456 140.767 130.466 141.161 130.336 141.527C130.206 141.892 129.946 142.199 129.609 142.371C128.887 142.737 128.165 143.103 127.443 143.47C124.985 144.717 122.527 145.964 120.069 147.211C111.454 151.58 104.74 159.094 101.386 167.74C100.769 169.296 100.151 170.852 99.533 172.408C99.2342 173.161 98.9355 173.913 98.6368 174.665Z" fill="#3BD424"/>
        </svg>
      </div>
      {/* Pot only — fixed, same size */}
      <svg width={sw} height={potH} viewBox="0 201 197 82" fill="none" style={{ flexShrink: 0, display: 'block', position: 'relative', zIndex: 1 }}>
        <path d="M44 201H154L143.424 248.903C148.674 265.83 136.023 283 118.301 283H80.1838C62.5366 283 50.2047 265.533 56.1117 248.903L44 201Z" fill="#FDF8EF"/>
      </svg>
    </div>
  )
}

function PlacedFlower2({ w }) {
  const [hov, setHov] = useState(false)
  const sw = Number.isFinite(w) ? w : 74
  const plantW = Math.round(sw * 1.28)
  const plantH = Math.round(plantW * 201 / 197)
  const potH   = Math.round(sw * 82 / 197)
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ position: 'relative', width: sw, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', overflow: 'visible' }}
    >
      {/* Plant only — scaled up, sways on hover */}
      <div style={{ flexShrink: 0, width: plantW, overflow: 'visible', position: 'relative', zIndex: 0, transformOrigin: 'bottom center', animation: hov ? 'plantSway 1.4s ease-in-out infinite' : 'none', transition: hov ? 'none' : 'transform 0.4s ease-out' }}>
        <svg width={plantW} height={plantH} viewBox="0 0 197 201" fill="none" overflow="visible">
          <path d="M64.5509 9.97064C69.0693 5.23562 76.5403 8.87327 78.8103 15.012C81.6231 22.6184 85.6149 32.344 89.7509 38.9163C97.4631 51.1713 118.812 72.1188 113.495 86.7183C108.178 101.318 97.2051 106.439 83.4729 99.5147C69.7408 92.5899 61.0211 78.1125 56.509 58.6762C51.9969 39.2399 61.1206 13.5653 64.5509 9.97064Z" fill="#3EAF2D"/>
          <path d="M116.269 226.609C119.397 224.116 122.526 221.624 125.654 219.131C124.052 217.186 122.34 214.924 120.74 212.724C109.658 197.024 98.7704 178.932 98.9646 160.952C99.8323 146.987 107.039 132.294 108.757 116.206C111.168 100.012 104.329 82.7185 92.5453 72.0282C90.4557 70.0035 88.2783 68.1249 85.9366 66.2867C85.4767 65.9269 84.8861 65.7645 84.2996 65.8292C83.7128 65.8943 83.178 66.1813 82.8082 66.6329C82.4384 67.0844 82.2624 67.6652 82.3142 68.2534C82.3663 68.8412 82.642 69.3881 83.0853 69.7681C85.2378 71.6129 87.2116 73.4782 89.0773 75.4543C99.6211 86.1303 104.584 100.828 101.899 115.308C99.7893 129.945 92.0524 143.424 90.0289 160.31C89.0505 183.197 100.267 201.955 111.181 219.338C112.809 221.794 114.405 224.124 116.269 226.609Z" fill="#79D424"/>
          <path d="M40.159 108.775C43.3267 103.231 51.2147 103.988 55.6682 108.563C58.65 111.627 62.1144 114.741 65.3907 116.625C73.6085 121.35 94.4622 125.555 92.1625 138.062C89.8627 150.569 81.4639 159.276 69.0066 161.051C56.5492 162.826 47.1671 157.058 40.568 145.903C33.9689 134.748 37.8247 112.86 40.159 108.775Z" fill="#3EAF2D"/>
          <path d="M154.444 127.778C158.268 132.185 155.781 138.808 150.745 141.757C146.536 144.222 141.851 147.18 138.976 149.661C132.753 155.031 125.144 167.408 115.567 161.94C105.991 156.472 101.274 147.103 103.392 136.399C105.511 125.696 112.921 119.671 123.942 117.468C134.963 115.266 151.77 124.696 154.444 127.778Z" fill="#3EAF2D"/>
          <path d="M91.5464 177.667C91.9191 178.662 92.6677 179.448 93.6535 179.841C94.6378 180.236 95.7787 180.205 96.799 179.767C97.8194 179.33 98.6281 178.525 99.0212 177.54C99.4158 176.554 99.3624 175.47 98.899 174.515C98.5027 173.696 98.1065 172.878 97.7102 172.059C95.7622 168.036 93.8142 164.013 91.8662 159.989C87.5516 150.954 80.2075 143.588 71.4809 139.295C69.1365 138.141 66.7921 136.987 64.4477 135.833C63.6319 135.431 62.8161 135.03 62.0003 134.628C61.6589 134.46 61.2559 134.437 60.885 134.553C60.5138 134.67 60.2051 134.918 60.0217 135.251C59.8384 135.584 59.7941 135.978 59.8937 136.354C59.9935 136.73 60.2291 137.057 60.5534 137.256C61.3291 137.731 62.1047 138.205 62.8803 138.68C65.1092 140.044 67.3381 141.407 69.567 142.771C77.1193 147.394 82.9105 154.52 85.8729 162.559C87.4444 166.744 89.0159 170.929 90.5874 175.114C90.9071 175.965 91.2267 176.816 91.5464 177.667Z" fill="#79D424"/>
          <path d="M99.4826 177.372C99.167 178.386 98.464 179.215 97.5039 179.667C96.5451 180.12 95.4078 180.16 94.3666 179.786C93.3254 179.412 92.4727 178.659 92.0208 177.699C91.5674 176.74 91.5519 175.653 91.9529 174.67C92.326 173.754 92.6991 172.838 93.0721 171.921C94.1115 169.369 95.1508 166.817 96.1902 164.265C100.245 154.137 108.016 145.752 117.485 140.992C121.947 138.744 126.41 136.496 130.872 134.249C131.756 133.804 132.639 133.359 133.523 132.914C133.864 132.742 134.267 132.715 134.639 132.829C135.012 132.943 135.323 133.19 135.509 133.523C135.695 133.857 135.742 134.251 135.643 134.628C135.544 135.005 135.309 135.334 134.984 135.534C134.141 136.052 133.298 136.569 132.455 137.087C128.198 139.702 123.94 142.318 119.683 144.933C111.565 149.917 105.514 157.832 102.829 166.647C102.008 169.278 101.187 171.909 100.367 174.539C100.072 175.484 99.7773 176.428 99.4826 177.372Z" fill="#79D424"/>
          <path d="M183.869 51.4144C188.59 55.7759 185.849 63.3161 180.196 66.3755C175.589 68.8687 170.509 72.0006 167.091 75.2212C159.351 82.5126 147.879 102.675 135.539 97.6864C123.2 92.6975 116.912 82.3599 119.269 69.4014C121.626 56.4429 131.879 53.5104 145.814 49.2244C159.749 44.9384 180.374 48.1861 183.869 51.4144Z" fill="#3EAF2D"/>
          <path d="M105.343 131.388C105.162 132.163 104.681 132.827 103.995 133.23C103.31 133.634 102.476 133.744 101.687 133.54C100.899 133.336 100.223 132.834 99.82 132.149C99.4161 131.463 99.3174 130.649 99.5351 129.884C99.9006 128.597 100.266 127.31 100.632 126.023C102.419 119.731 104.206 113.44 105.993 107.148C108.877 96.8363 115.616 87.7699 124.482 82.0832C130.73 78.0585 136.977 74.0338 143.225 70.009C144.35 69.2846 145.474 68.5601 146.599 67.8356C146.844 67.6778 147.146 67.6241 147.434 67.683C147.723 67.7421 147.976 67.909 148.14 68.1503C148.304 68.3916 148.365 68.6884 148.313 68.9788C148.26 69.269 148.099 69.5289 147.861 69.6982C146.772 70.4744 145.682 71.2506 144.593 72.0268C138.54 76.3389 132.487 80.651 126.434 84.9632C118.525 90.5771 112.864 99.0919 110.732 108.375C109.241 114.744 107.75 121.112 106.259 127.48C105.954 128.783 105.648 130.085 105.343 131.388Z" fill="#79D424"/>
        </svg>
      </div>
      {/* Pot only — fixed, same size */}
      <svg width={sw} height={potH} viewBox="0 201 197 82" fill="none" style={{ flexShrink: 0, display: 'block', position: 'relative', zIndex: 1 }}>
        <path d="M44 201H154L143.424 248.903C148.674 265.83 136.023 283 118.301 283H80.1838C62.5366 283 50.2047 265.533 56.1117 248.903L44 201Z" fill="#FDF8EF"/>
      </svg>
    </div>
  )
}

function PlacedCoffeeCup({ w }) {
  const sw = Number.isFinite(w) ? w : 74
  const cupW = Math.round(sw * 1.2)
  const cupH = Math.round(cupW * 228 / 148)
  return (
    <div style={{ position: 'relative', width: sw, height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <svg width={cupW} height={cupH} viewBox="0 0 148 228" fill="none" overflow="visible">
        {/* Steam — rendered before cup body so cup covers steam at start */}
        <ellipse cx="60" cy="148" rx="7" ry="7" fill="#E9E9E9" style={{ animation: 'steamFloat 4.5s ease-in-out 0s infinite' }}/>
        <ellipse cx="49" cy="145" rx="6" ry="6" fill="#E9E9E9" style={{ animation: 'steamFloat 4.5s ease-in-out 1.125s infinite' }}/>
        <ellipse cx="72" cy="143" rx="8" ry="8" fill="#E9E9E9" style={{ animation: 'steamFloat 4.5s ease-in-out 2.25s infinite' }}/>
        <ellipse cx="52" cy="141" rx="6" ry="6" fill="#E9E9E9" style={{ animation: 'steamFloat 4.5s ease-in-out 3.375s infinite' }}/>
        {/* Handle */}
        <path d="M101 153.464C101 153.464 114.988 150.228 121.858 160.853C132.818 177.802 129.827 192.823 121.858 205.147C114.988 215.772 101 212.537 101 212.537" stroke="#FDF8EF" strokeWidth="11.8331"/>
        {/* Cup body — draws over steam at start, steam emerges above rim as it rises */}
        <path d="M104.073 139.109H15.5433V222.572C15.5433 225.333 17.7819 227.572 20.5433 227.572H99.073C101.834 227.572 104.073 225.333 104.073 222.572V139.109Z" fill="#FDF8EF"/>
      </svg>
    </div>
  )
}

function PlacedLight({ w }) {
  const sw = Number.isFinite(w) ? w : 74
  return (
    <div style={{ position: 'relative', width: sw, height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <svg width={sw} height={Math.round(sw * 162 / 117)} viewBox="0 0 117 162" fill="none">
        <circle cx="58.443" cy="62.4756" r="55.8339" fill="#FFFBE5" fillOpacity="0.29" style={{ animation: 'candleGlow 3.8s ease-in-out infinite' }}/>
        <circle cx="58.443" cy="62.4756" r="29.2899" fill="#FFF5C3" fillOpacity="0.71" style={{ animation: 'candleGlow 3.8s ease-in-out 0.4s infinite' }}/>
        <circle cx="58.443" cy="62.4756" r="13.7296" fill="#FFC9AE" fillOpacity="0.71" style={{ animation: 'candleGlow 3.8s ease-in-out 0.8s infinite' }}/>
        <circle cx="59" cy="62" r="4" fill="#FF8649" style={{ animation: 'candleGlow 3.8s ease-in-out 0.2s infinite' }}/>
        <path d="M43.7985 71.6287C46.0393 69.3132 70.0396 60.6485 76.7497 71.6287C80.8503 78.3388 76.7497 83.9016 76.7497 91.7655C76.7497 99.6294 78.0139 109.471 76.7497 122.886C75.4855 136.301 76.7497 159.498 76.7497 159.498H43.7985C43.7985 159.498 45.2908 97.0411 43.7985 91.7655C42.3063 86.4899 38.4282 83.5496 39.2213 78.4935C39.2213 78.4935 41.5578 73.9442 43.7985 71.6287Z" fill="white"/>
        <path d="M43.7985 71.6287C46.0393 69.3132 70.0396 60.6485 76.7497 71.6287C80.8503 78.3388 76.7497 83.9016 76.7497 91.7655C76.7497 99.6294 78.0139 109.471 76.7497 122.886C75.4855 136.301 76.7497 159.498 76.7497 159.498H43.7985C43.7985 159.498 45.2908 97.0411 43.7985 91.7655C42.3063 86.4899 38.4282 83.5496 39.2213 78.4935C39.2213 78.4935 41.5578 73.9442 43.7985 71.6287Z" fill="#FDF8EF"/>
        <path d="M24.5769 148.515H96.8864L93.7563 161.329H28.5626L24.5769 148.515Z" fill="#DF2C2C"/>
        <rect x="57.5276" y="63.3909" width="2.74593" height="5.49186" fill="#786B6B"/>
      </svg>
    </div>
  )
}

function PlacedClock({ w }) {
  const sw = Number.isFinite(w) ? w : 74
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const h = time.getHours() % 12
  const m = time.getMinutes()
  const s = time.getSeconds()
  const secAngle  = s * 6
  const minAngle  = m * 6  + s * 0.1
  const hourAngle = h * 30 + m * 0.5
  return (
    <div style={{ position: 'relative', width: sw, height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <svg width={sw} height={Math.round(sw * 156 / 129)} viewBox="0 0 129 156" fill="none">
        {/* Top bar + stem */}
        <path d="M58.5 18C57.1193 18 56 16.8807 56 15.5C56 14.1193 57.1193 13 58.5 13L68.5 13C69.8807 13 71 14.1193 71 15.5C71 16.8807 69.8807 18 68.5 18L58.5 18Z" fill="#D7D7D7"/>
        <path d="M63 15C63 14.7239 63.2239 14.5 63.5 14.5C63.7761 14.5 64 14.7239 64 15V26C64 26.2761 63.7761 26.5 63.5 26.5C63.2239 26.5 63 26.2761 63 26V15Z" fill="#D7D7D7"/>
        {/* Left bell */}
        <rect x="29.5527" y="31.6865" width="5" height="6" transform="rotate(-30 29.5527 31.6865)" fill="#D7D7D7"/>
        <path d="M17.2529 10.383C16.5626 9.18723 16.9723 7.65825 18.168 6.9679C19.3637 6.27754 20.8927 6.68723 21.5831 7.88296L24.2445 12.4928L19.9144 14.9928L17.2529 10.383Z" fill="#D7D7D7"/>
        <path d="M6.5 35.7583C2.91015 29.5405 5.04053 21.5898 11.2583 18L31.1769 6.49999C37.3947 2.91014 45.3454 5.04052 48.9352 11.2583L53.4352 19.0526L11 43.5526L6.5 35.7583Z" fill="#DF2C2C"/>
        <path d="M9.09815 34.2583C6.33672 29.4754 7.97547 23.3594 12.7584 20.598L32.677 9.09802C37.4599 6.33659 43.5758 7.97535 46.3372 12.7583L50.8372 20.5525L13.5982 42.0525L9.09815 34.2583Z" fill="#C72A2A"/>
        {/* Right bell */}
        <rect width="5" height="6" transform="matrix(-0.866025 -0.5 -0.5 0.866025 98.8826 31.6865)" fill="#D7D7D7"/>
        <path d="M111.182 10.383C111.873 9.18723 111.463 7.65825 110.267 6.9679C109.072 6.27754 107.543 6.68723 106.852 7.88296L104.191 12.4928L108.521 14.9928L111.182 10.383Z" fill="#D7D7D7"/>
        <path d="M121.935 35.7583C125.525 29.5405 123.395 21.5898 117.177 18L97.2584 6.49999C91.0406 2.91014 83.0899 5.04052 79.5001 11.2583L75.0001 19.0526L117.435 43.5526L121.935 35.7583Z" fill="#DF2C2C"/>
        <path d="M119.337 34.2583C122.099 29.4754 120.46 23.3594 115.677 20.598L95.7583 9.09802C90.9754 6.33659 84.8595 7.97535 82.0981 12.7583L77.5981 20.5525L114.837 42.0525L119.337 34.2583Z" fill="#C72A2A"/>
        {/* Legs */}
        <path d="M33.837 133.881C34.3807 133.297 34.6521 132.536 34.5659 131.745C34.4811 130.954 34.0456 130.198 33.381 129.663C32.7164 129.128 31.8846 128.864 31.0943 128.95C30.3025 129.035 29.6171 129.463 29.163 130.119C28.9123 130.48 28.6617 130.841 28.411 131.203C23.8992 137.705 19.3874 144.208 14.8756 150.711C14.6249 151.072 14.3743 151.433 14.1236 151.795C13.965 152.024 13.904 152.317 13.9449 152.602C13.9863 152.887 14.1263 153.142 14.3431 153.316C14.5599 153.491 14.8383 153.573 15.1261 153.552C15.4134 153.532 15.6865 153.409 15.8764 153.205C16.1757 152.883 16.4751 152.561 16.7744 152.239C22.1626 146.442 27.5508 140.645 32.939 134.847C33.2383 134.525 33.5377 134.203 33.837 133.881Z" fill="#D7D7D7"/>
        <circle cx="15" cy="153" r="3" fill="#D7D7D7"/>
        <path d="M90.663 133.881C90.1193 133.297 89.8479 132.536 89.9341 131.745C90.0189 130.954 90.4544 130.198 91.119 129.663C91.7836 129.128 92.6154 128.864 93.4057 128.95C94.1975 129.035 94.8829 129.463 95.337 130.119C95.5877 130.48 95.8383 130.841 96.089 131.203C100.601 137.705 105.113 144.208 109.624 150.711C109.875 151.072 110.126 151.433 110.376 151.795C110.535 152.024 110.596 152.317 110.555 152.602C110.514 152.887 110.374 153.142 110.157 153.316C109.94 153.491 109.662 153.573 109.374 153.552C109.087 153.532 108.813 153.409 108.624 153.205C108.324 152.883 108.025 152.561 107.726 152.239C102.337 146.442 96.9492 140.645 91.561 134.847C91.2617 134.525 90.9623 134.203 90.663 133.881Z" fill="#D7D7D7"/>
        <circle cx="3" cy="3" r="3" transform="matrix(-1 0 0 1 112.5 150)" fill="#D7D7D7"/>
        {/* Clock body */}
        <circle cx="64" cy="85" r="59" fill="#DF2C2C"/>
        <circle cx="64" cy="85" r="55" fill="#C72A2A"/>
        <circle cx="64" cy="85" r="49" fill="#FDF8EF"/>
        {/* Tick marks */}
        {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => {
          const a = i * 30 * Math.PI / 180
          return <line key={i} x1={64 + 41 * Math.sin(a)} y1={85 - 41 * Math.cos(a)} x2={64 + 47 * Math.sin(a)} y2={85 - 47 * Math.cos(a)} stroke="#C8C8C8" strokeWidth={i % 3 === 0 ? 2.5 : 1.5} strokeLinecap="round"/>
        })}
        {/* Seconds hand */}
        <g transform={`rotate(${secAngle}, 64, 85)`}>
          <rect x="63.25" y="42" width="1.5" height="43" rx="0.75" fill="#858585"/>
          <rect x="63.25" y="88" width="1.5" height="10" rx="0.75" fill="#858585"/>
        </g>
        {/* Hour hand */}
        <g transform={`rotate(${hourAngle}, 64, 85)`}>
          <rect x="62" y="60" width="4" height="25" rx="2" fill="#1a1a1a"/>
        </g>
        {/* Minute hand */}
        <g transform={`rotate(${minAngle}, 64, 85)`}>
          <rect x="63" y="47" width="2" height="38" rx="1" fill="#1a1a1a"/>
        </g>
        {/* Center pivot */}
        <circle cx="64" cy="85" r="3.5" fill="#1a1a1a"/>
        <circle cx="64" cy="85" r="1.5" fill="#858585"/>
      </svg>
    </div>
  )
}

// ─── SVG Icon Components ──────────────────────────────────────────────────────

function IconBooks({ size = 28, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect x="3" y="7" width="7" height="15" rx="1.5" fill={color} opacity="0.65" />
      <rect x="11" y="4" width="8" height="18" rx="1.5" fill={color} />
      <rect x="20" y="8" width="6" height="14" rx="1.5" fill={color} opacity="0.8" />
    </svg>
  )
}
function IconOpenBook({ size = 36, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <path d="M18 30 Q8 25 4 7 L18 9Z" fill={color} opacity="0.65"/>
      <path d="M18 30 Q28 25 32 7 L18 9Z" fill={color} opacity="0.65"/>
      <line x1="18" y1="9" x2="18" y2="30" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
function IconTrash({ size = 28, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <line x1="4" y1="9" x2="24" y2="9" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M11 7 Q11 5 14 5 Q17 5 17 7" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"/>
      <rect x="7" y="11" width="14" height="12" rx="2" stroke={color} strokeWidth="2" fill="none"/>
      <line x1="11" y1="14" x2="11" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="17" y1="14" x2="17" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
function IconPencil({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M9.5 2 L12 4.5 L4.5 12 L2 12.5 L2.5 10 Z" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <line x1="8.5" y1="3" x2="11" y2="5.5" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}
function IconClose({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <line x1="2" y1="2" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="12" y1="2" x2="2" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
function IconCheck({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M3 9 L7 13 L15 5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function IconRotate({ size = 28, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path d="M22 7 A9 9 0 1 0 23 15" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <polyline points="22,3 22,8 17,8" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  )
}
function IconStar({ size = 22, filled = false }) {
  const c = filled ? '#e8a400' : 'none'
  const sc = filled ? '#e8a400' : '#d4c4a8'
  return (
    <svg width={size} height={size} viewBox="0 0 22 22">
      <polygon points="11,2 13.3,8.2 20,8.7 15.2,13 16.9,19.5 11,16.2 5.1,19.5 6.8,13 2,8.7 8.7,8.2"
        fill={c} stroke={sc} strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  )
}
function IconLeaf({ size = 28, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path d="M14 25 C9 22 5 17 5 11 C5 6 9 3 14 3 C19 3 23 6 23 11 C23 17 19 22 14 25Z" fill={color} opacity="0.85"/>
      <line x1="14" y1="25" x2="14" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M14 18 Q9 14 7 9" stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.7"/>
    </svg>
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

// ─── Edit-mode item previews ──────────────────────────────────────────────────

function InventoryPreview({ type }) {
  if (type === 'vertical-book') return (
    <div style={{ width: 18, height: 52, background: '#5a3a8a', borderRadius: '3px 3px 1px 1px', boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ writingMode: 'vertical-rl', fontSize: 8, color: '#d4c8f0', fontFamily: "'Manrope',sans-serif", fontWeight: 600 }}>BOOK</span>
    </div>
  )
  if (type === 'horizontal-stack') return (
    <div style={{ width: 60, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {['#c92a2a','#1c3a5f','#2f7d6e','#7d6a1a'].map((c, i) => (
        <div key={i} style={{ height: 11, background: c, borderRadius: 2 }} />
      ))}
    </div>
  )
  if (type === 'flower')  return <div style={{ width: 38, height: 52, position: 'relative', overflow: 'visible' }}><PlacedFlower w={38} /></div>
  if (type === 'flower2') return <div style={{ width: 38, height: 52, position: 'relative', overflow: 'visible' }}><PlacedFlower2 w={38} /></div>
  if (type === 'coffee')  return <div style={{ width: 38, height: 52, position: 'relative', overflow: 'visible' }}><PlacedCoffeeCup w={38} /></div>
  if (type === 'light')   return <div style={{ width: 38, height: 52, position: 'relative', overflow: 'visible' }}><PlacedLight w={38} /></div>
  if (type === 'clock')   return <div style={{ width: 38, height: 52, position: 'relative', overflow: 'visible' }}><PlacedClock w={38} /></div>
  return null
}

function titleT(title) {
  return Math.min(1, (title ?? '').length / 36)
}

function PlacedVerticalBook({ book, w, h, active, grabbed, onEnter, onLeave, onClick }) {
  const bookH = Math.round(h * (0.72 + titleT(book?.title) * 0.28))
  const titleLen = (book?.title || '').length
  const spineFontSize = Math.max(7, Math.min(10, Math.floor((bookH - 8) / (titleLen * 0.62))))
  return (
    <div
      onMouseEnter={onEnter}
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
            onMouseDown={onBookMouseDown ? e => { e.stopPropagation(); onBookMouseDown(i, e) } : undefined}
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

function EditableShelfRow({ shelf, shelfIdx, items, dragging, dropTarget, innerRef, onMouseMove, onMouseUp, onItemMouseDown, onStackBookMouseDown, onEditClick, grabbedBookId, showEditButton }) {
  const [hoveredItemId, setHoveredItemId] = useState(null)
  return (
    <>
      <div style={{ position: 'relative', display: 'flex', background: '#E2712C', borderLeft: '16px solid #E2712C', borderRight: '16px solid #E2712C' }}>
        <ShelfLabel label={shelf.label} tabBg={shelf.tabBg} tabInk={shelf.tabInk} />
        {onEditClick && <EditButton onClick={onEditClick} visible={showEditButton !== false} onMouseDown={e => e.stopPropagation()} />}
        <div
          ref={innerRef}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          style={{
            position: 'relative', flex: 1, height: SHELF_H,
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
              onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onItemMouseDown(e, shelfIdx, it) }}
              style={{
                position: 'absolute', left: it.startSlot * SLOT_W, bottom: 0,
                width: it.slotWidth * SLOT_W, height: '100%',
                cursor: 'grab', zIndex: hoveredItemId === it.id ? 5 : 2,
              }}
            >
              {it.type === 'vertical-book' && (
                <PlacedVerticalBook
                  book={it.book} w={it.slotWidth * SLOT_W} h={SHELF_H}
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
                  onBookMouseDown={onStackBookMouseDown
                    ? (bookIdx, e) => onStackBookMouseDown(e, shelfIdx, it, bookIdx)
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

function SavedShelfRow({ shelf, items, onBookClick, onEditClick, grabbedBookId }) {
  const [hoveredId, setHoveredId] = useState(null)
  return (
    <>
      <div style={{ position: 'relative', display: 'flex', background: '#E2712C', borderLeft: '16px solid #E2712C', borderRight: '16px solid #E2712C' }}>
        <ShelfLabel label={shelf.label} tabBg={shelf.tabBg} tabInk={shelf.tabInk} />
        {onEditClick && <EditButton onClick={onEditClick} visible={!!onEditClick} />}
        <div style={{
          position: 'relative', flex: 1, height: SHELF_H,
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
                  book={it.book} w={it.slotWidth * SLOT_W} h={SHELF_H}
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

// ─── SidePanelButtons ─────────────────────────────────────────────────────────

function SidePanelButtons({ editDragging, onBook, onDecor, isEditMode, inventory = [], onInventoryItemPlace }) {
  const btnBase = {
    width: 88, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    padding: '16px 8px', border: 'none', borderRadius: 16, cursor: 'pointer',
    fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 14,
    transition: 'transform .12s',
  }
  const onHover  = e => { e.currentTarget.style.transform = 'scale(1.06)' }
  const offHover = e => { e.currentTarget.style.transform = '' }
  return (
    <div style={{
      position: 'fixed', right: 24, top: '50%',
      display: 'flex', flexDirection: 'column', gap: 14,
      zIndex: 48,
      transform: isEditMode ? 'translateY(-50%) translateX(0)' : 'translateY(-50%) translateX(130px)',
      opacity: isEditMode && !editDragging ? 1 : 0,
      transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease',
      pointerEvents: isEditMode && !editDragging ? 'auto' : 'none',
    }}>
      <button onClick={onBook} style={{ ...btnBase, background: '#254CA4', color: '#FDF8EF' }}
        onMouseEnter={onHover} onMouseLeave={offHover}>
        <IconBooks size={28} color="#FDF8EF" />
        <span>Book</span>
      </button>
      <button onClick={onDecor} style={{ ...btnBase, background: '#254CA4', color: '#FDF8EF' }}
        onMouseEnter={onHover} onMouseLeave={offHover}>
        <IconLeaf size={28} color="#FDF8EF" />
        <span>Decor</span>
      </button>
      {inventory.length > 0 && (() => {
        const topItem = inventory[0]
        return (
          <div
            onClick={() => onInventoryItemPlace(topItem)}
            title={topItem.type === 'book' ? topItem.book?.title : topItem.type === 'stack' ? `Stack of ${topItem.books?.length}` : topItem.decorType}
            style={{
              width: 88, height: 84,
              position: 'relative',
              background: 'rgba(253,248,239,0.25)',
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <svg
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
              width="88" height="84" viewBox="0 0 88 84"
            >
              <rect
                x="1.5" y="1.5" width="85" height="81" rx="10.5" ry="10.5"
                fill="none" stroke="rgba(253,248,239,0.65)" strokeWidth="2"
                strokeDasharray="12 12"
              />
            </svg>
            {topItem.type === 'book' && (
              <div style={{
                width: 16, height: 44, borderRadius: 2,
                background: topItem.book?.spine ?? '#5A4A3A',
                boxShadow: '3px 4px 14px rgba(0,0,0,0.55), -1px 0 0 rgba(0,0,0,0.2)',
              }} />
            )}
            {topItem.type === 'stack' && (
              <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
                {(topItem.books ?? []).slice(0, 4).map((b, i) => (
                  <div key={i} style={{
                    width: 10,
                    height: [38, 44, 36, 42][i] ?? 38,
                    borderRadius: 2,
                    background: b.spine ?? '#5A4A3A',
                    boxShadow: '1px 3px 8px rgba(0,0,0,0.5)',
                  }} />
                ))}
              </div>
            )}
            {topItem.type === 'decor' && (
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, color: '#FDF8EF',
                boxShadow: '0 3px 10px rgba(0,0,0,0.45)',
              }}>✦</div>
            )}
          </div>
        )
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

function BookAddPanel({ isOpen, selectedBooks, onToggleBook, onConfirm, onClose }) {
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
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 62 }}
      onMouseDown={onClose}
    >
      <div
        style={{ background: '#FDF8EF', borderRadius: 18, padding: 28, maxWidth: 440, width: '92%', maxHeight: '84vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 40px rgba(0,0,0,0.28)', fontFamily: "'Manrope',sans-serif" }}
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

function DecorAddPanel({ isOpen, onSelect, onClose }) {
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
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 62 }}
      onMouseDown={onClose}
    >
      <div
        style={{ background: '#FDF8EF', borderRadius: 18, padding: 20, maxWidth: 480, width: '92%', boxShadow: '0 8px 40px rgba(0,0,0,0.28)', fontFamily: "'Manrope',sans-serif" }}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1C1C2E' }}>Add Decoration</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center' }}><IconClose size={16} color="#606078" /></button>
        </div>

        {/* Cards — grid wraps automatically as more items are added */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
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

// ─── DragGhost ────────────────────────────────────────────────────────────────
// Shows the dragged item only — Sprout's real arm animates to the cursor position.

function DragGhost({ dragging, ghostRef, dragRotated, stageSc = 1 }) {
  const isBook  = dragging?.type === 'vertical-book'
  const isStack = dragging?.type === 'horizontal-stack'
  const slotW  = SLOT_W * stageSc
  const bookH  = SHELF_H * stageSc
  const stackH = 108 * stageSc

  let gW, gH, tx, ty, content
  if (isBook && dragRotated) {
    gW = 5 * slotW; gH = stackH
    tx = -gW / 2;   ty = -stackH
    content = <PlacedHorizontalStack books={[dragging.book]} w={gW} />
  } else if (isBook) {
    gW = slotW; gH = bookH
    tx = -gW;   ty = -(bookH / 2)
    content = <PlacedVerticalBook book={dragging.book} w={gW} h={bookH} />
  } else if (isStack && dragRotated) {
    const books = dragging.books ?? []
    gW = books.length * slotW; gH = bookH
    tx = -gW;                  ty = -(bookH / 2)
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

  return (
    <div
      ref={ghostRef}
      style={{
        position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 55,
        width: gW, height: gH,
        transform: `translate(${tx}px, ${ty}px)`,
        opacity: dragging ? 0.88 : 0,
        filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.44))',
        transition: 'opacity .12s, width .15s ease, height .15s ease, transform .15s ease',
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
        zIndex: 25, background: '#254CA4', border: 'none', borderRadius: 12,
        padding: '8px 12px', fontFamily: "'Manrope',sans-serif",
        fontWeight: 700, fontSize: 14, color: '#FDF8EF',
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

function ShelfLabel({ label, tabBg, tabInk }) {
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, zIndex: 20, pointerEvents: 'none' }}>
      <div style={{ background: tabBg, color: tabInk, fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 13, padding: '5px 12px 5px 8px', borderRadius: '0 0 6px 0', boxShadow: '2px 2px 6px rgba(0,0,0,0.18)' }}>
        {label}
      </div>
    </div>
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

// ─── ShelfPlate — gold nameplate above the bookcase ──────────────────────────

function ShelfPlate({ shelfName, username, onEdit, showEditButton }) {
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
      {showEditButton && <EditButton onClick={onEdit} visible={hovered} />}
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
      <div style={{ background: '#FDF8EF', borderRadius: 20, padding: '28px 32px 24px', width: 340, boxShadow: '0 16px 48px rgba(0,0,0,0.3)', fontFamily: "'Manrope',sans-serif" }}>
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
      <div style={{ background: '#FDF8EF', borderRadius: 20, padding: '28px 32px 24px', width: 340, boxShadow: '0 16px 48px rgba(0,0,0,0.3)', fontFamily: "'Manrope',sans-serif" }}>
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

// ─── ShelfRow (read-only display) ─────────────────────────────────────────────

function ShelfRow({ shelf, hoveredId, grabbedId, onEnter, onLeave, onClick, onEditClick }) {
  return (
    <>
      <div style={{ position: 'relative', display: 'flex', background: '#E2712C', borderLeft: '16px solid #E2712C', borderRight: '16px solid #E2712C' }}>
        <ShelfLabel label={shelf.label} tabBg={shelf.tabBg} tabInk={shelf.tabInk} />
        {onEditClick && <EditButton onClick={onEditClick} visible={!!onEditClick} />}
        <div style={{ position: 'relative', flex: 1, height: 168, display: 'flex', alignItems: 'flex-end', gap: 4, padding: '0 14px 0 16px', background: 'linear-gradient(180deg,#A4501D 0%,#EA8B50 8%)', overflow: 'visible' }}>
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

function Overlay({ selected, openPhase, onClose, shelfConfigs, descCache, userId, reviewsRef, isViewOnly, ownerName, viewerUserId }) {
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

  const BW = 280, BH = 420

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
            ? <button onClick={e => { e.stopPropagation(); setDraftText(''); setDraftRating(0); setReviewMode('edit') }} style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 600, color: '#FDF8EF', background: '#254CA4', border: 'none', borderRadius: 8, padding: '9px 20px', cursor: 'pointer', pointerEvents: 'auto' }}>Write a Review</button>
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
            {[1,2,3,4,5].map(s => <IconStar key={s} size={22} filled={s <= reviewRating} />)}
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
              <span key={star} onClick={isInteractive ? () => setDraftRating(star === draftRating ? 0 : star) : undefined} style={{ cursor: isInteractive ? 'pointer' : 'default', userSelect: 'none', padding: '5px 4px', display: 'inline-block' }}><IconStar size={24} filled={star <= draftRating} /></span>
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
        width: bookOpen ? BW * 2 : BW,
        transform: step > 0 ? 'translateY(-24px)' : 'translateY(115vh)',
        transition: [
          'width .62s cubic-bezier(.34,1.2,.5,1)',
          step === 0
            ? 'transform .34s cubic-bezier(.4,0,1,1)'
            : 'transform .56s cubic-bezier(.22,1,.36,1)',
        ].join(', '),
      }}>

        {/* Book container */}
        <div style={{ position: 'relative', width: '100%', height: BH, perspective: '1700px' }}>

          {/* Right page — description. When turner is active it's preloaded behind the turner. */}
          <div style={{
            position: 'absolute', right: 0, top: 0, width: BW, height: BH,
            background: '#FDF8EF',
            borderRadius: '0 10px 10px 0',
            boxShadow: 'inset 14px 0 22px -12px rgba(0,0,0,0.08)',
            padding: '24px', zIndex: 1,
            display: 'flex', flexDirection: 'column', gap: 10,
            opacity: bookOpen ? 1 : 0,
            transition: bookOpen ? 'opacity 0s' : 'opacity 0s .84s',
          }}>
            {rightDP === 1 && reviewPageContent(false)}
            {rightDP === 2 && <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#606078' }}>Find This Book</div>
              {bookLinks.map(({ section, items }) => (
                <div key={section} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', color: '#8888A0', marginBottom: 2 }}>{section}</div>
                  {items.map(({ label, icon, url }) => (
                    <a key={label} href={url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: "'Manrope', sans-serif", fontSize: 12, color: '#2C2C3E', textDecoration: 'none', padding: '2px 0', borderBottom: '1px solid rgba(100,100,140,0.15)' }}>
                      {icon}
                      <span>{label}</span>
                    </a>
                  ))}
                </div>
              ))}
            </div>}
          </div>

          {/* Cover — portrait: fills left:0; spread: slides to right half (left:BW) and flips
               around its LEFT edge (spine at x=BW) so the inner left page lands on the left. */}
          <div style={{
            position: 'absolute', left: bookOpen ? BW : 0, top: 0, width: BW, height: BH,
            transformStyle: 'preserve-3d',
            transformOrigin: 'left center',
            transform: bookOpen ? 'rotateY(-158deg)' : 'rotateY(0deg)',
            transition: 'left .62s cubic-bezier(.34,1.2,.5,1), transform .70s cubic-bezier(.5,0,.3,1) .14s',
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
                      window.location.href = window.location.origin + window.location.pathname
                    }}
                    style={{
                      alignSelf: 'flex-start',
                      background: '#254CA4', color: '#FDF8EF',
                      border: 'none', borderRadius: 8,
                      padding: '8px 14px',
                      fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 13,
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                      marginTop: 4,
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

          {/* 3D page-turn overlay — pivots from the spine, mirrors the cover animation */}
          {turnerVisible && (() => {
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

          {/* Left click zone — previous page */}
          <div
            onMouseEnter={() => setHoverArea('left')}
            onMouseLeave={() => setHoverArea(null)}
            onClick={e => { e.stopPropagation(); if (overlayPage > 0 && !turnerVisible) goToPage(overlayPage - 1) }}
            style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%', zIndex: 25, cursor: overlayPage > 0 && !turnerVisible ? 'pointer' : 'default', pointerEvents: (overlayPage > 0 && !(isViewOnly && overlayPage === 1)) ? 'auto' : 'none' }}
          />

          {/* Right click zone — next page */}
          <div
            onMouseEnter={() => setHoverArea('right')}
            onMouseLeave={() => setHoverArea(null)}
            onClick={e => { e.stopPropagation(); if (overlayPage < 2 && !turnerVisible) goToPage(overlayPage + 1) }}
            style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%', zIndex: 25, pointerEvents: overlayPage < 2 && !turnerVisible && !(overlayPage === 1 && reviewMode === 'edit') ? 'auto' : 'none', cursor: overlayPage < 2 && !turnerVisible ? 'pointer' : 'default' }}
          />

          {/* Arrow indicators — above all overlays so they're always visible */}
          <div style={{ position: 'absolute', bottom: bookOpen ? -2 : 12, left: bookOpen ? 16 : 12, width: 32, height: 32, borderRadius: '50%', background: bookOpen ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: bookOpen ? '#1C1C2E' : 'rgba(255,255,255,0.9)', pointerEvents: 'none', zIndex: 27, opacity: hoverArea === 'left' && overlayPage > 0 && !turnerVisible && reviewMode !== 'edit' ? 1 : 0, transition: 'opacity .18s ease' }}>
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><polyline points="6,1 1,7 6,13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div style={{ position: 'absolute', bottom: 12, right: 12, width: 32, height: 32, borderRadius: '50%', background: bookOpen ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: bookOpen ? '#1C1C2E' : 'rgba(255,255,255,0.9)', pointerEvents: 'none', zIndex: 27, opacity: hoverArea === 'right' && overlayPage < 2 && !turnerVisible && reviewMode !== 'edit' ? 1 : 0, transition: 'opacity .18s ease' }}>
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><polyline points="2,1 7,7 2,13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>

          {/* Interactive review panel — hidden during any turner animation; single source via reviewPageContent.
               zIndex:2 during initial book-open (behind cover), 26 once animation completes. */}
          {displayPage === 1 && bookOpen && !turnerVisible && (
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
          <button onClick={() => { if (!turnerVisible) goToPage(Math.max(0, overlayPage - 1)) }} style={{ background: 'none', border: 'none', cursor: overlayPage > 0 && !turnerVisible ? 'pointer' : 'default', color: 'rgba(253,248,239,0.85)', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: paginationHover && overlayPage > 0 ? 1 : 0, transition: 'opacity .25s ease' }}>
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><polyline points="6,1 1,7 6,13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          {[0, 1, 2].map(p => (
            <button key={p} onClick={() => { if (!turnerVisible) goToPage(p) }} style={{ width: 9, height: 9, borderRadius: '50%', border: 'none', padding: 0, cursor: !turnerVisible ? 'pointer' : 'default', background: p === overlayPage ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.32)', transition: 'background .15s', flexShrink: 0 }} />
          ))}
          <button onClick={() => { if (!turnerVisible) goToPage(Math.min(2, overlayPage + 1)) }} style={{ background: 'none', border: 'none', cursor: overlayPage < 2 && !turnerVisible ? 'pointer' : 'default', color: 'rgba(253,248,239,0.85)', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: paginationHover && overlayPage < 2 ? 1 : 0, transition: 'opacity .25s ease' }}>
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
            padding: '28px 24px 22px', width: 228, textAlign: 'center',
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

// ─── TitleScreen ──────────────────────────────────────────────────────────────

function TitleScreen({ onDismiss, onReveal }) {
  const faceRef = useRef(null)
  const [irisOff, setIrisOff] = useState({ x: 0, y: 0 })
  const [exitPhase, setExitPhase] = useState(null) // null | 'duck' | 'reveal'
  const [hoveredLetter, setHoveredLetter] = useState(null)
  const [btnHover, setBtnHover] = useState(false)
  const [isNear, setIsNear] = useState(false)

  useEffect(() => {
    const MAX = 7
    function onMove(e) {
      const el = faceRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const cx = r.left + 162 * (r.width / 325)
      const cy = r.top + 85 * (r.height / 331)
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (!dist) return
      const t = Math.min(dist, 100) / 100
      setIrisOff({ x: (dx / dist) * t * MAX, y: (dy / dist) * t * MAX })
      setIsNear(dist < 220)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  function handleClick() {
    if (exitPhase) return
    setExitPhase('duck')
    setTimeout(() => { setExitPhase('reveal'); onReveal() }, 420)
    setTimeout(onDismiss, 1050)
  }

  const LETTERS = [
    { ch: 'T', r: -5, dy:  6 },
    { ch: 'O', r:  4, dy: -5 },
    { ch: 'M', r: -3, dy:  7 },
    { ch: 'A', r:  6, dy: -4 },
    { ch: '!', r: -7, dy:  3 },
  ]

  const BODY = "M322.183 170.001C323.757 173.831 324.319 177.661 323.87 181.491C323.42 185.321 322.295 188.926 320.496 192.306C318.697 195.685 317.347 199.177 316.448 202.782C315.548 206.387 315.211 210.217 315.435 214.272C315.66 218.328 314.873 222.045 313.074 225.425C311.275 228.804 308.688 231.733 305.315 234.212C301.941 236.69 300.142 240.069 299.917 244.35C299.692 248.631 297.893 251.785 294.519 253.813C291.145 255.841 288.671 258.657 287.097 262.262C285.523 265.866 284.173 269.697 283.049 273.752C281.924 277.807 278.775 279.835 273.602 279.835C268.429 279.835 264.269 280.849 261.12 282.877C257.971 284.904 255.497 287.721 253.698 291.326C251.899 294.93 248.862 296.733 244.589 296.733C240.316 296.733 237.055 298.31 234.805 301.464C232.556 304.618 229.52 306.533 225.697 307.209C221.873 307.885 218.724 310.138 216.25 313.968C213.776 317.799 210.628 319.826 206.804 320.052C202.981 320.277 199.27 320.84 195.671 321.741C192.073 322.643 188.474 323.656 184.876 324.783C181.277 325.909 177.678 327.487 174.08 329.514C170.481 331.542 166.77 330.19 162.947 325.459C159.123 320.727 155.3 320.277 151.477 324.107C147.653 327.937 144.055 328.162 140.681 324.783C137.307 321.403 133.821 319.376 130.223 318.7C126.624 318.024 123.363 316.447 120.439 313.968C117.515 311.49 114.366 309.688 110.993 308.561C107.619 307.435 103.796 307.322 99.5224 308.223C95.2492 309.124 92.1004 307.66 90.0762 303.83C88.052 300 84.6784 298.535 79.9553 299.436C75.2322 300.338 71.971 298.761 70.1717 294.705C68.3725 290.65 65.1113 288.735 60.3882 288.96C55.6651 289.185 52.6288 287.27 51.2794 283.215C49.9299 279.159 46.8936 276.794 42.1705 276.118C37.4474 275.442 35.3108 272.513 35.7606 267.331C36.2104 262.149 35.8731 257.756 34.7485 254.151C33.624 250.546 29.8005 248.631 23.2781 248.406C16.7558 248.18 15.0689 245.139 18.2177 239.281C21.3664 233.423 21.9287 229.03 19.9045 226.101C17.8803 223.172 14.7316 220.468 10.4583 217.99C6.18501 215.512 3.93592 212.357 3.71101 208.527C3.4861 204.697 4.16082 200.754 5.73519 196.699C7.30956 192.643 7.75938 188.926 7.08465 185.546C6.40992 182.167 5.06046 178.675 3.03628 175.07C1.01209 171.465 0.224909 167.86 0.674728 164.255C1.12455 160.651 1.12455 156.933 0.674728 153.103C0.224909 149.273 0 145.555 0 141.951C0 138.346 0 134.628 0 130.798C0 126.968 1.57437 123.476 4.7231 120.322C7.87183 117.167 9.89602 113.788 10.7957 110.183C11.6953 106.578 13.607 103.537 16.5308 101.058C19.4547 98.58 20.4668 94.9752 19.5671 90.2439C18.6675 85.5125 20.1294 82.2457 23.9529 80.4432C27.7763 78.6408 29.688 75.374 29.688 70.6426C29.688 65.9113 32.2745 63.433 37.4474 63.2077C42.6203 62.9824 45.8815 60.9547 47.231 57.1245C48.5804 53.2944 49.9299 49.3516 51.2794 45.2962C52.6288 41.2408 54.8779 38.0865 58.0266 35.8335C61.1754 33.5805 64.7739 32.2287 68.8223 31.7781C72.8707 31.3275 76.8066 30.8769 80.63 30.4263C84.4535 29.9757 87.9396 28.9618 91.0883 27.3847C94.2371 25.8076 97.1609 23.6672 99.8598 20.9636C102.559 18.26 105.145 14.6552 107.619 10.1491C110.093 5.6431 113.242 3.27743 117.065 3.05213C120.889 2.82683 124.825 2.71418 128.873 2.71418C132.921 2.71418 136.857 4.17864 140.681 7.10756C144.504 10.0365 148.215 10.825 151.814 9.47323C155.412 8.12142 159.123 5.75575 162.947 2.37623C166.77 -1.0033 170.369 -0.777995 173.743 3.05213C177.116 6.88226 180.715 8.34672 184.538 7.44552C188.362 6.54431 192.185 6.20636 196.009 6.43166C199.832 6.65696 203.768 6.31901 207.816 5.4178C211.865 4.51659 215.238 5.8684 217.937 9.47323C220.636 13.0781 224.01 15.2184 228.058 15.8943C232.107 16.5702 234.918 19.1612 236.492 23.6672C238.067 28.1733 240.653 30.9895 244.252 32.116C247.85 33.2426 251.786 34.0311 256.059 34.4817C260.333 34.9323 263.706 36.6221 266.18 39.551C268.654 42.4799 270.679 45.8594 272.253 49.6896C273.827 53.5197 276.976 55.7727 281.699 56.4486C286.422 57.1245 288.896 59.7155 289.121 64.2215C289.346 68.7276 291.82 71.7691 296.543 73.3462C301.266 74.9234 303.965 77.7396 304.64 81.7951C305.315 85.8505 305.989 89.7933 306.664 93.6234C307.339 97.4535 308.126 101.171 309.026 104.776C309.925 108.381 311.837 111.648 314.761 114.576C317.685 117.505 318.472 121.11 317.122 125.391C315.773 129.672 314.536 133.727 313.411 137.557C312.287 141.387 313.074 144.992 315.773 148.372C318.472 151.751 319.821 155.243 319.821 158.848C319.821 162.453 320.608 166.171 322.183 170.001Z"
  const EYE   = "M63.1562 85.3432C63.1562 85.3432 63.1562 70.4788 94.5741 70.4788C125.992 70.4788 125.992 85.3432 125.992 85.3432C125.992 85.3432 125.992 100.208 94.5741 100.208C63.1562 100.208 63.1562 85.3432 63.1562 85.3432Z"
  const EYE_R = "M198.621 85.3432C198.621 85.3432 198.621 70.4788 230.039 70.4788C261.457 70.4788 261.457 85.3432 261.457 85.3432C261.457 85.3432 261.457 100.208 230.039 100.208C198.621 100.208 198.621 85.3432 198.621 85.3432Z"
  const ox = irisOff.x * (325 / 226)
  const oy = irisOff.y * (331 / 230)

  const ducking = exitPhase === 'duck' || exitPhase === 'reveal'
  const outerStyle = (z) => ({
    position: 'absolute', bottom: 0, left: '50%',
    width: 'min(100vw, 96vh)',
    transform: ducking
      ? 'translateX(-50%) translateY(110%)'
      : isNear
        ? 'translateX(-50%) translateY(74%)'
        : 'translateX(-50%) translateY(66%)',
    transition: 'transform 0.42s cubic-bezier(.34,1,.5,1)',
    pointerEvents: 'none', zIndex: z,
  })
  const breathStyle = { animation: 'tomaBreath 3.5s ease-in-out infinite', transformOrigin: 'center bottom' }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: '#254CA4',
      transform: exitPhase === 'reveal' ? 'translateY(-100%)' : 'translateY(0)',
      transition: exitPhase === 'reveal' ? 'transform 0.6s cubic-bezier(.7,0,.3,1)' : 'none',
      overflow: 'hidden',
      fontFamily: "'Manrope', sans-serif",
    }}>
      {/* z:0 — cave mouth rings, arcs exit the screen at the bottom */}
      <svg width="100%" height="160" viewBox="0 0 1280 160"
        style={{ position: 'absolute', bottom: 0, left: 0, zIndex: 0, display: 'block', overflow: 'visible', pointerEvents: 'none' }}
      >
        <ellipse cx="640" cy="280" rx="1160" ry="220" fill="#1A3280" />
        <ellipse cx="640" cy="310" rx="915" ry="210" fill="#223152" />
      </svg>

      {/* z:1 — body blob (behind title text), breathes */}
      <div style={outerStyle(1)}>
        <div style={breathStyle}>
          <svg width="100%" viewBox="0 0 325 331" fill="none">
            <path d={BODY} fill="#72FF5D" />
          </svg>
        </div>
      </div>

      {/* z:2 — TOMA! letters + subtitle + button */}
      <div style={{
        position: 'absolute', top: '4vh', left: 0, right: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 14, zIndex: 2,
      }}>
        {/* Letter row in a fixed-height container so hover pops don't shift subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.01em', height: 'clamp(72px, 15.5vw, 215px)' }}>
          {LETTERS.map((l, i) => (
            <span
              key={i}
              onMouseEnter={() => setHoveredLetter(i)}
              onMouseLeave={() => setHoveredLetter(null)}
              style={{
                fontFamily: "'Gasoek One', sans-serif",
                fontSize: 'clamp(64px, 14vw, 200px)',
                color: '#FFFFFF', lineHeight: 1,
                display: 'inline-block', userSelect: 'none', cursor: 'default',
                transform: hoveredLetter === i
                  ? `rotate(${l.r * 2.8}deg) translateY(-14px) scale(1.3)`
                  : `rotate(${l.r}deg) translateY(${l.dy}px)`,
                transition: 'transform 0.18s cubic-bezier(.34,1.6,.5,1)',
              }}
            >{l.ch}</span>
          ))}
        </div>
        <div style={{
          fontSize: 13, fontWeight: 700,
          color: 'rgba(255,255,255,0.6)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>Create a Personal Collection</div>
        <button
          onClick={(e) => { e.stopPropagation(); handleClick() }}
          onMouseEnter={() => setBtnHover(true)}
          onMouseLeave={() => setBtnHover(false)}
          style={{
            marginTop: 8, background: '#0F1E4A', color: '#FFFFFF',
            border: 'none', borderRadius: 14, padding: '13px 36px',
            fontSize: 14, fontWeight: 700,
            fontFamily: "'Manrope', sans-serif",
            letterSpacing: '0.06em', cursor: 'pointer',
            transform: btnHover ? 'scale(1.1) translateY(-3px)' : 'scale(1) translateY(0)',
            boxShadow: btnHover ? '0 10px 28px rgba(0,0,0,0.45)' : '0 4px 12px rgba(0,0,0,0.25)',
            transition: 'transform 0.18s cubic-bezier(.34,1.6,.5,1), box-shadow 0.18s ease',
          }}
        >Start</button>
      </div>

      {/* z:3 — face / eyes (in front of title text), breathes in sync */}
      <div ref={faceRef} style={outerStyle(3)}>
        <div style={breathStyle}>
          <svg width="100%" viewBox="0 0 325 331" fill="none">
            <rect x="158.348" y="116.244" width="5.49186" height="9.15309" fill="#FDF8EF" />
            <line x1="166.586" y1="129.974" x2="155.602" y2="129.974" stroke="#3BD424" strokeWidth="9.15309" />
            <path d={EYE} fill="#FDF8EF" />
            <mask id="ts-eye-l" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="63" y="70" width="63" height="31">
              <path d={EYE} fill="white" />
            </mask>
            <g mask="url(#ts-eye-l)">
              <circle cx={94.5741 + ox} cy={85.3432 + oy} r="17" fill="#1C1C2E" />
            </g>
            <path d={EYE_R} fill="#FDF8EF" />
            <mask id="ts-eye-r" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="198" y="70" width="64" height="31">
              <path d={EYE_R} fill="white" />
            </mask>
            <g mask="url(#ts-eye-r)">
              <circle cx={230.039 + ox} cy={85.3432 + oy} r="17" fill="#1C1C2E" />
            </g>
            <rect x="133.881" y="99.7687" width="54.0033" height="25.6287" rx="12.8143" fill="#3BD424" />
            <line x1="161.433" y1="123.285" x2="140.381" y2="142.507" stroke="#3BD424" strokeWidth="9.15309" />
            <line y1="-4.57655" x2="28.5072" y2="-4.57655" transform="matrix(0.738486 0.674269 0.674269 -0.738486 163.84 119.906)" stroke="#3BD424" strokeWidth="9.15309" />
          </svg>
        </div>
      </div>
    </div>
  )
}

// ─── TomaHead — inline SVG so irises can be driven by React state ────────────

function TomaHead({ irisOff, style, onMouseEnter }) {
  const ox = irisOff.x * (325 / 226)
  const oy = irisOff.y * (331 / 230)
  const EYE = "M63.1562 85.3432C63.1562 85.3432 63.1562 70.4788 94.5741 70.4788C125.992 70.4788 125.992 85.3432 125.992 85.3432C125.992 85.3432 125.992 100.208 94.5741 100.208C63.1562 100.208 63.1562 85.3432 63.1562 85.3432Z"
  const EYE_R = "M198.621 85.3432C198.621 85.3432 198.621 70.4788 230.039 70.4788C261.457 70.4788 261.457 85.3432 261.457 85.3432C261.457 85.3432 261.457 100.208 230.039 100.208C198.621 100.208 198.621 85.3432 198.621 85.3432Z"
  return (
    <svg width="100%" height="100%" viewBox="0 0 325 331" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', ...style }} onMouseEnter={onMouseEnter}>
      <path d="M322.183 170.001C323.757 173.831 324.319 177.661 323.87 181.491C323.42 185.321 322.295 188.926 320.496 192.306C318.697 195.685 317.347 199.177 316.448 202.782C315.548 206.387 315.211 210.217 315.435 214.272C315.66 218.328 314.873 222.045 313.074 225.425C311.275 228.804 308.688 231.733 305.315 234.212C301.941 236.69 300.142 240.069 299.917 244.35C299.692 248.631 297.893 251.785 294.519 253.813C291.145 255.841 288.671 258.657 287.097 262.262C285.523 265.866 284.173 269.697 283.049 273.752C281.924 277.807 278.775 279.835 273.602 279.835C268.429 279.835 264.269 280.849 261.12 282.877C257.971 284.904 255.497 287.721 253.698 291.326C251.899 294.93 248.862 296.733 244.589 296.733C240.316 296.733 237.055 298.31 234.805 301.464C232.556 304.618 229.52 306.533 225.697 307.209C221.873 307.885 218.724 310.138 216.25 313.968C213.776 317.799 210.628 319.826 206.804 320.052C202.981 320.277 199.27 320.84 195.671 321.741C192.073 322.643 188.474 323.656 184.876 324.783C181.277 325.909 177.678 327.487 174.08 329.514C170.481 331.542 166.77 330.19 162.947 325.459C159.123 320.727 155.3 320.277 151.477 324.107C147.653 327.937 144.055 328.162 140.681 324.783C137.307 321.403 133.821 319.376 130.223 318.7C126.624 318.024 123.363 316.447 120.439 313.968C117.515 311.49 114.366 309.688 110.993 308.561C107.619 307.435 103.796 307.322 99.5224 308.223C95.2492 309.124 92.1004 307.66 90.0762 303.83C88.052 300 84.6784 298.535 79.9553 299.436C75.2322 300.338 71.971 298.761 70.1717 294.705C68.3725 290.65 65.1113 288.735 60.3882 288.96C55.6651 289.185 52.6288 287.27 51.2794 283.215C49.9299 279.159 46.8936 276.794 42.1705 276.118C37.4474 275.442 35.3108 272.513 35.7606 267.331C36.2104 262.149 35.8731 257.756 34.7485 254.151C33.624 250.546 29.8005 248.631 23.2781 248.406C16.7558 248.18 15.0689 245.139 18.2177 239.281C21.3664 233.423 21.9287 229.03 19.9045 226.101C17.8803 223.172 14.7316 220.468 10.4583 217.99C6.18501 215.512 3.93592 212.357 3.71101 208.527C3.4861 204.697 4.16082 200.754 5.73519 196.699C7.30956 192.643 7.75938 188.926 7.08465 185.546C6.40992 182.167 5.06046 178.675 3.03628 175.07C1.01209 171.465 0.224909 167.86 0.674728 164.255C1.12455 160.651 1.12455 156.933 0.674728 153.103C0.224909 149.273 0 145.555 0 141.951C0 138.346 0 134.628 0 130.798C0 126.968 1.57437 123.476 4.7231 120.322C7.87183 117.167 9.89602 113.788 10.7957 110.183C11.6953 106.578 13.607 103.537 16.5308 101.058C19.4547 98.58 20.4668 94.9752 19.5671 90.2439C18.6675 85.5125 20.1294 82.2457 23.9529 80.4432C27.7763 78.6408 29.688 75.374 29.688 70.6426C29.688 65.9113 32.2745 63.433 37.4474 63.2077C42.6203 62.9824 45.8815 60.9547 47.231 57.1245C48.5804 53.2944 49.9299 49.3516 51.2794 45.2962C52.6288 41.2408 54.8779 38.0865 58.0266 35.8335C61.1754 33.5805 64.7739 32.2287 68.8223 31.7781C72.8707 31.3275 76.8066 30.8769 80.63 30.4263C84.4535 29.9757 87.9396 28.9618 91.0883 27.3847C94.2371 25.8076 97.1609 23.6672 99.8598 20.9636C102.559 18.26 105.145 14.6552 107.619 10.1491C110.093 5.6431 113.242 3.27743 117.065 3.05213C120.889 2.82683 124.825 2.71418 128.873 2.71418C132.921 2.71418 136.857 4.17864 140.681 7.10756C144.504 10.0365 148.215 10.825 151.814 9.47323C155.412 8.12142 159.123 5.75575 162.947 2.37623C166.77 -1.0033 170.369 -0.777995 173.743 3.05213C177.116 6.88226 180.715 8.34672 184.538 7.44552C188.362 6.54431 192.185 6.20636 196.009 6.43166C199.832 6.65696 203.768 6.31901 207.816 5.4178C211.865 4.51659 215.238 5.8684 217.937 9.47323C220.636 13.0781 224.01 15.2184 228.058 15.8943C232.107 16.5702 234.918 19.1612 236.492 23.6672C238.067 28.1733 240.653 30.9895 244.252 32.116C247.85 33.2426 251.786 34.0311 256.059 34.4817C260.333 34.9323 263.706 36.6221 266.18 39.551C268.654 42.4799 270.679 45.8594 272.253 49.6896C273.827 53.5197 276.976 55.7727 281.699 56.4486C286.422 57.1245 288.896 59.7155 289.121 64.2215C289.346 68.7276 291.82 71.7691 296.543 73.3462C301.266 74.9234 303.965 77.7396 304.64 81.7951C305.315 85.8505 305.989 89.7933 306.664 93.6234C307.339 97.4535 308.126 101.171 309.026 104.776C309.925 108.381 311.837 111.648 314.761 114.576C317.685 117.505 318.472 121.11 317.122 125.391C315.773 129.672 314.536 133.727 313.411 137.557C312.287 141.387 313.074 144.992 315.773 148.372C318.472 151.751 319.821 155.243 319.821 158.848C319.821 162.453 320.608 166.171 322.183 170.001Z" fill="#72FF5D" />
      <rect x="158.348" y="116.244" width="5.49186" height="9.15309" fill="#FDF8EF" />
      <line x1="166.586" y1="129.974" x2="155.602" y2="129.974" stroke="#3BD424" strokeWidth="9.15309" />
      {/* left eye */}
      <path d={EYE} fill="#FDF8EF" />
      <mask id="toma-eye-l" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="63" y="70" width="63" height="31">
        <path d={EYE} fill="white" />
      </mask>
      <g mask="url(#toma-eye-l)">
        <circle cx={94.5741 + ox} cy={85.3432 + oy} r="17" fill="#1C1C2E" />
      </g>
      {/* right eye */}
      <path d={EYE_R} fill="#FDF8EF" />
      <mask id="toma-eye-r" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="198" y="70" width="64" height="31">
        <path d={EYE_R} fill="white" />
      </mask>
      <g mask="url(#toma-eye-r)">
        <circle cx={230.039 + ox} cy={85.3432 + oy} r="17" fill="#1C1C2E" />
      </g>
      <rect x="133.881" y="99.7687" width="54.0033" height="25.6287" rx="12.8143" fill="#3BD424" />
      <line x1="161.433" y1="123.285" x2="140.381" y2="142.507" stroke="#3BD424" strokeWidth="9.15309" />
      <line y1="-4.57655" x2="28.5072" y2="-4.57655" transform="matrix(0.738486 0.674269 0.674269 -0.738486 163.84 119.906)" stroke="#3BD424" strokeWidth="9.15309" />
    </svg>
  )
}

// ─── Onboarding overlay ────────────────────────────────────────────────────────

function OnboardingOverlay({ onSubmit }) {
  const [name, setName] = useState('')
  const [shelfName, setShelfName] = useState('')
  const [loading, setLoading] = useState(false)
  const canSubmit = name.trim() && shelfName.trim() && !loading

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(25,36,61,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Manrope', sans-serif" }}>
      <div style={{ background: '#FDF8EF', borderRadius: 20, padding: '40px 36px', width: 360, boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#1C1C2E', marginBottom: 6 }}>Welcome to TOMA!</div>
        <div style={{ fontSize: 14, color: '#666680', marginBottom: 28 }}>Let's set up your bookshelf.</div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1C1C2E', marginBottom: 6 }}>Bookshelf name</div>
          <input value={shelfName} onChange={e => setShelfName(e.target.value)} placeholder="e.g. My Reading Nook"
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #C4C4D4', fontSize: 14, fontFamily: "'Manrope', sans-serif", color: '#1C1C2E', background: '#FDF8EF', outline: 'none' }} />
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1C1C2E', marginBottom: 6 }}>Your name</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Alex"
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #C4C4D4', fontSize: 14, fontFamily: "'Manrope', sans-serif", color: '#1C1C2E', background: '#FDF8EF', outline: 'none' }} />
        </div>

        <button
          disabled={!canSubmit}
          onClick={async () => {
            if (!canSubmit) return
            setLoading(true)
            await onSubmit(name.trim(), shelfName.trim())
          }}
          style={{ width: '100%', padding: '12px 0', background: canSubmit ? '#254CA4' : '#C4C4D4', color: '#FDF8EF', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'default', fontFamily: "'Manrope', sans-serif", transition: 'background 0.15s' }}
        >
          {loading ? 'Setting up your shelf…' : 'Create my shelf'}
        </button>
      </div>
    </div>
  )
}

// ─── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [showTitle, setShowTitle] = useState(true)
  const [revealing, setRevealing] = useState(false)
  const [hoveredId, setHoveredId] = useState(null)
  const [target, setTarget] = useState(null)
  const [displayTarget, setDisplayTarget] = useState(null)
  const [selected, setSelected] = useState(null)
  const [openPhase, setOpenPhase] = useState('closed')
  const [headDucking, setHeadDucking] = useState(false)
  const headDuckTimerRef = useRef(null)
  const descCacheRef = useRef({})
  const [scale, setScale] = useState(1)
  // armGRef removed — forearm SVG now lives inside stageRef and scrolls natively

  // Grab animation state
  const [grabPhase, setGrabPhase] = useState(null) // null|'extending'|'grabbing'|'retracting'|'done'
  const [grabbedBook, setGrabbedBook] = useState(null)
  const [fingerExtend, setFingerExtend] = useState(0) // 0..1
  const [retractMode, setRetractMode] = useState(0)   // 0..1 — shoulder blend during retraction

  // Used to position head below the top board so it can pop up when overlay closes
  const [closingToTopRow, setClosingToTopRow] = useState(false)
  // Temporarily enables top CSS transition for the pop-up animation, then clears itself
  const [applyTopTransition, setApplyTopTransition] = useState(false)

  // ── Shelf configs (dynamic) ────────────────────────────────────────────────
  const [shelfConfigs, setShelfConfigs] = useState([])
  const [editingShelfIdx, setEditingShelfIdx] = useState(null)

  function saveShelf(idx, newLabel, newColorKey) {
    setShelfConfigs(prev => prev.map((c, i) => i === idx ? { ...c, label: newLabel, colorKey: newColorKey } : c))
    setEditingShelfIdx(null)
  }
  function deleteShelf(idx) {
    setShelfConfigs(prev => prev.filter((_, i) => i !== idx))
    setShelfContents(prev => prev.filter((_, i) => i !== idx))
    setEditingShelfIdx(null)
  }
  const [showAddShelfModal, setShowAddShelfModal] = useState(false)
  let nextShelfId = useRef(SHELVES.length)
  function addShelf(label = 'New Shelf', colorKey = 'yellow') {
    const id = `shelf_${nextShelfId.current++}`
    setShelfConfigs(prev => [...prev, { id, label, colorKey, items: [] }])
    setShelfContents(prev => [...prev, []])
  }

  // ── DB / persistence ───────────────────────────────────────────────────────
  const [userId, setUserId]                 = useState(null)
  const [shelfName, setShelfName]           = useState('My Shelf')
  const [shareId, setShareId]               = useState(null)
  const [isViewOnly, setIsViewOnly]         = useState(false)
  const [isDbLoaded, setIsDbLoaded]         = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [bookcaseRevealed, setBookcaseRevealed] = useState(false)
  const [poofActive, setPoofActive]             = useState(false)
  const [headIntroTop, setHeadIntroTop]         = useState(null)
  const [headIntroLeft, setHeadIntroLeft]       = useState(null)
  const [username, setUsername]             = useState('')
  const [showPlateEdit, setShowPlateEdit]   = useState(false)
  const [saveStatus, setSaveStatus]         = useState('')  // 'saving' | 'saved' | ''
  const [irisOff, setIrisOff]               = useState({ x: 0, y: 0 })
  const headRef = useRef(null)
  const deleteBtnRef = useRef(null)
  const [deleteBtnRect, setDeleteBtnRect] = useState(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [linkCopied, setLinkCopied]         = useState(false)
  const [headerVisible, setHeaderVisible]   = useState(true)
  const [viewerHasOwnShelf, setViewerHasOwnShelf] = useState(false)
  const [inventory, setInventory]           = useState([])
  const [viewerUserId, setViewerUserId]     = useState(null)
  const lastScrollY = useRef(0)
  const reviewsRef   = useRef(new Map())
  const saveTimerRef = useRef(null)

  // ── Edit mode ──────────────────────────────────────────────────────────────
  const [isEditMode, setIsEditMode] = useState(false)
  const [shelfContents, setShelfContents] = useState([])
  const [editDragging, setEditDragging] = useState(null)
  // editDragging = { type, slotWidth, book?, books?, sourceItemId? }
  const [editDragStagePos, setEditDragStagePos] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)
  const [showBookPanel, setShowBookPanel] = useState(false)
  const [showDecorPanel, setShowDecorPanel] = useState(false)
  const [stackBooks, setStackBooks] = useState([])
  const shelfInnerRefs = useRef([])
  const ghostRef = useRef(null)
  const editDraggingRef = useRef(null)
  const isEditModeRef = useRef(false)
  const shelfContentsRef = useRef([])
  const dropTargetRef = useRef(null)
  const nextItemId = useRef(1)
  editDraggingRef.current = editDragging
  shelfContentsRef.current = shelfContents
  dropTargetRef.current = dropTarget

  const stageRef = useRef(null)
  const containerRef = useRef(null)
  const closeTimer = useRef(null)
  const retractRef = useRef(null)
  const displayTargetRef = useRef(null)
  const introBlockRef    = useRef(false)
  const leaveTimerRef = useRef(null)
  const grabRafRef = useRef(null)
  const grabPhaseRef = useRef(null) // mirrors grabPhase for use in event listener closures
  const fingerExtendRef = useRef(0)
  const [editGripExtend, setEditGripExtend] = useState(0)
  const editGripExtendRef = useRef(0)
  const editGripRafRef = useRef(null)
  const editDragReleaseTimer = useRef(null)
  const [dragRotated, setDragRotated] = useState(false)
  const dragRotatedRef = useRef(false)
  const [dragOverDelete, setDragOverDelete] = useState(false)
  const dragOverDeleteRef = useRef(false)
  const deleteConfirmedRef = useRef(false)
  const rotateDelayTimer = useRef(null)
  const rotateCooldownUntil = useRef(0)
  const [rotateAnimKey, setRotateAnimKey] = useState(0)
  const retractModeRef = useRef(0)
  const lastMousePosRef = useRef(null)    // last known cursor in stage-local coords
  const viewportMouseRef = useRef(null)   // last known cursor in raw viewport coords
  const [hoveredShelfIdx, setHoveredShelfIdx] = useState(null)

  useEffect(() => {
    SHELVES.flatMap(s => s.items).forEach(item => {
      if (item.thumbnail) { const img = new Image(); img.src = item.thumbnail }
    })
  }, [])

  useEffect(() => {
    function updateScale() {
      // Use the container's actual clientWidth so a vertical scrollbar doesn't shift centering
      const w = containerRef.current ? containerRef.current.clientWidth : window.innerWidth
      setScale(Math.max(0.45, Math.min(2.5, w / 1080)))
    }
    updateScale()
    // Also update when scrollbar appears/disappears (content height changes)
    const ro = typeof ResizeObserver !== 'undefined' && containerRef.current
      ? new ResizeObserver(updateScale)
      : null
    if (ro && containerRef.current) ro.observe(containerRef.current)
    window.addEventListener('resize', updateScale)
    return () => { window.removeEventListener('resize', updateScale); ro?.disconnect() }
  }, [])

  // ── DB: load on mount, auto-save on changes ───────────────────────────────
  useEffect(() => {
    const urlShareId = new URLSearchParams(window.location.search).get('shelf')
    if (urlShareId) {
      loadShelfByShareId(urlShareId).then(async result => {
        if (!result) return
        setIsViewOnly(true)
        setShelfName(result.name)
        const { shelfConfigs: cfgs, shelfContents: cnts } = reconstructShelf(result)
        setShelfConfigs(cfgs)
        setShelfContents(cnts)
        reviewsRef.current = await loadReviews(result.ownerUserId)
        const ownerName = await getUsername(result.ownerUserId)
        setUsername(ownerName ?? '')
        setIsDbLoaded(true)
        // background: check if viewer has their own shelf + store their userId
        getMyIp().then(async ip => {
          const uid = await getOrCreateUser(ip)
          setViewerUserId(uid)
          const sid = await getShareId(uid)
          if (sid) setViewerHasOwnShelf(true)
        })
      })
    } else {
      getMyIp().then(async ip => {
        const uid = await getOrCreateUser(ip)
        const shelf = await loadShelfByUserId(uid)
        const isNewUser = !shelf || shelf.rows.length === 0
        if (!isNewUser) {
          setShelfName(shelf.name)
          setShareId(shelf.shareId)
          const { shelfConfigs: cfgs, shelfContents: cnts } = reconstructShelf(shelf)
          setShelfConfigs(cfgs)
          setShelfContents(cnts)
        }
        reviewsRef.current = await loadReviews(uid)
        const uname = await getUsername(uid)
        const inv = await loadInventory(uid)
        // batch all final state together so auto-save never fires before isDbLoaded
        setIsDbLoaded(true)
        setUserId(uid)
        setUsername(uname ?? '')
        setInventory(inv)
        if (isNewUser) setShowOnboarding(true)
      })
    }
  }, [])

  async function handleOnboardingSubmit(displayName, newShelfName) {
    setShelfName(newShelfName)
    setUsername(displayName)
    await saveUsername(userId, displayName)
    const { configs, contents } = await fetchDefaultShelfData()
    setShelfConfigs(configs)
    setShelfContents(contents)
    await persistShelf(userId, newShelfName, configs, contents)
    setShowOnboarding(false)
  }

  async function handlePlateSave(newShelfName, newUsername) {
    setShelfName(newShelfName)
    setUsername(newUsername)
    if (userId) await saveUsername(userId, newUsername)
    setShowPlateEdit(false)
  }

  useEffect(() => {
    if (!userId || isViewOnly || !isDbLoaded || showOnboarding) return
    clearTimeout(saveTimerRef.current)
    setSaveStatus('saving')
    saveTimerRef.current = setTimeout(async () => {
      await persistShelf(userId, shelfName, shelfConfigs, shelfContents)
      if (!shareId) setShareId(await getShareId(userId))
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(''), 2000)
    }, 2000)
  }, [shelfConfigs, shelfContents, shelfName, userId, isDbLoaded, showOnboarding]) // eslint-disable-line

  // Intro reveal sequence:
  //   0–565ms   : smoke only — arm follows cursor freely throughout
  //   565–1130ms: bookcase appears under smoke; head parked below shelf, arm tracks cursor
  //   1130–1950ms: smoke off; head rises from below to top-of-shelf position, arm free
  //   1950ms    : headIntroTop released, normal formula takes over
  useEffect(() => {
    if (!isDbLoaded || showOnboarding || bookcaseRevealed) return

    window.scrollTo({ top: 0, behavior: 'instant' })
    document.body.style.overflow = 'hidden'

    const startBelow = bookcaseBottom + 100

    setPoofActive(true)

    let emergeRaf = null

    // t=565ms: reveal bookcase under smoke; head parked below shelf at top-of-shelf X (580)
    const tReveal = setTimeout(() => {
      setBookcaseRevealed(true)
      setHeadIntroTop(startBelow)
      setHeadIntroLeft(580)   // lock X to top-of-shelf position regardless of cursor
    }, 565)

    const t1 = setTimeout(() => {
      // Smoke clears — head rises from below to top-of-shelf position
      setPoofActive(false)

      const headEndTop = 108  // topBlend=1 resting headTop
      const dur        = 820

      let t0 = null
      function frameEmerge(ts) {
        if (!t0) t0 = ts
        const p  = Math.min(1, (ts - t0) / dur)
        const ep = 1 - Math.pow(1 - p, 3)  // ease-out cubic
        setHeadIntroTop(Math.round(startBelow + (headEndTop - startBelow) * ep))
        if (p < 1) {
          emergeRaf = requestAnimationFrame(frameEmerge)
        } else {
          emergeRaf = null
          setHeadIntroTop(null)
          setHeadIntroLeft(null)
          document.body.style.overflow = ''
        }
      }
      emergeRaf = requestAnimationFrame(frameEmerge)
    }, 1130)

    return () => {
      clearTimeout(tReveal)
      clearTimeout(t1)
      if (emergeRaf) cancelAnimationFrame(emergeRaf)
      setHeadIntroTop(null)
      setHeadIntroLeft(null)
      document.body.style.overflow = ''
    }
  }, [isDbLoaded, showOnboarding]) // eslint-disable-line

  // Header hide/show: requires 80px scroll movement to toggle, cursor within 70px of top reveals it,
  // hides after 3s of mouse inactivity away from top
  useEffect(() => {
    let anchor = 0
    const THRESHOLD = 80
    let idleTimer = null

    const scheduleHide = () => {
      clearTimeout(idleTimer)
      idleTimer = setTimeout(() => {
        if (window.scrollY > 10) setHeaderVisible(false)
      }, 3000)
    }

    const onScroll = () => {
      const y = window.scrollY
      if (y <= 10) {
        setHeaderVisible(true)
        clearTimeout(idleTimer)
        anchor = y
        return
      }
      const delta = y - anchor
      if (delta > THRESHOLD) {
        setHeaderVisible(false)
        clearTimeout(idleTimer)
        anchor = y
      } else if (delta < -THRESHOLD) {
        setHeaderVisible(true)
        scheduleHide()
        anchor = y
      }
    }

    const onMouseMove = (e) => {
      if (e.clientY < 70) {
        setHeaderVisible(true)
        clearTimeout(idleTimer)
      } else {
        scheduleHide()
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('mousemove', onMouseMove)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMouseMove)
      clearTimeout(idleTimer)
    }
  }, [])

  // On scroll, re-derive displayTarget from the stored viewport cursor position so the
  // arm keeps pointing at the correct stage-local spot without waiting for a mousemove.
  useEffect(() => {
    let scrollRaf = null
    function onScroll() {
      if (scrollRaf) return
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = null
        if (introBlockRef.current) return
        const sr = stageRef.current?.getBoundingClientRect()
        const vm = viewportMouseRef.current
        if (!sr || !vm) return
        const sc = sr.width / 1080
        const newPos = { x: (vm.x - sr.left) / sc, y: (vm.y - sr.top) / sc }
        lastMousePosRef.current = newPos
        displayTargetRef.current = newPos
        setDisplayTarget(newPos)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => () => {
    clearTimeout(closeTimer.current)
    clearTimeout(leaveTimerRef.current)
    cancelAnimationFrame(retractRef.current)
    cancelAnimationFrame(grabRafRef.current)
  }, [])

  // Auto-clear the temporary top transition after the pop-up animation completes
  useEffect(() => {
    if (!applyTopTransition) return
    const t = setTimeout(() => setApplyTopTransition(false), 450)
    return () => clearTimeout(t)
  }, [applyTopTransition])

  const handleMove = useCallback((e) => {
    if (selected) return
    if (grabPhaseRef.current) return
    if (isEditMode) return
    clearTimeout(leaveTimerRef.current)
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect) return
    setTarget({ x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale })
  }, [selected, scale, isEditMode])

  const handleLeave = useCallback(() => {
    if (selected) return
    if (grabPhaseRef.current) return
    if (isEditMode) return
    clearTimeout(leaveTimerRef.current)
    setTarget(null)
    setHoveredId(null)
  }, [selected])

  // Track cursor globally — RAF-throttled so React re-renders at most once per frame
  useEffect(() => {
    let rafId = null
    function onWindowMove(e) {
      const rect = stageRef.current?.getBoundingClientRect()
      if (!rect) return
      viewportMouseRef.current = { x: e.clientX, y: e.clientY }
      const t = { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale }
      lastMousePosRef.current = t  // always track, even during overlay
      if (selected) return
      if (grabPhaseRef.current) return // frozen during grab animation
      if (introBlockRef.current) return // frozen during intro animation
      cancelAnimationFrame(retractRef.current)
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        const pos = lastMousePosRef.current
        displayTargetRef.current = pos
        setDisplayTarget(pos)
      })
    }
    window.addEventListener('mousemove', onWindowMove)
    return () => { window.removeEventListener('mousemove', onWindowMove); if (rafId) cancelAnimationFrame(rafId) }
  }, [selected, scale])

  const handleEnter = useCallback((b) => {
    if (selected) return
    if (grabPhaseRef.current) return
    setHoveredId(b.id)
  }, [selected])

  const handleLeaveBook = useCallback((b) => {
    if (selected) return
    if (grabPhaseRef.current) return
    setHoveredId(id => id === b.id ? null : id)
  }, [selected])

  const handleClickRef = useRef(null)
  const handleClick = useCallback((b) => {
    if (grabPhaseRef.current) return

    // Start prefetching immediately — gives the full grab+overlay animation (~1.4s) as head start
    if (b?.id?.startsWith('OL') && !b.description && !descCacheRef.current[b.id]) {
      descCacheRef.current[b.id] = fetch(`https://openlibrary.org/works/${b.id}.json`)
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
    }

    // Freeze arm at current position
    grabPhaseRef.current = 'extending'
    setGrabPhase('extending')
    setGrabbedBook(b)
    setHoveredId(null)
    cancelAnimationFrame(retractRef.current)
    cancelAnimationFrame(grabRafRef.current)

    const EXTEND_DUR = 350
    const GRAB_HOLD  = 150
    const RETRACT_DUR = 420

    let start = null
    function extendLoop(ts) {
      if (!start) start = ts
      const p = Math.min((ts - start) / EXTEND_DUR, 1)
      // ease-in-out cubic
      const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
      fingerExtendRef.current = ease
      setFingerExtend(ease)
      if (p < 1) { grabRafRef.current = requestAnimationFrame(extendLoop); return }

      // Fingers fully extended — book appears in hand, brief hold
      grabPhaseRef.current = 'grabbing'
      setGrabPhase('grabbing')

      let holdStart = null
      function holdLoop(ts2) {
        if (!holdStart) holdStart = ts2
        if (ts2 - holdStart < GRAB_HOLD) { grabRafRef.current = requestAnimationFrame(holdLoop); return }

        // Retract arm + book to the right — target x=720 ensures hand and book
        // both clear the shelf right edge (702) before z-index drops.
        // retractMode drives the shoulder blend in computeArm (arm flattens to horizontal).
        grabPhaseRef.current = 'retracting'
        setGrabPhase('retracting')

        const from = displayTargetRef.current ? { ...displayTargetRef.current } : { x: 340, y: 500 }
        const toX = 820  // must clear shelf right edge (171+624=795) before z-index drops
        let retStart = null
        function retractLoop(ts3) {
          if (!retStart) retStart = ts3
          const rp = Math.min((ts3 - retStart) / RETRACT_DUR, 1)
          const rease = 1 - (1 - rp) * (1 - rp) // ease-out quad
          const next = { x: from.x + (toX - from.x) * rease, y: from.y }
          displayTargetRef.current = next
          setDisplayTarget(next)
          // shoulder slides to horizontal in lock-step with the retraction
          retractModeRef.current = rease
          setRetractMode(rease)
          // fingers close as arm retracts
          fingerExtendRef.current = 1 - rease
          setFingerExtend(1 - rease)
          if (rp < 1) { grabRafRef.current = requestAnimationFrame(retractLoop); return }

          // Arm cleared shelf — forearm drops to z=1 (shelf covers on return), then swing back left
          grabPhaseRef.current = 'returning'
          setGrabPhase('returning')

          const retractedX = displayTargetRef.current.x // ~720
          const returnToX  = 340 // centre of shelf
          const RETURN_DUR = 380
          let returnStart = null
          function returnLoop(ts4) {
            if (!returnStart) returnStart = ts4
            const rp2 = Math.min((ts4 - returnStart) / RETURN_DUR, 1)
            const ease2 = rp2 < 0.5 ? 2 * rp2 * rp2 : 1 - Math.pow(-2 * rp2 + 2, 2) / 2
            const retX = retractedX + (returnToX - retractedX) * ease2
            displayTargetRef.current = { x: retX, y: from.y }
            setDisplayTarget({ x: retX, y: from.y })
            retractModeRef.current = 1 - ease2   // shoulder un-flattens as arm swings back
            setRetractMode(1 - ease2)
            if (rp2 < 1) { grabRafRef.current = requestAnimationFrame(returnLoop); return }

            // Arm back behind shelf — pause 200ms then open overlay
            grabPhaseRef.current = 'done'
            setGrabPhase('done')
            setTimeout(() => {
              grabPhaseRef.current = null
              fingerExtendRef.current = 0
              retractModeRef.current = 0
              setGrabPhase(null)
              setGrabbedBook(null)
              setFingerExtend(0)
              setRetractMode(0)
              displayTargetRef.current = null
              setDisplayTarget(null)

              clearTimeout(closeTimer.current)
              setSelected(b)
              setOpenPhase('closed')
              requestAnimationFrame(() => requestAnimationFrame(() => setOpenPhase('open')))
            }, 200)
          }
          grabRafRef.current = requestAnimationFrame(returnLoop)
        }
        grabRafRef.current = requestAnimationFrame(retractLoop)
      }
      grabRafRef.current = requestAnimationFrame(holdLoop)
    }
    grabRafRef.current = requestAnimationFrame(extendLoop)
  }, [])
  handleClickRef.current = handleClick

  const handleClose = useCallback(() => {
    setOpenPhase('closing')
    clearTimeout(closeTimer.current)
    const pos = lastMousePosRef.current
    const toTop = pos ? computeArm(pos).elbowY < 390 : false
    if (toTop) setClosingToTopRow(true)
    closeTimer.current = setTimeout(() => {
      setSelected(null)
      setHoveredId(null)
      setOpenPhase('closed')
      setClosingToTopRow(false)
      // When cursor is in top area, briefly enable top transition so head springs up from below
      if (toTop) setApplyTopTransition(true)
      // Pop arm back to current cursor position so creature reappears immediately
      if (pos) {
        displayTargetRef.current = pos
        setDisplayTarget(pos)
      }
    }, 480)
  }, [])

  // ── Edit mode handlers ───────────────────────────────────────────────────────

  function enterEditMode() {
    isEditModeRef.current = true
    setIsEditMode(true)
    setHoveredId(null)
  }

  function exitEditMode() {
    isEditModeRef.current = false
    setIsEditMode(false)
    setEditDragging(null)
    setDropTarget(null)
    setShowBookPanel(false)
    setShowDecorPanel(false)
    setStackBooks([])
    if (editDragReleaseTimer.current) { clearTimeout(editDragReleaseTimer.current); editDragReleaseTimer.current = null }
    setEditDragStagePos(null)
  }

  // Track cursor Y globally in edit mode to show the correct shelf's edit button
  useEffect(() => {
    if (!isEditMode) { setHoveredShelfIdx(null); return }
    const numShelves = shelfContents.length
    function onGlobalMove(e) {
      const sr = stageRef.current?.getBoundingClientRect()
      if (!sr) return
      const sc = sr.width / 1080
      const stageY = (e.clientY - sr.top) / sc
      // Each shelf row occupies 188px starting at y=196 (top board bottom)
      const idx = Math.floor((stageY - 196) / 188)
      setHoveredShelfIdx(idx >= 0 && idx < numShelves ? idx : null)
    }
    window.addEventListener('mousemove', onGlobalMove)
    return () => window.removeEventListener('mousemove', onGlobalMove)
  }, [isEditMode, shelfContents.length])

  // Iris tracking — move eyes toward mouse cursor
  useEffect(() => {
    const MAX = 7
    function onMove(e) {
      const head = headRef.current
      if (!head) return
      const r = head.getBoundingClientRect()
      const scale = r.width / 226
      const cx = r.left + 112 * scale
      const cy = r.top + 61 * scale
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist === 0) return
      const t = Math.min(dist, 100) / 100
      setIrisOff({ x: (dx / dist) * t * MAX, y: (dy / dist) * t * MAX })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // Cache delete button position when drag starts (for donate bin placement)
  useEffect(() => {
    if (editDragging && deleteBtnRef.current) {
      setDeleteBtnRect(deleteBtnRef.current.getBoundingClientRect())
    }
  }, [!!editDragging])

  // ── Book panel handlers ───────────────────────────────────────────────────────
  function handleToggleBookInPanel(book) {
    setStackBooks(prev =>
      prev.some(b => b.id === book.id)
        ? prev.filter(b => b.id !== book.id)
        : prev.length < 5 ? [...prev, book] : prev
    )
  }

  function handleBookPanelConfirm() {
    if (stackBooks.length === 0) return
    setShowBookPanel(false)
    if (stackBooks.length === 1) {
      startEditDrag({ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 },
        { type: 'vertical-book', slotWidth: 1, book: stackBooks[0] })
    } else {
      startEditDrag({ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 },
        { type: 'horizontal-stack', slotWidth: 5, books: stackBooks })
    }
    setStackBooks([])
  }

  function handleDecorSelect(type) {
    setShowDecorPanel(false)
    startEditDrag({ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 },
      { type, slotWidth: 2 })
  }

  function startEditDrag(e, info) {
    if (editDragReleaseTimer.current) { clearTimeout(editDragReleaseTimer.current); editDragReleaseTimer.current = null }
    dragRotatedRef.current = false; setDragRotated(false)
    dragOverDeleteRef.current = false; setDragOverDelete(false)
    deleteConfirmedRef.current = false
    if (rotateDelayTimer.current) { clearTimeout(rotateDelayTimer.current); rotateDelayTimer.current = null }
    rotateCooldownUntil.current = 0
    setEditDragging(info)
    if (ghostRef.current) {
      ghostRef.current.style.left = e.clientX + 'px'
      ghostRef.current.style.top  = e.clientY + 'px'
    }
  }

  // Global mousemove while edit-dragging: update ghost + compute drop target
  useEffect(() => {
    if (!editDragging) return
    function onMove(e) {
      if (ghostRef.current) {
        const sr = stageRef.current?.getBoundingClientRect()
        const sc = sr ? sr.width / 1080 : 1
        // Clamp ghost to arm's reachable area: right=786, top=196, bottom=bookcase floor
        const bookcaseFloor = 196 + shelfContentsRef.current.length * 188
        const gx = sr ? Math.min(e.clientX, sr.left + 786 * sc) : e.clientX
        const gy = sr ? Math.max(sr.top + 196 * sc, Math.min(e.clientY, sr.top + bookcaseFloor * sc)) : e.clientY
        ghostRef.current.style.left = gx + 'px'
        ghostRef.current.style.top  = gy + 'px'
      }
      const drag = editDraggingRef.current
      const sw       = drag?.slotWidth ?? 1
      const excl     = drag?.sourceItemId ?? null
      const dragType = drag?.type

      // Compute drop target for a shelf rect, clamping clientX into rect bounds
      const shelfDrop = (rect, shelfIdx, clientX) => {
        const x = Math.max(rect.left, Math.min(rect.right - 1, clientX))
        const slotPx = rect.width / NUM_SLOTS
        const centre = Math.floor((x - rect.left) / slotPx)
        const shelf = shelfContentsRef.current[shelfIdx]
        const isRotatedBook = dragType === 'vertical-book' && dragRotatedRef.current

        // Branch B — horizontal-stack rotated back to individual vertical books
        if (dragType === 'horizontal-stack' && dragRotatedRef.current) {
          const eSw = drag.books?.length ?? 1
          // Merge into existing stack if it has room for all incoming books
          const cursorStack = shelf.find(it =>
            it.type === 'horizontal-stack' && it.id !== excl &&
            centre >= it.startSlot && centre < it.startSlot + it.slotWidth &&
            (it.books?.length ?? 0) + eSw <= 5
          )
          if (cursorStack) return { shelfIdx, mergeStackId: cursorStack.id, valid: true }
          const zone = findFreeZone(shelf, centre, eSw, excl)
          const snapSlot = zone.length >= eSw
            ? Math.max(zone.start, Math.min(zone.start + zone.length - eSw, centre - Math.floor(eSw / 2)))
            : Math.max(0, Math.min(NUM_SLOTS - eSw, centre - Math.floor(eSw / 2)))
          return { shelfIdx, startSlot: snapSlot, valid: zone.length >= eSw, convertToVertical: true }
        }

        // Branch A — horizontal-stack or single vertical book laid flat (same rules)
        if (dragType === 'horizontal-stack' || isRotatedBook) {
          const count = isRotatedBook ? 1 : (drag.books?.length ?? 1)
          // Merge into existing stack first
          const cursorStack = shelf.find(it =>
            it.type === 'horizontal-stack' && it.id !== excl &&
            centre >= it.startSlot && centre < it.startSlot + it.slotWidth &&
            (it.books?.length ?? 0) + count <= 5
          )
          if (cursorStack) return { shelfIdx, mergeStackId: cursorStack.id, valid: true }
          // Try 5-slot horizontal placement
          const zone5 = findFreeZone(shelf, centre, 5, excl)
          if (zone5.length >= 5) {
            const hSlot = Math.max(zone5.start, Math.min(zone5.start + zone5.length - 5, centre - 2))
            return { shelfIdx, startSlot: hSlot, valid: true, ...(isRotatedBook ? { rotateToHorizontal: true } : {}) }
          }
          // Fallback: if cursor is beside an occupied slot and an N-wide gap is adjacent, place books vertically
          if (!isRotatedBook && count >= 1 && count < 5 && slotsOverlap(shelf, centre, 1, excl)) {
            const zoneN = findFreeZone(shelf, centre, count, excl)
            if (zoneN.length >= count) {
              const vSlot = Math.max(zoneN.start, Math.min(zoneN.start + zoneN.length - count, centre - Math.floor(count / 2)))
              return { shelfIdx, startSlot: vSlot, valid: true, convertToVertical: true }
            }
          }
          // No valid placement — show cursor-centred 5-slot position in red
          const hSlot = Math.max(0, Math.min(NUM_SLOTS - 5, centre - 2))
          return { shelfIdx, startSlot: hSlot, valid: false, ...(isRotatedBook ? { rotateToHorizontal: true } : {}) }
        }

        // Branch C — vertical book + decorative items
        if (dragType === 'vertical-book') {
          // Merge into an existing horizontal stack
          const cursorStack = shelf.find(it =>
            it.type === 'horizontal-stack' && it.id !== excl &&
            centre >= it.startSlot && centre < it.startSlot + it.slotWidth &&
            (it.books?.length ?? 0) < 5
          )
          if (cursorStack) return { shelfIdx, mergeStackId: cursorStack.id, valid: true }
        }
        const zone = findFreeZone(shelf, centre, sw, excl)
        const snapSlot = zone.length >= sw
          ? Math.max(zone.start, Math.min(zone.start + zone.length - sw, centre - Math.floor(sw / 2)))
          : Math.max(0, Math.min(NUM_SLOTS - sw, centre - Math.floor(sw / 2)))
        return { shelfIdx, startSlot: snapSlot, valid: zone.length >= sw }
      }

      // Exact hit
      let found = null
      shelfInnerRefs.current.forEach((el, shelfIdx) => {
        if (!el) return
        const rect = el.getBoundingClientRect()
        if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return
        found = shelfDrop(rect, shelfIdx, e.clientX)
      })

      // Fallback: snap to nearest shelf when cursor is over borders/boards
      if (!found) {
        let bestIdx = -1, bestRect = null, bestDy = Infinity
        shelfInnerRefs.current.forEach((el, shelfIdx) => {
          if (!el) return
          const rect = el.getBoundingClientRect()
          if (e.clientX < rect.left - 20 || e.clientX > rect.right + 20) return
          const dy = Math.max(0, rect.top - e.clientY, e.clientY - rect.bottom)
          if (dy < bestDy) { bestDy = dy; bestIdx = shelfIdx; bestRect = rect }
        })
        if (bestRect && bestDy < 50) found = shelfDrop(bestRect, bestIdx, e.clientX)
      }

      setDropTarget(found)

      // Drive the real Sprout arm to the cursor for book/stack drags
      if (dragType === 'vertical-book' || dragType === 'horizontal-stack') {
        const sr = stageRef.current?.getBoundingClientRect()
        if (sr) {
          const s = sr.width / 1080
          const pos = { x: (e.clientX - sr.left) / s, y: (e.clientY - sr.top) / s }
          displayTargetRef.current = pos
          setDisplayTarget(pos)
          setEditDragStagePos(pos)
        }
      }
    }
    function onUp(e) {
      // Delay clearing editDragStagePos so the arm lingers while the grip-release animation plays (220ms)
      if (editDragReleaseTimer.current) clearTimeout(editDragReleaseTimer.current)
      editDragReleaseTimer.current = setTimeout(() => {
        setEditDragStagePos(null)
        editDragReleaseTimer.current = null
      }, 260)
      const drag = editDraggingRef.current
      if (!drag) return
      // Delete: only if mouse was released directly on the delete zone button
      if (deleteConfirmedRef.current) {
        deleteConfirmedRef.current = false
        dragOverDeleteRef.current = false; setDragOverDelete(false)
        setDropTarget(null)
        setEditDragging(null)
        return
      }
      const dt = dropTargetRef.current
      if (dt && dt.valid) {
        if (dt.rotateToHorizontal) {
          setShelfContents(sc => {
            const updated = sc.map(r => [...r])
            updated[dt.shelfIdx] = [...updated[dt.shelfIdx], {
              id: `si-${nextItemId.current++}`,
              type: 'horizontal-stack', slotWidth: 5,
              startSlot: dt.startSlot, books: [drag.book],
            }].sort((a, b) => a.startSlot - b.startSlot)
            return updated
          })
        } else if (dt.mergeStackId) {
          // Drop book/stack onto an existing stack → merge books
          const incomingBooks = drag.type === 'vertical-book'
            ? [drag.book]
            : (drag.books || [])
          setShelfContents(sc => {
            const updated = sc.map(r => [...r])
            const row = [...updated[dt.shelfIdx]]
            const idx = row.findIndex(it => it.id === dt.mergeStackId)
            if (idx !== -1) {
              const stack = row[idx]
              row[idx] = { ...stack, books: [...(stack.books || []), ...incomingBooks] }
              updated[dt.shelfIdx] = row
            }
            return updated
          })
        } else if (dt.convertToVertical) {
          // Horizontal stack that didn't fit: place each book as its own vertical book
          const books = drag.books || (drag.book ? [drag.book] : [])
          setShelfContents(sc => {
            const updated = sc.map(r => [...r])
            const newItems = books.map((book, i) => ({
              id: `si-${nextItemId.current++}`,
              type: 'vertical-book', slotWidth: 1,
              startSlot: dt.startSlot + i, book,
            }))
            updated[dt.shelfIdx] = [...updated[dt.shelfIdx], ...newItems].sort((a, b) => a.startSlot - b.startSlot)
            return updated
          })
        } else {
          const newItem = {
            id: `si-${nextItemId.current++}`,
            type: drag.type, slotWidth: drag.type === 'horizontal-stack' ? 5 : drag.slotWidth,
            startSlot: dt.startSlot,
            ...(drag.book  ? { book: drag.book }   : {}),
            ...(drag.books ? { books: drag.books } : {}),
          }
          setShelfContents(sc => {
            const updated = sc.map(r => [...r])
            updated[dt.shelfIdx] = [...updated[dt.shelfIdx], newItem].sort((a, b) => a.startSlot - b.startSlot)
            return updated
          })
        }
        // If item came from inventory, remove it now that it's placed
        if (drag.sourceInventoryId && userId) {
          removeInventoryItem(userId, drag.sourceInventoryId)
          setInventory(prev => prev.filter(i => i.id !== drag.sourceInventoryId))
        }
      } else if (drag.sourceItem == null && !drag.sourceInventoryId) {
        // Came from add panel, dropped off shelf → send to inventory
        if (drag.type === 'vertical-book' && drag.book && userId) {
          addInventoryBook(userId, drag.book).then(invId =>
            setInventory(prev => [...prev, { id: invId, type: 'book', book: drag.book }])
          )
        } else if (drag.type === 'horizontal-stack' && drag.books?.length && userId) {
          addInventoryStack(userId, drag.books).then(invId =>
            setInventory(prev => [...prev, { id: invId, type: 'stack', books: drag.books }])
          )
        } else if (drag.type !== 'vertical-book' && drag.type !== 'horizontal-stack' && userId) {
          addInventoryDecor(userId, drag.type).then(invId =>
            setInventory(prev => [...prev, { id: invId, type: 'decor', decorType: drag.type }])
          )
        }
      } else if (drag.sourceItem != null) {
        // Invalid or out-of-bounds drop: restore item to its original shelf position
        const { sourceItem, sourceShelfIdx, sourceRemainingId } = drag
        setShelfContents(sc => {
          const updated = sc.map(r => [...r])
          if (sourceRemainingId) {
            updated[sourceShelfIdx] = updated[sourceShelfIdx].filter(it => it.id !== sourceRemainingId)
          }
          updated[sourceShelfIdx] = [...updated[sourceShelfIdx], sourceItem].sort((a, b) => a.startSlot - b.startSlot)
          return updated
        })
      }
      setDropTarget(null)
      setEditDragging(null)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup',   onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup',   onUp)
    }
  }, [editDragging])

  // Pick up a placed shelf item (removes it, starts drag)
  function _startPlacedItemDrag(e, shelfIdx, item) {
    dragRotatedRef.current = false; setDragRotated(false)
    dragOverDeleteRef.current = false; setDragOverDelete(false)
    deleteConfirmedRef.current = false
    if (rotateDelayTimer.current) { clearTimeout(rotateDelayTimer.current); rotateDelayTimer.current = null }
    rotateCooldownUntil.current = 0
    setShelfContents(sc => {
      const updated = sc.map(r => [...r])
      updated[shelfIdx] = updated[shelfIdx].filter(it => it.id !== item.id)
      return updated
    })
    const drag = { type: item.type, slotWidth: item.slotWidth, sourceItemId: item.id,
      sourceItem: item, sourceShelfIdx: shelfIdx,
      ...(item.book  ? { book: item.book }   : {}),
      ...(item.books ? { books: item.books } : {}),
    }
    setEditDragging(drag)
    // Set arm position immediately so it appears at the cursor from frame 1.
    const sr = stageRef.current?.getBoundingClientRect()
    if (sr) {
      const s = sr.width / 1080
      const pos = { x: (e.clientX - sr.left) / s, y: (e.clientY - sr.top) / s }
      displayTargetRef.current = pos
      setDisplayTarget(pos)
      setEditDragStagePos(pos)
    }
    if (ghostRef.current) {
      ghostRef.current.style.left = e.clientX + 'px'
      ghostRef.current.style.top  = e.clientY + 'px'
    }
  }

  function handlePlacedItemMouseDown(e, shelfIdx, item) {
    if (ghostRef.current) {
      ghostRef.current.style.left = e.clientX + 'px'
      ghostRef.current.style.top  = e.clientY + 'px'
    }
    // For book items defer the drag so a quick release becomes a click-to-view
    if (item.type === 'vertical-book' && item.book) {
      const startX = e.clientX, startY = e.clientY
      function onPendingMove(ev) {
        if (Math.abs(ev.clientX - startX) > 5 || Math.abs(ev.clientY - startY) > 5) {
          cleanup()
          _startPlacedItemDrag(ev, shelfIdx, item)
        }
      }
      function onPendingUp() {
        cleanup()
        handleClickRef.current(item.book)
      }
      function cleanup() {
        document.removeEventListener('mousemove', onPendingMove)
        document.removeEventListener('mouseup', onPendingUp)
      }
      document.addEventListener('mousemove', onPendingMove)
      document.addEventListener('mouseup', onPendingUp)
      return
    }
    _startPlacedItemDrag(e, shelfIdx, item)
  }

  function _startStackDrag(e, shelfIdx, stackItem, bookIdx) {
    const grabbedBooks   = stackItem.books.slice(bookIdx)
    const remainingBooks = stackItem.books.slice(0, bookIdx)
    const remainingId = remainingBooks.length > 0 ? `si-${nextItemId.current++}` : null
    setShelfContents(sc => {
      const updated = sc.map(r => [...r])
      updated[shelfIdx] = updated[shelfIdx].filter(it => it.id !== stackItem.id)
      if (remainingBooks.length > 0) {
        updated[shelfIdx] = [...updated[shelfIdx], {
          id: remainingId,
          type: 'horizontal-stack', slotWidth: stackItem.slotWidth,
          startSlot: stackItem.startSlot, books: remainingBooks,
        }].sort((a, b) => a.startSlot - b.startSlot)
      }
      return updated
    })
    setEditDragging({ type: 'horizontal-stack', slotWidth: stackItem.slotWidth,
      books: grabbedBooks, sourceItemId: stackItem.id,
      sourceItem: stackItem, sourceShelfIdx: shelfIdx, sourceRemainingId: remainingId })
    if (ghostRef.current) {
      ghostRef.current.style.left = e.clientX + 'px'
      ghostRef.current.style.top  = e.clientY + 'px'
    }
  }

  // Grab N books off the top of a stack — defer until mouse moves so a quick release = click-to-view
  function handleStackBookMouseDown(e, shelfIdx, stackItem, bookIdx) {
    e.preventDefault()
    e.stopPropagation()
    if (ghostRef.current) {
      ghostRef.current.style.left = e.clientX + 'px'
      ghostRef.current.style.top  = e.clientY + 'px'
    }
    const startX = e.clientX, startY = e.clientY
    function onPendingMove(ev) {
      if (Math.abs(ev.clientX - startX) > 5 || Math.abs(ev.clientY - startY) > 5) {
        cleanup()
        _startStackDrag(ev, shelfIdx, stackItem, bookIdx)
      }
    }
    function onPendingUp() {
      cleanup()
      const book = stackItem.books[bookIdx]
      if (book) handleClickRef.current(book)
    }
    function cleanup() {
      document.removeEventListener('mousemove', onPendingMove)
      document.removeEventListener('mouseup', onPendingUp)
    }
    document.addEventListener('mousemove', onPendingMove)
    document.addEventListener('mouseup', onPendingUp)
  }

  // Shelf inner mousemove: re-compute drop highlight (redundant with global but keeps it snappy)
  function handleShelfMouseMove(e, shelfIdx) {
    const drag = editDraggingRef.current
    if (!drag) return
    const sw   = drag.slotWidth
    const excl = drag.sourceItemId ?? null
    const el   = shelfInnerRefs.current[shelfIdx]
    if (!el) return
    const rect = el.getBoundingClientRect()
    const slotPx = rect.width / NUM_SLOTS
    const centre = Math.floor((e.clientX - rect.left) / slotPx)
    // Merge: book or stack dragged over a horizontal-stack with room
    const isRotatedBook = drag.type === 'vertical-book' && dragRotatedRef.current
    if (drag.type === 'horizontal-stack' || isRotatedBook) {
      if (!isRotatedBook && dragRotatedRef.current) {
        const eSw = drag.books?.length ?? 1
        const startSlot = Math.max(0, Math.min(NUM_SLOTS - eSw, centre - Math.floor(eSw / 2)))
        setDropTarget({ shelfIdx, startSlot, valid: !slotsOverlap(shelfContentsRef.current[shelfIdx], startSlot, eSw, excl), convertToVertical: true })
        return
      }
      const count = isRotatedBook ? 1 : (drag.books?.length ?? 1)
      const cursorStack = shelfContentsRef.current[shelfIdx].find(it =>
        it.type === 'horizontal-stack' && it.id !== excl &&
        centre >= it.startSlot && centre < it.startSlot + it.slotWidth &&
        (it.books?.length ?? 0) + count <= 5
      )
      if (cursorStack) { setDropTarget({ shelfIdx, mergeStackId: cursorStack.id, valid: true }); return }
      const hSlot = Math.max(0, Math.min(NUM_SLOTS - 5, centre - 2))
      if (!slotsOverlap(shelfContentsRef.current[shelfIdx], hSlot, 5, excl)) {
        setDropTarget({ shelfIdx, startSlot: hSlot, valid: true, ...(isRotatedBook ? { rotateToHorizontal: true } : {}) })
        return
      }
      if (!isRotatedBook && count >= 2 && count < 5) {
        const vSlot = Math.max(0, Math.min(NUM_SLOTS - count, centre - Math.floor(count / 2)))
        if (!slotsOverlap(shelfContentsRef.current[shelfIdx], vSlot, count, excl)) {
          setDropTarget({ shelfIdx, startSlot: vSlot, valid: true, convertToVertical: true })
          return
        }
      }
      setDropTarget({ shelfIdx, startSlot: hSlot, valid: false })
      return
    }
    if (drag.type === 'vertical-book') {
      const cursorStack = shelfContentsRef.current[shelfIdx].find(it =>
        it.type === 'horizontal-stack' && it.id !== excl &&
        centre >= it.startSlot && centre < it.startSlot + it.slotWidth &&
        (it.books?.length ?? 0) < 5
      )
      if (cursorStack) { setDropTarget({ shelfIdx, mergeStackId: cursorStack.id, valid: true }); return }
    }
    const startSlot = Math.max(0, Math.min(NUM_SLOTS - sw, centre - Math.floor(sw / 2)))
    setDropTarget({ shelfIdx, startSlot, valid: !slotsOverlap(shelfContentsRef.current[shelfIdx], startSlot, sw, excl) })
  }

  // Escape cancels drag / closes panels
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        setShowBookPanel(false)
        setShowDecorPanel(false)
        setEditDragging(null)
        setDropTarget(null)
        setStackBooks([])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Animate grip open/close when edit drag starts or ends
  useEffect(() => {
    const GRIP_DUR = 220
    let start = null
    const fromVal = editGripExtendRef.current
    const toVal = editDragging ? 1 : 0
    if (editGripRafRef.current) cancelAnimationFrame(editGripRafRef.current)
    function loop(ts) {
      if (!start) start = ts
      const p = Math.min((ts - start) / GRIP_DUR, 1)
      const ease = p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p+2, 3)/2
      const val = fromVal + (toVal - fromVal) * ease
      editGripExtendRef.current = val
      setEditGripExtend(val)
      if (p < 1) editGripRafRef.current = requestAnimationFrame(loop)
    }
    editGripRafRef.current = requestAnimationFrame(loop)
    return () => { if (editGripRafRef.current) cancelAnimationFrame(editGripRafRef.current) }
  }, [editDragging !== null])  // eslint-disable-line react-hooks/exhaustive-deps

  // ── End edit mode handlers ────────────────────────────────────────────────────

  // Head/arm stay hidden during grab return animation AND while overlay is open/closing
  const retreating = grabPhase === 'returning' || grabPhase === 'done' || selected !== null
  // returnProgress 0→1: during returning, retractMode sweeps 1→0, so 1-retractMode gives progress
  const returnProgress = retreating ? (1 - retractMode) : 0
  const bookcaseBottom = 196 + shelfConfigs.length * 188
  // During retreating the arm is at z=1 (behind shelf). Tighten the clamp so the hand
  // (elbowY + 24 + 24px stroke radius) never pokes below the bookcase floor.
  const maxElbowY = retreating ? bookcaseBottom - 60 : bookcaseBottom - 10
  const isEditDragArm = editDragStagePos !== null
  const armTarget = displayTarget
  const arm = computeArm(armTarget, retractMode, returnProgress, maxElbowY, isEditDragArm ? -600 : 270)
  // Stage rect — maps in-stage coordinates to the always-fixed forearm SVG
  const stageSR = stageRef.current?.getBoundingClientRect() ?? null
  const stageSc = stageSR ? stageSR.width / 1080 : 1
  const armActive = armTarget !== null && (isEditDragArm || grabPhase !== 'done')
  // Type-2 drag grab: forearm extends 32px toward cursor as editGripExtend goes 0→1 (matches handShift).
  // Uses the natural retractMode=0 shoulder — no rotation, no disappear.
  const activeFaPath = editGripExtend > 0.001
    ? `M ${arm.handTipX + Math.round(92 - 32 * editGripExtend)} ${arm.handY} L ${arm.elbowX} ${arm.elbowY}`
    : arm.faPath
  const isTopRow = arm.elbowY < 390
  // During overlay: closingToTopRow means cursor is in top area — park head below the top board
  // so it can spring UP when overlay closes. Otherwise slide left into the shelf.
  const overlayOpenTopRow = selected !== null && closingToTopRow
  const grabReturnTopRow  = selected === null && isTopRow && retreating
  // topBlend: 1 = fully top-row, 0 = fully side-row.
  // Blends head position over a 100px zone (elbowY 340→440) instead of snapping at 390.
  const topBlend = arm.elbowY < 340 ? 1 : arm.elbowY > 440 ? 0 : (440 - arm.elbowY) / 100
  const headLeft = headIntroLeft !== null ? headIntroLeft
    : (retreating && !overlayOpenTopRow && !grabReturnTopRow) ? 250
    : 580 * topBlend + 740 * (1 - topBlend)
  const headTop  = headIntroTop !== null ? headIntroTop
    : overlayOpenTopRow ? 200
    : grabReturnTopRow ? 190
    : 108 * topBlend + (arm.elbowY - 295) * (1 - topBlend)
  const headRotate = retreating ? 0 : -5 * topBlend + 7 * (1 - topBlend)

  // Blend edit grip over normal grab; whichever is active drives fingers + hand shift
  const activeGrip = editGripExtend > 0.001 ? editGripExtend : fingerExtend
  const fingers = computeFingerPaths(activeGrip)
  const handShift = -32 * activeGrip

  // During grabbing/retracting/returning, hide the grabbed book in the shelf
  const grabbedBookId = (grabPhase === 'grabbing' || grabPhase === 'retracting' || grabPhase === 'returning' || grabPhase === 'done')
    ? grabbedBook?.id : null


  // Grabbed book clone — follows arm; matches actual shelf book dimensions
  const CLONE_W = Math.round(SLOT_W * 1.1)
  const CLONE_H = grabbedBook ? Math.round(SHELF_H * (0.72 + titleT(grabbedBook.title) * 0.28) * 1.1) : SHELF_H
  const cloneSpineFontSize = grabbedBook ? Math.max(7, Math.min(12, Math.floor((CLONE_H - 16) / ((grabbedBook.title || '').length * 0.62)))) : 12
  const showClone = grabbedBook && (grabPhase === 'grabbing' || grabPhase === 'retracting')
  const cloneLeft = arm.handTipX + 2 - CLONE_W
  const cloneTop  = arm.handY - 24 - CLONE_H / 2

  const stageHeight = Math.max(960, bookcaseBottom + 140)

  return (
    <Fragment>
    <div
      ref={containerRef}
      onContextMenu={e => e.preventDefault()}
      style={{
        width: '100%', minHeight: '100vh',
        display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        overflowX: 'hidden',
        background: '#223152',
        fontFamily: "'Manrope', sans-serif",
        transform: showTitle && !revealing ? 'translateY(100vh)' : 'translateY(0)',
        transition: revealing ? 'transform 0.6s cubic-bezier(.7,0,.3,1)' : 'none',
      }}>
      <div
        ref={stageRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ position: 'relative', width: 1080, height: stageHeight, zoom: scale, zIndex: retreating ? 10 : undefined }}
      >
          {/* cave background */}
          <CaveBackground stageHeight={stageHeight} bookcaseBottom={bookcaseBottom} />

          {poofActive && <PoofSmoke top={178} h={Math.max(1, shelfConfigs.length) * 188} />}

          {bookcaseRevealed && <div style={{ position: 'absolute', inset: 0 }}>

          {/* bookshelf shadow — two ellipses */}
          <div style={{ position: 'absolute', left: -300, top: bookcaseBottom - 90, width: 1680, height: 180, borderRadius: '50%', background: '#19243D', opacity: 0.4, zIndex: 0 }} />
          <div style={{ position: 'absolute', left: -100, top: bookcaseBottom - 45, width: 1280, height: 90, borderRadius: '50%', background: '#19243D', opacity: 0.6, zIndex: 0 }} />

          {/* header bar — fixed, hides on scroll down, shows on scroll up */}
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px 10px', zIndex: 9, pointerEvents: 'none', transform: headerVisible ? 'translateY(0)' : 'translateY(-120%)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 10, alignSelf: isViewOnly ? 'flex-start' : 'center' }}>
              {isViewOnly && (
                <span style={{ color: '#FDF8EF', opacity: 0.7, fontSize: 12, fontFamily: "'Manrope',sans-serif", whiteSpace: 'nowrap' }}>
                  Viewing {username ? `${username}'s collection` : 'a collection'}
                </span>
              )}
              {!isViewOnly && (
                <button
                  onClick={isEditMode ? exitEditMode : enterEditMode}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 14px 6px 8px', cursor: 'pointer',
                    background: 'linear-gradient(#2A2A2A, #2A2A2A) padding-box, repeating-linear-gradient(-45deg, #FFD700, #FFD700 7px, #1C1C1C 7px, #1C1C1C 14px) border-box',
                    border: '3px solid transparent',
                    borderRadius: 11,
                    color: '#ffffff',
                    fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 13,
                  }}
                >
                  {/* toggle track */}
                  <div style={{
                    width: 36, height: 20, borderRadius: 10, flexShrink: 0, position: 'relative',
                    background: isEditMode ? '#FFD700' : '#1A1A1A',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.7)',
                    transition: 'background 0.2s',
                  }}>
                    {/* thumb */}
                    <div style={{
                      position: 'absolute', top: 3, width: 14, height: 14, borderRadius: 7,
                      background: '#3C3C3C',
                      left: isEditMode ? 19 : 3,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.6)',
                      transition: 'left 0.18s cubic-bezier(.4,0,.2,1)',
                    }}/>
                  </div>
                  Build mode
                </button>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'auto' }}>
              {isViewOnly && (
                <button
                  onClick={() => { window.location.href = window.location.origin + window.location.pathname }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#254CA4', color: '#FDF8EF', border: 'none', borderRadius: 10, padding: '7px 14px', fontSize: 13, fontFamily: "'Manrope',sans-serif", fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  {viewerHasOwnShelf ? 'My Collection' : 'Create your shelf'}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M5 3L9.5 7L5 11" stroke="#FDF8EF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
              {!isViewOnly && (<>
                {saveStatus !== '' && (
                  <span style={{ fontSize: 12, color: '#FDF8EF', opacity: 0.65, fontFamily: "'Manrope',sans-serif", pointerEvents: 'none' }}>
                    {saveStatus === 'saving' ? 'Saving…' : 'Saved'}
                  </span>
                )}
                {shareId && (
                  <button onClick={() => setShowShareModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#254CA4', color: '#FDF8EF', border: '3px solid transparent', borderRadius: 10, padding: '6px 14px', fontSize: 13, fontFamily: "'Manrope',sans-serif", fontWeight: 700, cursor: 'pointer' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="11" cy="2.5" r="1.5" stroke="#FDF8EF" strokeWidth="1.4"/>
                      <circle cx="11" cy="11.5" r="1.5" stroke="#FDF8EF" strokeWidth="1.4"/>
                      <circle cx="3" cy="7" r="1.5" stroke="#FDF8EF" strokeWidth="1.4"/>
                      <path d="M9.6 3.3L4.4 6.2M4.4 7.8l5.2 2.9" stroke="#FDF8EF" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                    Share
                  </button>
                )}
              </>)}
            </div>
          </div>

          {/* gold nameplate — bottom-aligned with bookcase top */}
          <div style={{ position: 'absolute', left: 228, top: 178, zIndex: 9, transform: 'translateY(-100%)' }}>
            <ShelfPlate
              shelfName={shelfName}
              username={username}
              showEditButton={isEditMode && !isViewOnly}
              onEdit={() => setShowPlateEdit(true)}
            />
          </div>

          {/* creature head */}
          <div ref={headRef} style={{
            position: 'absolute',
            left: headLeft, top: headTop,
            width: 226, height: 230, zIndex: 1,
            transform: `rotate(${headRotate}deg)`,
            transformOrigin: '50% 90%',
            transition: (headIntroTop !== null || headIntroLeft !== null) ? 'none'
              : retreating
                ? 'left .38s ease-in, top .38s ease-in, transform .3s ease-in'
                : applyTopTransition
                  ? 'left .72s cubic-bezier(.22,.68,0,1.18), top .4s cubic-bezier(.34,1.4,.5,1), transform .3s ease-out'
                  : 'left .72s cubic-bezier(.22,.68,0,1.18), transform .3s ease-out',
          }}>
            <div style={{ position: 'absolute', inset: 0, animation: headDucking ? 'headDuck 1.8s ease-in-out' : (selected ? 'none' : 'tomaBob 4.6s ease-in-out infinite') }}>
              <TomaHead
                irisOff={irisOff}
                style={{ cursor: selected ? 'default' : 'pointer' }}
                onMouseEnter={() => {
                  if (selected || headDucking) return
                  setHeadDucking(true)
                  clearTimeout(headDuckTimerRef.current)
                  headDuckTimerRef.current = setTimeout(() => setHeadDucking(false), 1850)
                }}
              />
              {/* blink lids sit on top of the inline SVG irises */}
              <div style={{ position: 'absolute', left: 38, top: 46, width: 54, height: 30, background: '#72FF5D', transformOrigin: 'center top', animation: headDucking ? 'eyeSquint 1.8s ease-in-out' : (selected ? 'none' : 'blinkLid 5s .2s infinite') }} />
              <div style={{ position: 'absolute', left: 132, top: 46, width: 54, height: 30, background: '#72FF5D', transformOrigin: 'center top', animation: headDucking ? 'eyeSquint 1.8s ease-in-out' : (selected ? 'none' : 'blinkLid 5s .2s infinite') }} />
            </div>
          </div>

          {/* bookshelf */}
          <div style={{ position: 'absolute', left: 228, top: 178, width: 624, zIndex: 2 }}>
            <div style={{ height: 18, background: '#E2712C', borderRadius: '4px 4px 0 0' }} />
            <div>
            {(() => {
              const hasPlaced = shelfContents.some(row => row.length > 0)
              return shelfConfigs.map((cfg, shelfIdx) => {
                const colors = getShelfColors(cfg.colorKey)
                const shelf = { ...colors, label: cfg.label, items: cfg.items || [] }
                if (isEditMode) return (
                  <EditableShelfRow
                    key={cfg.id}
                    shelf={shelf}
                    shelfIdx={shelfIdx}
                    items={shelfContents[shelfIdx] || []}
                    dragging={editDragging}
                    dropTarget={dropTarget}
                    innerRef={el => { shelfInnerRefs.current[shelfIdx] = el }}
                    onMouseMove={e => handleShelfMouseMove(e, shelfIdx)}
                    onMouseUp={() => {}}
                    onItemMouseDown={handlePlacedItemMouseDown}
                    onStackBookMouseDown={handleStackBookMouseDown}
                    onEditClick={() => setEditingShelfIdx(shelfIdx)}
                    showEditButton={!editDragging && hoveredShelfIdx === shelfIdx && !selected}
                    grabbedBookId={grabbedBookId}
                  />
                )
                if (hasPlaced) return (
                  <SavedShelfRow
                    key={cfg.id}
                    shelf={shelf}
                    items={shelfContents[shelfIdx] || []}
                    onBookClick={handleClick}
                    grabbedBookId={grabbedBookId}
                  />
                )
                return (
                  <ShelfRow
                    key={cfg.id}
                    shelf={shelf}
                    hoveredId={hoveredId}
                    grabbedId={grabbedBookId}
                    onEnter={handleEnter}
                    onLeave={handleLeaveBook}
                    onClick={handleClick}
                  />
                )
              })
            })()}
            {/* Add shelf button — edit mode only, fades out while dragging */}
            {isEditMode && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 4px', opacity: editDragging ? 0 : 1, pointerEvents: editDragging ? 'none' : 'auto', transition: 'opacity 0.2s ease' }}>
                <button
                  onClick={() => setShowAddShelfModal(true)}
                  style={{ background: '#254CA4', border: 'none', borderRadius: 12, padding: '10px 28px', fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 15, color: '#FDF8EF', cursor: 'pointer' }}
                >+ Add Shelf</button>
              </div>
            )}
            </div>{/* end scrollable shelf list */}
          </div>

          {/* top board cover — hides arm origin behind shelf top */}
          <div style={{ position: 'absolute', left: 228, top: 176, width: 624, height: 20, background: '#E2712C', borderRadius: '4px 4px 0 0', zIndex: 11 }} />

          {/* grabbed book clone — follows arm, styled to match shelf book */}
          {showClone && (
            <div style={{
              position: 'absolute',
              left: cloneLeft, top: cloneTop,
              width: CLONE_W, height: CLONE_H,
              background: grabbedBook.spine,
              borderRadius: '3px 3px 1px 1px',
              zIndex: 10,
              pointerEvents: 'none',
              boxShadow: 'inset -2px 0 5px rgba(0,0,0,0.18), 0 6px 18px rgba(0,0,0,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}>
              <span style={{
                writingMode: 'vertical-rl', textOrientation: 'mixed', whiteSpace: 'nowrap',
                fontFamily: "'Manrope', sans-serif", fontWeight: 600,
                fontSize: cloneSpineFontSize,
                letterSpacing: cloneSpineFontSize < 10 ? '0' : '0.3px',
                color: grabbedBook.ink,
                padding: '8px 0', maxHeight: CLONE_H - 14, overflow: 'hidden',
                pointerEvents: 'none',
              }}>
                {grabbedBook.title}
              </span>
            </div>
          )}

          {/* arm — upper arm behind shelf (z=1); forearm + hand z varies during grab */}
          <svg width="1080" height="960" style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', zIndex: 1, overflow: 'visible' }}>
            <path d={arm.uaPath} fill="none" stroke="#72FF5D" strokeWidth="48" strokeLinecap="round"
              style={{ opacity: armActive ? 1 : 0, transition: 'opacity .2s ease' }} />
          </svg>

          {/* Forearm + hand — lives inside stageRef so it scrolls natively with the body.
              retreating = arm swept right returning behind shelf, drop z so shelf covers it */}
          <svg width="1080" height="960" style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', zIndex: retreating ? 1 : 56, overflow: 'visible' }}>
            <g style={{ opacity: armActive ? 1 : 0, transition: 'opacity .2s ease' }}>
              <path d={activeFaPath} fill="none" stroke="#72FF5D" strokeWidth="48" strokeLinecap="round" />
              <g transform={arm.handTransform}>
                <g style={{ animation: (grabPhase || editGripExtend > 0.001 || !!selected) ? 'none' : 'handSway 4.6s ease-in-out infinite' }}>
                  <g style={{ transform: `translateX(${handShift}px)` }}>
                    <path d="M86 -40 C 72 -55, 44 -53, 33 -45" stroke="#72FF5D" strokeWidth="23" strokeLinecap="round" fill="none" />
                    <circle cx="92" cy="0" r="44" fill="#72FF5D" />
                    <path d={fingers.index}  stroke="#72FF5D" strokeWidth="23" strokeLinecap="round" fill="none" />
                    <path d={fingers.middle} stroke="#72FF5D" strokeWidth="23" strokeLinecap="round" fill="none" />
                    <path d={fingers.ring}   stroke="#72FF5D" strokeWidth="23" strokeLinecap="round" fill="none" />
                    <path d={fingers.pinky}  stroke="#72FF5D" strokeWidth="23" strokeLinecap="round" fill="none" />
                  </g>
                </g>
              </g>
            </g>
          </svg>

          </div>}{/* end bookcaseRevealed */}

        </div>
      {/* Overlay lives outside the scale transform so position:fixed hits the true viewport */}
      <Overlay selected={selected} openPhase={openPhase} onClose={handleClose} shelfConfigs={shelfConfigs} descCache={descCacheRef} userId={userId} reviewsRef={reviewsRef} isViewOnly={isViewOnly} ownerName={username} viewerUserId={viewerUserId} />

      {editingShelfIdx !== null && (
        <ShelfEditModal
          cfg={shelfConfigs[editingShelfIdx]}
          onSave={(label, colorKey) => saveShelf(editingShelfIdx, label, colorKey)}
          onDelete={() => deleteShelf(editingShelfIdx)}
          onClose={() => setEditingShelfIdx(null)}
          canDelete={shelfConfigs.length > 2}
        />
      )}

      {showAddShelfModal && (
        <ShelfEditModal
          cfg={{ label: 'New Shelf', colorKey: 'yellow' }}
          onSave={(label, colorKey) => { addShelf(label, colorKey); setShowAddShelfModal(false) }}
          onClose={() => setShowAddShelfModal(false)}
          showDelete={false}
          title="New Shelf"
        />
      )}

      {/* Share modal */}
      {showShareModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(25,36,61,0.6)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseDown={e => { if (e.target === e.currentTarget) { setShowShareModal(false); setLinkCopied(false) } }}>
          <div style={{ background: '#FDF8EF', borderRadius: 20, padding: '28px 32px 24px', width: 340, boxShadow: '0 16px 48px rgba(0,0,0,0.3)', fontFamily: "'Manrope',sans-serif" }}
            onMouseDown={e => e.stopPropagation()}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1C1C2E', marginBottom: 6 }}>Share your shelf</div>
            <div style={{ fontSize: 14, color: '#666680', marginBottom: 20 }}>Anyone with this link can view your shelf.</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#606078', marginBottom: 8, letterSpacing: '0.04em' }}>LINK</div>
            <input
              readOnly
              value={`${window.location.origin}${window.location.pathname}?shelf=${shareId}`}
              onFocus={e => e.target.select()}
              style={{ width: '100%', boxSizing: 'border-box', border: '2px solid #D0D0DC', borderRadius: 10, padding: '9px 13px', fontSize: 13, fontFamily: "'Manrope',sans-serif", fontWeight: 500, background: 'white', color: '#1C1C2E', outline: 'none', marginBottom: 16, cursor: 'text' }}
            />
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?shelf=${shareId}`)
                  setLinkCopied(true)
                  setTimeout(() => setLinkCopied(false), 2500)
                }}
                style={{ flex: 1, background: '#254CA4', border: 'none', borderRadius: 10, padding: '11px 0', fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 15, color: '#FDF8EF', cursor: 'pointer', transition: 'background 0.15s' }}
              >{linkCopied ? 'Copied!' : 'Copy link'}</button>
              <button
                onClick={() => { setShowShareModal(false); setLinkCopied(false) }}
                style={{ flex: 1, background: 'transparent', border: '2px solid #D0D0DC', borderRadius: 10, padding: '11px 0', fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 15, color: '#606078', cursor: 'pointer' }}
              >Close</button>
            </div>
          </div>
        </div>
      )}

      {showOnboarding && <OnboardingOverlay onSubmit={handleOnboardingSubmit} />}

      {showPlateEdit && (
        <ShelfPlateEditModal
          shelfName={shelfName}
          username={username}
          onSave={handlePlateSave}
          onClose={() => setShowPlateEdit(false)}
        />
      )}

      {/* Edit mode UI — also outside scale so position:fixed hits the true viewport */}
      {isEditMode && (
        <>
          <DragGhost dragging={editDragging} ghostRef={ghostRef} dragRotated={dragRotated} stageSc={stageSc} />

          {/* Action zones — fades in/out left of bookshelf while dragging a book or stack, below ghost/arm */}
          {stageSR && (() => {
            const visible = !!(editDragging && (editDragging.type === 'horizontal-stack' || editDragging.type === 'vertical-book'))
            const deleteVisible = !!editDragging
            const btnStyle = (active, isDelete) => ({
              borderRadius: 16, padding: '20px 18px', minWidth: 80,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 14,
              background: '#FDF8EF',
              border: `2px solid ${isDelete ? '#c0392b' : '#254CA4'}`,
              color: isDelete ? '#c0392b' : '#254CA4',
              boxShadow: active
                ? (isDelete ? '0 0 0 4px rgba(192,57,43,0.2), 0 2px 10px rgba(0,0,0,0.18)' : '0 0 0 4px rgba(37,76,164,0.2), 0 2px 10px rgba(0,0,0,0.18)')
                : '0 2px 10px rgba(0,0,0,0.18)',
              pointerEvents: visible ? 'auto' : 'none', userSelect: 'none',
              transition: 'box-shadow .15s',
            })
            return (
              <div style={{ position: 'fixed', top: 0, bottom: 0, left: 0,
                width: Math.max(80, stageSR.left), display: 'flex', flexDirection: 'column',
                alignItems: 'flex-start', justifyContent: 'center', gap: 24, paddingLeft: 24,
                zIndex: 45, pointerEvents: 'none',
                opacity: (visible || deleteVisible) ? 1 : 0, transition: 'opacity 0.2s ease' }}>
                <div style={btnStyle(dragRotated, false)}
                  onMouseEnter={visible ? () => {
                    if (Date.now() < rotateCooldownUntil.current || rotateDelayTimer.current) return
                    rotateDelayTimer.current = setTimeout(() => {
                      dragRotatedRef.current = !dragRotatedRef.current
                      setDragRotated(dragRotatedRef.current)
                      setRotateAnimKey(k => k + 1)
                      rotateCooldownUntil.current = Date.now() + 700
                      rotateDelayTimer.current = null
                    }, 380)
                  } : undefined}
                  onMouseLeave={visible ? () => {
                    if (rotateDelayTimer.current) { clearTimeout(rotateDelayTimer.current); rotateDelayTimer.current = null }
                  } : undefined}>
                  <div key={rotateAnimKey} style={{ display: 'inline-block', animation: rotateAnimKey > 0 ? 'spinOnce 0.45s cubic-bezier(0.4,0,0.2,1)' : 'none' }}><IconRotate size={28} color="currentColor" /></div>
                  <span>Rotate</span>
                </div>
                <div ref={deleteBtnRef} style={{ ...btnStyle(dragOverDelete, true), pointerEvents: deleteVisible ? 'auto' : 'none' }}
                  onMouseEnter={deleteVisible ? () => { dragOverDeleteRef.current = true; setDragOverDelete(true) } : undefined}
                  onMouseLeave={deleteVisible ? () => { dragOverDeleteRef.current = false; setDragOverDelete(false) } : undefined}
                  onMouseUp={deleteVisible ? () => { deleteConfirmedRef.current = true } : undefined}>
                  <IconTrash size={28} color="currentColor" />
                  <span>Delete</span>
                </div>
              </div>
            )
          })()}

          {/* Donate bin + second arm — one animated group; arm slides in behind bin */}
          {stageSR && !!editDragging && deleteBtnRect && (() => {
            const panelWidth = Math.max(80, stageSR.left)
            const BIN_W = 120
            const binLeft = Math.max(8, (panelWidth - BIN_W) / 2)
            const bookcaseScreenBottom = stageSR.top + bookcaseBottom * stageSc
            const belowShelf = (deleteBtnRect.bottom + 48) > bookcaseScreenBottom
            const binTop = deleteBtnRect.bottom + 48
            return (
              <div style={{
                position: 'fixed', left: 0, top: binTop,
                width: panelWidth, zIndex: 1, pointerEvents: 'none', overflow: 'visible',
              }}>
                <div style={{
                  width: BIN_W,
                  transform: dragOverDelete
                    ? `translateX(${binLeft}px)`
                    : belowShelf ? `translateX(-${BIN_W + 8}px)` : 'translateX(30vw)',
                  transition: 'transform 0.65s cubic-bezier(.34,1.4,.5,1)',
                  position: 'relative', overflow: 'visible',
                }}>
                <svg width={BIN_W} viewBox="0 0 316 346" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'relative', zIndex: 1 }}>
                  <path d="M268.679 327.62L308.002 15.0001L307.519 15.0003C268.002 25.5884 42.002 24.1104 8.00195 15.0001L41.4139 327.5C41.7677 330.81 44.1168 333.542 47.3636 334.275C61.8648 337.549 104.208 345.999 155.002 345.999C205.915 345.999 248.338 337.509 262.742 334.252C265.936 333.53 268.27 330.869 268.679 327.62Z" fill="#00529C"/>
                  <path d="M8.00195 15.3973L8.48529 15.3972C48.002 4.80904 274.002 6.28706 308.002 15.3973" stroke="#233B7A" strokeWidth="16" strokeLinecap="round"/>
                  <path d="M308.002 15.0001L307.519 15.0003C268.002 25.5884 42.002 24.1104 8.00195 15.0001" stroke="#24418C" strokeWidth="16" strokeLinecap="round"/>
                  <path d="M170.405 166.24L170.414 167.483L171.658 167.48L196.072 167.425H196.137L196.201 167.418C198.824 167.14 201.291 166.407 203.485 165.165C202.277 167.792 201.166 170.277 200.101 172.535C198.339 176.27 196.661 179.478 194.72 182.11C192.79 184.726 190.618 186.745 187.877 188.122C185.133 189.501 181.737 190.278 177.299 190.28H170.413L170.405 191.521L170.381 195.296L161.433 179.447L170.384 163.362L170.405 166.24ZM110.554 164.637C110.908 164.87 111.265 165.1 111.625 165.317C112.66 165.941 113.728 166.5 114.752 166.906C115.759 167.306 116.805 167.589 117.772 167.59V167.591C123.477 167.604 129.182 167.615 134.886 167.627H150.916L150.866 190.463H132.251C126.222 188.565 121.691 183.869 117.89 178.077C115.09 173.813 112.776 169.108 110.554 164.637ZM207.751 153.173C207.746 154.054 207.414 155.107 206.744 156.257C206.023 157.495 204.964 158.75 203.723 159.875C202.483 160.999 201.092 161.964 199.734 162.639C198.361 163.321 197.105 163.666 196.109 163.656L188.214 163.571L178.358 145.377L197.945 133.497L207.751 153.173ZM129.848 133.416L139.045 150.148L135.021 147.735L133.838 147.025L133.248 148.272C130.8 153.45 128.351 158.628 125.902 163.806C123.27 163.76 120.637 163.713 118.005 163.667C113.006 162.452 109.383 158.561 107.369 153.732L115.467 137.192L115.99 136.121L114.946 135.547L111.073 133.416H129.848ZM174.532 101.249C178.927 101.661 181.089 104.142 183.716 108.093L187.738 115.181L188.389 116.326L189.499 115.617L191.547 114.307L182.577 130.31L162.849 130.353L166.483 128.365L167.475 127.823L167.034 126.781C164.779 121.457 161.749 115.324 157.939 109.969C155.556 106.619 152.792 103.523 150.225 101.297L174.532 101.249ZM135.679 102.626C140.458 100.965 144.177 102.027 147.212 104.125C150.172 106.172 152.474 109.202 154.38 111.835L144.883 130.091L125.499 117.907L135.679 102.626Z" fill="#FDF8EF" stroke="#FDF8EF" strokeWidth="2.5"/>
                  <path d="M104.597 229.999V209.839H110.911C111.097 209.839 111.443 209.843 111.947 209.853C112.46 209.862 112.95 209.899 113.417 209.965C114.994 210.161 116.319 210.725 117.393 211.659C118.475 212.592 119.292 213.777 119.843 215.215C120.393 216.643 120.669 218.211 120.669 219.919C120.669 221.636 120.393 223.213 119.843 224.651C119.292 226.079 118.475 227.259 117.393 228.193C116.319 229.117 114.994 229.677 113.417 229.873C112.95 229.938 112.46 229.975 111.947 229.985C111.443 229.994 111.097 229.999 110.911 229.999H104.597ZM107.593 227.213H110.911C111.228 227.213 111.606 227.203 112.045 227.185C112.483 227.166 112.871 227.129 113.207 227.073C114.233 226.877 115.064 226.433 115.699 225.743C116.343 225.043 116.814 224.184 117.113 223.167C117.411 222.149 117.561 221.067 117.561 219.919C117.561 218.733 117.407 217.637 117.099 216.629C116.791 215.611 116.315 214.762 115.671 214.081C115.036 213.39 114.215 212.951 113.207 212.765C112.871 212.699 112.479 212.662 112.031 212.653C111.592 212.634 111.219 212.625 110.911 212.625H107.593V227.213ZM132.343 230.419C130.327 230.419 128.609 229.98 127.191 229.103C125.772 228.216 124.685 226.984 123.929 225.407C123.182 223.829 122.809 222 122.809 219.919C122.809 217.837 123.182 216.008 123.929 214.431C124.685 212.853 125.772 211.626 127.191 210.749C128.609 209.862 130.327 209.419 132.343 209.419C134.349 209.419 136.062 209.862 137.481 210.749C138.909 211.626 139.996 212.853 140.743 214.431C141.489 216.008 141.863 217.837 141.863 219.919C141.863 222 141.489 223.829 140.743 225.407C139.996 226.984 138.909 228.216 137.481 229.103C136.062 229.98 134.349 230.419 132.343 230.419ZM132.343 227.633C133.771 227.651 134.956 227.339 135.899 226.695C136.851 226.041 137.565 225.136 138.041 223.979C138.517 222.812 138.755 221.459 138.755 219.919C138.755 218.379 138.517 217.035 138.041 215.887C137.565 214.729 136.851 213.829 135.899 213.185C134.956 212.541 133.771 212.214 132.343 212.205C130.915 212.186 129.725 212.499 128.773 213.143C127.83 213.787 127.121 214.692 126.645 215.859C126.169 217.025 125.926 218.379 125.917 219.919C125.907 221.459 126.141 222.807 126.617 223.965C127.093 225.113 127.807 226.009 128.759 226.653C129.72 227.297 130.915 227.623 132.343 227.633ZM144.655 229.999V209.839H147.623L157.549 224.819V209.839H160.517V229.999H157.549L147.623 215.005V229.999H144.655ZM163.025 229.999L169.577 209.839H173.791L180.343 229.999H177.305L171.271 211.603H172.027L166.063 229.999H163.025ZM166.427 225.449V222.705H176.955V225.449H166.427ZM186.213 229.999V212.597H179.507V209.839H195.845V212.597H189.139V229.999H186.213ZM198.085 229.999V209.839H210.965V212.597H201.011V218.253H209.285V221.011H201.011V227.241H210.965V229.999H198.085Z" fill="#FDF8EF"/>
                </svg>
                </div>
              </div>
            )
          })()}

          <BookAddPanel
            isOpen={showBookPanel}
            selectedBooks={stackBooks}
            onToggleBook={handleToggleBookInPanel}
            onConfirm={handleBookPanelConfirm}
            onClose={() => setShowBookPanel(false)}
          />
          <DecorAddPanel
            isOpen={showDecorPanel}
            onSelect={handleDecorSelect}
            onClose={() => setShowDecorPanel(false)}
          />
        </>
      )}

      {/* SidePanelButtons — always mounted so it can animate in/out */}
      {bookcaseRevealed && !isViewOnly && (
        <SidePanelButtons
          isEditMode={isEditMode}
          editDragging={editDragging}
          inventory={inventory}
          onBook={() => { setShowBookPanel(true); setShowDecorPanel(false); setStackBooks([]) }}
          onDecor={() => { setShowDecorPanel(true); setShowBookPanel(false) }}
          onInventoryItemPlace={item => {
            if (item.type === 'book') {
              startEditDrag({ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 },
                { type: 'vertical-book', slotWidth: 1, book: item.book, sourceInventoryId: item.id })
            } else if (item.type === 'stack') {
              startEditDrag({ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 },
                { type: 'horizontal-stack', slotWidth: 5, books: item.books, sourceInventoryId: item.id })
            } else {
              startEditDrag({ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 },
                { type: item.decorType, slotWidth: 2, sourceInventoryId: item.id })
            }
            setShowBookPanel(false); setShowDecorPanel(false)
          }}
        />
      )}

    </div>
    {showTitle && <TitleScreen onDismiss={() => setShowTitle(false)} onReveal={() => setRevealing(true)} />}
    </Fragment>
  )
}
