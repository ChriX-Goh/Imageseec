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
  function overviewLayout(ratios, width, height, horizontal = false, clean = false) {
    const gap = 12, padding = clean ? 0 : 12, caption = clean ? 0 : 27;
    const safe = ratios.map(r => Number.isFinite(r) && r > 0 ? r : 1);
    const boxes = [];
    let offset = 0;
    for (let start = 0; start < safe.length;) {
      let end = start, sum = 0;
      const target = horizontal ? Math.min(210, width) : Math.min(180, Math.max(100, width / 3));
      const limit = horizontal ? height : width;
      while (end < safe.length) {
        const value = horizontal ? 1 / safe[end] : safe[end];
        const n = end - start + 1;
        const projected = (sum + value) * target + n * (horizontal ? padding + caption : padding) + (n - 1) * gap;
        if (horizontal && end > start && projected > limit) break;
        sum += value; end++;
        if (projected >= limit) break;
      }
      const n = end - start;
      const fit = Math.max(1, (limit - (n - 1) * gap - n * (horizontal ? padding + caption : padding)) / sum);
      const size = Math.min(fit, target * (end === safe.length || horizontal ? 1 : 1.35));
      let cross = 0;
      for (let i = start; i < end; i++) {
        const w = (horizontal ? size : size * safe[i]) + padding;
        const h = (horizontal ? size / safe[i] : size) + padding + caption;
        boxes.push({ x: horizontal ? offset : cross, y: horizontal ? cross : offset, width: w, height: h });
        cross += (horizontal ? h : w) + gap;
      }
      offset += size + padding + (horizontal ? 0 : caption) + gap;
      start = end;
    }
    return { boxes, width: horizontal ? Math.max(0, offset - gap) : width, height: horizontal ? height : Math.max(0, offset - gap) };
  }
  lens.controls = { ticks, rulerMax, fromPosition, toPosition, holdPan, wheelMode, overviewLayout };
})();
