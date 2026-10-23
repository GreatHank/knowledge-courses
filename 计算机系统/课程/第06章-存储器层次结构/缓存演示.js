"use strict";
(() => {
  const rowAddresses = Array.from({length:16}, (_, i) => i * 4);
  const colAddresses = Array.from({length:16}, (_, i) => ((i % 4) * 4 + Math.floor(i / 4)) * 4);
  const presets = {
    book: {S:4, E:1, B:2, m:4, width:1, addresses:[0,1,13,8,0]},
    direct: {S:4, E:1, B:2, m:4, width:1, addresses:[0,8,0,8,0,8]},
    "two-way": {S:2, E:2, B:2, m:4, width:1, addresses:[0,8,0,8,0,8]},
    lru: {S:2, E:2, B:2, m:4, width:1, addresses:[0,4,0,8,4]},
    "rows-small": {S:2, E:1, B:16, m:6, width:4, addresses:rowAddresses},
    "cols-small": {S:2, E:1, B:16, m:6, width:4, addresses:colAddresses},
    "cols-fit": {S:4, E:1, B:16, m:6, width:4, addresses:colAddresses}
  };
  for (const root of document.querySelectorAll('[data-cache-demo]')) {
    const q = s => root.querySelector(s);
    let config, sets, history;
    const bin = (v, bits) => bits ? v.toString(2).padStart(bits,'0') + '₂' : '无此字段';
    function reset() {
      config = presets[q('[data-preset]').value];
      sets = Array.from({length:config.S}, () => Array.from({length:config.E}, () => ({valid:false, tag:null, block:null, last:-1})));
      history = [];
      render();
    }
    function step() {
      if (history.length === config.addresses.length) return;
      const A = config.addresses[history.length];
      const block = Math.floor(A / config.B), set = block % config.S;
      const tag = Math.floor(block / config.S), offset = A % config.B;
      const lines = sets[set];
      let lineIndex = lines.findIndex(line => line.valid && line.tag === tag);
      const hit = lineIndex !== -1;
      let evicted = null;
      if (!hit) {
        lineIndex = lines.findIndex(line => !line.valid);
        if (lineIndex === -1) {
          lineIndex = lines.reduce((best, line, i) => line.last < lines[best].last ? i : best, 0);
          evicted = lines[lineIndex].block;
        }
        Object.assign(lines[lineIndex], {valid:true, tag, block});
      }
      lines[lineIndex].last = history.length;
      history.push({A, block, set, tag, offset, hit, evicted, lineIndex});
      render();
    }
    function render() {
      const {S,E,B,m,width,addresses} = config;
      const last = history.at(-1), hits = history.filter(x => x.hit).length;
      q('[data-config]').textContent = `C = ${S*E*B} B；S = ${S} 组；E = ${E} 行/组；B = ${B} B；地址 ${m} 位，每次读 ${width} B。${E>1?'满组按 LRU 替换。':'每组只有一行。'}`;
      q('[data-result]').textContent = last ? `第 ${history.length} 次：读地址 ${last.A}，属于块 ${last.block}，选组 ${last.set}，${last.hit?'命中':'缺失'}。${last.evicted===null?'':`换出块 ${last.evicted}。`}` : '尚未读取；所有行的 valid 都是 0。';
      const b=Math.log2(B), s=Math.log2(S);
      q('[data-tag]').textContent=last?bin(last.tag,m-s-b):'—';
      q('[data-set]').textContent=last?bin(last.set,s):'—';
      q('[data-offset]').textContent=last?bin(last.offset,b):'—';
      const container=q('[data-lines]');
      container.replaceChildren();
      sets.forEach((lines,si)=>{
        const setBox=document.createElement('div'); setBox.className='cache-set'+(last?.set===si?' selected':'');
        const title=document.createElement('h3');title.textContent=`组 ${si}`;setBox.append(title);
        lines.forEach((line,li)=>{
          const box=document.createElement('div');box.className='cache-line'+(last?.set===si&&last.lineIndex===li?' recent':'');
          for (const text of [`行 ${li} · valid = ${line.valid?1:0} · tag = ${line.valid?line.tag:'—'}`,line.valid?`块 ${line.block} · 地址 ${line.block*B}–${(line.block+1)*B-1}`:'空行',line.valid?`最近使用：第 ${line.last+1} 次`:'尚未装入']) {
            const span=document.createElement('span');span.textContent=text;box.append(span);
          }
          setBox.append(box);
        });container.append(setBox);
      });
      q('[data-stats]').textContent=`已读取 ${history.length}/${addresses.length} 次；命中 ${hits} 次，缺失 ${history.length-hits} 次。`;
      const tbody=q('[data-trace]');tbody.replaceChildren();
      history.forEach((h,i)=>{
        const tr=document.createElement('tr');
        [i+1,h.A,h.block,h.set,h.hit?'命中':'缺失',h.evicted===null?'—':h.evicted].forEach((value,j)=>{const td=document.createElement('td');td.textContent=value;if(j===4)td.className=h.hit?'trace-hit':'trace-miss';tr.append(td);});
        tbody.append(tr);
      });
      q('[data-step]').disabled=q('[data-all]').disabled=history.length===addresses.length;
    }
    q('[data-preset]').addEventListener('change',reset);
    q('[data-step]').addEventListener('click',step);
    q('[data-all]').addEventListener('click',()=>{while(history.length<config.addresses.length)step();});
    q('[data-reset]').addEventListener('click',reset);
    reset();
  }
})();
