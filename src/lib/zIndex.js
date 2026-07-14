/** Central z-index scale — higher layers block lower ones. */
export const Z = {
  stage: 10,
  // Above retreating stage (book grab raises stage to `stage`) so Edit/Share stay clickable.
  header: 50,
  fab: 40,
  dragZone: 45,
  chrome: 48,
  dragGhost: 55,
  panel: 62,
  bookPreview: 70,
  bookOverlay: 100,
  confirmDialog: 200,
  shelfEdit: 300,
  dialogHigh: 9000,
  onboarding: 9999,
  toast: 10001,
}
