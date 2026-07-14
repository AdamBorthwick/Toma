/** Central z-index scale — higher layers block lower ones. */
export const Z = {
  stage: 10,
  fab: 40,
  chrome: 48,
  // Above stage + chrome so Edit/Share stay visible when a book opens.
  header: 50,
  // Above header so delete/rotate drop targets stay hittable while dragging.
  dragZone: 52,
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
