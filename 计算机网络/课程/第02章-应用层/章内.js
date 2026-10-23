"use strict";
const hit = document.querySelector("#hit-rate");
if (hit) {
  const updateCache = () => {
    const h = Number(hit.value) / 100;
    document.querySelector("#cache-output").textContent = `命中率 ${hit.value}%；出口 ${(15 * (1 - h)).toFixed(1)} 次/s；负载强度 ${(1 - h).toFixed(2)}`;
  };
  hit.addEventListener("input", updateCache);
  updateCache();
}
const p2p = document.querySelector("#p2p-demo");
if (p2p) {
  const fields = [...p2p.querySelectorAll("input")];
  const output = p2p.querySelector("output");
  const updateP2P = () => {
    if (!fields.every(el => el.value !== "" && el.checkValidity())) {
      output.textContent = "请输入范围内的数值；N须为正整数，服务器上传与下载速率须大于0。";
      return;
    }
    const [n, us, u, d] = fields.map(el => Number(el.value));
    const cs = Math.max(n * 100 / us, 100 / d);
    const peer = Math.max(100 / us, 100 / d, n * 100 / (us + n * u));
    output.textContent = `CS ≥ ${cs.toFixed(2)} s；P2P ≥ ${peer.toFixed(2)} s`;
  };
  fields.forEach(el => el.addEventListener("input", updateP2P));
  updateP2P();
}
