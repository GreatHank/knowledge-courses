'use strict';
const byId=id=>document.getElementById(id);
if(byId('crc-form')){
 const remainder=(bits,g)=>{
  const a=bits.split('').map(Number),b=g.split('').map(Number);
  for(let i=0;i<=a.length-b.length;i++)if(a[i])for(let j=0;j<b.length;j++)a[i+j]^=b[j];
  return a.slice(-(g.length-1)).join('');
 };
 const calculate=()=>{
  const d=byId('crc-data').value.trim(),g=byId('crc-g').value.trim(),e=byId('crc-error').value.trim(),out=byId('crc-output');
  if(!/^[01]{1,32}$/.test(d)||!/^1[01]{0,15}1$/.test(g)){out.textContent='请输入1–32位二进制数据；G须为2–17位二进制且首尾为1。';return;}
  const r=remainder(d+'0'.repeat(g.length-1),g),c=d+r;
  if(e&&(!/^[01]+$/.test(e)||e.length!==c.length)){out.textContent=`错误掩码须留空或恰为${c.length}位二进制。`;return;}
  const mask=e||'0'.repeat(c.length),received=c.split('').map((v,i)=>Number(v)^Number(mask[i])).join(''),syndrome=remainder(received,g);
  const changed=mask.includes('1'),detected=syndrome.includes('1');
  out.textContent=`R=${r}\n发送串：${c}\n接收串：${received}\n接收余数：${syndrome}\n${detected?'检测到错误':changed?'校验通过，但此错误模式漏检':'校验通过（本次未加入错误）'}`;
 };
 byId('crc-form').addEventListener('submit',e=>{e.preventDefault();calculate();});calculate();
}
if(byId('aloha-form')){
 const calculate=()=>{
  const rawN=byId('aloha-n').value,rawP=byId('aloha-p').value,n=Number(rawN),p=Number(rawP),out=byId('aloha-output'),bars=byId('aloha-bars');
  if(!rawN||!rawP||!Number.isInteger(n)||n<1||n>100||!Number.isFinite(p)||p<0||p>1){out.textContent='请输入1–100的整数N与0–1的概率p。';bars.replaceChildren();return;}
  const idle=(1-p)**n,success=n===1?p:n*p*(1-p)**(n-1),collision=Math.max(0,1-idle-success);
  out.textContent=`N=${n}，p=${p}：空闲${(idle*100).toFixed(2)}%，成功${(success*100).toFixed(2)}%，碰撞${(collision*100).toFixed(2)}%。`;
  bars.replaceChildren();
  for(const [name,value] of [['空闲',idle],['成功',success],['碰撞',collision]]){
   const row=document.createElement('div');row.className='prob-row';const label=document.createElement('div');label.textContent=`${name} ${(value*100).toFixed(2)}%`;
   const track=document.createElement('div');track.className='prob-track';track.setAttribute('aria-hidden','true');const fill=document.createElement('div');fill.className='prob-fill';fill.style.width=`${value*100}%`;track.append(fill);row.append(label,track);bars.append(row);
  }
 };
 byId('aloha-form').noValidate=true;
 byId('aloha-form').addEventListener('submit',e=>{e.preventDefault();calculate();});
 byId('aloha-opt').addEventListener('click',()=>{const raw=byId('aloha-n').value,n=Number(raw);if(raw&&Number.isInteger(n)&&n>=1&&n<=100)byId('aloha-p').value=String(1/n);calculate();});calculate();
}
if(byId('switch-demo')){
 const events=[['A','B',1],['B','A',2],['C','B',3],['A','广播',1]];let step=0;
 const render=()=>{
  const learned=new Map();let result='尚未收到帧。';
  for(let i=0;i<step;i++){
   const [source,dest,port]=events[i];learned.set(source,port);
   const known=learned.get(dest),ports=dest==='广播'||known===undefined?[1,2,3].filter(p=>p!==port):known===port?[]:[known];
   result=`${source}→${dest}，从端口${port}进入；${dest==='广播'?'广播复制':known===undefined?'未知单播泛洪':'已知单播转发'}到端口${ports.join('、')}。`;
  }
  byId('sw-output').textContent=`第${step}步：${result}`;
  const host=byId('sw-table');host.replaceChildren();const list=document.createElement('p');list.textContent=learned.size?`MAC表：${Array.from(learned,([a,p])=>`${a}→${p}`).join('，')}`:'MAC表：空';host.append(list);
  byId('sw-prev').disabled=step===0;byId('sw-next').disabled=step===events.length;
 };
 byId('sw-next').addEventListener('click',()=>{if(step<events.length)step++;render();});byId('sw-prev').addEventListener('click',()=>{if(step>0)step--;render();});byId('sw-reset').addEventListener('click',()=>{step=0;render();});render();
}
