'use strict';
(() => {
  const byId = id => document.getElementById(id);
  const gate = byId('vgs'), drain = byId('vds');
  function current(vgs, vds, short) {
    const overdrive = vgs - 0.5;
    if (overdrive <= 0) return 0;
    const v = Math.min(overdrive, vds, short ? 0.6 : Infinity);
    return 200 * (overdrive*v - v*v/2);
  }
  function region(vgs, vds, short) {
    const overdrive = vgs - 0.5;
    if (overdrive <= 0) return '理想关断（忽略漏电）';
    if (vds === 0) return '无漏源压差';
    if (vds < Math.min(overdrive, short ? 0.6 : Infinity)) return '电阻区';
    return short && overdrive > 0.6 ? '速度限制' : '夹断饱和';
  }
  const y = i => 290-i*260/250;
  function update() {
    const vg = Number(gate.value), vd = Number(drain.value);
    byId('vgs-value').textContent = vg.toFixed(1)+' V';
    byId('vds-value').textContent = vd.toFixed(1)+' V';
    for (const short of [false,true]) {
      const prefix = short ? 'short' : 'long';
      const i = current(vg,vd,short);
      byId(prefix+'-current').textContent = i.toFixed(1)+' μA';
      byId(prefix+'-state').textContent = region(vg,vd,short);
      byId(prefix+'-point').setAttribute('cx',String(70+vd*270));
      byId(prefix+'-point').setAttribute('cy',String(y(i)));
      byId(prefix+'-path').setAttribute('d',Array.from({length:201},(_,k)=>`${k?'L':'M'}${70+k*2.7} ${y(current(vg,k/100,short))}`).join(' '));
    }
    byId('bias-line').setAttribute('x1',String(70+vd*270));
    byId('bias-line').setAttribute('x2',String(70+vd*270));
    byId('iv-desc').textContent = `横轴 VDS 0 至 2 V，纵轴 0 至 250 微安；当前 VGS ${vg.toFixed(1)} V，VDS ${vd.toFixed(1)} V。`;
    byId('model-note').textContent = vg<=0.5 ? '这里按理想手算模型显示零电流；真实器件仍可能有亚阈值与结漏电。' : vg<=1.1 ? '过驱动不超过 0.6 V，夹断先发生，两条模型曲线重合。' : '相同过驱动下，速度限制模型更早趋于饱和；这里关闭了沟道长度调制。';
  }
  gate.addEventListener('input',update);
  drain.addEventListener('input',update);
  update();
})();
