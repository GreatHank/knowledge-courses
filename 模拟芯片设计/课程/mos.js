const slider=document.getElementById('vov');
const output=document.getElementById('mos-result');
function update(){
  const v=Number(slider.value);
  output.textContent=`Vov = ${v.toFixed(1)} V；VGS = ${(v+0.5).toFixed(1)} V；ID = ${(100*v*v).toFixed(0)} μA；gm = ${(200*v).toFixed(0)} μS。`;
}
slider.addEventListener('input',update);
update();
