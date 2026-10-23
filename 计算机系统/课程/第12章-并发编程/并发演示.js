/* Deterministic teaching models. No real threads or hardware memory model. */
'use strict';
for (const box of document.querySelectorAll('[data-demo]')) {
  const select=box.querySelector('select'), next=box.querySelector('[data-step]');
  const state=box.querySelector('[data-state]'), event=box.querySelector('[data-event]'), log=box.querySelector('[data-log]');
  let model, schedule, step, history;
  const card=(title,value)=>`<article class="card"><h3>${title}</h3><p>${value}</p></article>`;
  function reset() {
    step=0; history=[];
    if(box.dataset.demo==='counter') {
      const locked=select.value==='locked';
      model={cnt:0,register:{A:null,B:null},pc:{A:0,B:0},owner:null,ops:locked?['P','L','U','S','V']:['L','U','S']};
      schedule=select.value==='lost'?['A','B','A','A','B','B']:locked?['A','B','A','A','A','A','B','B','B','B','B']:['A','A','A','B','B','B'];
    } else if(box.dataset.demo==='buffer') {
      const full=select.value==='full';
      model={queue:full?[10,20]:[],slots:full?0:2,items:full?2:0,pc:{P:0,C:0},reserved:{P:0,C:0},value:full?30:10};
      schedule=full?['P','C','C','C','P','P','P']:select.value==='empty'?['C','P','P','P','C','C','C']:['P','C','P','P','C','C','C'];
    } else {
      model={locks:{s:null,t:null},pc:{A:0,B:0},waiting:{A:null,B:null},ops:{A:['Ps','Pt','work','Vt','Vs'],B:select.value==='ordered'?['Ps','Pt','work','Vt','Vs']:['Pt','Ps','work','Vs','Vt']}};
      schedule=select.value==='deadlock'?['A','B','A','B']:select.value==='ordered'?['A','B','A','A','A','A','B','B','B','B','B']:['A','A','A','A','A','B','B','B','B','B'];
    }
    event.textContent='初始状态；点击“下一步”观察一次操作。'; render();
  }
  function advance() {
    if(step>=schedule.length)return;
    const who=schedule[step]; let message;
    if(box.dataset.demo==='counter') {
      const op=model.ops[model.pc[who]];
      if(op==='P'&&model.owner!==null)message=`${who} 尝试 P：许可被 ${model.owner} 持有，等待，尚未进入临界区。`;
      else {
        if(op==='P')model.owner=who;
        if(op==='L')model.register[who]=model.cnt;
        if(op==='U')model.register[who]++;
        if(op==='S')model.cnt=model.register[who];
        if(op==='V')model.owner=null;
        model.pc[who]++;
        message=`${who} 完成 ${op}：`+({P:'取得唯一许可。',L:`读取 cnt = ${model.cnt}。`,U:`自己的寄存器变为 ${model.register[who]}。`,S:`写回 cnt = ${model.cnt}。`,V:'归还许可。'}[op]);
      }
    } else if(box.dataset.demo==='buffer') {
      const phase=model.pc[who]%3, sem=who==='P'?'slots':'items';
      if(phase===0&&model[sem]===0)message=`${who==='P'?'生产者':'消费者'} 等待 ${sem}：没有可用许可，状态未推进。`;
      else {
        if(phase===0){model[sem]--;model.reserved[who]++;message=`成功 P(${sem})：预订一份资源，暂未完成整个操作。`;}
        if(phase===1){
          if(who==='P'){model.queue.push(model.value);message=`在 mutex 内写入任务 ${model.value}；尚未 V(items) 发布。`;model.value+=10;}
          else {const item=model.queue.shift();message=`在 mutex 内取出任务 ${item}；尚未 V(slots) 归还空位。`;}
        }
        if(phase===2){const publish=who==='P'?'items':'slots';model[publish]++;model.reserved[who]--;message=`V(${publish})：${who==='P'?'发布项目':'归还空位'}，本次操作完成。`;}
        model.pc[who]++;
      }
    } else {
      const op=model.ops[who][model.pc[who]], lock=op.slice(1);
      if(op[0]==='P'&&model.locks[lock]!==null){model.waiting[who]=lock;message=`${who} 等待锁 ${lock}，它由 ${model.locks[lock]} 持有。`;}
      else {
        if(op[0]==='P'){model.locks[lock]=who;model.waiting[who]=null;message=`${who} 取得锁 ${lock}。`;}
        else if(op[0]==='V'){model.locks[lock]=null;message=`${who} 释放锁 ${lock}。`;}
        else message=`${who} 持有两把锁，完成受保护的工作。`;
        model.pc[who]++;
      }
    }
    step++;history.push(`${step}. ${message}`);event.textContent=message;render();
  }
  function render() {
    if(box.dataset.demo==='counter') {
      state.innerHTML=card('共享内存 cnt',model.cnt)+card('寄存器 A / B',`${model.register.A??'未加载'} / ${model.register.B??'未加载'}`)+card('A / B 下一步',`${model.ops[model.pc.A]??'结束'} / ${model.ops[model.pc.B]??'结束'}`)+card('互斥许可持有者',model.ops[0]==='P'?(model.owner??'无'):'本情形未加锁');
      box.dataset.cnt=String(model.cnt);
    } else if(box.dataset.demo==='buffer') {
      state.innerHTML=card('实际队列：容量 2',model.queue.length?model.queue.join('，'):'空')+card('slots / items',`${model.slots} / ${model.items}`)+card('正在操作的预订：生产者 / 消费者',`${model.reserved.P} / ${model.reserved.C}`)+card('许可合计',`${model.slots+model.items}；操作进行到一半时可以小于 2`);
      box.dataset.queue=JSON.stringify(model.queue);box.dataset.slots=String(model.slots);box.dataset.items=String(model.items);
    } else {
      const deadlocked=model.waiting.A&&model.waiting.B&&model.locks[model.waiting.A]==='B'&&model.locks[model.waiting.B]==='A';
      state.innerHTML=card('锁 s / t 的持有者',`${model.locks.s??'空闲'} / ${model.locks.t??'空闲'}`)+card('A / B 等待的锁',`${model.waiting.A??'无'} / ${model.waiting.B??'无'}`)+card('A / B 下一步',`${model.ops.A[model.pc.A]??'结束'} / ${model.ops.B[model.pc.B]??'结束'}`)+card('当前状态',deadlocked?'循环等待，已经死锁':model.pc.A===5&&model.pc.B===5?'两个线程均结束':'仍可推进；等待者要重新获得许可才继续');
      box.dataset.deadlocked=String(Boolean(deadlocked));
    }
    box.dataset.step=String(step);box.dataset.model=JSON.stringify(model);
    next.disabled=step>=schedule.length;
    log.textContent=history.join('\n');
    if(next.disabled)event.textContent+=' 本情形演示结束，可重新开始或切换情形。';
  }
  next.addEventListener('click',advance);
  box.querySelector('[data-reset]').addEventListener('click',reset);
  select.addEventListener('change',reset);
  reset();
}
