(() => {
  const lens = globalThis.ImageLens ||= {};
  const ticks = [0, 25, 50, 75, 100];
  function rulerMax(percent) { return [100, 150, 200, 300, 500].find(n => percent <= n) || 500; }
  function fromPosition(position, maximum = 100) {
    const values = [0, 25, 50, 75, maximum];
    const n = Math.max(0, Math.min(4, Number(position)));
    const i = Math.min(3, Math.floor(n));
    return values[i] + (values[i + 1] - values[i]) * (n - i);
  }
  function toPosition(percent, maximum = 100) {
    const values = [0, 25, 50, 75, maximum];
    const n = Math.max(0, Math.min(maximum, Number(percent)));
    const i = Math.max(0, values.findIndex((value, index) => index < 4 && n <= values[index + 1]));
    return i + (n - values[i]) / (values[i + 1] - values[i]);
  }
  function holdPan(initialPan, anchor, delta, ratio) { return anchor - (anchor - initialPan) * ratio - delta * ratio; }
  function wheelMode(event) { return event.shiftKey ? 'fine' : event.altKey ? 'zoom' : 'navigate'; }
  lens.controls = { ticks, rulerMax, fromPosition, toPosition, holdPan, wheelMode };
})();
