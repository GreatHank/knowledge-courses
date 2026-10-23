'use strict';
(()=>{
const $=id=>document.getElementById(id);
if($('ls-demo')){
 const nodes=['u','v','w','x','y','z'],order=['u','x','y','v','w','z'];
 const edges=[['u','v',2],['u','x',1],['u','w',5],['v','w',3],['v','x',2],['x','w',3],['x','y',1],['w','y',1],['w','z',5],['y','z',2]];
 const graph=Object.fromEntries(nodes.map(n=>[n,{}]));
 for(const [a,b,c] of edges){graph[a][b]=c;graph[b][a]=c;}
 const d=Object.fromEntries(nodes.map(n=>[n,Infinity])),p={},done=[],states=[];d.u=0;
 for(let step=0;step<nodes.length;step++){
  const next=order.filter(n=>!done.includes(n)).reduce((a,b)=>d[b]<d[a]?b:a);
  done.push(next);
  for(const [v,c] of Object.entries(graph[next]))if(!done.includes(v)&&d[next]+c<d[v]){d[v]=d[next]+c;p[v]=next;}
  states.push({done:[...done],d:{...d},p:{...p}});
 }
 let pos=0;
 const fmt=v=>Number.isFinite(v)?String(v):'∞';
 const render=()=>{
  const st=states[pos];
  $('ls-output').textContent='第'+pos+'步：N′={'+st.done.join(',')+'}；距离按u,v,w,x,y,z排列为'+nodes.map(n=>fmt(st.d[n])).join(',')+'。';
  const rows=nodes.map(n=>'<tr><td>'+n+'</td><td>'+fmt(st.d[n])+'</td><td>'+(st.p[n]||'—')+'</td><td>'+(st.done.includes(n)?'已确定':'暂定')+'</td></tr>').join('');
  $('ls-table').innerHTML='<div class="table-wrap" tabindex="0" role="region" aria-label="算法当前距离表"><table><thead><tr><th>节点</th><th>距离</th><th>前驱</th><th>状态</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  $('ls-prev').disabled=pos===0;$('ls-next').disabled=pos===states.length-1;
 };
 $('ls-prev').addEventListener('click',()=>{pos--;render();});
 $('ls-next').addEventListener('click',()=>{pos++;render();});
 $('ls-reset').addEventListener('click',()=>{pos=0;render();});render();
}
if($('bgp-demo')){
 const ids=['bgp-pref','bgp-path','bgp-cost'];
 const render=()=>{
  const raw=ids.map(id=>$(id).value),v=raw.map(Number);
  if(raw.some(x=>x.trim()==='')||v.some((x,i)=>!Number.isInteger(x)||x<Number($(ids[i]).min)||x>Number($(ids[i]).max))){
   $('bgp-output').textContent='请输入范围内整数：偏好0–1000、路径长度1–20、内部代价0–1000。';return;
  }
  const [pref,path,cost]=v;let winner,reason;
  if(pref!==100){winner=pref>100?'B':'A';reason='LOCAL_PREF较高优先（A=100，B='+pref+'）';}
  else if(path!==2){winner=path<2?'B':'A';reason='偏好相同，AS路径较短优先（A=2，B='+path+'）';}
  else if(cost!==2){winner=cost<2?'B':'A';reason='偏好和AS路径长度相同，内部代价较小优先（A=2，B='+cost+'）';}
  else{winner='A';reason='三个指标完全相同，教学约定固定保留A';}
  $('bgp-output').textContent='选择'+winner+'：'+reason+'。';
 };
 ids.forEach(id=>$(id).addEventListener('input',render));render();
}
})();

