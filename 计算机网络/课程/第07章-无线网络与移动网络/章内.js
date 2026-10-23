'use strict';
const cdmaForm=document.getElementById('cdma-form');
if(cdmaForm){
 cdmaForm.noValidate=true;
 cdmaForm.addEventListener('submit',e=>{
  e.preventDefault();
  const raw=document.getElementById('cdma-gain').value,g=Number(raw),out=document.getElementById('cdma-output');
  if(raw.trim()===''||!Number.isFinite(g)||g<0||g>4){out.textContent='请输入0至4之间的有限幅度系数。';return;}
  const b1=Number(document.getElementById('cdma-b1').value),b2=Number(document.getElementById('cdma-b2').value);
  const c1=[1,1,1,-1,1,-1,-1,-1],c2=document.getElementById('cdma-code').value==='same'?c1:[1,-1,1,1,1,-1,1,1];
  const z=c1.map((v,i)=>b1*v+g*b2*c2[i]),dot=c1.reduce((a,v,i)=>a+v*c2[i],0),r=z.reduce((a,v,i)=>a+v*c1[i],0)/8;
  const fmt=x=>Number(x.toFixed(6)).toString();
  const decision=r===0?'相关值为0，无法按符号判决':`按符号判为数据位${r>0?1:0}（${(r>0?1:-1)===b1?'与原位相符':'与原位不符'}）`;
  out.textContent=`c₁·c₂=${dot}\n接收叠加：[${z.map(fmt).join(',')}]\nd̂₁=${fmt(r)}；${decision}。\n原数据位${b1===1?1:0}。模型不含噪声、时延与多径。`;
 });
}
function steps(id,states){
 const out=document.getElementById(id+'-output');if(!out)return;
 let i=0;const prev=document.getElementById(id+'-prev'),next=document.getElementById(id+'-next'),reset=document.getElementById(id+'-reset');
 const render=()=>{out.textContent=`${i} / ${states.length-1} · ${states[i]}`;prev.disabled=i===0;next.disabled=i===states.length-1;};
 prev.addEventListener('click',()=>{if(i>0)i--;render();});next.addEventListener('click',()=>{if(i<states.length-1)i++;render();});reset.addEventListener('click',()=>{i=0;render();});render();
}
steps('backoff',[
 '信道正忙；A=2，B=5。两站冻结。',
 '信道空闲并等待DIFS；A=2，B=5。尚未消耗退避时隙。',
 '第1个完整空闲时隙后：A=1，B=4。',
 '第2个完整空闲时隙后：A=0，B=3。A开始发送。',
 'A发送DATA；B=3，听到信道忙而冻结。',
 '接收者在SIFS后回ACK；B=3，当前交换尚未结束。',
 'ACK结束，再等待DIFS；B仍为3。',
 'B经过3个完整空闲退避时隙，依次3→2→1→0，开始发送。',
 'B的DATA与ACK交换成功。此固定示例完成；没有模拟下一轮随机选择。'
]);
steps('handover',[
 'UE在源基站。下行：P-GW → S-GW → 源基站 → UE。旧资源在用。',
 '源基站请求切换；目标检查并预留资源，回复接受。UE仍在源侧，旧路径保持。',
 '源基站给UE目标接入信息，UE转向目标。S-GW尚未改端点；旧基站将待转数据转发给目标。',
 '目标通知MME，请求更新承载。下行暂经P-GW → S-GW → 源基站 → 目标基站 → UE。',
 'S-GW的接入侧隧道改到目标。新包走P-GW → S-GW → 目标基站 → UE；过渡包可能仍在旧转发路径中。',
 '路径切换确认，源侧释放旧无线与相关承载资源。目标处理过渡期间的数据。',
 '切换完成。UE在目标基站；P-GW与S-GW保持不变，旧资源已释放。此例会话IP地址保持。'
]);
