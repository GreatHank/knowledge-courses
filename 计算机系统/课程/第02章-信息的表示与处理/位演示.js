'use strict';
const bitDemo = document.getElementById('bit-demo');
let bitValue = 251;
for (const button of bitDemo.querySelectorAll('[data-bit]')) {
  button.addEventListener('click', () => {
    bitValue ^= 1 << Number(button.dataset.bit);
    for (const bit of bitDemo.querySelectorAll('[data-bit]')) {
      const on = Boolean(bitValue & (1 << Number(bit.dataset.bit)));
      bit.setAttribute('aria-pressed', String(on));
      bit.querySelector('b').textContent = on ? '1' : '0';
    }
    document.getElementById('unsigned-value').textContent = bitValue;
    document.getElementById('signed-value').textContent = String(bitValue < 128 ? bitValue : bitValue - 256).replace('-', '−');
    document.getElementById('bit-explanation').textContent = '0x' + bitValue.toString(16).toUpperCase().padStart(2, '0') + (bitValue < 128 ? ' · 最高位为 0：两种解释的数值相同。' : ' · 最高位为 1：补码值 = 无符号值 − 256。');
  });
}
