// Exponential smoothing for scrollTop / scrollLeft — user wheel and touch deltas become
// a glide instead of instant jumps. Call onStep each animation frame to sync dependents
// (e.g. arm aim) in the same coordinate space as the scroll position.

function clampScroll(el, top, left) {
  const maxTop = Math.max(0, el.scrollHeight - el.clientHeight)
  const maxLeft = Math.max(0, el.scrollWidth - el.clientWidth)
  return {
    top: Math.max(0, Math.min(maxTop, top)),
    left: Math.max(0, Math.min(maxLeft, left)),
  }
}

function createSmoothScroller(getEl, { onStep, tau = 0.1 } = {}) {
  let targetTop = 0
  let targetLeft = 0
  let raf = null
  let lastTs = null

  function syncFromEl() {
    const el = getEl()
    if (!el) return
    targetTop = el.scrollTop
    targetLeft = el.scrollLeft
  }

  function applyTargets(top, left) {
    const el = getEl()
    if (!el) return
    const c = clampScroll(el, top, left)
    targetTop = c.top
    targetLeft = c.left
  }

  function addDelta(dTop, dLeft = 0) {
    const el = getEl()
    if (!el) return
    if (raf == null) syncFromEl()
    applyTargets(targetTop + dTop, targetLeft + dLeft)
    ensure()
  }

  function setTargets(top, left) {
    const el = getEl()
    if (!el) return
    applyTargets(top, left ?? el.scrollLeft)
    ensure()
  }

  function ensure() {
    if (raf != null) return
    lastTs = null
    raf = requestAnimationFrame(step)
  }

  function step(ts) {
    const el = getEl()
    if (!el) {
      stop()
      return
    }
    if (lastTs == null) lastTs = ts
    const dt = Math.min(48, ts - lastTs) / 1000
    lastTs = ts
    const a = 1 - Math.exp(-dt / Math.max(0.05, tau))

    const curTop = el.scrollTop
    const curLeft = el.scrollLeft
    const nextTop = curTop + (targetTop - curTop) * a
    const nextLeft = curLeft + (targetLeft - curLeft) * a
    if (nextTop !== curTop) el.scrollTop = nextTop
    if (nextLeft !== curLeft) el.scrollLeft = nextLeft
    onStep?.()

    const done = Math.abs(targetTop - nextTop) < 0.35 && Math.abs(targetLeft - nextLeft) < 0.35
    if (done) {
      el.scrollTop = targetTop
      el.scrollLeft = targetLeft
      onStep?.()
      stop()
      return
    }
    raf = requestAnimationFrame(step)
  }

  function stop() {
    if (raf != null) cancelAnimationFrame(raf)
    raf = null
    lastTs = null
  }

  function isActive() {
    return raf != null
  }

  return { addDelta, setTargets, syncFromEl, stop, isActive, ensure }
}

export { createSmoothScroller, clampScroll }
