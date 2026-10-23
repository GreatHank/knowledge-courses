"use strict";
// A dependency-and-issue-capacity teaching model, not a CPU benchmark.
function accumulatorSchedule(k, count = 12) {
  const ready = Array(k).fill(0);
  const issued = new Map();
  const events = [];
  for (let i = 0; i < count; i++) {
    const chain = i % k;
    let start = ready[chain];
    while ((issued.get(start) || 0) >= 2) start++;
    issued.set(start, (issued.get(start) || 0) + 1);
    ready[chain] = start + 5;
    events.push({element: i, chain, start, end: start + 5});
  }
  return events;
}
function drawAccumulators() {
  const k = Number(document.getElementById('acc-count').value);
  const events = accumulatorSchedule(k);
  const finish = Math.max(...events.map(e => e.end));
  document.getElementById('acc-result').textContent = `K=${k}：稳态 CPE 下界 max(5/${k}, 0.5) = ${Math.max(5/k, .5).toFixed(2)}。图中前 12 次乘法从 t=0 开始，到 t=${finish} 完成；未计末尾合并。`;
  const chart = document.createElement('div');
  chart.className = 'timing';
  chart.setAttribute('role', 'img');
  chart.setAttribute('aria-label', `${k} 个累积器的前 12 次乘法调度，全部乘法在第 ${finish} 拍完成，不含合并。`);
  for (const e of events) {
    const row = document.createElement('div');
    row.className = 'timing-row';
    const label = document.createElement('span');
    label.textContent = `d${e.element} · acc${e.chain}`;
    const track = document.createElement('div');
    track.className = 'timing-track';
    const block = document.createElement('span');
    block.className = 'timing-block';
    block.style.left = `${e.start / finish * 100}%`;
    block.style.width = `${5 / finish * 100}%`;
    block.textContent = String(e.start);
    block.title = `开始 ${e.start}，完成 ${e.end}`;
    track.append(block); row.append(label, track); chart.append(row);
  }
  document.getElementById('acc-timeline').replaceChildren(chart);
}
document.getElementById('acc-count').addEventListener('change', drawAccumulators);
drawAccumulators();
