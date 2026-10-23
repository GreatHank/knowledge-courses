'use strict';
// 固定轨迹只描述单线程、普通信号，以及各情形列出的事件交错。
const traces = {
  coalesce: {
    labels: ['生成次数','pending 位','blocked 位','处理函数进入次数'],
    initial: [0,0,1,0],
    steps: [
      ['第一次生成：被屏蔽，记为待处理。',[1,1,1,0]],
      ['第二次生成：已有同一种待处理信号，pending 仍为 1。',[2,1,1,0]],
      ['第三次生成：普通信号不按次数排队。',[3,1,1,0]],
      ['解除屏蔽；待处理信号现在可以递送。',[3,1,0,0]],
      ['进入处理函数：本次 pending 清除；同种信号在处理期间自动屏蔽。',[3,0,1,1]],
      ['处理函数返回，恢复未屏蔽状态；只进入过一次。',[3,0,0,1]]
    ]
  },
  during: {
    labels: ['生成次数','pending 位','blocked 位','处理函数进入次数'],
    initial: [0,0,0,0],
    steps: [
      ['第一次信号被递送，进入处理函数；同种信号暂时屏蔽。',[1,0,1,1]],
      ['处理期间再次生成，pending 变为 1。',[2,1,1,1]],
      ['处理期间第三次生成，与已有待处理信号合并。',[3,1,1,1]],
      ['第一次处理函数返回，恢复原来的未屏蔽状态。',[3,1,0,1]],
      ['待处理信号再次触发处理函数；pending 清除。',[3,0,1,2]],
      ['第二次处理完成。三次生成对应两次进入，而非固定一对一。',[3,0,0,2]]
    ]
  },
  'registration-bad': {
    labels: ['孩子状态','作业表','SIGCHLD pending','SIGCHLD blocked'],
    initial: ['未创建','空',0,0],
    steps: [
      ['fork 成功，父进程还没执行 addjob。',['运行','空',0,0]],
      ['孩子先退出，内核生成 SIGCHLD。',['已终止，未回收','空',1,0]],
      ['处理函数回收孩子并尝试 deletejob，但表里还没有它。',['已回收','空',0,0]],
      ['父进程继续 addjob，留下已经结束的作业记录。',['已回收','残留：孩子 PID',0,0]]
    ]
  },
  'registration-good': {
    labels: ['孩子状态','作业表','SIGCHLD pending','SIGCHLD blocked'],
    initial: ['未创建','空',0,0],
    steps: [
      ['父进程先屏蔽 SIGCHLD，再准备 fork。',['未创建','空',0,1]],
      ['fork 成功；孩子可运行，父进程仍屏蔽。',['运行','空',0,1]],
      ['孩子很快退出，通知待处理；处理函数尚不能进入。',['已终止，未回收','空',1,1]],
      ['父进程完成 addjob。',['已终止，未回收','已登记：孩子 PID',1,1]],
      ['父进程恢复原 mask，SIGCHLD 可以递送。',['已终止，未回收','已登记：孩子 PID',1,0]],
      ['处理函数回收并删除已有记录，作业表与实际状态一致。',['已回收','空',0,0]]
    ]
  },
  'pause-gap': {
    labels: ['child_done','主流程','孩子状态','SIGCHLD pending'],
    initial: [0,'准备检查','运行',0],
    steps: [
      ['主流程检查 child_done，读到 0，决定进入 pause。',[0,'检查完成，尚未 pause','运行',0]],
      ['恰在空隙里孩子退出，SIGCHLD 生成。',[0,'尚未 pause','已终止，未回收',1]],
      ['处理函数回收孩子，将 child_done 置 1，再返回。',[1,'即将执行 pause','已回收',0]],
      ['主流程调用 pause。若再没有信号，就一直睡眠。',[1,'睡眠：错过唤醒','已回收',0]]
    ]
  },
  atomic: {
    labels: ['child_done','主流程','SIGCHLD pending','SIGCHLD blocked'],
    initial: [0,'已在 fork 前屏蔽',0,1],
    steps: [
      ['孩子退出，通知成为 pending，处理函数尚不能运行。',[0,'准备检查',1,1]],
      ['主流程在屏蔽状态下检查，读到 child_done=0。',[0,'检查完成',1,1]],
      ['sigsuspend 原子地恢复可递送的 mask 并等待，pending 信号随即进入处理函数。',[0,'处理函数执行；同种信号暂时屏蔽',0,1]],
      ['处理函数回收目标孩子并置 child_done=1。',[1,'处理函数即将返回',0,1]],
      ['sigsuspend 返回 EINTR，恢复调用前的屏蔽集合。',[1,'重新检查条件',0,1]],
      ['条件已满足，退出循环并恢复最初 mask。',[1,'继续主流程',0,0]]
    ]
  }
};
for (const root of document.querySelectorAll('[data-demo]')) {
  const q=s=>root.querySelector(s);
  let position=0;
  function render(){
    const t=traces[q('[data-scenario]').value];
    const state=position?t.steps[position-1][1]:t.initial;
    q('[data-event]').textContent=position?`${position}/${t.steps.length} · ${t.steps[position-1][0]}`:'从初始状态开始；点击“下一步”查看事件。';
    q('[data-state]').replaceChildren(...t.labels.map((label,i)=>{
      const card=document.createElement('div');card.className='card';
      const h=document.createElement('h3');h.textContent=label;
      const p=document.createElement('p');p.dataset.value=String(i);p.textContent=String(state[i]);
      card.append(h,p);return card;
    }));
    q('[data-trace]').replaceChildren(...t.steps.slice(0,position).map((step,i)=>{
      const tr=document.createElement('tr'),num=document.createElement('td'),event=document.createElement('td');
      num.textContent=String(i+1);event.textContent=step[0];tr.append(num,event);return tr;
    }));
    q('[data-step]').disabled=position===t.steps.length;
    q('[data-all]').disabled=position===t.steps.length;
  }
  q('[data-scenario]').addEventListener('change',()=>{position=0;render();});
  q('[data-step]').addEventListener('click',()=>{position++;render();});
  q('[data-all]').addEventListener('click',()=>{position=traces[q('[data-scenario]').value].steps.length;render();});
  q('[data-reset]').addEventListener('click',()=>{position=0;render();});
  render();
}
