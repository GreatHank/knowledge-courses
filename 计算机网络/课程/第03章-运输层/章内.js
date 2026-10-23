'use strict';
const byId=id=>document.getElementById(id);
const checksum=byId('checksum-demo');
if(checksum){
 const ids=['word1','word2','word3'],out=byId('checksum-output'),hex=n=>'0x'+n.toString(16).toUpperCase().padStart(4,'0');
 const update=()=>{
  const values=ids.map(id=>byId(id).value.trim());
  if(values.some(v=>!/^[0-9a-f]{1,4}$/i.test(v))){out.textContent='请输入1–4位十六进制数字（0–FFFF）。';return;}
  let sum=values.reduce((s,v)=>s+parseInt(v,16),0);
  while(sum>65535)sum=(sum&65535)+(sum>>>16);
  const check=(~sum)&65535;
  out.textContent='回卷和 '+hex(sum)+'；检验和 '+hex(check)+'；含检验和的和 0xFFFF';
 };
 checksum.addEventListener('input',update);update();
}
const pipeline=byId('pipeline-demo');
if(pipeline){
 const update=()=>{
  const el=byId('window-n'),n=el.valueAsNumber,out=byId('pipeline-output');
  if(!Number.isInteger(n)||n<1||n>10000){out.textContent='请输入1–10000之间的整数窗口。';return;}
  const u=Math.min(1,n*8000/(30000000+8000));
  out.textContent='N='+n+'；利用率 '+(100*u).toFixed(4)+'%；分组比特吞吐量 '+(1000*u).toFixed(4)+' Mbit/s';
 };
 pipeline.addEventListener('input',update);update();
}
const flow=byId('flow-demo');
if(flow){
 const update=()=>{
  const vals=['rwnd','cwnd','flight'].map(id=>byId(id).valueAsNumber),out=byId('flow-output');
  if(vals.some(v=>!Number.isInteger(v)||v<0||v>1000000)){out.textContent='请输入0–1000000之间的整数字节数。';return;}
  const limit=Math.min(vals[0],vals[1]);
  out.textContent='共同上限 '+limit+' 字节；可新增发送 '+Math.max(0,limit-vals[2])+' 字节';
 };
 flow.addEventListener('input',update);update();
}

