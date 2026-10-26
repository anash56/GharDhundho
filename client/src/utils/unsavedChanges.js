// Shared registry used to avoid navigating away from a form with unsaved edits.
const dirtySources = new Set();

export function setUnsavedChange(sourceId, isDirty) {
  if (isDirty) dirtySources.add(sourceId);
  else dirtySources.delete(sourceId);
}

export function hasUnsavedChanges() {
  return dirtySources.size > 0;
}
