'use strict';
(() => {
 const byId=id=>document.getElementById(id);
 const controls=['period','skew','jitter'];
 function update(){
  const [T,d,J]=controls.map(id=>Number(byId(id).value));
  controls.forEach(id=>byId(id+'-value').textContent=byId(id).value);
  const setup=T+d-2*J-640,hold=90-d-2*J,lo=640-T+2*J,hi=90-2*J;
  byId('setup-margin').textContent=setup;byId('hold-margin').textContent=hold;
  byId('allowed').textContent=lo<=hi?`${lo} ≤ δ ≤ ${hi} ps`:`无可行区间（下限 ${lo} ps > 上限 ${hi} ps）`;
  byId('status').textContent=setup<0||hold<0?'至少一种约束未满足。':setup===0||hold===0?'到达零裕量边界，尚无实际设计余量。':'两种约束均有正裕量。';
  const a=x=>T+x-2*J-640,b=x=>90-x-2*J;
  const low=Math.floor(Math.min(0,a(-200),b(200))/100)*100,high=Math.ceil(Math.max(0,a(200),b(-200))/100)*100;
  const x=v=>80+(v+200)*670/400,y=v=>330-(v-low)*300/(high-low);
  for(const [name,fn,val] of [['setup',a,setup],['hold',b,hold]]){
   byId(name+'-line').setAttribute('d',`M80 ${y(fn(-200))} L750 ${y(fn(200))}`);
   byId(name+'-point').setAttribute('cx',x(d));byId(name+'-point').setAttribute('cy',y(val));
  }
  byId('zero').setAttribute('y1',y(0));byId('zero').setAttribute('y2',y(0));byId('zero-label').setAttribute('y',y(0)+5);
  byId('top-value').textContent=high;byId('bottom-value').textContent=low;
  byId('chart-desc').textContent=`周期 ${T} ps、每端误差 ${J} ps、偏斜 ${d} ps，建立裕量 ${setup} ps，保持裕量 ${hold} ps。零线以上为非负裕量。`;
 }
 controls.forEach(id=>byId(id).addEventListener('input',update));update();
})();
