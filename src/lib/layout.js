// Shared bookcase / slot geometry. These are the coordinates that both platforms use
// verbatim — they describe the stage, not the platform-specific viewport it renders into.

const publicPath = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`

// ─── Edit-mode constants & helpers ────────────────────────────────────────────
const SLOT_W    = 37   // logical px per slot — (624 shelf - 16 left border - 16 right border) / 16 slots = 37
const NUM_SLOTS = 16   // slots per shelf row
const SHELF_H   = 168  // inner content height
const MOBILE_HEADER_PAD = 72  // px reserved at top of stage for the always-visible mobile header
const BOOKCASE_LEFT = 228
const BOOKCASE_WIDTH = 624
const BOOKCASE_RIGHT = BOOKCASE_LEFT + BOOKCASE_WIDTH

function isRotatableDragType(type) {
  return type === 'horizontal-stack' || type === 'vertical-book'
}

const PLATE_EM_BASE = 100
const SHELF_TAB_FONT_EM = 13 / SHELF_H
const SHELF_EDIT_FONT_EM = 11 / SHELF_H
const SHELF_HINT_FONT_EM = 13 / SHELF_H
const PLATE_TITLE_FONT_EM = 15 / PLATE_EM_BASE
const PLATE_USER_FONT_EM = 10.5 / PLATE_EM_BASE
const SURFACE_LABEL_FONT_EM = 9 / PLATE_EM_BASE

export {
  publicPath, SLOT_W, NUM_SLOTS, SHELF_H, MOBILE_HEADER_PAD,
  BOOKCASE_LEFT, BOOKCASE_WIDTH, BOOKCASE_RIGHT,
  isRotatableDragType,
  PLATE_EM_BASE,
  SHELF_TAB_FONT_EM, SHELF_EDIT_FONT_EM, SHELF_HINT_FONT_EM,
  PLATE_TITLE_FONT_EM, PLATE_USER_FONT_EM, SURFACE_LABEL_FONT_EM,
}
