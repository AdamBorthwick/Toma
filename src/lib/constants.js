const publicPath = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`


// ─── Edit-mode constants & helpers ────────────────────────────────────────────
const SLOT_W    = 37   // logical px per slot — (624 shelf - 16 left border - 16 right border) / 16 slots = 37
const NUM_SLOTS = 16   // slots per shelf row
const SHELF_H   = 168  // inner content height
const MOBILE_HEADER_PAD = 72  // px reserved at top of stage for the always-visible mobile header
// Stage px fitted to viewport width on mobile (see updateScale).
const MOBILE_ZOOMED_OUT_FIT = 880  // bookcase + Toma head peeking on the right
const MOBILE_ZOOMED_IN_FIT = 656    // one-shelf detail; 1.5× multiplier applied on top
const BOOKCASE_LEFT = 228
const BOOKCASE_WIDTH = 624
const BOOKCASE_RIGHT = BOOKCASE_LEFT + BOOKCASE_WIDTH
const MOBILE_ZOOMED_IN_PEEK_LEFT = 24   // screen px of cave past the left shelf edge
const MOBILE_ZOOMED_IN_RIGHT = 940       // stage px — pan far enough right to reveal Toma's head
const MOBILE_ZOOMED_IN_MONSTER_BIAS = 52 // stage px — default framing favors the right peek


export { publicPath, SLOT_W, NUM_SLOTS, SHELF_H, MOBILE_HEADER_PAD, MOBILE_ZOOMED_OUT_FIT, MOBILE_ZOOMED_IN_FIT, BOOKCASE_LEFT, BOOKCASE_WIDTH, BOOKCASE_RIGHT, MOBILE_ZOOMED_IN_PEEK_LEFT, MOBILE_ZOOMED_IN_RIGHT, MOBILE_ZOOMED_IN_MONSTER_BIAS }
