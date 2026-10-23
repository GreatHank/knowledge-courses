(() => {
  const get = id => document.getElementById(id);
  function update() {
    const r = Number(get('r').value), c = Number(get('c').value), v = Number(get('v').value);
    const tau = r * c; // kΩ × fF = ps
    for (const [id, value] of Object.entries({r, c, v: v.toFixed(1)})) get(id + '-value').textContent = value;
    for (const [id, value] of Object.entries({tau, t50: Math.log(2)*tau, t90: Math.log(10)*tau, tr: Math.log(9)*tau})) get(id).textContent = value.toFixed(1) + ' ps';
    get('ein').textContent = (c*v*v).toFixed(1) + ' fJ';
    const curve = Array.from({length:201}, (_,i) => {
      const t = i*5, x = 58 + t/1000*590, y = 264 - (1-Math.exp(-t/tau))*218;
      return (i ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2);
    }).join(' ');
    get('rc-curve').setAttribute('d', curve);
    const marker = 58 + Math.log(2)*tau/1000*590;
    get('rc-marker').setAttribute('x1', marker);
    get('rc-marker').setAttribute('x2', marker);
  }
  ['r','c','v'].forEach(id => get(id).addEventListener('input', update));
  update();
})();
