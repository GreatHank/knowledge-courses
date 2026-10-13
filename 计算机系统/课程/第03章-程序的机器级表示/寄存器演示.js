'use strict';
const demo=document.querySelector('#register-demo');
const buttons=demo.querySelectorAll('[data-width]');
const initial=0x0011223344556677n;
const notes={8:'其余 7 字节保持原样。',16:'其余 6 字节保持原样。',32:'低 4 字节写入全 1，高 4 字节自动清零。',64:'整个 64 位寄存器写入全 1。'};
function render(width){
 const mask=(1n<<BigInt(width))-1n;
 const value=width===32?mask:(initial&~mask)|mask;
 const hex=value.toString(16).padStart(16,'0').toUpperCase();
 buttons.forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.width)===width)));
 demo.querySelectorAll('.register-bytes span').forEach((span,i)=>{
  span.textContent=hex.slice(i*2,i*2+2);
  span.className=width===32&&i<4?'cleared':i>=8-width/8?'changed':'';
 });
 demo.querySelector('.register-result').textContent='结果：0x'+hex+'；'+notes[width];
}
buttons.forEach(button=>button.addEventListener('click',()=>render(Number(button.dataset.width))));
