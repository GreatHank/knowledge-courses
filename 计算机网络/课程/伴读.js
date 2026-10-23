const bytes=document.querySelector('#packet-bytes');
if(bytes){
  const rate=document.querySelector('#rate-mbps'),distance=document.querySelector('#distance-km'),output=document.querySelector('#delay-output');
  function updateDelay(){
    if(![bytes,rate,distance].every(el=>el.value!==''&&el.checkValidity())){output.textContent='请输入范围内的包长、速率和距离。';return;}
    const tx=Number(bytes.value)*8/(Number(rate.value)*1e6)*1000,prop=Number(distance.value)*1000/2e8*1000;
    output.textContent=`发送 ${tx.toFixed(3)} ms；传播 ${prop.toFixed(3)} ms；整包到齐 ${(tx+prop).toFixed(3)} ms`;
    document.querySelector('.send-bar').style.flexGrow=String(tx);
    document.querySelector('.prop-bar').style.flexGrow=String(prop);
  }
  [bytes,rate,distance].forEach(el=>el.addEventListener('input',updateDelay));updateDelay();
}
const flows=document.querySelector('#flow-count');
if(flows){
  function updateThroughput(){
    const n=Number(flows.value),share=5/n,throughput=Math.min(2,1,share);
    const bottleneck=share<1?'共享核心链路':share===1?'客户接入与共享核心并列':'客户接入链路';
    document.querySelector('#throughput-output').textContent=`${n} 条下载；每流 ${throughput.toFixed(3)} Mbps；瓶颈：${bottleneck}`;
  }
  flows.addEventListener('input',updateThroughput);updateThroughput();
}
