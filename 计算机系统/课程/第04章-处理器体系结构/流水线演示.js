// 固定的 load/use 例子逐拍展示；不是指令解释器或硬件仿真。
(() => {
  const slider = document.getElementById('cycle');
  const previous = document.getElementById('cycle-prev');
  const next = document.getElementById('cycle-next');
  const stages = ['F', 'D', 'E', 'M', 'W'];
  const traces = [
    {name:'L · mrmovq', cells:['F','D','E','M','W','','','']},
    {name:'A · addq', cells:['','F','D','D','E','M','W','']},
    {name:'H · halt', cells:['','','F','F','D','E','M','W']},
    {name:'气泡', cells:['','','','E','M','W','','']}
  ];
  const explanation = [
    '第 1 拍：取出 L，尚未读取它的源寄存器。',
    '第 2 拍：L 在 D 读 %rdx=128；取出 A。',
    '第 3 拍：L 在 E 算出地址 128，加载值还没有出现。A 在 D 需要新的 %rax：本拍末保持 F、D，并向 E 注入气泡。',
    '第 4 拍：L 在 M 读出 3，转发给仍在 D 的 A；E 是气泡。A 同时读取原有 %rbx=10，本拍末可以进入 E。',
    '第 5 拍：A 在 E 算出 3+10=13。L 在 W，本拍末把加载的 3 写入 %rax；A 的结果尚未写回。',
    '第 6 拍：A 在 M，不做数据访存，携带结果 13 继续前进；气泡经过 W，不产生写入。',
    '第 7 拍：A 在 W，本拍末把 13 写入 %rax；H 已到 M。',
    '第 8 拍：H 到达 W，报告 HLT 并停止。最终 %rax=13；相邻加载与使用多付了一拍等待。'
  ];
  function render() {
    const cycle = Number(slider.value);
    document.getElementById('cycle-number').textContent = String(cycle);
    for (const stage of stages) {
      const entry = traces.find(row => row.cells[cycle-1] === stage);
      const output = document.querySelector('[data-stage="'+stage+'"]');
      output.textContent = entry ? entry.name : '空';
      output.parentElement.classList.toggle('active', Boolean(entry) && entry.name !== '气泡');
      output.parentElement.classList.toggle('bubble', Boolean(entry) && entry.name === '气泡');
    }
    document.getElementById('cycle-explanation').textContent = explanation[cycle-1];
    previous.disabled = cycle === 1;
    next.disabled = cycle === 8;
  }
  slider.addEventListener('input', render);
  previous.addEventListener('click', () => { slider.value = String(Math.max(1,Number(slider.value)-1)); render(); });
  next.addEventListener('click', () => { slider.value = String(Math.min(8,Number(slider.value)+1)); render(); });
  render();
})();
