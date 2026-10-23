'use strict';
const theta = document.getElementById('theta');
const energy = document.getElementById('energy');
const activity = document.getElementById('activity');
function updateThermalBudget() {
  const t = Number(theta.value);
  const e = Number(energy.value);
  const a = Number(activity.value);
  const powerLimit = 100 / t;
  const gatePowerW = a * e * 1e-3;
  document.getElementById('theta-value').textContent = t.toFixed(1);
  document.getElementById('energy-value').textContent = e.toFixed(2);
  document.getElementById('activity-value').textContent = a.toFixed(1);
  document.getElementById('pmax').textContent = powerLimit.toFixed(1) + ' W';
  document.getElementById('pgate').textContent = (gatePowerW * 1000).toFixed(3) + ' mW';
  document.getElementById('nmax').textContent = Math.floor(powerLimit / gatePowerW).toLocaleString('en-US');
}
for (const control of [theta, energy, activity]) control.addEventListener('input', updateThermalBudget);
updateThermalBudget();
