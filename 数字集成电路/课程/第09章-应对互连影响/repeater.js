'use strict';
(() => {
  const controls = ['length', 'segments', 'size'].map(id => document.getElementById(id));
  const rd = 7800, cd = 6e-15, r = 0.075, c = 0.11e-15;
  const text = (id, value) => { document.getElementById(id).textContent = value; };
  const terms = (length, m, s) => [
    0.69 * rd * c * length / s,
    0.69 * m * rd * cd,
    0.69 * r * length * s * cd,
    0.38 * r * c * length * length / m
  ].map(value => value * 1e9);
  function update() {
    const [mm, m, s] = controls.map(control => Number(control.value));
    const length = mm * 1000;
    const parts = terms(length, m, s);
    const delay = parts.reduce((a, b) => a + b, 0);
    const optimalM = length * Math.sqrt(0.38 * r * c / (0.69 * rd * cd));
    const optimalS = Math.sqrt(rd * c / (r * cd));
    ['length', 'segments', 'size'].forEach((id, i) => text(id + '-label', [mm, m, s][i]));
    text('delay', delay.toFixed(3));
    text('wire', (0.38 * r * c * length * length * 1e9).toFixed(3));
    text('optimal-m', optimalM.toFixed(3));
    text('optimal-s', optimalS.toFixed(3));
    text('critical-length', (mm / optimalM).toFixed(3));
    text('effort', m * s);
    ['drive', 'gates', 'load', 'wire'].forEach((id, i) => text('term-' + id, parts[i].toFixed(3)));
    const values = Array.from({length: 64}, (_, i) => terms(length, i + 1, s).reduce((a, b) => a + b, 0));
    const max = Math.max(...values) * 1.1;
    const x = value => 70 + (value - 1) / 63 * 405;
    const y = value => 245 - value / max * 210;
    const node = (tag, attrs, value) => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
      Object.entries(attrs).forEach(([key, v]) => element.setAttribute(key, v));
      if (value !== undefined) element.textContent = value;
      return element;
    };
    const plot = document.getElementById('plot');
    plot.replaceChildren();
    plot.append(node('path', {d: 'M70 25V245H475', class: 'axis', fill: 'none'}));
    [0, max / 2, max].forEach(value => {
      plot.append(node('text', {x: 60, y: y(value) + 6, 'text-anchor': 'end'}, value.toFixed(1)));
    });
    [1, 16, 32, 48, 64].forEach(value => plot.append(node('text', {x: x(value), y: 270, 'text-anchor': 'middle'}, value)));
    plot.append(node('text', {x: 72, y: 20}, '延迟 / ns'));
    plot.append(node('text', {x: 475, y: 294, 'text-anchor': 'end'}, '线段数 m'));
    plot.append(node('path', {class: 'curve', d: values.map((v, i) => `${i ? 'L' : 'M'}${x(i + 1)},${y(v)}`).join(' ')}));
    plot.append(node('line', {class: 'opt', x1: x(optimalM), x2: x(optimalM), y1: 25, y2: 245}));
    plot.append(node('circle', {class: 'point', cx: x(m), cy: y(delay), r: 5}));
    text('chart-desc', `线长 ${mm} mm、尺寸 ${s} 倍；当前 ${m} 段，延迟 ${delay.toFixed(3)} ns。曲线固定线长和尺寸，扫描 1 至 64 段。`);
  }
  controls.forEach(control => control.addEventListener('input', update));
  update();
})();
