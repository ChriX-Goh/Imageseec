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
  function overviewLayout(ratios, width, height, horizontal = false, clean = false, alignment = 'auto', gap = 12, sizePercent = 100, startOrdinal = 0) {
    const padding = clean ? 0 : 12, caption = clean ? 0 : 27;
    const scale = Math.max(25, Math.min(300, Number(sizePercent) || 100)) / 100;
    const count = Math.max(0, Math.floor(Number(ratios?.length) || 0));
    const ordinalStart = Math.floor(Number(startOrdinal) || 0);
    const resolved = alignment === 'auto' ? (horizontal ? 'horizontal' : 'vertical') : alignment;
    const preferredImageWidth = resolved === 'horizontal' ? 180 * scale * 4 / 3 : 210 * scale;
    const preferredImageHeight = resolved === 'vertical' ? 210 * scale * 3 / 4 : 180 * scale;
    const crossLimit = horizontal ? height : width;
    const preferredTrack = horizontal
      ? preferredImageHeight + padding + caption
      : preferredImageWidth + padding;
    const bandSize = Math.max(1, Math.min(64, Math.floor((crossLimit + gap) / (preferredTrack + gap)) || 1));
    const cross = Math.max(1, (crossLimit - gap * (bandSize - 1)) / bandSize);
    const imageHeight = horizontal ? Math.max(1, cross - padding - caption) : Math.max(1, cross - padding) * 3 / 4;
    // Every unloaded and loaded thumbnail keeps this same 4:3 geometry.
    const cardWidth = horizontal ? imageHeight * 4 / 3 + padding : cross;
    const cardHeight = horizontal ? cross : imageHeight + padding + caption;
    const firstBand = Math.floor(ordinalStart / bandSize);
    const lastBand = count ? Math.floor((ordinalStart + count - 1) / bandSize) : firstBand - 1;
    const bands = [];
    for (let absolute = firstBand; absolute <= lastBand; absolute++) {
      const firstOrdinal = absolute * bandSize;
      const lastOrdinal = firstOrdinal + bandSize - 1;
      const firstIndex = Math.max(0, firstOrdinal - ordinalStart);
      const lastIndex = Math.min(count - 1, lastOrdinal - ordinalStart);
      const bandIndex = absolute - firstBand;
      const x = horizontal ? bandIndex * (cardWidth + gap) : 0;
      const y = horizontal ? 0 : bandIndex * (cardHeight + gap);
      bands.push({
        index: bandIndex, ordinal: absolute, ordinalStart: firstOrdinal, ordinalEnd: lastOrdinal,
        startIndex: firstIndex, endIndex: lastIndex, x, y,
        width: horizontal ? cardWidth : width, height: horizontal ? height : cardHeight
      });
    }
    const boxes = Array(count);
    for (let index = 0; index < count; index++) {
      const ordinal = ordinalStart + index;
      const absoluteBand = Math.floor(ordinal / bandSize);
      const bandIndex = absoluteBand - firstBand;
      const lane = ((ordinal % bandSize) + bandSize) % bandSize;
      const band = bands[bandIndex];
      boxes[index] = horizontal
        ? { index, ordinal, bandIndex, x: band.x, y: lane * (cross + gap), width: cardWidth, height: cross }
        : { index, ordinal, bandIndex, x: lane * (cross + gap), y: band.y, width: cross, height: cardHeight };
    }
    const extent = count ? (bands.length - 1) * ((horizontal ? cardWidth : cardHeight) + gap) + (horizontal ? cardWidth : cardHeight) : 0;
    return { boxes, width: horizontal ? extent : width, height: horizontal ? height : extent, bandSize, bands };
  }
  function overviewCacheRange(total, firstVisible, lastVisible, before, after) {
    const count = Math.max(0, Math.floor(Number(total) || 0));
    if (!count) return { start: 0, end: -1, before: 0, after: 0 };
    const first = Math.max(0, Math.min(count - 1, Math.floor(Number(firstVisible) || 0)));
    const last = Math.max(first, Math.min(count - 1, Math.floor(Number(lastVisible) || first)));
    const start = Math.max(0, first - Math.max(0, Math.floor(Number(before) || 0)));
    const end = Math.min(count - 1, last + Math.max(0, Math.floor(Number(after) || 0)));
    return { start, end, before: first - start, after: end - last };
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
  lens.controls = { ticks, overviewTicks, rulerMax, fromPosition, toPosition, holdPan, wheelMode, overviewLayout, overviewCacheRange, overviewRetryIntent };
})();
