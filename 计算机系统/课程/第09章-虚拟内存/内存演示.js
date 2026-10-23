'use strict';
(() => {
  const hex = (n, width = 2) => '0x' + n.toString(16).toUpperCase().padStart(width, '0');
  const pt = {0:0x28,2:0x33,3:2,5:0x16,8:0x13,9:0x17,10:9,13:0x2d,14:0x11,15:0x0d};
  const tlb = [ [[9,13],[7,2]], [[3,45]], [], [[3,13],[10,52]] ];
  const cache = {0:[0x19,[0x99,0x11,0x23,0x11]],2:[0x1b,[0,2,4,8]],4:[0x32,[0x43,0x6d,0x8f,9]],5:[0x0d,[0x36,0x72,0xf0,0x1d]],7:[0x16,[0x11,0xc2,0xdf,3]],8:[0x24,[0x3a,0,0x51,0x89]],10:[0x2d,[0x93,0x15,0xda,0x3b]],13:[0x16,[4,0x96,0x34,0x15]],14:[0x13,[0x83,0x77,0x1b,0xd3]]};
  function translation(key) {
    const va = {hit:0x3d4,walk:0x238,cachemiss:0,fault:0x40}[key];
    const vpn=va>>6, off=va&63, set=vpn&3, tag=vpn>>2;
    const hit=tlb[set].find(entry=>entry[0]===tag);
    const steps=[{event:'从原图快照开始，只读一个字节。',cards:[['虚拟地址',hex(va,4)],['当前阶段','尚未翻译']]},
      {event:'先分开 VPN 与页内偏移，再用 VPN 划分 TLB 索引与标签。',cards:[['VPN / VPO',`${hex(vpn)} / ${hex(off)}`],['TLBI / TLBT',`${hex(set)} / ${hex(tag)}`]]}];
    let ppn;
    if(hit){ppn=hit[1];steps.push({event:'TLB 中有效项的标签匹配，直接得到物理页号。',cards:[['TLB','命中'],['PPN',hex(ppn)]]});}
    else {
      steps.push({event:'TLB 组中没有有效的匹配标签，需要查页表；尚不能判定缺页。',cards:[['TLB','未命中'],['查找目标',`PTE[${hex(vpn)}]`]]});
      if(!(vpn in pt)){steps.push({event:'教材快照中此 PTE 无效，触发缺页；没有足够信息继续计算。',cards:[['页表','无效'],['结果','缺页：PA 与数据未知']]});return steps;}
      ppn=pt[vpn];steps.push({event:'页表项有效，页面已驻留。本次可完成翻译；不模拟后续替换策略。',cards:[['页表','有效'],['PPN',hex(ppn)]]});
    }
    const pa=ppn*64+off,ci=(pa>>2)&15,ct=pa>>6,co=pa&3;
    steps.push({event:'把 PPN 与原页内偏移拼成 PA，再拆出数据缓存字段。',cards:[['PA',hex(pa,3)],['CT / CI / CO',`${hex(ct)} / ${hex(ci)} / ${co}`]]});
    const line=cache[ci];
    if(line&&line[0]===ct)steps.push({event:'数据缓存有效且标签匹配，按块内偏移取得字节。',cards:[['缓存','命中'],['返回字节',hex(line[1][co])]]});
    else steps.push({event:'该组没有有效的匹配标签，需要访问下级存储；图中没有给出返回字节。',cards:[['缓存','未命中'],['结果','字节未知；页面已驻留']]});
    return steps;
  }
  const block=(size,allocated,label)=>({size,allocated,label});
  const allocator={
    split:[
      {event:'初始只有一个 64 B 普通空闲块；不画两端哨兵。',blocks:[block(64,false,'空闲')]},
      {event:'申请 A 的 12 B payload：加头脚并对齐为 24 B，余下 40 B 可独立成块。',blocks:[block(24,true,'A：请求 12 B'),block(40,false,'空闲')]},
      {event:'申请 B 的 8 B payload：需要 16 B，原 40 B 空闲块余下 24 B。',blocks:[block(24,true,'A：请求 12 B'),block(16,true,'B：请求 8 B'),block(24,false,'空闲')]},
      {event:'释放 A；后面的 B 仍已分配，不能越过 B 合并两段空闲空间。',blocks:[block(24,false,'空闲'),block(16,true,'B：请求 8 B'),block(24,false,'空闲')]},
      {event:'释放 B，前后都是空闲块；合并 24 + 16 + 24 = 64 B。',blocks:[block(64,false,'空闲：合并完成')]}
    ],
    nosplit:[
      {event:'初始只有一个 32 B 普通空闲块。',blocks:[block(32,false,'空闲')]},
      {event:'申请 12 B payload，调整为 24 B；余量 8 B 小于最小普通块 16 B。',blocks:[block(32,false,'候选：32 B')]},
      {event:'整个 32 B 块交给 A，不生成 8 B 的非法余块。',blocks:[block(32,true,'A：请求 12 B，整块分配')]},
      {event:'释放 A 后恢复 32 B 空闲块。',blocks:[block(32,false,'空闲：释放完成')]}
    ]
  };
  document.querySelectorAll('[data-demo]').forEach(root=>{
    const select=root.querySelector('select'),next=root.querySelector('[data-next]'),all=root.querySelector('[data-all]');
    let index=0,steps;
    function load(){index=0;steps=root.dataset.demo==='translation'?translation(select.value):allocator[select.value];render();}
    function render(){
      const state=steps[index];root.querySelector('[data-event]').textContent=`${index} / ${steps.length-1} · ${state.event}`;
      const target=root.querySelector('[data-state]');target.replaceChildren();
      if(state.blocks){
        const strip=document.createElement('div');strip.className='heap-strip';
        state.blocks.forEach((b,i)=>{const cell=document.createElement('div');cell.className='heap-block '+(b.allocated?'allocated':'free');cell.style.flexGrow=b.size;cell.textContent=`${i+1} · ${b.size} B｜${b.label}`;strip.append(cell);});target.append(strip);
        const note=document.createElement('p');note.className='note';note.textContent='从左到右是虚拟地址递增顺序；窄屏可横滑。尺寸包含头部和脚部。';target.append(note);
      }else state.cards.forEach(([title,value])=>{const card=document.createElement('article');card.className='card';const h=document.createElement('h3'),p=document.createElement('p');h.textContent=title;p.textContent=value;card.append(h,p);target.append(card);});
      const trace=root.querySelector('[data-trace]');trace.replaceChildren();steps.slice(1,index+1).forEach(s=>{const li=document.createElement('li');li.textContent=s.event;trace.append(li);});
      next.disabled=index===steps.length-1;all.disabled=next.disabled;root.dataset.step=index;
    }
    select.addEventListener('change',load);next.addEventListener('click',()=>{index++;render();});all.addEventListener('click',()=>{index=steps.length-1;render();});root.querySelector('[data-reset]').addEventListener('click',load);load();
  });
})();
