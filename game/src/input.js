// The Gilded Hour — keyboard and mouse.
// Tracks held keys, the mouse position in canvas pixels, click points for the
// decoy throw, and one-shot key presses (E to climb into the vent, R to retry).
export function makeInput(canvas) {
  const input = {
    keys: new Set(),
    mouse: { x: 0, y: 0, inside: false },
    click: null, // {x, y} consumed once by the game loop
    pressed: new Set(), // codes pressed since the last consumeKey
  };

  window.addEventListener('keydown', function (e) {
    if (e.code === 'Space' || e.code.indexOf('Arrow') === 0) e.preventDefault();
    if (!e.repeat) input.pressed.add(e.code);
    input.keys.add(e.code);
  });
  window.addEventListener('keyup', function (e) {
    input.keys.delete(e.code);
  });
  window.addEventListener('blur', function () {
    input.keys.clear();
  });

  function toCanvas(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }
  canvas.addEventListener('mousemove', function (e) {
    const p = toCanvas(e.clientX, e.clientY);
    input.mouse.x = p.x;
    input.mouse.y = p.y;
    input.mouse.inside = true;
  });
  canvas.addEventListener('mousedown', function (e) {
    const p = toCanvas(e.clientX, e.clientY);
    input.click = { x: p.x, y: p.y };
  });

  // True once per physical press; the game loop calls this every frame.
  input.consumeKey = function (code) {
    if (input.pressed.has(code)) {
      input.pressed.delete(code);
      return true;
    }
    return false;
  };
  input.consumeClick = function () {
    const c = input.click;
    input.click = null;
    return c;
  };
  return input;
}
