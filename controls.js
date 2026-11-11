(() => {
  const lens = globalThis.ImageLens ||= {};
  const ticks = [0, 25, 50, 75, 100];
  const overviewTicks = [25, 50, 100, 200, 300];
  function rulerMax(percent) { return [100, 150, 200, 300, 500].find(n => percent <= n) || 500; }
  function fromPosition(position, maximum = 100, overview = false) {
    const values = overview ? overviewTicks : [0, 25, 50, 75, maximum];
    const n = Math.max(0, Math.min(4, Number(position)));
    const i = Math.min(3, Math.floor(n));
    return values[i] + (values[i + 1] - values[i]) * (n - i);
  }
  function toPosition(percent, maximum = 100, overview = false) {
    const values = overview ? overviewTicks : [0, 25, 50, 75, maximum];
    const n = Math.max(values[0], Math.min(values[4], Number(percent)));
    const i = Math.max(0, values.findIndex((value, index) => index < 4 && n <= values[index + 1]));
    return i + (n - values[i]) / (values[i + 1] - values[i]);
  }
  function holdPan(initialPan, anchor, delta, ratio) { return anchor - (anchor - initialPan) * ratio - delta * ratio; }
  function wheelMode(event) { return event.shiftKey ? 'fine' : event.altKey ? 'zoom' : 'navigate'; }
  function overviewLayout(ratios, width, height, horizontal = false, clean = false, alignment = 'auto', gap = 12, sizePercent = 100, startOrdinal = 0, stable = null) {
    const padding = clean ? 0 : 12, caption = clean ? 0 : 27;
    const scale = Math.max(25, Math.min(300, Number(sizePercent) || 100)) / 100;
    const safe = Array.from(ratios || [], ratio => Number.isFinite(Number(ratio)) && Number(ratio) > 0 ? Number(ratio) : 4 / 3);
    const count = safe.length, ordinalStart = Math.floor(Number(startOrdinal) || 0);
    const resolved = alignment === 'auto' ? (horizontal ? 'horizontal' : 'vertical') : alignment;
    const boxes = Array(count), bands = [], bandIds = Array(count), lanes = Array(count).fill(-1);
    const laneHints = Array.isArray(stable?.lanes) ? stable.lanes : [];
    const bandHints = Array.isArray(stable?.bands) ? stable.bands : [];
    const matchesDirection = resolved === (horizontal ? 'horizontal' : 'vertical');

    if (matchesDirection) {
      // Fixed-width columns (vertical) / fixed-height rows (horizontal) retain
      // image aspect ratio. Stable lane hints keep a decoded image in its lane.
      const limit = horizontal ? height : width;
      const trim = horizontal ? padding + caption : padding;
      const base = (horizontal ? 180 : 210) + trim;
      const target = (base - trim) * scale + trim;
      const laneCount = Math.max(1, Math.floor((limit + gap) / (target + gap)));
      const nominalCount = Math.max(1, Math.floor((limit + gap) / (base + gap)));
      const nominalCross = (limit - gap * (nominalCount - 1)) / nominalCount;
      const fitCross = (limit - gap * (laneCount - 1)) / laneCount;
      const cross = Math.max(1, scale > 1 ? Math.min(fitCross, (nominalCross - trim) * scale + trim) : fitCross);
      const inset = Math.max(0, (limit - cross * laneCount - gap * (laneCount - 1)) / 2);
      const ends = Array(laneCount).fill(0);
      const knownLaneAfter = Array(count).fill(false);
      let knownLane = false;
      for (let i = count - 1; i >= 0; i--) {
        knownLaneAfter[i] = knownLane;
        if (Number.isInteger(laneHints[i]) && laneHints[i] >= 0 && laneHints[i] < laneCount) knownLane = true;
      }
      for (let index = 0; index < count; index++) {
        const ordinal = ordinalStart + index;
        const hint = laneHints[index];
        const lane = Number.isInteger(hint) && hint >= 0 && hint < laneCount
          ? hint
          : knownLaneAfter[index]
            ? ((ordinal % laneCount) + laneCount) % laneCount
            : ends.indexOf(Math.min(...ends));
        lanes[index] = lane;
        const imageWidth = horizontal ? Math.max(1, cross - padding - caption) * safe[index] : Math.max(1, cross - padding);
        const imageHeight = horizontal ? Math.max(1, cross - padding - caption) / safe[index] : Math.max(1, cross - padding) / safe[index];
        const cardWidth = horizontal ? imageWidth + padding : cross;
        const cardHeight = horizontal ? cross : imageHeight + padding + caption;
        const x = horizontal ? ends[lane] : inset + lane * (cross + gap);
        const y = horizontal ? inset + lane * (cross + gap) : ends[lane];
        boxes[index] = { index, ordinal, bandIndex: lane, lane, x, y, width: cardWidth, height: cardHeight };
        bandIds[index] = `lane:${lane}`;
        ends[lane] += (horizontal ? cardWidth : cardHeight) + gap;
      }
      const extent = Math.max(0, ...ends) - (count ? gap : 0);
      for (let lane = 0; lane < laneCount; lane++) {
        const indices = boxes.filter(box => box.lane === lane).map(box => box.index);
        if (!indices.length) continue;
        const laneBoxes = indices.map(index => boxes[index]);
        bands.push({ index: lane, key: `lane:${lane}`, startIndex: Math.min(...indices), endIndex: Math.max(...indices),
          x: horizontal ? 0 : inset + lane * (cross + gap), y: horizontal ? inset + lane * (cross + gap) : 0,
          width: horizontal ? extent : cross, height: horizontal ? cross : extent, size: indices.length });
      }
      return { boxes, width: horizontal ? extent : width, height: horizontal ? height : extent, bandSize: laneCount, bands, lanes, bandIds };
    }

    // Opposite-axis alignment uses contiguous justified rows or columns. Once a
    // band is assigned, keep its membership stable through thumbnail decoding.
    const target = horizontal ? Math.min(210 * scale, width) : Math.min(180, Math.max(100, width / 3)) * scale;
    const limit = horizontal ? height : width;
    let offset = 0, start = 0, generated = 0;
    const usedBands = new Set(bandHints.filter(key => key !== null && key !== undefined));
    while (start < count) {
      let end = start + 1, key = bandHints[start];
      if (key !== null && key !== undefined && !bands.some(band => band.key === key)) {
        while (end < count && bandHints[end] === key) end++;
      } else {
        do { key = `band:${ordinalStart + start}:${generated++}`; } while (usedBands.has(key));
        usedBands.add(key);
        let sum = horizontal ? 1 / safe[start] : safe[start];
        while (end < count && (bandHints[end] === null || bandHints[end] === undefined)) {
          const n = end - start + 1;
          const value = horizontal ? 1 / safe[end] : safe[end];
          const projected = (sum + value) * target + n * (horizontal ? padding + caption : padding) + (n - 1) * gap;
          if (horizontal && projected > limit) break;
          sum += value; end++;
          if (projected >= limit) break;
        }
      }
      const sum = safe.slice(start, end).reduce((total, ratio) => total + (horizontal ? 1 / ratio : ratio), 0);
      const n = end - start;
      const fit = Math.max(1, (limit - (n - 1) * gap - n * (horizontal ? padding + caption : padding)) / sum);
      const size = Math.min(fit, target * (end === count || horizontal ? 1 : 1.35));
      let cross = 0, bandWidth = 0, bandHeight = 0;
      for (let index = start; index < end; index++) {
        const ratio = safe[index];
        const cardWidth = (horizontal ? size : size * ratio) + padding;
        const cardHeight = (horizontal ? size / ratio : size) + padding + caption;
        const x = horizontal ? offset : cross;
        const y = horizontal ? cross : offset;
        boxes[index] = { index, ordinal: ordinalStart + index, bandIndex: bands.length, lane: bands.length, x, y, width: cardWidth, height: cardHeight };
        bandIds[index] = key;
        cross += (horizontal ? cardHeight : cardWidth) + gap;
        bandWidth = Math.max(bandWidth, x + cardWidth - (horizontal ? offset : 0));
        bandHeight = Math.max(bandHeight, y + cardHeight - (horizontal ? 0 : offset));
      }
      offset += size + padding + (horizontal ? 0 : caption) + gap;
      bands.push({ index: bands.length, key, startIndex: start, endIndex: end - 1,
        x: horizontal ? offset - size - padding - gap : 0, y: horizontal ? 0 : offset - size - padding - caption - gap,
        width: horizontal ? size + padding : limit, height: horizontal ? limit : size + padding + caption, size: n });
      start = end;
    }
    const counts = bands.map(band => band.size).sort((a, b) => a - b);
    const middle = Math.floor(counts.length / 2);
    const bandSize = counts.length ? counts.length % 2 ? counts[middle] : Math.round((counts[middle - 1] + counts[middle]) / 2) : 1;
    return { boxes, width: horizontal ? Math.max(0, offset - gap) : width, height: horizontal ? height : Math.max(0, offset - gap), bandSize, bands, lanes, bandIds };
  }
  function overviewSpatialIndex(boxes, horizontal) {
    const sorted = boxes.map((box, index) => ({ index, box, start: horizontal ? box.x : box.y,
      end: horizontal ? box.x + box.width : box.y + box.height })).sort((a, b) => a.start - b.start);
    let end = -Infinity;
    for (const item of sorted) { end = Math.max(end, item.end); item.maxEnd = end; }
    return sorted;
  }
  function overviewIndexedRange(sorted, viewport, horizontal) {
    const start = horizontal ? viewport.left : viewport.top, end = horizontal ? viewport.right : viewport.bottom;
    let low = 0, high = sorted.length;
    while (low < high) { const mid = (low + high) >>> 1; if (sorted[mid].maxEnd <= start) low = mid + 1; else high = mid; }
    let first = -1, last = -1;
    for (let i = low; i < sorted.length && sorted[i].start < end; i++) {
      const { box, index } = sorted[i];
      if (box.x + box.width <= viewport.left || box.x >= viewport.right || box.y + box.height <= viewport.top || box.y >= viewport.bottom) continue;
      first = first < 0 ? index : Math.min(first, index);
      last = Math.max(last, index);
    }
    return { first, last };
  }
  function overviewCacheRange(total, firstVisible, lastVisible, before, after, hasImage = () => true) {
    const count = Math.max(0, Math.floor(Number(total) || 0));
    if (!count) return { start: 0, end: -1, before: 0, after: 0 };
    const first = Math.max(0, Math.min(count - 1, Math.floor(Number(firstVisible) || 0)));
    const last = Math.max(first, Math.min(count - 1, Math.floor(Number(lastVisible) || first)));
    const targetBefore = Math.max(0, Math.floor(Number(before) || 0));
    const targetAfter = Math.max(0, Math.floor(Number(after) || 0));
    let start = first, end = last, foundBefore = 0, foundAfter = 0;
    while (start > 0 && foundBefore < targetBefore) { if (hasImage(--start)) foundBefore++; }
    while (end < count - 1 && foundAfter < targetAfter) { if (hasImage(++end)) foundAfter++; }
    return { start, end, before: foundBefore, after: foundAfter };
  }
  function overviewRetryIntent(intent, side, amount, now) {
    side = Math.sign(Number(side));
    amount = Math.min(24, Math.max(0, Number(amount) || 0));
    if (!side || !amount || !Number.isFinite(now)) return false;
    if (intent.side !== side || now - intent.lastAt > 500) {
      intent.samples = []; intent.retried = false;
    }
    intent.side = side; intent.lastAt = now;
    intent.samples = (intent.samples || []).filter(sample => now - sample.at <= 500);
    intent.samples.push({ at: now, amount });
    intent.distance = intent.samples.reduce((sum, sample) => sum + sample.amount, 0);
    if (intent.retried || intent.distance < 72) return false;
    intent.retried = true; intent.lastRetryAt = now;
    return true;
  }
  lens.controls = { ticks, overviewTicks, rulerMax, fromPosition, toPosition, holdPan, wheelMode, overviewLayout, overviewSpatialIndex, overviewIndexedRange, overviewCacheRange, overviewRetryIntent };
})();
