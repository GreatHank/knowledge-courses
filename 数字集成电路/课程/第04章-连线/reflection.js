(() => {
  const ratio = document.querySelector('#source-ratio');
  const arrival = document.querySelector('#arrival');
  const svg = document.querySelector('#lattice');
  const fmt = x => (Math.abs(x)<1e-10 ? 0 : x).toFixed(4);
  function update() {
    const r = Number(ratio.value), selected = Number(arrival.value);
    const gamma = (r-1)/(r+1), a0 = 5/(r+1);
    let total=0, rows='', drawing='<title>无损开路线的四次负载到达</title><defs><marker id="arrow-forward" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="context-stroke"/></marker></defs><line class="rail" x1="95" y1="50" x2="95" y2="580"/><line class="rail" x1="525" y1="50" x2="525" y2="580"/><text x="95" y="30" text-anchor="middle">源端</text><text x="525" y="30" text-anchor="middle">开路负载</text>';
    for(let k=0;k<4;k++) {
      const wave=a0*gamma**k, y=60+140*k;
      total+=2*wave;
      rows+=`<tr aria-current="${selected===k+1}"><td>${2*k+1} T</td><td>${fmt(wave)} V</td><td>${fmt(2*wave)} V</td><td>${fmt(total)} V</td></tr>`;
      drawing+=`<path class="forward ${selected===k+1?'chosen':''}" d="M95 ${y} L525 ${y+65}" marker-end="url(#arrow-forward)"/><text class="wave-label" x="310" y="${y+17}" text-anchor="middle">${fmt(wave)} V →</text><text x="555" y="${y+71}">${2*k+1}T</text>`;
      if(k<3)drawing+=`<path class="return" d="M525 ${y+65} L95 ${y+140}" marker-end="url(#arrow-forward)"/><text class="wave-label" x="310" y="${y+126}" text-anchor="middle">← ${fmt(wave)} V</text>`;
      if(selected===k+1) document.querySelector('#load-voltage').textContent=fmt(total)+' V';
    }
    document.querySelector('#injected').textContent=fmt(a0)+' V';
    document.querySelector('#source-gamma').textContent=fmt(gamma);
    document.querySelector('#arrival-number').textContent=selected;
    document.querySelector('#arrival-time').textContent=(2*selected-1)+' T';
    document.querySelector('#arrival-table tbody').innerHTML=rows;
    svg.innerHTML=drawing;
    svg.style.display='block';
  }
  ratio.addEventListener('change',update);
  arrival.addEventListener('input',update);
  update();
})();
