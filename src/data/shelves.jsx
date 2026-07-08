import { publicPath } from '../lib/layout.js'

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


export { SHELVES, ROYGBIV, getShelfColors, findShelf, BOOK_CATALOG, reconstructShelf, INVENTORY_ITEMS, buildInitialContents }
