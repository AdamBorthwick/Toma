import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { resolveUserId, loadShelfByUserId, loadShelfByShareId, loadReviews, persistShelf, getShareId, setUsername as saveUsername, getUsername, getMonsterLook, setMonsterLook, loadInventory, addInventoryBook, addInventoryStack, addInventoryDecor, removeInventoryItem, DbError } from './db.js'
import { SLOT_W, NUM_SLOTS, SHELF_H, BOOKCASE_LEFT, BOOKCASE_WIDTH, MOBILE_ZOOMED_IN_MONSTER_BIAS, isRotatableDragType } from './lib/constants.js'
import { mobileShelfScrollBounds, computeMobileScale, setGhostPos, slotsOverlap, findFreeZone, computeArm, computeFingerPaths, titleT } from './lib/geometry.js'
import { fetchDefaultShelfData } from './lib/openLibrary.js'
import { SHELVES, getShelfColors, reconstructShelf } from './data/shelves.jsx'
import { getMonsterColors } from './data/monster.jsx'
import { IconTrash, IconRotate } from './components/icons.jsx'
import { CaveBackground, PoofSmoke, TomaHead } from './components/scene.jsx'
import { EditableShelfRow, SavedShelfRow, DragGhost, ShelfPlate, ShelfRow } from './components/shelfRows.jsx'
import { SidePanelButtons, BookAddPanel, DecorAddPanel, MonsterCustomizeModal, ShelfListModal, ShelfPlateEditModal, ShelfEditModal } from './components/panels.jsx'
import { Overlay } from './components/Overlay.jsx'
import { TitleScreen } from './components/TitleScreen.jsx'
import { OnboardingOverlay } from './components/OnboardingOverlay.jsx'

