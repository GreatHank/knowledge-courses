'use strict';
const input = document.getElementById('vd');
const output = document.getElementById('split-result');
function updateSplit() {
  const vd = Number(input.value);
  const i1 = 100 / (1 + Math.exp(-vd / 26));
  const i2 = 100 - i1;
  output.textContent = `v_d = ${vd} mV；Q1 = ${i1.toFixed(2)} μA；Q2 = ${i2.toFixed(2)} μA；差值 = ${(i1-i2).toFixed(2)} μA`;
}
input.addEventListener('input', updateSplit);
document.getElementById('split-reset').addEventListener('click', () => { input.value = '0'; updateSplit(); });
updateSplit();
