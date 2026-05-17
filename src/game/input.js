import { audio } from './audio.js';

// Pointer → world X. Handles both mouse and touch via Pointer Events.
// Also unlocks AudioContext on first interaction (required for Capacitor WebView).
export function attachInput(canvas, world) {
  let dragging = false;
  let unlocked = false;

  const updateFrom = (clientX) => {
    const rect = canvas.getBoundingClientRect();
    world.setSquadX(clientX - rect.left);
  };

  const onDown = (e) => {
    if (!unlocked) {
      audio.unlock();
      unlocked = true;
    }
    if (!world.started) world.start();
    dragging = true;
    updateFrom(e.clientX);
    canvas.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    if (!dragging) return;
    updateFrom(e.clientX);
  };
  const onUp = (e) => {
    dragging = false;
    try { canvas.releasePointerCapture?.(e.pointerId); } catch (_) {}
  };

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  return () => {
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerup', onUp);
    canvas.removeEventListener('pointercancel', onUp);
  };
}
