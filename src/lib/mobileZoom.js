// Mobile one-shelf-focus zoom constants. These describe how much of the stage fits into
// the viewport in each of the two toggle states, and how far the user is allowed to pan
// past the shelf edges before the clamp kicks in. Desktop never reads any of these —
// it uses the full 1080-wide stage and the container width is the only variable.

// Stage px fitted to viewport width on mobile (see computeStageScale in scale.js).
const MOBILE_ZOOMED_OUT_FIT = 880  // bookcase + Toma head peeking on the right
const MOBILE_ZOOMED_IN_FIT  = 656  // one-shelf detail; 1.5× multiplier applied on top

// Pan bounds (see computeScrollBounds in scroll.js).
const MOBILE_ZOOMED_IN_PEEK_LEFT    = 24   // screen px of cave past the left shelf edge
const MOBILE_ZOOMED_IN_RIGHT        = 940  // stage px — pan far enough right to reveal Toma's head
const MOBILE_ZOOMED_IN_MONSTER_BIAS = 52   // stage px — default framing favors the right peek

export {
  MOBILE_ZOOMED_OUT_FIT,
  MOBILE_ZOOMED_IN_FIT,
  MOBILE_ZOOMED_IN_PEEK_LEFT,
  MOBILE_ZOOMED_IN_RIGHT,
  MOBILE_ZOOMED_IN_MONSTER_BIAS,
}
