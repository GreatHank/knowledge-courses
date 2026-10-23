'use strict';
(() => {
 const byId=id=>document.getElementById(id);
 const demo=byId('timing-demo');if(!demo)return;
 const ids=['period','logicMax','logicMin'];
 function update(){
  const [period,max,min]=ids.map(id=>Number(byId(id).value));
  ids.forEach(id=>{byId(id+'-value').value=byId(id).value;});
  const required=100+max+80,earliest=30+min,setup=period-required,hold=earliest-60;
  byId('setupMargin').textContent=setup+' ps';byId('holdMargin').textContent=hold+' ps';
  byId('setupStatus').textContent=setup>=0?'满足所设建立约束':'建立违例';
  byId('holdStatus').textContent=hold>=0?'满足所设保持约束':'保持违例';
  byId('required').textContent=required;byId('earliest').textContent=earliest;
  byId('max-bar').style.width=max/12+'%';byId('min-bar').style.width=min/2+'%';
  byId('period-marker').style.left=period/12+'%';
  byId('setup-track').setAttribute('aria-label',`最大路径加建立时间共${required}ps，周期${period}ps`);
  byId('hold-track').setAttribute('aria-label',`最早${earliest}ps变化，要求保持60ps`);
  byId('timing-explanation').textContent=(setup<0?`最慢路径还差 ${-setup} ps；增加周期或缩短最大路径可改善建立余量。`:'最慢路径在所设周期内来得及。')+(hold<0?`最短路径提前了 ${-hold} ps；增加周期不能修复保持违例，需要改变最短路径或采样条件。`:'最短路径满足所设保持要求；改变周期不改变这项保持余量。');
 }
 ids.forEach(id=>byId(id).addEventListener('input',update));update();
})();
