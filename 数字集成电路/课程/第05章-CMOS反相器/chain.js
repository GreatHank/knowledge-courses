'use strict';
(() => {
 const byId = id => document.getElementById(id);
 const fanout = byId('total-fanout'), loading = byId('self-loading'), count = byId('stage-count');
 function update() {
  const F = Number(fanout.value), gamma = Number(loading.value), N = Number(count.value);
  const values = Array.from({length: 8}, (_, i) => {
   const n = i + 1, f = F ** (1 / n);
   return {n, f, delay: n * (1 + f / gamma)};
  });
  const chosen = values[N - 1], best = values.reduce((a, b) => a.delay < b.delay ? a : b);
  byId('stage-number').textContent = N;
  byId('stage-effort').textContent = chosen.f.toFixed(3);
  byId('chain-delay').textContent = chosen.delay.toFixed(3);
  byId('best-stage').textContent = best.n + ' 级';
  byId('polarity').textContent = N % 2 ? '反相' : '同相';
  byId('stage-sizes').replaceChildren(...Array.from({length: N}, (_, j) => {
   const li = document.createElement('li');
   li.textContent = `第 ${j + 1} 级：${(chosen.f ** j).toFixed(3)}`;
   return li;
  }));
  const max = Math.max(...values.map(v => v.delay));
  const rows = values.map(v => {
   const tr = document.createElement('tr');
   if (v.n === N) tr.setAttribute('aria-current', 'true');
   for (const value of [String(v.n), v.f.toFixed(3), v.delay.toFixed(3)]) {
    const td = document.createElement('td'); td.textContent = value; tr.append(td);
   }
   const track = document.createElement('span'), bar = document.createElement('span');
   track.className = 'bar-track'; bar.style.width = (100 * v.delay / max) + '%';
   track.append(bar); tr.lastElementChild.append(track);
   return tr;
  });
  byId('stage-results').tBodies[0].replaceChildren(...rows);
 }
 for (const control of [fanout, loading, count]) control.addEventListener('input', update);
 update();
})();
