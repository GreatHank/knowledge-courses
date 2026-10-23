'use strict';
function ipv4(text){
 const parts=text.trim().split('.');
 if(parts.length!==4||parts.some(p=>!/^(0|[1-9]\d{0,2})$/.test(p)||Number(p)>255))return null;
 return parts.reduce((n,p)=>n*256+Number(p),0);
}
function dotted(n){return [24,16,8,0].map(k=>Math.floor(n/2**k)%256).join('.');}
const lpm=document.querySelector('#lpm-ip');
if(lpm){
 const rows=[['200.23.16.0',21,0],['200.23.24.0',24,1],['200.23.24.0',21,2],['0.0.0.0',0,3]];
 const update=()=>{
  const n=ipv4(lpm.value),out=document.querySelector('#lpm-output');
  if(n===null){out.textContent='请输入四段0–255的十进制IPv4地址，不使用多余前导零。';return;}
  const matches=rows.filter(([ip,p])=>Math.floor(n/2**(32-p))===Math.floor(ipv4(ip)/2**(32-p))).sort((a,b)=>b[1]-a[1]);
  const win=matches[0];out.textContent='匹配：'+matches.map(([ip,p])=>ip+'/'+p).join('、')+'；选择'+win[0]+'/'+win[1]+' → 接口'+win[2];
 };lpm.addEventListener('input',update);update();
}
const cidr=document.querySelector('#cidr-ip');
if(cidr){
 const pref=document.querySelector('#cidr-prefix');
 const update=()=>{
  const n=ipv4(cidr.value),p=Number(pref.value),out=document.querySelector('#cidr-output');
  if(n===null||pref.value.trim()===''||!Number.isInteger(p)||p<0||p>32){out.textContent='请输入有效IPv4地址和0–32的整数前缀长度。';return;}
  const count=2**(32-p),first=Math.floor(n/count)*count,last=first+count-1,mask=2**32-count;
  out.textContent='规范前缀：'+dotted(first)+'/'+p+'；范围：'+dotted(first)+'–'+dotted(last)+'；总地址数：'+count+'；掩码：'+dotted(mask);
 };cidr.addEventListener('input',update);pref.addEventListener('input',update);update();
}
const rate=document.querySelector('#wfq-rate');
if(rate){
 const weights=[1,2,3].map(i=>document.querySelector('#wfq-w'+i)),active=document.querySelector('#wfq-active3');
 const update=()=>{
  const r=Number(rate.value),w=weights.map(el=>Number(el.value)),out=document.querySelector('#wfq-output');
  if(rate.value.trim()===''||!Number.isFinite(r)||r<=0||r>1000000||weights.some((el,i)=>el.value.trim()===''||!Number.isInteger(w[i])||w[i]<1||w[i]>1000)){out.textContent='请输入大于0且不超过1000000的速率，以及1–1000的整数权重。';return;}
  const sum=w[0]+w[1]+(active.checked?w[2]:0);
  out.textContent=w.map((v,i)=>'类别'+(i+1)+'：'+(i===2&&!active.checked?0:r*v/sum).toFixed(3)+' Mbit/s').join('；');
 };[rate,...weights,active].forEach(el=>el.addEventListener('input',update));update();
}

