'use strict';
const cap=document.getElementById('internal-cap'),threshold=document.getElementById('threshold');
function update(){
 const ca=Number(cap.value),vt=Number(threshold.value),r=ca/50,limit=vt/(2.5-vt),cutoff=r<=limit;
 const vx=cutoff?2.5-vt:2.5/(1+r),out=2.5-r*vx;
 const set=(id,value)=>document.getElementById(id).textContent=value;
 set('cap-value',String(ca));set('out-voltage',out.toFixed(4));set('node-voltage',vx.toFixed(4));set('voltage-drop',(2.5-out).toFixed(4));set('cap-ratio',r.toFixed(4));
 set('regime',Math.abs(r-limit)<1e-10?'两种情形的边界':cutoff?'传输管先达到阈值限制':'两节点达到共同电压');
 set('margin',Math.abs(out-1.25)<1e-10?'输出等于 VM':out>1.25?'输出高于 VM':'输出低于 VM');set('charge-total',(50*out+ca*vx).toFixed(4));
 document.getElementById('out-bar').style.width=(out/2.5*100)+'%';document.getElementById('node-bar').style.width=(vx/2.5*100)+'%';
}
cap.addEventListener('input',update);threshold.addEventListener('change',update);update();
