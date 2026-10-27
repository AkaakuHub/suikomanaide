export function bindButton(button: HTMLButtonElement, action: () => void) {
  let touch: { id: number; x: number; y: number } | null = null;
  let touchHandled = false;
  const activate = () => {
    if (button.disabled) return;
    action();
    button.blur();
  };
  button.addEventListener("pointerdown", (event) => {
    touchHandled = false;
    touch =
      event.isPrimary && event.pointerType !== "mouse"
        ? { id: event.pointerId, x: event.clientX, y: event.clientY }
        : null;
  });
  button.addEventListener("pointermove", (event) => {
    if (touch && Math.hypot(event.clientX - touch.x, event.clientY - touch.y) > 12) touch = null;
  });
  button.addEventListener("pointercancel", () => {
    touch = null;
  });
  button.addEventListener("pointerup", (event) => {
    if (!touch || event.pointerId !== touch.id) return;
    touch = null;
    const bounds = button.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      return;
    event.preventDefault();
    touchHandled = true;
    activate();
  });
  button.addEventListener("click", (event) => {
    if (touchHandled && event.detail > 0) {
      event.preventDefault();
      return;
    }
    activate();
  });
}