// ─── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [showTitle, setShowTitle] = useState(() => {
    const p = new URLSearchParams(window.location.search)
    return !sessionStorage.getItem('seenIntro') &&
      p.get('skipIntro') !== '1' &&
      p.get('edit') !== '1' &&
      !p.get('shelf')
  })
  const [hoveredId, setHoveredId] = useState(null)
  // Note: cursor-tracking arm follows displayTarget directly (RAF-throttled from the
  // window pointermove listener below). No intermediate `target` state — an earlier
  // version had one but nothing read it, so it just triggered extra re-renders.
  const [displayTarget, setDisplayTarget] = useState(null)
  const [selected, setSelected] = useState(null)
  const [openPhase, setOpenPhase] = useState('closed')
  const [headDucking, setHeadDucking] = useState(false)
  const headDuckTimerRef = useRef(null)
  const uiOverlayOpenRef = useRef(false)
  const descCacheRef = useRef({})
  const [scale, setScale] = useState(1)
  const scaleRef = useRef(1)
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
  const shelfEditReturnToListRef = useRef(false)

  function finishShelfEdit() {
    const returnToList = shelfEditReturnToListRef.current
    shelfEditReturnToListRef.current = false
    setEditingShelfIdx(null)
    if (returnToList) setShowShelfList(true)
  }

  function saveShelf(idx, newLabel, newColorKey) {
    setShelfConfigs(prev => prev.map((c, i) => i === idx ? { ...c, label: newLabel, colorKey: newColorKey } : c))
    finishShelfEdit()
  }
  function deleteShelf(idx) {
    setShelfConfigs(prev => prev.filter((_, i) => i !== idx))
    setShelfContents(prev => prev.filter((_, i) => i !== idx))
    finishShelfEdit()
  }
  const [showAddShelfModal, setShowAddShelfModal] = useState(false)
  let nextShelfId = useRef(SHELVES.length)
  function addShelf(label = 'New Shelf', colorKey = 'yellow') {
    const id = `shelf_${nextShelfId.current++}`
    setShelfConfigs(prev => [...prev, { id, label, colorKey, items: [] }])
    setShelfContents(prev => [...prev, []])
  }
  function reorderShelf(fromIdx, toIdx) {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0) return
    const move = arr => {
      const next = [...arr]
      const [it] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, it)
      return next
    }
    setShelfConfigs(move)
    setShelfContents(move)
  }

  // ── DB / persistence ───────────────────────────────────────────────────────
  const _urlParams  = new URLSearchParams(window.location.search)
  const _skipIntro  = _urlParams.get('skipIntro') === '1'
  const _startEdit  = _urlParams.get('edit') === '1'
  const [flashInventory, setFlashInventory] = useState(_startEdit)

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
  const [monsterColorKey, setMonsterColorKey] = useState('green')
  const [monsterHatKey, setMonsterHatKey]     = useState('none')
  const [monsterHatColorKey, setMonsterHatColorKey] = useState('red')
  const [showMonsterPanel, setShowMonsterPanel] = useState(false)
  const [showPlateEdit, setShowPlateEdit]   = useState(false)
  const [saveStatus, setSaveStatus]         = useState('')  // 'saving' | 'saved' | 'error' | ''
  const [dbError, setDbError]               = useState(null)
  const [irisOff, setIrisOff]               = useState({ x: 0, y: 0 })
  const headRef = useRef(null)
  const deleteBtnRef = useRef(null)
  const [deleteBtnRect, setDeleteBtnRect] = useState(null)
  const rotateBtnRef = useRef(null)
  const wasOverRotateRef = useRef(false) // touch: edge-detect entry into the rotate zone
  const [showShareModal, setShowShareModal] = useState(false)
  const [linkCopied, setLinkCopied]         = useState(false)
  const [showShareCopyToast, setShowShareCopyToast] = useState(false)
  const shareCopyTimerRef = useRef(null)
  const shareLinkInputRef = useRef(null)
  const [headerVisible, setHeaderVisible]   = useState(true)
  const [nearTop, setNearTop]               = useState(false)
  const [surfacing, setSurfacing]           = useState(false)
  const [titleFromSurface, setTitleFromSurface] = useState(false)
  const [isMobile, setIsMobile]             = useState(() => window.innerWidth < 768)
  // Books stay proportional (fixed shelf height) at every breakpoint; on mobile we
  // deliver "one shelf at a time" via a larger zoom + horizontal pan, not by stretching shelves.
  const [shelfH, setShelfH]               = useState(SHELF_H)
  // Mobile user-controlled zoom multiplier (the +/- buttons), applied on top of the base
  // one-shelf-focus zoom. Pinch is disabled, so these buttons are how the user rescales.
  // Mobile two-state zoom: false = full-bookshelf view (fit width), true = one-shelf
  // detail view (pan within a shelf). Toggled by the single magnifier button.
  const [zoomedIn, setZoomedIn]           = useState(false)
  const zoomedInRef = useRef(false)
  const dragAutoZoomRef = useRef(false)
  const dragGrabAnchorRef = useRef(null)
  const pendingZoomStartRef = useRef(null)
  const scaleAnimatingRef = useRef(false)
  const scaleAnimRafRef = useRef(null)
  const bookcaseLayerRef = useRef(null)   // the shiftable layer holding bookshelf + head + arm
  const bookcaseShiftRef = useRef(0)      // current bookcase-layer top offset (stage units)
  const stageHeightRef = useRef(0)        // rendered stage height, mirrors render-derived value
  const [scaleTransitioning, setScaleTransitioning] = useState(false)
  const [viewerHasOwnShelf, setViewerHasOwnShelf] = useState(false)
  const [inventory, setInventory]           = useState([])
  const [viewerUserId, setViewerUserId]     = useState(null)
  const lastScrollY = useRef(0)
  const prevZoomedInRef = useRef(false)
  const reviewsRef   = useRef(new Map())
  const saveTimerRef = useRef(null)
  const saveInFlightRef = useRef(false)
  const skipAutoSaveRef = useRef(false)

  // ── Edit mode ──────────────────────────────────────────────────────────────
  const [isEditMode, setIsEditMode] = useState(false)
  const [shelfContents, setShelfContents] = useState([])
  const [editDragging, setEditDragging] = useState(null)
  // editDragging = { type, slotWidth, book?, books?, sourceItemId? }
  const [editDragStagePos, setEditDragStagePos] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)
  const [showBookPanel, setShowBookPanel] = useState(false)
  const [showDecorPanel, setShowDecorPanel] = useState(false)
  const [showShelfList, setShowShelfList] = useState(false)  // mobile shelf manager sheet
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
  const scrollRef = useRef(null)

  // Map viewport coords to in-stage coords. X uses container centering when zoomed out;
  // Y always uses the stage rect top (container top diverges on tall scrolled zoom trees).
  function shelfBookcaseBottom() {
    const cached = bookcaseBottomRef.current
    if (cached > 200) return cached
    const n = Math.max(1, shelfContentsRef.current.length)
    return 196 + n * (SHELF_H + 20)
  }

  // Measured stage geometry normalized to viewport (visual) space. Engines disagree on
  // getBoundingClientRect for a CSS-zoomed element: some return the visual box
  // (zoom-multiplied), others return the element's own coordinate space (unzoomed, with
  // even left/top divided by zoom). Detect which convention is in use by checking which
  // interpretation the measured width matches, then normalize.
  function stageMetrics() {
    const el = stageRef.current
    if (!el) return null
    const r = el.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) return null
    const z = scaleRef.current > 0 ? scaleRef.current : 1
    const stageH = stageHeightRef.current > 0
      ? stageHeightRef.current
      : Math.max(960, shelfBookcaseBottom() + 140)
    const ownSpace = Math.abs(r.width - 1080) < Math.abs(r.width - 1080 * z)
    if (ownSpace) {
      // rectZoom converts a measured rect of any element inside the stage to visual space.
      return { left: r.left * z, top: r.top * z, width: 1080 * z, height: stageH * z, sx: z, sy: z, rectZoom: z }
    }
    return { left: r.left, top: r.top, width: r.width, height: r.height, sx: r.width / 1080, sy: r.height / stageH, rectZoom: 1 }
  }

  // Multiplier that converts getBoundingClientRect values of in-stage elements to
  // visual (event clientX/clientY) space. 1 on legacy engines; the stage zoom on
  // engines that return zoom-divided rects.
  function stageRectZoom() {
    const m = stageMetrics()
    return m ? m.rectZoom : 1
  }

  // getBoundingClientRect of an element inside the zoomed stage, normalized to visual
  // space so it can be compared against event clientX/clientY.
  function visualRect(el) {
    const r = el.getBoundingClientRect()
    const rz = stageRectZoom()
    if (rz === 1) return r
    return {
      left: r.left * rz, top: r.top * rz, right: r.right * rz, bottom: r.bottom * rz,
      width: r.width * rz, height: r.height * rz,
    }
  }

  function clientToStage(clientX, clientY, aimHand = false) {
    const m = stageMetrics()
    if (!m) return null

    let originLeft = m.left
    if (isMobileRef.current && !zoomedInRef.current && containerRef.current) {
      // Container is outside the zoom subtree — its rect is always visual-space.
      const cr = containerRef.current.getBoundingClientRect()
      originLeft = cr.left + (cr.width - m.width) / 2
    }

    let x = (clientX - originLeft) / m.sx
    // Bookcase layer coords: the layer is shifted down inside the stage for vertical
    // centering, and the arm/head live inside that layer.
    let y = (clientY - m.top) / m.sy - bookcaseShiftRef.current

    if (aimHand) { x -= 20; y -= 24 }
    const floor = shelfBookcaseBottom()
    y = Math.max(196, Math.min(floor + 36, y))
    return { x, y }
  }

  // Aim the hand at the clicked book's visual center (more reliable than raw click coords).
  function clickToStageAim(clickEvent) {
    if (!clickEvent) return null
    const el = clickEvent.currentTarget
    if (el?.getBoundingClientRect) {
      const r = el.getBoundingClientRect()
      return clientToStage(r.left + r.width / 2, r.top + r.height / 2, true)
    }
    const { clientX, clientY } = clickEvent
    if (clientX == null || clientY == null) return null
    return clientToStage(clientX, clientY, true)
  }

  function trackArmTarget(pos) {
    const from = displayTargetRef.current
    const dy = from ? Math.abs(pos.y - from.y) : 0
    // While the page is scrolling, glide the arm/head instead of chasing every frame.
    if (pageScrollingRef.current) {
      lerpArmTarget(pos, mobileArmSmoothTau() + 0.2)
      return
    }
    // Large jumps (tap on a distant shelf) glide; continuous finger-follow stays snappy.
    const tau = dy > 400 ? 0.5 : dy > 200 ? 0.4 : dy > 80 ? 0.24 : mobileArmSmoothTau()
    lerpArmTarget(pos, tau)
  }

  // Desktop vertical scroll: shelf rows move under a fixed cursor, so snap the arm each
  // frame — lerping here left the hand pointing at the previous row when you clicked.
  function panMonsterOnDesktopScroll(pos) {
    snapArmTarget(pos)
  }

  const clientToStageRef = useRef(clientToStage)
  clientToStageRef.current = clientToStage
  const trackArmTargetRef = useRef(trackArmTarget)
  trackArmTargetRef.current = trackArmTarget
  const panMonsterOnDesktopScrollRef = useRef(panMonsterOnDesktopScroll)
  panMonsterOnDesktopScrollRef.current = panMonsterOnDesktopScroll

  // Raw viewport→stage mapping without the hand-aim offset or floor clamp — used for
  // zoom anchors, where clamping would make the anchor disagree with the actual scroll.
  // Returns bookcase-layer coords (same space as clientToStage).
  function clientToStageRaw(clientX, clientY) {
    const m = stageMetrics()
    if (!m) return null
    let x
    if (isMobileRef.current && !zoomedInRef.current && containerRef.current) {
      const cr = containerRef.current.getBoundingClientRect()
      x = (clientX - (cr.left + (cr.width - m.width) / 2)) / m.sx
    } else {
      x = (clientX - m.left) / m.sx
    }
    return { x, y: (clientY - m.top) / m.sy - bookcaseShiftRef.current }
  }

  function viewportCenterAnchor() {
    const scrollEl = scrollRef.current
    if (!scrollEl) return null
    const r = scrollEl.getBoundingClientRect()
    const cx = r.left + scrollEl.clientWidth / 2
    const cy = r.top + scrollEl.clientHeight / 2
    const pos = clientToStageRaw(cx, cy)
    if (!pos) return null
    return { clientX: cx, clientY: cy, stageX: pos.x, stageY: pos.y }
  }

  // Vertical centering: the stage (cave) stays pinned to the top of the screen and is
  // stretched to fill it; the bookcase layer inside the stage shifts down so the
  // bookshelf sits vertically centered. Shift is scale-dependent, reaching 0 once the
  // bookshelf outgrows the screen, so it animates naturally with zoom transitions.
  function mobileViewPad() {
    return 0
  }

  function bookcaseShiftAt(sc) {
    if (!isMobileRef.current || sc <= 0) return 0
    const scrollEl = scrollRef.current
    const h = (scrollEl ? scrollEl.clientHeight : window.innerHeight) - mobileViewPad()
    const bc = shelfBookcaseBottom()
    return Math.max(0, Math.round(h / (2 * sc) - (176 + bc) / 2))
  }

  function maxScrollTopAt(sc) {
    const scrollEl = scrollRef.current
    if (!scrollEl) return 0
    const stageH = stageHeightRef.current > 0
      ? stageHeightRef.current
      : Math.max(960, shelfBookcaseBottom() + 140)
    return Math.max(0, mobileViewPad() + stageH * sc - scrollEl.clientHeight)
  }

  // Scroll offsets that keep `anchor`'s bookcase-layer point under its viewport position
  // at scale `sc`. Valid in the zoomed-in (flex-start) layout where stage x=0 sits at the
  // scrollport's left edge when scrollLeft is 0.
  function zoomAnchorScroll(anchor, sc) {
    const scrollEl = scrollRef.current
    if (!scrollEl || !anchor) return null
    const r = scrollEl.getBoundingClientRect()
    return {
      left: r.left + anchor.stageX * sc - anchor.clientX,
      top: r.top + mobileViewPad() + (anchor.stageY + bookcaseShiftAt(sc)) * sc - anchor.clientY,
    }
  }

  function applyBookcaseShift(px) {
    bookcaseShiftRef.current = px
    if (bookcaseLayerRef.current) bookcaseLayerRef.current.style.top = `${px}px`
  }

  function cancelScaleAnim() {
    if (!scaleAnimRafRef.current) return
    cancelAnimationFrame(scaleAnimRafRef.current)
    scaleAnimRafRef.current = null
    scaleAnimatingRef.current = false
    setScaleTransitioning(false)
    if (stageRef.current) stageRef.current.style.zoom = String(scaleRef.current)
    applyBookcaseShift(bookcaseShiftAt(scaleRef.current))
  }

  // Animate CSS zoom from→to while scrolling so `anchor` stays put on screen. Per frame
  // the scroll follows the anchor exactly, plus an eased correction toward `endScroll`
  // (the clamped final position) so clamp differences are absorbed smoothly, not jumped.
  function animateMobileScale(from, to, anchor, endScroll, onDone) {
    cancelScaleAnim()
    scaleAnimatingRef.current = true
    setScaleTransitioning(true)
    const duration = 560
    const stageEl = stageRef.current
    const endRaw = zoomAnchorScroll(anchor, to)
    const corrL = endRaw ? endScroll.left - endRaw.left : 0
    const corrT = endRaw ? endScroll.top - endRaw.top : 0
    let t0 = null

    function step(ts) {
      if (!t0) t0 = ts
      const p = Math.min(1, (ts - t0) / duration)
      // Smootherstep — zero 1st/2nd derivative at endpoints (no abrupt start/stop).
      const eased = p * p * p * (p * (p * 6 - 15) + 10)
      const s = from + (to - from) * eased
      scaleRef.current = s

      // DOM-only zoom + bookcase-layer shift during the transition — avoids re-rendering
      // the whole tree each frame.
      if (stageEl) stageEl.style.zoom = String(s)
      if (isMobileRef.current) applyBookcaseShift(bookcaseShiftAt(s))

      const scrollEl = scrollRef.current
      const a = zoomAnchorScroll(anchor, s)
      if (scrollEl && a) {
        scrollEl.scrollLeft = a.left + corrL * eased
        scrollEl.scrollTop = a.top + corrT * eased
      }

      if (p < 1) {
        scaleAnimRafRef.current = requestAnimationFrame(step)
      } else {
        scaleAnimRafRef.current = null
        scaleAnimatingRef.current = false
        // Keep the final zoom applied — React re-writes the same value on the next
        // commit. Clearing it here can paint one frame at zoom:1 (visible glitch).
        if (stageEl) stageEl.style.zoom = String(to)
        setScaleTransitioning(false)
        setScale(to)
        onDone?.()
      }
    }
    scaleAnimRafRef.current = requestAnimationFrame(step)
  }

  // Zoom into detail view keeping `anchor` fixed under the finger / viewport point.
  function startMobileZoomIn(anchor, onReady) {
    const fromScale = scaleRef.current
    const scrollEl = scrollRef.current
    const w = scrollEl?.clientWidth ?? window.innerWidth
    const toScale = computeMobileScale(true, w)
    scaleAnimatingRef.current = true
    setScaleTransitioning(true)
    zoomedInRef.current = true

    // Final resting scroll: anchor position clamped to the shelf pan bounds.
    const endRaw = zoomAnchorScroll(anchor, toScale) ?? { left: 0, top: 0 }
    let endLeft = endRaw.left
    if (scrollEl) {
      const { min, max } = mobileShelfScrollBounds(scrollEl, toScale)
      endLeft = Math.max(min, Math.min(max, endLeft))
    }
    const endTop = Math.min(Math.max(0, endRaw.top), maxScrollTopAt(toScale))

    // The layout flip (centered → flex-start) happens on this state change; the paired
    // layout effect applies the equivalent scroll before paint, then starts the animation.
    pendingZoomStartRef.current = {
      scroll: zoomAnchorScroll(anchor, fromScale),
      run: () => animateMobileScale(fromScale, toScale, anchor, { left: endLeft, top: endTop }, onReady),
    }
    setZoomedIn(true)
  }

  // Zoom back out to the full-bookshelf view. Ends exactly on the centered zoomed-out
  // framing so the layout flip afterwards is visually a no-op.
  function startMobileZoomOut(onDone) {
    const scrollEl = scrollRef.current
    const w = scrollEl?.clientWidth ?? window.innerWidth
    const fromScale = scaleRef.current
    const toScale = computeMobileScale(false, w)
    const anchor = viewportCenterAnchor()
    const finish = () => {
      zoomedInRef.current = false
      setZoomedIn(false)
      onDone?.()
    }
    if (!anchor) { finish(); return }
    // Centered-layout equivalent: stage cropped equally left/right; keep the anchor's row in view.
    const endLeft = Math.max(0, (1080 * toScale - w) / 2)
    const endRaw = zoomAnchorScroll(anchor, toScale)
    const endTop = Math.min(Math.max(0, endRaw ? endRaw.top : 0), maxScrollTopAt(toScale))
    animateMobileScale(fromScale, toScale, anchor, { left: endLeft, top: endTop }, finish)
  }

  function toggleMobileZoom() {
    if (scaleAnimatingRef.current) return
    if (zoomedInRef.current) {
      startMobileZoomOut()
    } else {
      const anchor = viewportCenterAnchor()
      if (anchor) startMobileZoomIn(anchor)
      else setZoomedIn(true)
    }
  }

  function ensureMobileDragZoom(clientX, clientY, onReady) {
    if (!isMobileRef.current || zoomedInRef.current) {
      dragAutoZoomRef.current = false
      return false
    }
    const grabPos = clientToStageRaw(clientX, clientY)
    if (!grabPos) return false
    dragAutoZoomRef.current = true
    dragGrabAnchorRef.current = { clientX, clientY, stageX: grabPos.x, stageY: grabPos.y }
    startMobileZoomIn(dragGrabAnchorRef.current, onReady)
    return true
  }

  function mobileArmSmoothTau() {
    if (isEditModeRef.current) return 0.18
    return zoomedInRef.current ? 0.16 : 0.13
  }

  const [scrollUnlocked, setScrollUnlocked] = useState(false)
  const GAP_VH = 80
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
  const [dragOverRotate, setDragOverRotate] = useState(false)
  const dragOverRotateRef = useRef(false)
  const deleteConfirmedRef = useRef(false)
  const rotateDelayTimer = useRef(null)
  const rotateCooldownUntil = useRef(0)
  const [rotateAnimKey, setRotateAnimKey] = useState(0)
  const retractModeRef = useRef(0)
  const lastMousePosRef = useRef(null)    // last known cursor in stage-local coords
  const viewportMouseRef = useRef(null)   // last known cursor in raw viewport coords
  const pageScrollingRef = useRef(false) // true while the page scrollport is moving
  const lastDesktopScrollTopRef = useRef(0)
  const bookcaseBottomRef = useRef(0)     // stage-coord bookcase floor, mirrors render-derived bookcaseBottom
  const armGoalRef = useRef(null)         // unified lerp goal for arm tracking
  const armLerpRafRef = useRef(null)
  const armLerpTauRef = useRef(0.34)
  const armLerpLastTsRef = useRef(null)
  const armLerpContinueRef = useRef(() => true)
  const isMobileRef = useRef(false)
  const headGoalRef = useRef({ left: 630, top: 200, rotate: 0 })
  const headDisplayRef = useRef({ left: 630, top: 200, rotate: 0 })
  const headLerpRafRef = useRef(null)
  const headLerpLastTsRef = useRef(null)
  const headLerpTauRef = useRef(0.2)
  const [headDisplay, setHeadDisplay] = useState({ left: 630, top: 200, rotate: 0 })

  // Glide the arm toward a goal instead of snapping. Used for scroll, mobile touch
  // (browse + edit), and desktop mouse stays direct/snappy.
  // tau = seconds to close ~63% of the gap (exponential ease); frame-rate independent.
  function lerpArmTarget(goal, tau = 0.34, shouldContinue = null) {
    armGoalRef.current = goal
    armLerpTauRef.current = tau
    armLerpContinueRef.current = shouldContinue ?? (() => true)
    if (armLerpRafRef.current) return
    armLerpLastTsRef.current = null
    function step(ts) {
      if (!armLerpContinueRef.current()) {
        armLerpRafRef.current = null
        armLerpLastTsRef.current = null
        return
      }
      const tgt = armGoalRef.current
      const from = displayTargetRef.current
      if (!tgt) { armLerpRafRef.current = null; armLerpLastTsRef.current = null; return }
      if (!from) {
        displayTargetRef.current = { ...tgt }
        setDisplayTarget({ ...tgt })
        armLerpRafRef.current = null
        armLerpLastTsRef.current = null
        return
      }
      if (armLerpLastTsRef.current == null) armLerpLastTsRef.current = ts
      const dt = Math.min(48, ts - armLerpLastTsRef.current) / 1000
      armLerpLastTsRef.current = ts
      const a = 1 - Math.exp(-dt / Math.max(0.08, armLerpTauRef.current))
      const next = {
        x: from.x + (tgt.x - from.x) * a,
        y: from.y + (tgt.y - from.y) * a,
      }
      if (Math.hypot(next.x - tgt.x, next.y - tgt.y) < 0.35) {
        displayTargetRef.current = { ...tgt }
        setDisplayTarget({ ...tgt })
        armLerpRafRef.current = null
        armLerpLastTsRef.current = null
        return
      }
      displayTargetRef.current = next
      setDisplayTarget({ ...next })
      armLerpRafRef.current = requestAnimationFrame(step)
    }
    armLerpRafRef.current = requestAnimationFrame(step)
  }

  // Snap the arm to a goal immediately — used when picking up a book so the hand
  // doesn't lerp from a stale hover/scroll position.
  function snapArmTarget(goal) {
    if (armLerpRafRef.current) {
      cancelAnimationFrame(armLerpRafRef.current)
      armLerpRafRef.current = null
      armLerpLastTsRef.current = null
    }
    armGoalRef.current = goal
    displayTargetRef.current = { ...goal }
    setDisplayTarget({ ...goal })
  }

  function ensureHeadLerp() {
    if (headLerpRafRef.current) return
    headLerpLastTsRef.current = null
    function step(ts) {
      const tgt = headGoalRef.current
      const from = headDisplayRef.current
      if (!tgt || !from) {
        headLerpRafRef.current = null
        headLerpLastTsRef.current = null
        return
      }
      if (headLerpLastTsRef.current == null) headLerpLastTsRef.current = ts
      const dt = Math.min(48, ts - headLerpLastTsRef.current) / 1000
      headLerpLastTsRef.current = ts
      const a = 1 - Math.exp(-dt / Math.max(0.08, headLerpTauRef.current))
      const next = {
        left: from.left + (tgt.left - from.left) * a,
        top: from.top + (tgt.top - from.top) * a,
        rotate: from.rotate + (tgt.rotate - from.rotate) * a,
      }
      const dist = Math.hypot(next.left - tgt.left, next.top - tgt.top)
      const rotDist = Math.abs(next.rotate - tgt.rotate)
      if (dist < 0.45 && rotDist < 0.1) {
        headDisplayRef.current = { ...tgt }
        setHeadDisplay({ ...tgt })
        headLerpRafRef.current = null
        headLerpLastTsRef.current = null
        return
      }
      headDisplayRef.current = next
      setHeadDisplay({ ...next })
      headLerpRafRef.current = requestAnimationFrame(step)
    }
    headLerpRafRef.current = requestAnimationFrame(step)
  }

  useEffect(() => { isMobileRef.current = isMobile }, [isMobile])
  useEffect(() => { zoomedInRef.current = zoomedIn }, [zoomedIn])

  // Stage zoom + bookcase-layer shift are applied imperatively on every commit (no dep
  // array): during the zoom animation scaleRef is driven per-frame, and any React
  // re-render in between (arm lerp, drag state) would otherwise paint a stale value.
  useLayoutEffect(() => {
    if (!scaleAnimatingRef.current) scaleRef.current = scale
    if (stageRef.current) stageRef.current.style.zoom = String(scaleRef.current)
    if (isMobile) applyBookcaseShift(bookcaseShiftAt(scaleRef.current))
    else applyBookcaseShift(0)
  })

  // Zoom-in starts with a layout flip (centered → flex-start). Apply the equivalent
  // scroll before paint so the flip is invisible, then start the scale animation.
  useLayoutEffect(() => {
    if (!zoomedIn) return
    const pending = pendingZoomStartRef.current
    if (!pending) return
    pendingZoomStartRef.current = null
    const scrollEl = scrollRef.current
    if (scrollEl && pending.scroll) {
      scrollEl.scrollLeft = pending.scroll.left
      scrollEl.scrollTop = pending.scroll.top
    }
    pending.run()
  }, [zoomedIn])

  // Restore zoomed-out view after a drag that auto-zoomed in for placement precision.
  useEffect(() => {
    if (editDragging !== null) return
    if (!dragAutoZoomRef.current) return
    dragAutoZoomRef.current = false
    startMobileZoomOut()
  }, [editDragging])
  useEffect(() => { if (!scaleAnimatingRef.current) scaleRef.current = scale }, [scale])

  useEffect(() => {
    SHELVES.flatMap(s => s.items).forEach(item => {
      if (item.thumbnail) { const img = new Image(); img.src = item.thumbnail }
    })
  }, [])

  // Preload covers for every book on the user's shelf so the overlay shows them instantly.
  useEffect(() => {
    const seen = new Set()
    for (const row of shelfContents) {
      for (const item of row) {
        const books = item.type === 'vertical-book' ? [item.book] : (item.books ?? [])
        for (const b of books) {
          if (b?.thumbnail && !seen.has(b.thumbnail)) {
            seen.add(b.thumbnail)
            const img = new Image()
            img.src = b.thumbnail
          }
        }
      }
    }
  }, [shelfContents])

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    function updateScale() {
      // Skip while an animated zoom drives scale imperatively.
      if (scaleAnimatingRef.current) return
      // Mobile scale is off viewport width (containerRef sizes to content on mobile).
      // Desktop scale uses containerRef's clientWidth so scrollbars don't shift centering.
      const w = isMobile
        ? (scrollRef.current ? scrollRef.current.clientWidth : window.innerWidth)
        : (containerRef.current ? containerRef.current.clientWidth : window.innerWidth)
      let s
      if (isMobile) {
        s = computeMobileScale(zoomedIn, w)
      } else {
        s = Math.max(0.45, Math.min(2.5, w / 1080))
      }
      setScale(s)
      setShelfH(SHELF_H)
    }
    updateScale()
    // Also update when scrollbar appears/disappears (content height changes)
    const observed = isMobile ? scrollRef.current : containerRef.current
    const ro = typeof ResizeObserver !== 'undefined' && observed
      ? new ResizeObserver(updateScale)
      : null
    if (ro && observed) ro.observe(observed)
    window.addEventListener('resize', updateScale)
    return () => { window.removeEventListener('resize', updateScale); ro?.disconnect() }
  }, [isMobile, zoomedIn])

  // Horizontal scroll: locked on desktop; on mobile locked when zoomed out, clamped when zoomed in.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let clampRaf = null
    let settleAnimRaf = null
    function easeScrollLeftTo(target) {
      if (settleAnimRaf) cancelAnimationFrame(settleAnimRaf)
      const start = el.scrollLeft
      const diff = target - start
      if (Math.abs(diff) < 0.5) {
        el.scrollLeft = target
        return
      }
      const duration = 240
      let t0 = null
      function step(ts) {
        if (!t0) t0 = ts
        const p = Math.min(1, (ts - t0) / duration)
        const eased = p * p * (3 - 2 * p)
        el.scrollLeft = start + diff * eased
        if (p < 1) settleAnimRaf = requestAnimationFrame(step)
        else {
          el.scrollLeft = target
          settleAnimRaf = null
        }
      }
      settleAnimRaf = requestAnimationFrame(step)
    }
    function softClampX() {
      if (scaleAnimatingRef.current) return
      if (!isMobile) {
        if (el.scrollLeft !== 0) el.scrollLeft = 0
        return
      }
      if (!zoomedInRef.current) {
        if (el.scrollLeft !== 0) el.scrollLeft = 0
        return
      }
      const { min, max } = mobileShelfScrollBounds(el, scaleRef.current)
      const x = el.scrollLeft
      if (x < min) el.scrollLeft = x + (min - x) * 0.4
      else if (x > max) el.scrollLeft = x + (max - x) * 0.4
    }
    function settleClampX() {
      if (scaleAnimatingRef.current) return
      if (!isMobile) {
        if (el.scrollLeft !== 0) el.scrollLeft = 0
        return
      }
      if (!zoomedInRef.current) {
        if (el.scrollLeft !== 0) el.scrollLeft = 0
        return
      }
      const { min, max } = mobileShelfScrollBounds(el, scaleRef.current)
      const x = el.scrollLeft
      if (x < min - 0.5) easeScrollLeftTo(min)
      else if (x > max + 0.5) easeScrollLeftTo(max)
      else if (x < min || x > max) el.scrollLeft = Math.max(min, Math.min(max, x))
    }
    function onScroll() {
      if (scaleAnimatingRef.current) return
      if (!isMobile) {
        if (el.scrollLeft !== 0) el.scrollLeft = 0
        return
      }
      if (!zoomedInRef.current) {
        if (el.scrollLeft !== 0) el.scrollLeft = 0
        return
      }
      // Gentle pull during momentum; hard settle waits for scrollend/touchend.
      if (!clampRaf) {
        clampRaf = requestAnimationFrame(() => {
          clampRaf = null
          softClampX()
        })
      }
    }
    function settleX() {
      if (clampRaf) { cancelAnimationFrame(clampRaf); clampRaf = null }
      settleClampX()
    }
    function onWheel(e) {
      if (isMobile || e.deltaX === 0) return
      e.preventDefault()
      if (el.scrollLeft !== 0) el.scrollLeft = 0
    }
    softClampX()
    el.addEventListener('scroll', onScroll, { passive: true })
    el.addEventListener('touchend', settleX, { passive: true })
    el.addEventListener('scrollend', settleX, { passive: true })
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('scroll', onScroll)
      el.removeEventListener('touchend', settleX)
      el.removeEventListener('scrollend', settleX)
      el.removeEventListener('wheel', onWheel)
      if (clampRaf) cancelAnimationFrame(clampRaf)
      if (settleAnimRaf) cancelAnimationFrame(settleAnimRaf)
    }
  }, [isMobile, bookcaseRevealed, zoomedIn])

  // Desktop vertical scroll — dedicated handler pans the monster to the cursor's new
  // stage-local position (lerped). Kept separate from mousemove and mobile scroll logic.
  useEffect(() => {
    if (isMobile) return
    const el = scrollRef.current
    if (!el) return
    let panRaf = null
    let scrollIdleTimer = null

    function markPageScrolling() {
      pageScrollingRef.current = true
      clearTimeout(scrollIdleTimer)
      scrollIdleTimer = setTimeout(() => {
        pageScrollingRef.current = false
      }, 220)
    }

    function panMonsterToScrollAim() {
      if (introBlockRef.current) return
      if (selected || grabPhaseRef.current || editDraggingRef.current) return
      const vm = viewportMouseRef.current
      if (!vm) return
      const newPos = clientToStageRef.current(vm.x, vm.y, false)
      if (!newPos) return
      lastMousePosRef.current = newPos
      panMonsterOnDesktopScrollRef.current(newPos)
    }

    function onDesktopScroll() {
      const top = el.scrollTop
      if (top === lastDesktopScrollTopRef.current) return
      lastDesktopScrollTopRef.current = top
      markPageScrolling()
      if (panRaf) return
      panRaf = requestAnimationFrame(() => {
        panRaf = null
        panMonsterToScrollAim()
      })
    }

    function onDesktopWheel() {
      markPageScrolling()
    }

    lastDesktopScrollTopRef.current = el.scrollTop
    el.addEventListener('scroll', onDesktopScroll, { passive: true })
    el.addEventListener('wheel', onDesktopWheel, { passive: true })
    return () => {
      el.removeEventListener('scroll', onDesktopScroll)
      el.removeEventListener('wheel', onDesktopWheel)
      clearTimeout(scrollIdleTimer)
      if (panRaf) cancelAnimationFrame(panRaf)
    }
  }, [isMobile, selected, editDragging])

  // Mobile vertical scroll — lerp arm to the cursor's stage-local aim as shelves move.
  useEffect(() => {
    if (!isMobile) return
    const el = scrollRef.current
    if (!el) return
    let scrollRaf = null
    let scrollIdleTimer = null
    function markPageScrolling() {
      pageScrollingRef.current = true
      clearTimeout(scrollIdleTimer)
      scrollIdleTimer = setTimeout(() => {
        pageScrollingRef.current = false
      }, 220)
    }
    function onMobileScroll() {
      markPageScrolling()
      if (scrollRaf) return
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = null
        if (introBlockRef.current) return
        if (selected || grabPhaseRef.current || editDraggingRef.current) return
        const vm = viewportMouseRef.current
        if (!vm) return
        const newPos = clientToStageRef.current(vm.x, vm.y, true)
        if (!newPos) return
        lastMousePosRef.current = newPos
        trackArmTargetRef.current(newPos)
      })
    }
    el.addEventListener('scroll', onMobileScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onMobileScroll)
      if (scrollRaf) cancelAnimationFrame(scrollRaf)
      clearTimeout(scrollIdleTimer)
    }
  }, [isMobile, selected, editDragging])

  // Zoomed-in: center horizontal scroll on the bookcase only when entering detail view.
  useEffect(() => {
    if (!isMobile || !bookcaseRevealed) {
      prevZoomedInRef.current = zoomedIn
      return
    }
    const justZoomedIn = zoomedIn && !prevZoomedInRef.current
    prevZoomedInRef.current = zoomedIn
    if (!justZoomedIn) return
    // Animated zooms (drag auto-zoom + magnifier button) position the scroll themselves.
    if (scaleAnimatingRef.current || dragAutoZoomRef.current) return
    const el = scrollRef.current
    if (!el) return
    requestAnimationFrame(() => {
      const sc = scaleRef.current
      const bookcaseCenterScreen = (BOOKCASE_LEFT + BOOKCASE_WIDTH / 2) * sc
      const { min, max } = mobileShelfScrollBounds(el, sc)
      const target = Math.max(min, Math.min(max, bookcaseCenterScreen - el.clientWidth / 2 - MOBILE_ZOOMED_IN_MONSTER_BIAS * sc))
      el.scrollLeft = target
    })
  }, [isMobile, zoomedIn, bookcaseRevealed])

  // Zoomed-out: always reset horizontal offset when leaving detail view.
  useEffect(() => {
    if (!isMobile || zoomedIn || scaleAnimatingRef.current) return
    const el = scrollRef.current
    if (el) el.scrollLeft = 0
  }, [isMobile, zoomedIn, scale])

  // Block iOS Safari's pinch / double-tap zoom — it ignores user-scalable=no in the
  // viewport meta, so the visual size of books/decor would drift from their true size.
  useEffect(() => {
    const stop = e => e.preventDefault()
    let lastTouchEnd = 0
    const onTouchEnd = e => {
      const now = Date.now()
      if (now - lastTouchEnd < 300) e.preventDefault()  // double-tap zoom
      lastTouchEnd = now
    }
    document.addEventListener('gesturestart', stop)     // iOS pinch
    document.addEventListener('gesturechange', stop)
    document.addEventListener('touchend', onTouchEnd, { passive: false })
    return () => {
      document.removeEventListener('gesturestart', stop)
      document.removeEventListener('gesturechange', stop)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  // scroll-to-shelf handled directly in handleReveal (Mode 1 only)

  // ── DB: load on mount, auto-save on changes ───────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function bootstrapOwner() {
      const uid = await resolveUserId()
      const shelf = await loadShelfByUserId(uid)
      const isNewUser = !shelf || shelf.rows.length === 0
      if (cancelled) return
      if (!isNewUser) {
        setShelfName(shelf.name)
        setShareId(shelf.shareId)
        const { shelfConfigs: cfgs, shelfContents: cnts } = reconstructShelf(shelf)
        setShelfConfigs(cfgs)
        setShelfContents(cnts)
      }
      reviewsRef.current = await loadReviews(uid)
      const uname = await getUsername(uid)
      const look = await getMonsterLook(uid)
      const inv = await loadInventory(uid)
      if (cancelled) return
      setIsDbLoaded(true)
      setUserId(uid)
      setUsername(uname ?? '')
      setMonsterColorKey(look.colorKey)
      setMonsterHatKey(look.hatKey)
      setMonsterHatColorKey(look.hatColorKey)
      setInventory(inv)
      if (isNewUser) setShowOnboarding(true)
      if (_startEdit) { isEditModeRef.current = true; setIsEditMode(true) }
      if (_skipIntro || _startEdit) window.history.replaceState({}, '', window.location.pathname)
    }

    async function bootstrapViewer(urlShareId) {
      const result = await loadShelfByShareId(urlShareId)
      if (!result) {
        if (!cancelled) setDbError('This collection link is invalid or no longer exists.')
        return
      }
      if (cancelled) return
      setIsViewOnly(true)
      setShelfName(result.name)
      const { shelfConfigs: cfgs, shelfContents: cnts } = reconstructShelf(result)
      setShelfConfigs(cfgs)
      setShelfContents(cnts)
      reviewsRef.current = await loadReviews(result.ownerUserId)
      const ownerName = await getUsername(result.ownerUserId)
      const ownerLook = await getMonsterLook(result.ownerUserId)
      if (cancelled) return
      setUsername(ownerName ?? '')
      setMonsterColorKey(ownerLook.colorKey)
      setMonsterHatKey(ownerLook.hatKey)
      setMonsterHatColorKey(ownerLook.hatColorKey)
      setIsDbLoaded(true)
      // background: check if viewer has their own shelf + store their userId
      try {
        const uid = await resolveUserId()
        if (cancelled) return
        setViewerUserId(uid)
        const sid = await getShareId(uid)
        if (sid) setViewerHasOwnShelf(true)
      } catch {
        // non-fatal — view-only shelf still works without viewer identity
      }
    }

    const urlShareId = new URLSearchParams(window.location.search).get('shelf')
    const run = urlShareId ? () => bootstrapViewer(urlShareId) : bootstrapOwner
    run().catch(err => {
      if (cancelled) return
      const msg = err instanceof DbError ? err.message : 'Could not connect. Check your network and try again.'
      setDbError(msg)
    })

    return () => { cancelled = true }
  }, [])

  async function handleOnboardingSubmit(displayName, newShelfName) {
    setShelfName(newShelfName)
    setUsername(displayName)
    try {
      await saveUsername(userId, displayName)
      const { configs, contents } = await fetchDefaultShelfData()
      skipAutoSaveRef.current = true
      setShelfConfigs(configs)
      setShelfContents(contents)
      await persistShelf(userId, newShelfName, configs, contents)
      const sid = await getShareId(userId)
      if (sid) setShareId(sid)
      setShowOnboarding(false)
    } catch (err) {
      setSaveStatus('error')
      throw err
    }
  }

  async function handlePlateSave(newShelfName, newUsername) {
    setShelfName(newShelfName)
    setUsername(newUsername)
    if (userId) await saveUsername(userId, newUsername)
    setShowPlateEdit(false)
  }

  function clearShareCopyNotice() {
    clearTimeout(shareCopyTimerRef.current)
    shareCopyTimerRef.current = null
    setLinkCopied(false)
    setShowShareCopyToast(false)
  }

  async function copyShareLink() {
    if (!shareId) return
    const url = `${window.location.origin}${window.location.pathname}?shelf=${shareId}`
    let copied = false

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url)
        copied = true
      } catch { /* fall through to input fallback */ }
    }

    if (!copied && shareLinkInputRef.current) {
      const input = shareLinkInputRef.current
      input.focus()
      input.select()
      input.setSelectionRange(0, url.length)
      try { copied = document.execCommand('copy') } catch { /* ignore */ }
    }

    if (!copied) return

    setLinkCopied(true)
    setShowShareCopyToast(true)
    if (isMobileRef.current) setShowShareModal(false)
    clearTimeout(shareCopyTimerRef.current)
    shareCopyTimerRef.current = setTimeout(clearShareCopyNotice, 2800)
  }

  async function handleMonsterSave(colorKey, hatKey, hatColorKey) {
    setMonsterColorKey(colorKey)
    setMonsterHatKey(hatKey)
    setMonsterHatColorKey(hatColorKey)
    if (userId && !isViewOnly) {
      try { await setMonsterLook(userId, colorKey, hatKey, hatColorKey) } catch { setSaveStatus('error') }
    }
  }

  useEffect(() => {
    if (!userId || isViewOnly || !isDbLoaded || showOnboarding) return
    if (skipAutoSaveRef.current) {
      skipAutoSaveRef.current = false
      return
    }
    clearTimeout(saveTimerRef.current)
    setSaveStatus('saving')
    saveTimerRef.current = setTimeout(async () => {
      if (saveInFlightRef.current) return
      saveInFlightRef.current = true
      try {
        await persistShelf(userId, shelfName, shelfConfigs, shelfContents)
        if (!shareId) setShareId(await getShareId(userId))
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus(s => s === 'saved' ? '' : s), 2000)
      } catch {
        setSaveStatus('error')
      } finally {
        saveInFlightRef.current = false
      }
    }, 2000)
  }, [shelfConfigs, shelfContents, shelfName, userId, isDbLoaded, showOnboarding]) // eslint-disable-line

  useEffect(() => { document.fonts.load("700 1em 'Gasoek One'") }, [])

  // Intro reveal sequence:
  //   0–565ms   : smoke only — arm follows cursor freely throughout
  //   565–1130ms: bookcase appears under smoke; head parked below shelf, arm tracks cursor
  //   1130–1950ms: smoke off; head rises from below to top-of-shelf position, arm free
  //   1950ms    : headIntroTop released, normal formula takes over
  useEffect(() => {
    if (!isDbLoaded || showOnboarding || bookcaseRevealed || showTitle) return

    window.scrollTo({ top: 0, behavior: 'instant' })
    document.body.style.overflow = 'hidden'

    // Smoke-only path: reload / view-only / skipIntro — poof then reveal.
    if (_skipIntro || isViewOnly) {
      setPoofActive(true)
      const tReveal = setTimeout(() => setBookcaseRevealed(true), 450)
      const tClear  = setTimeout(() => { setPoofActive(false); document.body.style.overflow = ''; setScrollUnlocked(true) }, 900)
      return () => { clearTimeout(tReveal); clearTimeout(tClear) }
    }

    // Mode 1 (from title intro): no poof — reveal immediately, head pops up from behind
    // the bookshelf. It renders at z 1 (shelf rows are z 2 and opaque), so starting just
    // below the top board keeps it hidden until it rises above the shelf.
    const startBelow = 340
    let emergeRaf = null

    setBookcaseRevealed(true)
    setHeadIntroTop(startBelow)
    setHeadIntroLeft(580)

    const t1 = setTimeout(() => {
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
          setScrollUnlocked(true)
        }
      }
      emergeRaf = requestAnimationFrame(frameEmerge)
    }, 200)

    return () => {
      clearTimeout(t1)
      if (emergeRaf) cancelAnimationFrame(emergeRaf)
      setHeadIntroTop(null)
      setHeadIntroLeft(null)
      document.body.style.overflow = ''
    }
  }, [isDbLoaded, showOnboarding, showTitle]) // eslint-disable-line

  // Title scroll path reveals the bookcase before dismiss; unlock scroll once the title
  // DOM is gone so desktop isn't stuck with overflow:hidden.
  useEffect(() => {
    if (!isDbLoaded || showOnboarding || showTitle || !bookcaseRevealed) return
    document.body.style.overflow = ''
    if (!isMobile) setScrollUnlocked(true)
  }, [isDbLoaded, showOnboarding, showTitle, bookcaseRevealed, isMobile])

  // Header hide/show: requires 80px scroll movement to toggle, cursor within 70px of top reveals it,
  // hides after 3s of mouse inactivity away from top
  useEffect(() => {
    let anchor = 0
    const THRESHOLD = 80
    let idleTimer = null

    const scheduleHide = () => {
      clearTimeout(idleTimer)
      idleTimer = setTimeout(() => {
        if ((scrollRef.current?.scrollTop ?? 0) > 10) setHeaderVisible(false)
      }, 3000)
    }

    const onScroll = () => {
      const y = scrollRef.current ? scrollRef.current.scrollTop : 0
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
      setNearTop(e.clientY < 90 && Math.abs(e.clientX - window.innerWidth / 2) < 110)
    }

    const scrollEl = scrollRef.current
    scrollEl?.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('mousemove', onMouseMove)
    return () => {
      scrollEl?.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMouseMove)
      clearTimeout(idleTimer)
    }
  }, [])

  useEffect(() => () => {
    clearTimeout(closeTimer.current)
    clearTimeout(leaveTimerRef.current)
    clearTimeout(shareCopyTimerRef.current)
    cancelAnimationFrame(retractRef.current)
    cancelAnimationFrame(grabRafRef.current)
    cancelAnimationFrame(armLerpRafRef.current)
    cancelAnimationFrame(headLerpRafRef.current)
    cancelScaleAnim()
  }, [])

  // Auto-clear the temporary top transition after the pop-up animation completes
  useEffect(() => {
    if (!applyTopTransition) return
    const t = setTimeout(() => setApplyTopTransition(false), 450)
    return () => clearTimeout(t)
  }, [applyTopTransition])

  // Glide the head toward the pose derived from the arm instead of CSS-snapping left/top.
  useEffect(() => {
    const smoothHeadFollow = headIntroTop === null && headIntroLeft === null
      && !(grabPhase === 'returning' || grabPhase === 'done' || selected !== null)
      && !applyTopTransition
    if (!smoothHeadFollow) {
      if (headLerpRafRef.current) {
        cancelAnimationFrame(headLerpRafRef.current)
        headLerpRafRef.current = null
        headLerpLastTsRef.current = null
      }
      const goal = headGoalRef.current
      headDisplayRef.current = goal
      setHeadDisplay(goal)
      return
    }
    ensureHeadLerp()
  }, [
    displayTarget,
    retractMode,
    headIntroTop,
    headIntroLeft,
    grabPhase,
    selected,
    applyTopTransition,
    closingToTopRow,
    isMobile,
    editDragging,
  ])

  // Stage-level onMouseMove — desktop only; used to clear leave timer / hover.
  // Arm-follow tracking is done globally in the window pointermove effect below.
  const handleMove = useCallback((e) => {
    if (selected) return
    if (grabPhaseRef.current) return
    if (isEditMode) return
    clearTimeout(leaveTimerRef.current)
  }, [selected, isEditMode])

  const handleLeave = useCallback(() => {
    if (selected) return
    if (grabPhaseRef.current) return
    if (isEditMode) return
    clearTimeout(leaveTimerRef.current)
    setHoveredId(null)
  }, [selected, isEditMode])

  // Track cursor globally — RAF-throttled so React re-renders at most once per frame
  useEffect(() => {
    let rafId = null

    function applyArmTarget(pos, touch) {
      const mobileTouch = touch && isMobileRef.current
      if (mobileTouch) {
        // Browse + idle edit: glide on mobile. Edit-drag uses its own handler below.
        if (!editDraggingRef.current) {
          trackArmTargetRef.current(pos)
        }
      } else {
        if (armLerpRafRef.current) { cancelAnimationFrame(armLerpRafRef.current); armLerpRafRef.current = null }
        cancelAnimationFrame(retractRef.current)
        displayTargetRef.current = pos
        setDisplayTarget(pos)
      }
    }

    function onWindowMove(e, touch = false) {
      const prevVm = viewportMouseRef.current
      const sameViewport = prevVm && prevVm.x === e.clientX && prevVm.y === e.clientY
      // While the page is scrolling, dedicated scroll handlers own arm updates.
      if (pageScrollingRef.current) return
      if (!touch && !isMobileRef.current && sameViewport) return
      const pos = clientToStage(e.clientX, e.clientY, touch && isMobileRef.current)
      if (!pos) return
      viewportMouseRef.current = { x: e.clientX, y: e.clientY }
      lastMousePosRef.current = pos
      if (uiOverlayOpenRef.current) return
      if (grabPhaseRef.current) return
      if (introBlockRef.current) return
      if (editDraggingRef.current) return
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        applyArmTarget(lastMousePosRef.current, touch)
      })
    }

    function onWindowPointer(e) {
      if (e.pointerType === 'touch') onWindowMove(e, true)
    }

    // Tap without much movement still needs a lerp goal on mobile
    function onWindowPointerDown(e) {
      if (e.pointerType !== 'touch' || !isMobileRef.current) return
      if (uiOverlayOpenRef.current || grabPhaseRef.current || introBlockRef.current || editDraggingRef.current) return
      const pos = clientToStage(e.clientX, e.clientY, true)
      if (!pos) return
      viewportMouseRef.current = { x: e.clientX, y: e.clientY }
      lastMousePosRef.current = pos
      trackArmTargetRef.current(pos)
    }

    window.addEventListener('mousemove', onWindowMove)
    window.addEventListener('pointermove', onWindowPointer)
    window.addEventListener('pointerdown', onWindowPointerDown)
    return () => {
      window.removeEventListener('mousemove', onWindowMove)
      window.removeEventListener('pointermove', onWindowPointer)
      window.removeEventListener('pointerdown', onWindowPointerDown)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [selected, showBookPanel, showDecorPanel, showMonsterPanel, showShelfList, showShareModal, showPlateEdit, showAddShelfModal, editingShelfIdx, showOnboarding])

  // Capture taps/clicks on the stage so shelf touches always reach the arm handler.
  useEffect(() => {
    if (!bookcaseRevealed) return
    const el = stageRef.current
    if (!el) return
    function onStageDown(e) {
      if (editDraggingRef.current || uiOverlayOpenRef.current || grabPhaseRef.current || introBlockRef.current) return
      const aimHand = isMobileRef.current && e.pointerType === 'touch'
      const pos = clientToStageRef.current(e.clientX, e.clientY, aimHand)
      if (!pos) return
      viewportMouseRef.current = { x: e.clientX, y: e.clientY }
      lastMousePosRef.current = pos
      trackArmTargetRef.current(pos)
    }
    el.addEventListener('pointerdown', onStageDown, { passive: true })
    return () => el.removeEventListener('pointerdown', onStageDown)
  }, [bookcaseRevealed, selected])

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
  const handleClick = useCallback((b, clickEvent) => {
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

    const clientX = clickEvent?.clientX
    const clientY = clickEvent?.clientY
    if (clientX != null && clientY != null) {
      viewportMouseRef.current = { x: clientX, y: clientY }
    }
    const pos = clickToStageAim(clickEvent)
    if (pos) {
      snapArmTarget(pos)
      lastMousePosRef.current = pos
    } else if (lastMousePosRef.current) {
      snapArmTarget(lastMousePosRef.current)
    }

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
    setShowMonsterPanel(false)
    setStackBooks([])
    if (editDragReleaseTimer.current) { clearTimeout(editDragReleaseTimer.current); editDragReleaseTimer.current = null }
    setEditDragStagePos(null)
  }

  // Iris tracking — move eyes toward mouse cursor
  useEffect(() => {
    const MAX = 7
    function onMove(e) {
      if (uiOverlayOpenRef.current) return
      const head = headRef.current
      if (!head) return
      const r = visualRect(head)
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
    dragOverRotateRef.current = false; setDragOverRotate(false)
    deleteConfirmedRef.current = false
    wasOverRotateRef.current = false
    if (rotateDelayTimer.current) { clearTimeout(rotateDelayTimer.current); rotateDelayTimer.current = null }
    rotateCooldownUntil.current = 0
    const placeArm = () => {
      const cx = viewportMouseRef.current?.x ?? e.clientX
      const cy = viewportMouseRef.current?.y ?? e.clientY
      const pos = clientToStage(cx, cy, true)
      if (!pos) return
      snapArmTarget(pos)
      setEditDragStagePos(pos)
    }
    const autoZoomed = ensureMobileDragZoom(e.clientX, e.clientY, placeArm)
    setEditDragging(info)
    setGhostPos(ghostRef.current, e.clientX, e.clientY)
    if (isMobileRef.current && !autoZoomed) placeArm()
  }

  function startArmLerp(target) {
    lerpArmTarget(target, 0.18, () => !!editDraggingRef.current)
  }

  // Global mousemove while edit-dragging: update ghost + compute drop target
  useEffect(() => {
    if (!editDragging) return
    let lastPoint = null  // latest raw finger/cursor position, drives edge auto-pan
    function onMove(e) {
      lastPoint = { x: e.clientX, y: e.clientY }
      const onTouchLayout = isMobileRef.current
      const m = stageMetrics()
      // Clamp ghost to arm's reachable area: right=786 (836 on mobile — full bookcase width),
      // top=196, bottom=bookcase floor (both in the shifted bookcase layer).
      const shiftY = bookcaseShiftRef.current
      const bookcaseFloor = bookcaseBottomRef.current
      const maxGx = onTouchLayout ? 836 : 786
      const gx = m ? Math.min(e.clientX, m.left + maxGx * m.sx) : e.clientX
      const gy = m ? Math.max(m.top + (196 + shiftY) * m.sy, Math.min(e.clientY, m.top + (bookcaseFloor + shiftY) * m.sy)) : e.clientY
      setGhostPos(ghostRef.current, gx, gy)
      // Drop detection uses the raw finger — ghost clamping is visual only.
      const dropX = e.clientX
      const dropY = e.clientY
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
        const rect = visualRect(el)
        if (dropX < rect.left || dropX > rect.right || dropY < rect.top || dropY > rect.bottom) return
        found = shelfDrop(rect, shelfIdx, dropX)
      })

      // Fallback: snap to nearest shelf when cursor is over borders/boards
      if (!found) {
        let bestIdx = -1, bestRect = null, bestDy = Infinity
        shelfInnerRefs.current.forEach((el, shelfIdx) => {
          if (!el) return
          const rect = visualRect(el)
          if (dropX < rect.left - 20 || dropX > rect.right + 20) return
          const dy = Math.max(0, rect.top - dropY, dropY - rect.bottom)
          if (dy < bestDy) { bestDy = dy; bestIdx = shelfIdx; bestRect = rect }
        })
        if (bestRect && bestDy < 50) found = shelfDrop(bestRect, bestIdx, dropX)
      }

      setDropTarget(found)

      // Drive the real Sprout arm to the finger — ghost clamping is visual only.
      const pos = clientToStage(e.clientX, e.clientY, onTouchLayout)
      if (pos) {
        if (onTouchLayout) {
          startArmLerp(pos)
        } else {
          displayTargetRef.current = pos
          setDisplayTarget(pos)
        }
        setEditDragStagePos(pos)
      }

      // Touch: hover never fires, so hit-test the finger against the Rotate/Delete
      // buttons directly (mirrors the desktop onMouseEnter/onMouseLeave semantics).
      if (window.innerWidth < 768) {
        const inside = r => !!r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
        const rotatable = isRotatableDragType(dragType)
        const overRotate = rotatable && inside(rotateBtnRef.current?.getBoundingClientRect())
        // Toggle once on entry; the desktop 380ms hover-delay is skipped — the bar sits at
        // the bottom and is entered deliberately, the 700ms cooldown stops repeat toggles.
        if (overRotate && !wasOverRotateRef.current && Date.now() >= rotateCooldownUntil.current) {
          dragRotatedRef.current = !dragRotatedRef.current
          setDragRotated(dragRotatedRef.current)
          setRotateAnimKey(k => k + 1)
          rotateCooldownUntil.current = Date.now() + 700
        }
        wasOverRotateRef.current = overRotate
        if (overRotate !== dragOverRotateRef.current) {
          dragOverRotateRef.current = overRotate
          setDragOverRotate(overRotate)
        }
        const overDelete = inside(deleteBtnRef.current?.getBoundingClientRect())
        if (overDelete !== dragOverDeleteRef.current) {
          dragOverDeleteRef.current = overDelete
          setDragOverDelete(overDelete)
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
      // Delete: mouse released on the delete button (its onMouseUp sets the ref), or on
      // touch — where element onMouseUp never fires — finger lifted while over it
      if (deleteConfirmedRef.current || (window.innerWidth < 768 && dragOverDeleteRef.current)) {
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
          const invId = drag.sourceInventoryId
          removeInventoryItem(userId, invId)
            .then(() => setInventory(prev => prev.filter(i => i.id !== invId)))
            .catch(() => setSaveStatus('error'))
        }
      } else if (drag.sourceItem == null && !drag.sourceInventoryId) {
        // Came from add panel, dropped off shelf → send to inventory
        if (drag.type === 'vertical-book' && drag.book && userId) {
          addInventoryBook(userId, drag.book)
            .then(invId => setInventory(prev => [{ id: invId, type: 'book', book: drag.book }, ...prev].slice(0, 5)))
            .catch(() => setSaveStatus('error'))
        } else if (drag.type === 'horizontal-stack' && drag.books?.length && userId) {
          addInventoryStack(userId, drag.books)
            .then(invId => setInventory(prev => [{ id: invId, type: 'stack', books: drag.books }, ...prev].slice(0, 5)))
            .catch(() => setSaveStatus('error'))
        } else if (drag.type !== 'vertical-book' && drag.type !== 'horizontal-stack' && userId) {
          addInventoryDecor(userId, drag.type)
            .then(invId => setInventory(prev => [{ id: invId, type: 'decor', decorType: drag.type }, ...prev].slice(0, 5)))
            .catch(() => setSaveStatus('error'))
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
      dragOverRotateRef.current = false; setDragOverRotate(false)
      setEditDragging(null)
    }
    // Edge auto-pan (touch): holding an item near a screen edge pans the view in that
    // direction — horizontal pans the shelf, vertical scrolls between shelves. The drop
    // target is recomputed each pan step so the highlight tracks the moving content.
    let panRaf = null
    function panTick() {
      panRaf = requestAnimationFrame(panTick)
      if (!lastPoint || window.innerWidth >= 768) return
      const EDGE = 64, MAX_V = 14
      const speed = depth => Math.ceil(MAX_V * Math.min(1, depth / EDGE))
      let panned = false
      // Both scroll axes live on scrollRef now (containerRef is a max-content wrapper).
      const scr = scrollRef.current
      if (scr) {
        if (zoomedInRef.current) {
          const sc = scaleRef.current
          const { min, max } = mobileShelfScrollBounds(scr, sc)
          if (lastPoint.x < EDGE) {
            scr.scrollLeft = Math.max(min, scr.scrollLeft - speed(EDGE - lastPoint.x))
            panned = true
          } else if (lastPoint.x > window.innerWidth - EDGE) {
            scr.scrollLeft = Math.min(max, scr.scrollLeft + speed(lastPoint.x - (window.innerWidth - EDGE)))
            panned = true
          }
        }
        const topEdge = EDGE
        if (lastPoint.y < topEdge) { scr.scrollTop -= speed(topEdge - lastPoint.y); panned = true }
        else if (lastPoint.y > window.innerHeight - EDGE) { scr.scrollTop += speed(lastPoint.y - (window.innerHeight - EDGE)); panned = true }
      }
      if (panned) onMove({ clientX: lastPoint.x, clientY: lastPoint.y })
    }
    panRaf = requestAnimationFrame(panTick)

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup',   onUp)
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup',   onUp)
      if (panRaf) cancelAnimationFrame(panRaf)
    }
  }, [editDragging])

  // While an item is being dragged on touch, freeze page scrolling so the finger drives
  // the ghost directly (otherwise a vertical drag toward another shelf is swallowed as a
  // scroll). Scrolling between shelves is done by touching empty shelf area, not an item;
  // near-edge auto-pan (above) covers panning mid-drag.
  useEffect(() => {
    if (!editDragging) return
    const block = e => e.preventDefault()
    window.addEventListener('touchmove', block, { passive: false })
    document.body.style.touchAction = 'none'  // belt-and-braces vs. browser gesture takeover
    return () => {
      window.removeEventListener('touchmove', block)
      document.body.style.touchAction = ''
    }
  }, [editDragging])

  // Pick up a placed shelf item (removes it, starts drag)
  function _startPlacedItemDrag(e, shelfIdx, item) {
    dragRotatedRef.current = false; setDragRotated(false)
    dragOverDeleteRef.current = false; setDragOverDelete(false)
    dragOverRotateRef.current = false; setDragOverRotate(false)
    deleteConfirmedRef.current = false
    wasOverRotateRef.current = false
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
    const placeArm = () => {
      const cx = viewportMouseRef.current?.x ?? e.clientX
      const cy = viewportMouseRef.current?.y ?? e.clientY
      const pos = clientToStage(cx, cy, isMobileRef.current)
      if (!pos) return
      snapArmTarget(pos)
      setEditDragStagePos(pos)
    }
    const autoZoomed = ensureMobileDragZoom(e.clientX, e.clientY, placeArm)
    setEditDragging(drag)
    setGhostPos(ghostRef.current, e.clientX, e.clientY)
    if (!isMobileRef.current || !autoZoomed) placeArm()
  }

  function handlePlacedItemPointerDown(e, shelfIdx, item) {
    // Already carrying an item (e.g. just added from the panel) — let the drag/drop for
    // that one finish; ignore touches that land on other placed books.
    if (editDraggingRef.current) return
    viewportMouseRef.current = { x: e.clientX, y: e.clientY }
    setGhostPos(ghostRef.current, e.clientX, e.clientY)
    // For book items defer the drag so a quick release becomes a click-to-view
    if (item.type === 'vertical-book' && item.book) {
      const startX = e.clientX, startY = e.clientY
      function onPendingMove(ev) {
        const dx = ev.clientX - startX, dy = ev.clientY - startY
        if (Math.sqrt(dx*dx + dy*dy) > 8) {
          cleanup()
          // Any drag past threshold starts the move (item has touch-action:none, so a
          // vertical drag toward another shelf is a real drag, not a scroll). A release
          // without movement falls through to onPendingUp → open the book.
          _startPlacedItemDrag(ev, shelfIdx, item)
        }
      }
      function onPendingUp(ev) {
        cleanup()
        handleClickRef.current(item.book, ev)
      }
      function onPendingCancel() { cleanup() }
      function cleanup() {
        document.removeEventListener('pointermove', onPendingMove)
        document.removeEventListener('pointerup', onPendingUp)
        document.removeEventListener('pointercancel', onPendingCancel)
      }
      document.addEventListener('pointermove', onPendingMove)
      document.addEventListener('pointerup', onPendingUp)
      document.addEventListener('pointercancel', onPendingCancel)
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
    const placeArm = () => {
      const cx = viewportMouseRef.current?.x ?? e.clientX
      const cy = viewportMouseRef.current?.y ?? e.clientY
      const pos = clientToStage(cx, cy, isMobileRef.current)
      if (!pos) return
      snapArmTarget(pos)
      setEditDragStagePos(pos)
    }
    const autoZoomed = ensureMobileDragZoom(e.clientX, e.clientY, placeArm)
    setEditDragging({ type: 'horizontal-stack', slotWidth: stackItem.slotWidth,
      books: grabbedBooks, sourceItemId: stackItem.id,
      sourceItem: stackItem, sourceShelfIdx: shelfIdx, sourceRemainingId: remainingId })
    setGhostPos(ghostRef.current, e.clientX, e.clientY)
    if (!isMobileRef.current || !autoZoomed) placeArm()
  }

  // Grab N books off the top of a stack — defer until pointer moves so a quick release = click-to-view
  function handleStackBookPointerDown(e, shelfIdx, stackItem, bookIdx) {
    if (!isMobile) e.preventDefault()
    e.stopPropagation()
    viewportMouseRef.current = { x: e.clientX, y: e.clientY }
    setGhostPos(ghostRef.current, e.clientX, e.clientY)
    const startX = e.clientX, startY = e.clientY
    function onPendingMove(ev) {
      const dx = ev.clientX - startX, dy = ev.clientY - startY
      if (Math.sqrt(dx*dx + dy*dy) > 8) {
        cleanup()
        _startStackDrag(ev, shelfIdx, stackItem, bookIdx)
      }
    }
    function onPendingUp(ev) {
      cleanup()
      const book = stackItem.books[bookIdx]
      if (book) handleClickRef.current(book, ev)
    }
    function onPendingCancel() { cleanup() }
    function cleanup() {
      document.removeEventListener('pointermove', onPendingMove)
      document.removeEventListener('pointerup', onPendingUp)
      document.removeEventListener('pointercancel', onPendingCancel)
    }
    document.addEventListener('pointermove', onPendingMove)
    document.addEventListener('pointerup', onPendingUp)
    document.addEventListener('pointercancel', onPendingCancel)
  }

  // Shelf inner mousemove: re-compute drop highlight (redundant with global but keeps it snappy)
  function handleShelfMouseMove(e, shelfIdx) {
    const drag = editDraggingRef.current
    if (!drag) return
    const sw   = drag.slotWidth
    const excl = drag.sourceItemId ?? null
    const el   = shelfInnerRefs.current[shelfIdx]
    if (!el) return
    const rect = visualRect(el)
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
  const uiOverlayOpen = selected !== null
    || showBookPanel || showDecorPanel || showMonsterPanel || showShelfList
    || showShareModal || showPlateEdit || showAddShelfModal || editingShelfIdx !== null
    || showOnboarding
  uiOverlayOpenRef.current = uiOverlayOpen
  // returnProgress 0→1: during returning, retractMode sweeps 1→0, so 1-retractMode gives progress
  const returnProgress = retreating ? (1 - retractMode) : 0
  const safeShelfH = (Number.isFinite(shelfH) && shelfH > 0) ? shelfH : SHELF_H
  const bookcaseBottom = 196 + shelfConfigs.length * (safeShelfH + 20)
  bookcaseBottomRef.current = bookcaseBottom
  // During retreating the arm is at z=1 (behind shelf). Otherwise let the hand reach
  // the bottom shelf row (elbow can sit slightly below the bookcase floor line).
  const maxElbowY = retreating ? bookcaseBottom - 60 : bookcaseBottom + 36
  const isEditDragArm = editDragStagePos !== null
  const armTarget = displayTarget
  const armMaxTx = isMobile ? 850 : 786
  const arm = computeArm(armTarget, retractMode, returnProgress, maxElbowY, isEditDragArm ? -600 : 270, armMaxTx)
  // Stage rect (visual space) — maps in-stage coordinates to position:fixed overlays
  const stageM = stageRef.current ? stageMetrics() : null
  const stageSR = stageM ? { left: stageM.left, top: stageM.top, width: stageM.width, height: stageM.height } : null
  const stageSc = stageM ? stageM.sx : 1
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
  // Wider zone on mobile so the head doesn't snap between poses.
  const blendLow = isMobile ? 320 : 340
  const blendHigh = isMobile ? 460 : 440
  const topBlend = arm.elbowY < blendLow ? 1 : arm.elbowY > blendHigh ? 0 : (blendHigh - arm.elbowY) / (blendHigh - blendLow)
  const headLeft = headIntroLeft !== null ? headIntroLeft
    : (retreating && !overlayOpenTopRow && !grabReturnTopRow) ? 250
    : 580 * topBlend + (isMobile ? 710 : 740) * (1 - topBlend)
  const headTop  = headIntroTop !== null ? headIntroTop
    : overlayOpenTopRow ? 200
    : grabReturnTopRow ? 190
    : 108 * topBlend + (arm.handY - 295) * (1 - topBlend)
  const headRotate = retreating ? 0 : -5 * topBlend + 7 * (1 - topBlend)
  headGoalRef.current = { left: headLeft, top: headTop, rotate: headRotate }
  const smoothHeadFollow = headIntroTop === null && headIntroLeft === null && !retreating && !applyTopTransition
  headLerpTauRef.current = pageScrollingRef.current
    ? 0.38
    : isMobile
      ? (mobileArmSmoothTau() + 0.04)
      : 0.13
  const renderHeadLeft = smoothHeadFollow ? headDisplay.left : headLeft
  const renderHeadTop = smoothHeadFollow ? headDisplay.top : headTop
  const renderHeadRotate = smoothHeadFollow ? headDisplay.rotate : headRotate
  const monsterLook = getMonsterColors(monsterColorKey)

  // Blend edit grip over normal grab; whichever is active drives fingers + hand shift
  const activeGrip = editGripExtend > 0.001 ? editGripExtend : fingerExtend
  const fingers = computeFingerPaths(activeGrip)
  const handShift = -32 * activeGrip

  // During grabbing/retracting/returning, hide the grabbed book in the shelf
  const grabbedBookId = (grabPhase === 'grabbing' || grabPhase === 'retracting' || grabPhase === 'returning' || grabPhase === 'done')
    ? grabbedBook?.id : null


  // Grabbed book clone — follows arm; matches actual shelf book dimensions
  const CLONE_W = Math.round(SLOT_W * 1.1)
  const CLONE_H = grabbedBook ? Math.round(safeShelfH * (0.72 + titleT(grabbedBook.title) * 0.28) * 1.1) : safeShelfH
  const cloneSpineFontSize = grabbedBook ? Math.max(7, Math.min(12, Math.floor((CLONE_H - 16) / ((grabbedBook.title || '').length * 0.62)))) : 12
  const showClone = grabbedBook && (grabPhase === 'grabbing' || grabPhase === 'retracting')
  const cloneLeft = arm.handTipX + 2 - CLONE_W
  const cloneTop  = arm.handY - 24 - CLONE_H / 2

  // Stage height: tall enough for the bookcase (plus its centering shift), and on mobile
  // stretched to fill the viewport at the zoomed-out scale so the cave ceiling stays at
  // the top of the screen and the cave floor reaches the bottom.
  const renderBookcaseShift = isMobile ? bookcaseShiftAt(scale) : 0
  const mobileViewportFillH = isMobile
    ? Math.ceil(window.innerHeight / Math.max(0.05, computeMobileScale(false, window.innerWidth)))
    : 0
  const stageHeight = Math.max(960, bookcaseBottom + renderBookcaseShift + 140, mobileViewportFillH)
  stageHeightRef.current = stageHeight
  const armSvgH = stageHeight

  function handleSurface() {
    setSurfacing(true)
    setTitleFromSurface(true)
    setShowTitle(true)
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!scrollRef.current) return
      const offset = Math.round(window.innerHeight * (1 + GAP_VH / 100))
      // Set overflow directly before scrollTop so the jump is reliable before React re-renders
      scrollRef.current.style.overflowY = 'auto'
      scrollRef.current.style.overflowX = 'hidden'
      scrollRef.current.scrollTop = offset
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
      setScrollUnlocked(true)
    }))
    setTimeout(() => {
      setBookcaseRevealed(false)
      setScrollUnlocked(false)
      setSurfacing(false)
      if (scrollRef.current) scrollRef.current.scrollTop = 0
    }, 900)
  }

  function handleReveal() {
    setScrollUnlocked(true)

    // Reveal the bookcase immediately so shelf content is ready as the scroll reaches it.
    // The intro effect will skip Mode 1 because bookcaseRevealed is already true.
    if (isDbLoaded && !bookcaseRevealed) {
      setBookcaseRevealed(true)
      // Start just below the shelf's top board (head is z-behind the opaque rows) so it
      // pops up from behind the bookshelf rather than traveling from the screen bottom
      const startBelow = 340
      setHeadIntroTop(startBelow)
      setHeadIntroLeft(580)
      // Start head emergence ~600ms in — roughly when the scroll reaches the shelf
      setTimeout(() => {
        const headEndTop = 108
        const dur = 820
        let t0 = null
        function frameEmerge(ts) {
          if (!t0) t0 = ts
          const p = Math.min(1, (ts - t0) / dur)
          const ep = 1 - Math.pow(1 - p, 3)
          setHeadIntroTop(Math.round(startBelow + (headEndTop - startBelow) * ep))
          if (p < 1) {
            requestAnimationFrame(frameEmerge)
          } else {
            setHeadIntroTop(null)
            setHeadIntroLeft(null)
          }
        }
        requestAnimationFrame(frameEmerge)
      }, 600)
    }

    requestAnimationFrame(() => {
      if (!scrollRef.current) return
      const target = Math.round(window.innerHeight * (1 + GAP_VH / 100))
      const el = scrollRef.current
      el.scrollTo({ top: target, behavior: 'smooth' })
      // Dismiss only after scroll reaches the cave — removes title DOM without a jump
      let dismissed = false
      const go = () => { if (dismissed) return; dismissed = true; handleDismiss() }
      el.addEventListener('scrollend', go, { once: true })
      setTimeout(go, 1000) // fallback for Safari + slow devices
    })
  }

  function handleDismiss() {
    sessionStorage.setItem('seenIntro', '1')
    setShowTitle(false)
    // Desktop: title scroll ends with bookcase already revealed — keep scroll enabled.
    // Mobile already unlocks via the bookcaseRevealed overflow branch.
    setScrollUnlocked(!isMobileRef.current || bookcaseRevealed)
    setTitleFromSurface(false)
  }

  // Reset scroll before paint when the title DOM is removed — a rAF here paints one
  // frame with the container collapsed (blue background flash) before the reset lands.
  useLayoutEffect(() => {
    if (!showTitle && scrollRef.current) scrollRef.current.scrollTop = 0
  }, [showTitle])

  if (dbError) {
    return (
      <div className="fill-viewport" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 20, padding: 32, background: '#223152', color: '#FDF8EF',
        fontFamily: "'Manrope', sans-serif", textAlign: 'center',
      }}>
        <div style={{ fontFamily: "'Gasoek One', sans-serif", fontSize: 42, letterSpacing: 1 }}>TOMA!</div>
        <p style={{ margin: 0, maxWidth: 360, lineHeight: 1.5, opacity: 0.85 }}>{dbError}</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => window.location.reload()}
            style={{ background: '#254CA4', color: '#FDF8EF', border: 'none', borderRadius: 10, padding: '10px 20px', fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
          >Retry</button>
          <button
            onClick={() => { window.location.href = window.location.origin + window.location.pathname }}
            style={{ background: 'transparent', color: '#FDF8EF', border: '1.5px solid rgba(253,248,239,0.4)', borderRadius: 10, padding: '10px 20px', fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
          >Go home</button>
        </div>
      </div>
    )
  }

  if (!isDbLoaded && !showTitle) {
    return (
      <div className="fill-viewport" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 16, background: '#223152', color: '#FDF8EF', fontFamily: "'Manrope', sans-serif",
      }}>
        <div style={{ fontFamily: "'Gasoek One', sans-serif", fontSize: 42, letterSpacing: 1 }}>TOMA!</div>
        <p style={{ margin: 0, opacity: 0.65, fontSize: 14 }}>Loading your collection…</p>
      </div>
    )
  }

  const pageCanScroll = !showTitle && (scrollUnlocked || bookcaseRevealed)

  return (
    <>
    <div ref={scrollRef} className="fill-viewport page-scroll" style={{
      overflowY: pageCanScroll ? 'auto' : 'hidden',
      overflowX: (isMobile && zoomedIn && !showTitle) ? 'auto' : 'hidden',
      overscrollBehaviorX: 'none',
      background: '#223152',
      // Mobile one-shelf-focus: gently snap each shelf into view on vertical scroll.
      // 'proximity' (not 'mandatory') so the head/top and add-shelf button stay reachable.
      // Off while dragging so edge auto-pan isn't yanked back to a snap point.
      scrollSnapType: (isMobile && !showTitle && !editDragging && !scaleTransitioning) ? 'y proximity' : undefined }}>
      {showTitle && (
        <>
          <TitleScreen
            onDismiss={handleDismiss}
            onReveal={handleReveal}
            scale={scale}
            fromSurface={titleFromSurface}
            bodyColor={monsterLook.body}
            accentColor={monsterLook.accent}
            hat={monsterHatKey}
            hatColorKey={monsterHatColorKey}
          />
          <div className="gap-viewport" style={{
            width: '100%',
            background: 'linear-gradient(to bottom, #223152, #19243D)',
            overflow: 'hidden',
          }} />
        </>
      )}
      <div
        ref={containerRef}
      onContextMenu={e => e.preventDefault()}
      className={isMobile ? undefined : 'min-fill-viewport'}
      style={{
        // Zoomed out: center the stage so Toma's head is visible. Zoomed in: max-content +
        // flex-start so horizontal pan stays within the bookshelf clamp.
        width: (isMobile && zoomedIn) ? 'max-content' : '100%',
        minHeight: isMobile ? undefined : '100vh',
        display: 'flex',
        justifyContent: (isMobile && zoomedIn) ? 'flex-start' : 'center', alignItems: 'flex-start',
        background: '#223152',
        fontFamily: "'Manrope', sans-serif",
      }}>
      <div
        ref={stageRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ position: 'relative', width: 1080, height: stageHeight,
          // zoom is applied imperatively via a layout effect (see scaleRef sync) so the
          // per-frame animated value survives React re-renders without a flash.
          zIndex: retreating ? 10 : undefined,
          // Zoomed in: pan within the shelf. Zoomed out: vertical only. Freeze while dragging.
          touchAction: isMobile ? (editDragging ? 'none' : (zoomedIn ? 'pan-x pan-y' : 'pan-y')) : 'pan-y',
          // flexShrink 0: flex items default to shrink:1, which would compress the zoomed stage
          // below 1080*scale. With shrink off, plain flex centering crops the overflow equally
          // on both sides — engine-agnostic (margin-based centering interacts with CSS zoom
          // differently on iOS WebKit vs Chromium).
          flexShrink: 0 }}
      >
          {/* cave background */}
          <CaveBackground stageHeight={stageHeight} bookcaseBottom={bookcaseBottom} />

          {/* Surface button — only on own shelf, fades in when mouse nears top */}
          {bookcaseRevealed && !isViewOnly && (() => {
            if (typeof document !== 'undefined' && !document.getElementById('surface-kf')) {
              const s = document.createElement('style'); s.id = 'surface-kf'
              s.textContent = '@keyframes surfaceBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}'
              document.head.appendChild(s)
            }
            return (
              <div
                onClick={handleSurface}
                style={{
                  position: 'absolute', top: 28, left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  opacity: (isMobile || nearTop) ? 1 : 0,
                  transition: 'opacity 0.35s ease',
                  pointerEvents: (isMobile || nearTop) ? 'auto' : 'none',
                  cursor: 'pointer', zIndex: 20, userSelect: 'none',
                }}
              >
                <svg
                  width="18" height="12" viewBox="0 0 18 12"
                  style={{ animation: (!isMobile && nearTop) ? 'surfaceBob 1.8s ease-in-out infinite' : 'none' }}
                >
                  <path d="M9 1 L17 11 L1 11 Z" fill="rgba(253,248,239,0.65)" />
                </svg>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
                  color: 'rgba(253,248,239,0.5)', fontFamily: "'Manrope', sans-serif",
                  textTransform: 'uppercase',
                }}>Surface</span>
              </div>
            )
          })()}

          {poofActive && <PoofSmoke top={178 + renderBookcaseShift} h={Math.max(1, shelfConfigs.length) * 188} />}

          {bookcaseRevealed && <div ref={bookcaseLayerRef} style={{ position: 'absolute', left: 0, right: 0, top: renderBookcaseShift, height: '100%' }}>

          {/* bookshelf shadow — two ellipses */}
          <div style={{ position: 'absolute', left: -300, top: bookcaseBottom - 90, width: 1680, height: 180, borderRadius: '50%', background: '#19243D', opacity: 0.4, zIndex: 0 }} />
          <div style={{ position: 'absolute', left: -100, top: bookcaseBottom - 45, width: 1280, height: 90, borderRadius: '50%', background: '#19243D', opacity: 0.6, zIndex: 0 }} />

          {/* header bar moved outside the zoomed stage — see below after the stage div.
              (position:fixed inside a CSS-zoomed ancestor renders inconsistently across engines) */}

          {/* gold nameplate — bottom-aligned with bookcase top */}
          <div style={{ position: 'absolute', left: 228, top: 178, zIndex: 9, transform: 'translateY(-100%)' }}>
            <ShelfPlate
              shelfName={shelfName}
              username={username}
              isMobile={isMobile}
            />
          </div>

          {/* creature head */}
          <div ref={headRef} style={{
            position: 'absolute',
            left: renderHeadLeft, top: renderHeadTop,
            width: 226, height: 230, zIndex: 1,
            overflow: 'visible',
            transform: `rotate(${renderHeadRotate}deg)`,
            transformOrigin: '50% 90%',
            transition: (headIntroTop !== null || headIntroLeft !== null) ? 'none'
              : smoothHeadFollow ? 'none'
              : isMobile ? 'transform .3s ease-out'
              : retreating
                ? 'left .38s ease-in, top .38s ease-in, transform .3s ease-in'
                : applyTopTransition
                  ? 'left .72s cubic-bezier(.22,.68,0,1.18), top .4s cubic-bezier(.34,1.4,.5,1), transform .3s ease-out'
                  : 'none',
          }}>
            <div style={{ position: 'absolute', inset: 0, animation: headDucking ? 'headDuck 1.8s ease-in-out' : (uiOverlayOpen ? 'none' : 'tomaBob 4.6s ease-in-out infinite') }}>
              <TomaHead
                irisOff={irisOff}
                bodyColor={monsterLook.body}
                accentColor={monsterLook.accent}
                hat={monsterHatKey}
                hatColorKey={monsterHatColorKey}
                blinkAnim={headDucking ? 'squint' : (uiOverlayOpen ? 'none' : 'blink')}
                style={{ cursor: uiOverlayOpen ? 'default' : 'pointer' }}
                onMouseEnter={() => {
                  if (uiOverlayOpen || headDucking) return
                  setHeadDucking(true)
                  clearTimeout(headDuckTimerRef.current)
                  headDuckTimerRef.current = setTimeout(() => setHeadDucking(false), 1850)
                }}
              />
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
                const row = isEditMode ? (
                  <EditableShelfRow
                    shelf={shelf}
                    shelfIdx={shelfIdx}
                    items={shelfContents[shelfIdx] || []}
                    dragging={editDragging}
                    dropTarget={dropTarget}
                    innerRef={el => { shelfInnerRefs.current[shelfIdx] = el }}
                    onPointerMove={e => handleShelfMouseMove(e, shelfIdx)}
                    onPointerUp={() => {}}
                    onItemPointerDown={handlePlacedItemPointerDown}
                    onStackBookPointerDown={handleStackBookPointerDown}
                    grabbedBookId={grabbedBookId}
                    shelfH={safeShelfH}
                    isMobile={isMobile}
                  />
                ) : hasPlaced ? (
                  <SavedShelfRow
                    shelf={shelf}
                    items={shelfContents[shelfIdx] || []}
                    onBookClick={handleClick}
                    grabbedBookId={grabbedBookId}
                    shelfH={safeShelfH}
                  />
                ) : (
                  <ShelfRow
                    shelf={shelf}
                    hoveredId={hoveredId}
                    grabbedId={grabbedBookId}
                    onEnter={handleEnter}
                    onLeave={handleLeaveBook}
                    onClick={handleClick}
                    shelfH={safeShelfH}
                  />
                )
                // On mobile each shelf row is a vertical scroll-snap target so the view
                // settles on one shelf at a time. scrollMarginTop offsets the view-only banner.
                return isMobile
                  ? <div key={cfg.id} style={{ scrollSnapAlign: 'center' }}>{row}</div>
                  : <div key={cfg.id}>{row}</div>
              })
            })()}
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
          <svg width="1080" height={armSvgH} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', zIndex: 1, overflow: 'visible' }}>
            <path d={arm.uaPath} fill="none" stroke={monsterLook.body} strokeWidth="48" strokeLinecap="round"
              style={{ opacity: armActive ? 1 : 0, transition: 'opacity .2s ease' }} />
          </svg>

          {/* Forearm + hand — lives inside stageRef so it scrolls natively with the body.
              retreating = arm swept right returning behind shelf, drop z so shelf covers it */}
          <svg width="1080" height={armSvgH} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', zIndex: retreating ? 1 : 56, overflow: 'visible' }}>
            <g style={{ opacity: armActive ? 1 : 0, transition: 'opacity .2s ease' }}>
              <path d={activeFaPath} fill="none" stroke={monsterLook.body} strokeWidth="48" strokeLinecap="round" />
              <g transform={arm.handTransform}>
                <g style={{ animation: (grabPhase || editGripExtend > 0.001 || uiOverlayOpen) ? 'none' : 'handSway 4.6s ease-in-out infinite' }}>
                  <g style={{ transform: `translateX(${handShift}px)` }}>
                    <path d="M86 -40 C 72 -55, 44 -53, 33 -45" stroke={monsterLook.body} strokeWidth="23" strokeLinecap="round" fill="none" />
                    <circle cx="92" cy="0" r="44" fill={monsterLook.body} />
                    <path d={fingers.index}  stroke={monsterLook.body} strokeWidth="23" strokeLinecap="round" fill="none" />
                    <path d={fingers.middle} stroke={monsterLook.body} strokeWidth="23" strokeLinecap="round" fill="none" />
                    <path d={fingers.ring}   stroke={monsterLook.body} strokeWidth="23" strokeLinecap="round" fill="none" />
                    <path d={fingers.pinky}  stroke={monsterLook.body} strokeWidth="23" strokeLinecap="round" fill="none" />
                  </g>
                </g>
              </g>
            </g>
          </svg>

          </div>}{/* end bookcaseRevealed */}

        </div>
      {/* header bar — desktop only; mobile owners use the footer, viewers use the view-only footer */}
      {bookcaseRevealed && !isMobile && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px 10px', zIndex: 9, pointerEvents: 'none', background: 'transparent', transform: (headerVisible && !surfacing) ? 'translateY(0)' : 'translateY(-120%)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
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
                <div style={{
                  width: 36, height: 20, borderRadius: 12, flexShrink: 0, position: 'relative',
                  background: isEditMode ? '#FFD700' : '#1A1A1A',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.7)',
                  transition: 'background 0.2s',
                }}>
                  <div style={{
                    position: 'absolute', top: 3, width: 14, height: 14, borderRadius: 8,
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
                onClick={() => { window.location.href = window.location.origin + window.location.pathname + '?skipIntro=1' }}
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
                <span style={{ fontSize: 12, color: saveStatus === 'error' ? '#FF8A8A' : '#FDF8EF', opacity: saveStatus === 'error' ? 1 : 0.65, fontFamily: "'Manrope',sans-serif", pointerEvents: 'none' }}>
                  {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : 'Save failed'}
                </span>
              )}
              {shareId && (
                <button onClick={() => setShowShareModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#254CA4', color: '#FDF8EF', border: '3px solid transparent', borderRadius: 10, padding: '6px 14px', fontSize: 13, fontFamily: "'Manrope',sans-serif", fontWeight: 700, cursor: 'pointer' }}>
                  <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
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
      )}

      {/* Mobile zoom toggle — pinch is disabled, so one magnifier button switches between
          the full-bookshelf view and a 3x one-shelf detail view. Hidden while dragging. */}
      {isMobile && bookcaseRevealed && !selected && !editDragging && (
        <button
          onClick={toggleMobileZoom}
          style={{
            position: 'fixed', left: 12, top: 12, zIndex: 40,
            width: 44, height: 44, borderRadius: 12, border: 'none',
            background: 'rgba(37,76,164,0.92)', color: '#FDF8EF',
            cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="9.5" cy="9.5" r="6.5" stroke="#FDF8EF" strokeWidth="2.2" />
            <path d="M14.5 14.5L20 20" stroke="#FDF8EF" strokeWidth="2.2" strokeLinecap="round" />
            {/* plus to zoom in, minus to zoom back out */}
            <path d="M6.5 9.5H12.5" stroke="#FDF8EF" strokeWidth="2" strokeLinecap="round" />
            {!zoomedIn && <path d="M9.5 6.5V12.5" stroke="#FDF8EF" strokeWidth="2" strokeLinecap="round" />}
          </svg>
        </button>
      )}

      {/* Share — mobile only, top-right, same 44x44 style as the zoom toggle */}
      {isMobile && bookcaseRevealed && !isViewOnly && !selected && !editDragging && shareId && (
        <button
          onClick={() => setShowShareModal(true)}
          aria-label="Share collection"
          style={{
            position: 'fixed', right: 12, top: 12, zIndex: 40,
            width: 44, height: 44, borderRadius: 12, border: 'none',
            background: 'rgba(37,76,164,0.92)', color: '#FDF8EF',
            cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 14 14" fill="none">
            <circle cx="11" cy="2.5" r="1.5" stroke="#FDF8EF" strokeWidth="1.4"/>
            <circle cx="11" cy="11.5" r="1.5" stroke="#FDF8EF" strokeWidth="1.4"/>
            <circle cx="3" cy="7" r="1.5" stroke="#FDF8EF" strokeWidth="1.4"/>
            <path d="M9.6 3.3L4.4 6.2M4.4 7.8l5.2 2.9" stroke="#FDF8EF" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </button>
      )}

      {/* Overlay lives outside the scale transform so position:fixed hits the true viewport */}
      <Overlay selected={selected} openPhase={openPhase} onClose={handleClose} shelfConfigs={shelfConfigs} descCache={descCacheRef} userId={userId} reviewsRef={reviewsRef} isViewOnly={isViewOnly} ownerName={username} viewerUserId={viewerUserId} isMobile={isMobile} monsterBodyColor={monsterLook.body} />

      {editingShelfIdx !== null && (
        <ShelfEditModal
          cfg={shelfConfigs[editingShelfIdx]}
          onSave={(label, colorKey) => saveShelf(editingShelfIdx, label, colorKey)}
          onDelete={() => deleteShelf(editingShelfIdx)}
          onClose={finishShelfEdit}
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
          onMouseDown={e => { if (e.target === e.currentTarget) { setShowShareModal(false); clearShareCopyNotice() } }}>
          <div style={{ background: '#FDF8EF', borderRadius: 20, padding: '28px 32px 24px', width: 'min(340px, 92vw)', boxShadow: '0 16px 48px rgba(0,0,0,0.3)', fontFamily: "'Manrope',sans-serif" }}
            onMouseDown={e => e.stopPropagation()}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1C1C2E', marginBottom: 6 }}>Share your shelf</div>
            <div style={{ fontSize: 14, color: '#666680', marginBottom: 20 }}>Anyone with this link can view your shelf.</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#606078', marginBottom: 8, letterSpacing: '0.04em' }}>LINK</div>
            <input
              ref={shareLinkInputRef}
              readOnly
              value={`${window.location.origin}${window.location.pathname}?shelf=${shareId}`}
              onFocus={e => e.target.select()}
              style={{ width: '100%', boxSizing: 'border-box', border: '2px solid #D0D0DC', borderRadius: 10, padding: '9px 13px', fontSize: 13, fontFamily: "'Manrope',sans-serif", fontWeight: 500, background: 'white', color: '#1C1C2E', outline: 'none', marginBottom: 16, cursor: 'text' }}
            />
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                onClick={copyShareLink}
                style={{ flex: 1, background: linkCopied ? '#3EAF2D' : '#254CA4', border: 'none', borderRadius: 10, padding: '11px 0', fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 15, color: '#FDF8EF', cursor: 'pointer', transition: 'background 0.15s' }}
              >{linkCopied ? 'Copied!' : 'Copy link'}</button>
              <button
                onClick={() => { setShowShareModal(false); clearShareCopyNotice() }}
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
          <DragGhost dragging={editDragging} ghostRef={ghostRef} dragRotated={dragRotated} stageSc={stageSc} shelfH={safeShelfH} isMobile={isMobile} />

          {/* Action zones — fades in/out left of bookshelf while dragging a book or stack, below ghost/arm */}
          {stageSR && (() => {
            const visible = !!(editDragging && isRotatableDragType(editDragging.type))
            const deleteVisible = !!editDragging
            const btnStyle = (hoverActive, variant) => {
              const isDelete = variant === 'delete'
              const tint = isDelete ? '#fce8e6' : '#e8eef9'
              const glow = isDelete
                ? '0 0 0 5px rgba(192,57,43,0.38), 0 6px 20px rgba(192,57,43,0.28)'
                : '0 0 0 5px rgba(37,76,164,0.38), 0 6px 20px rgba(37,76,164,0.28)'
              return {
                borderRadius: 16, padding: '20px 18px', minWidth: 80,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 14,
                background: hoverActive ? tint : '#FDF8EF',
                border: `2px solid ${isDelete ? '#c0392b' : '#254CA4'}`,
                color: isDelete ? '#c0392b' : '#254CA4',
                transform: hoverActive ? 'scale(1.06)' : undefined,
                boxShadow: hoverActive ? glow : '0 2px 10px rgba(0,0,0,0.18)',
                userSelect: 'none',
                transition: 'box-shadow .15s, transform .15s, background .15s',
              }
            }
            return (
              <div style={isMobile
                ? { position: 'fixed', left: 0, right: 0, bottom: 0,
                    display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 20,
                    padding: '12px 16px calc(12px + env(safe-area-inset-bottom))',
                    zIndex: 45, pointerEvents: 'none',
                    opacity: (visible || deleteVisible) ? 1 : 0, transition: 'opacity 0.2s ease' }
                : { position: 'fixed', top: 0, bottom: 0, left: 0,
                    width: Math.max(80, stageSR.left), display: 'flex', flexDirection: 'column',
                    alignItems: 'flex-start', justifyContent: 'center', gap: 24, paddingLeft: 24,
                    zIndex: 45, pointerEvents: 'none',
                    opacity: (visible || deleteVisible) ? 1 : 0, transition: 'opacity 0.2s ease' }}>
                <div ref={rotateBtnRef} style={{
                    ...btnStyle(dragOverRotate, 'rotate'),
                    display: visible ? 'flex' : 'none',
                    pointerEvents: visible ? 'auto' : 'none',
                  }}
                  onMouseEnter={visible ? () => {
                    dragOverRotateRef.current = true
                    setDragOverRotate(true)
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
                    dragOverRotateRef.current = false
                    setDragOverRotate(false)
                    if (rotateDelayTimer.current) { clearTimeout(rotateDelayTimer.current); rotateDelayTimer.current = null }
                  } : undefined}>
                  <div key={rotateAnimKey} style={{
                    display: 'inline-block',
                    animation: rotateAnimKey > 0
                      ? 'spinOnce 0.45s cubic-bezier(0.4,0,0.2,1)'
                      : (dragOverRotate ? 'rotateHover 0.42s ease-in-out infinite alternate' : 'none'),
                  }}><IconRotate size={28} color="currentColor" /></div>
                  <span>Rotate</span>
                </div>
                <div ref={deleteBtnRef} style={{ ...btnStyle(dragOverDelete, 'delete'), pointerEvents: deleteVisible ? 'auto' : 'none' }}
                  onMouseEnter={deleteVisible ? () => { dragOverDeleteRef.current = true; setDragOverDelete(true) } : undefined}
                  onMouseLeave={deleteVisible ? () => { dragOverDeleteRef.current = false; setDragOverDelete(false) } : undefined}
                  onMouseUp={deleteVisible ? () => { deleteConfirmedRef.current = true } : undefined}>
                  <div style={{
                    display: 'inline-block',
                    animation: dragOverDelete ? 'trashHover 0.42s ease-in-out infinite alternate' : 'none',
                  }}>
                    <IconTrash size={28} color="currentColor" />
                  </div>
                  <span>Delete</span>
                </div>
              </div>
            )
          })()}

          {/* Donate bin + second arm — one animated group; arm slides in behind bin.
              Desktop only: it anchors to the left-column panel layout. */}
          {!isMobile && stageSR && !!editDragging && deleteBtnRect && (() => {
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
                    : `translateX(-${BIN_W + 8}px)`,
                  opacity: dragOverDelete ? 1 : 0,
                  transition: 'transform 0.65s cubic-bezier(.34,1.4,.5,1), opacity 0.4s ease',
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
            isMobile={isMobile}
          />
          <DecorAddPanel
            isOpen={showDecorPanel}
            onSelect={handleDecorSelect}
            onClose={() => setShowDecorPanel(false)}
            isMobile={isMobile}
          />
          <MonsterCustomizeModal
            isOpen={showMonsterPanel}
            colorKey={monsterColorKey}
            hatKey={monsterHatKey}
            hatColorKey={monsterHatColorKey}
            onSave={handleMonsterSave}
            onClose={() => setShowMonsterPanel(false)}
            isMobile={isMobile}
          />
          {showShelfList && (
            <ShelfListModal
              shelfConfigs={shelfConfigs}
              getColors={getShelfColors}
              shelfName={shelfName}
              username={username}
              onEditPlate={() => { setShowShelfList(false); setShowPlateEdit(true) }}
              onEditShelf={idx => { shelfEditReturnToListRef.current = true; setShowShelfList(false); setEditingShelfIdx(idx) }}
              onDeleteShelf={idx => deleteShelf(idx)}
              onAddShelf={() => { setShowShelfList(false); setShowAddShelfModal(true) }}
              onReorder={reorderShelf}
              onClose={() => setShowShelfList(false)}
              isMobile={isMobile}
            />
          )}
        </>
      )}

      {/* Mobile view-only footer — creator name + link to own shelf */}
      {isMobile && isViewOnly && bookcaseRevealed && !showTitle && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 48,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          padding: '12px 16px calc(12px + env(safe-area-inset-bottom, 0px))',
          background: 'linear-gradient(to top, rgba(34,49,82,0.98) 65%, rgba(34,49,82,0.88) 85%, transparent)',
          pointerEvents: 'none',
        }}>
          <div style={{ minWidth: 0, pointerEvents: 'auto' }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: 'rgba(253,248,239,0.55)',
              letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2,
              fontFamily: "'Manrope',sans-serif",
            }}>Collection by</div>
            <div style={{
              fontSize: 14, fontWeight: 700, color: '#FDF8EF',
              fontFamily: "'Manrope',sans-serif",
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {username || 'Someone'}
            </div>
          </div>
          <button
            onClick={() => { window.location.href = window.location.origin + window.location.pathname + '?skipIntro=1' }}
            style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
              background: '#254CA4', color: '#FDF8EF', border: 'none', borderRadius: 12,
              padding: '10px 14px', fontSize: 13, fontFamily: "'Manrope',sans-serif",
              fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', pointerEvents: 'auto',
            }}
          >
            {viewerHasOwnShelf ? 'View my shelf' : 'Create your shelf'}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3L9.5 7L5 11" stroke="#FDF8EF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* SidePanelButtons — always mounted so it can animate in/out.
          Hidden while the title screen is up (mobile footer would float over it). */}
      {bookcaseRevealed && !isViewOnly && !showTitle && !surfacing && (
        <SidePanelButtons
          isEditMode={isEditMode && !surfacing}
          editDragging={editDragging}
          isMobile={isMobile}
          inventory={inventory}
          flashInventory={flashInventory}
          onToggleEdit={isEditMode ? exitEditMode : enterEditMode}
          onShare={() => setShowShareModal(true)}
          showShare={!!shareId}
          onBook={() => { setShowBookPanel(true); setShowDecorPanel(false); setShowMonsterPanel(false); setStackBooks([]) }}
          onDecor={() => { setShowDecorPanel(true); setShowBookPanel(false); setShowMonsterPanel(false) }}
          onMonster={() => { setShowMonsterPanel(true); setShowBookPanel(false); setShowDecorPanel(false); setShowShelfList(false) }}
          onShelves={() => { setShowShelfList(true); setShowBookPanel(false); setShowDecorPanel(false); setShowMonsterPanel(false) }}
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
    </div>

    {showShareCopyToast && (
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          left: '50%',
          ...(isMobile
            ? { top: 'calc(68px + env(safe-area-inset-top))', bottom: 'auto' }
            : { bottom: 28 }),
          transform: 'translateX(-50%)',
          zIndex: 10001,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 18px', borderRadius: 12,
          background: '#254CA4', color: '#FDF8EF',
          boxShadow: '0 8px 28px rgba(0,0,0,0.28)',
          fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 14,
          pointerEvents: 'none', whiteSpace: 'nowrap',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <circle cx="9" cy="9" r="8" stroke="#FDF8EF" strokeWidth="1.6" />
          <path d="M5.5 9.2L7.8 11.5L12.5 6.8" stroke="#FDF8EF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Link copied to clipboard
      </div>
    )}
    </>
  )
}
