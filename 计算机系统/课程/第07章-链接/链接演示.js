'use strict';
const archiveDemo=document.querySelector('[data-archive-demo]');
if(archiveDemo){
 const main={name:'main.o',defs:['main'],refs:['addvec']};
 const vector={name:'libvector.a',members:[{name:'multvec.o',defs:['multvec'],refs:[]},{name:'addvec.o',defs:['addvec'],refs:[]}]};
 const mainX={name:'main.o',defs:['main'],refs:['x']};
 const libx={name:'libx.a',members:[{name:'helper.o',defs:['helper'],refs:[]},{name:'x.o',defs:['x'],refs:['y']}]};
 const liby={name:'liby.a',members:[{name:'y.o',defs:['y'],refs:['helper']}]};
 const cases={good:[main,vector],bad:[vector,main],chain:[main,{name:'libvector.a',members:[{name:'helper.o',defs:['helper'],refs:[]},{name:'addvec.o',defs:['addvec'],refs:['helper']}]}],cycle:[mainX,libx,liby,libx],'cycle-bad':[mainX,libx,liby]};
 const q=s=>archiveDemo.querySelector(s),show=set=>set.length?'{ '+set.join(', ')+' }':'∅';
 let states=[],position=0;
 function simulate(inputs){
  const E=new Set(),U=new Set(),D=new Set(),events=[];
  function record(event){events.push({event,E:[...E],U:[...U],D:[...D]});}
  function include(m){E.add(m.name);for(const d of m.defs){D.add(d);U.delete(d);}for(const r of m.refs)if(!D.has(r))U.add(r);}
  for(const input of inputs){
   if(!input.members){include(input);record('纳入普通目标文件 '+input.name);continue;}
   record('开始扫描 '+input.name);
   let changed;
   do{changed=false;for(const m of input.members){if(!E.has(m.name)&&m.defs.some(d=>U.has(d))){include(m);record('从 '+input.name+' 抽取 '+m.name);changed=true;}}}while(changed);
   record(input.name+' 内已无可抽取成员，转向下一输入');
  }
  record(U.size?'结束：仍有未解析引用，链接失败':'结束：U 为空，可以合并并重定位');return events;
 }
 function render(){
  const s=position?states[position-1]:{E:[],U:[],D:[],event:'从左到右处理输入，三个集合初始为空。'};
  q('[data-e]').textContent=show(s.E);q('[data-u]').textContent=show(s.U);q('[data-d]').textContent=show(s.D);q('[data-event]').textContent=`${position}/${states.length} · ${s.event}`;
  q('[data-trace]').replaceChildren();
  states.slice(0,position).forEach((s,i)=>{const tr=document.createElement('tr');[String(i+1),s.event,show(s.U)].forEach(t=>{const td=document.createElement('td');td.textContent=t;tr.append(td);});q('[data-trace]').append(tr);});
  q('[data-step]').disabled=position===states.length;q('[data-all]').disabled=position===states.length;
 }
 function reset(){states=simulate(cases[q('[data-scenario]').value]);position=0;render();}
 q('[data-scenario]').addEventListener('change',reset);q('[data-step]').addEventListener('click',()=>{position++;render();});q('[data-all]').addEventListener('click',()=>{position=states.length;render();});q('[data-reset]').addEventListener('click',reset);reset();
}
const relocationDemo=document.querySelector('[data-relocation-demo]');
if(relocationDemo){
 const q=s=>relocationDemo.querySelector(s),hex=n=>'0x'+n.toString(16),cases={book:{base:0x4004d0,S:0x4004e8},shift:{base:0x5004d0,S:0x5004e8},backward:{base:0x4004d0,S:0x4004c0}};
 function render(){const {base,S}=cases[q('[data-relocation]').value],P=base+15,next=P+4,value=S-4-P;
  const bytes=Array.from({length:4},(_,i)=>((value>>>0)>>>8*i&255).toString(16).padStart(2,'0')).join(' ');
  q('[data-calculation]').textContent=`S = ${hex(S)}\nP = ${hex(P)}\nA = -4\nS + A - P = ${value}`;
  q('[data-bytes]').textContent=`指令：e8 ${bytes}\n下一条：${hex(next)}\n有符号位移：${value}\n目标：${hex(next+value)}`;
 }
 q('[data-relocation]').addEventListener('change',render);render();
}
