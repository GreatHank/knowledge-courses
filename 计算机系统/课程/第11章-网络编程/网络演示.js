(() => {
  'use strict';
  const card = (title, value) => {
    const el = document.createElement('article');
    el.className = 'card';
    const h = document.createElement('h3'), p = document.createElement('p');
    h.textContent = title; p.textContent = value; el.append(h, p); return el;
  };
  const plans = {
    queued: ['prepare', 'connectA', 'acceptA', 'closeA'],
    two: ['prepare', 'connectA', 'connectB', 'acceptA', 'acceptB', 'closeA'],
    bindfail: ['socket', 'bindfail', 'cleanup']
  };
  function socketStart() {
    return {listening:false, fd:{}, queue:[], clients:{}, nextfd:4, event:'尚未创建套接字。点击下一步，观察服务器的资源变化。'};
  }
  function socketStep(s, action) {
    if (action === 'prepare') {
      s.fd[3] = '监听入口'; s.listening = true;
      s.event = 'socket、bind、listen 均成功；服务器保留 listenfd = 3。';
    } else if (action === 'socket') {
      s.fd[3] = '未绑定的套接字';
      s.event = 'socket 成功返回 3，但它还不是监听入口。';
    } else if (action === 'bindfail') {
      s.event = '本例 bind 失败（EADDRINUSE）。停止准备，不继续调用 listen；描述符 3 仍需清理。';
    } else if (action === 'cleanup') {
      delete s.fd[3]; s.event = '关闭失败分支持有的描述符 3；没有监听入口，没有已建立连接。';
    } else if (action.startsWith('connect')) {
      const id = action.slice(-1);
      if (!s.listening) throw new Error('模型顺序错误：没有监听入口');
      s.queue.push(id); s.clients[id] = 'connect 已成功';
      s.event = `客户端 ${id} 的握手完成并进入队列。connect 已可返回，服务器应用尚未 accept 这个连接。`;
    } else if (action.startsWith('accept')) {
      const id = action.slice(-1);
      if (s.queue.shift() !== id) throw new Error('模型顺序错误：队列与 accept 不一致');
      s.fd[s.nextfd++] = `连接 ${id}`;
      s.event = `accept 取出连接 ${id}，返回新的 connfd = ${s.nextfd - 1}。listenfd = 3 保留。`;
    } else if (action === 'closeA') {
      const fd = Object.keys(s.fd).find(k => s.fd[k] === '连接 A');
      if (fd === undefined) throw new Error('模型顺序错误：连接 A 尚未接受');
      delete s.fd[fd]; s.clients.A = '本例服务器已关闭其连接描述符';
      s.event = `close(${fd}) 释放连接 A 的服务器描述符。监听入口${s.fd[5] ? '和连接 B 都' : '仍'}保留；这一步不模拟 TCP 后续关闭报文。`;
    } else throw new Error('未知模型动作');
  }
  const enc = new TextEncoder();
  const asciiHeader = n => enc.encode(`HTTP/1.1 200 OK\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: ${n}\r\n\r\n`);
  function httpPlan(kind) {
    const body = enc.encode(kind === 'utf8' ? '你好' : 'hello');
    const head = asciiHeader(body.length);
    const all = Uint8Array.from([...head, ...body]);
    if (kind === 'split') return [all.slice(0, head.length-2), all.slice(head.length-2,head.length+2), all.slice(head.length+2)];
    if (kind === 'truncated') return [all.slice(0,head.length+3), null];
    return [all.slice(0,head.length+2), all.slice(head.length+2,head.length+3), all.slice(head.length+3)];
  }
  function parseHttp(bytes, eof) {
    let end = -1;
    for (let i=0;i+3<bytes.length;i++) {
      if (bytes[i]===13 && bytes[i+1]===10 && bytes[i+2]===13 && bytes[i+3]===10) {end=i+4;break;}
    }
    if (end<0) return {header:'尚未收到完整首部', body:[], length:null, status:eof?'首部截断':'等待首部空行'};
    const header = new TextDecoder().decode(Uint8Array.from(bytes.slice(0,end)));
    const match = /\r\nContent-Length: (\d+)\r\n/.exec(header);
    if (!match) throw new Error('演示数据缺少合法 Content-Length');
    const length=Number(match[1]), body=bytes.slice(end,end+length);
    return {header,body,length,status:body.length===length?'正文完整':eof?'正文截断':'等待正文'};
  }
  document.querySelectorAll('[data-demo]').forEach(root => {
    const select=root.querySelector('select'), next=root.querySelector('[data-step]'), reset=root.querySelector('[data-reset]');
    const event=root.querySelector('[data-event]'), state=root.querySelector('[data-state]'), dump=root.querySelector('[data-bytes]');
    let step, s, received, eof, chunks;
    function render() {
      state.replaceChildren(); root.dataset.step=String(step);
      if (root.dataset.demo==='socket') {
        event.textContent=`第 ${step} 步 · ${s.event}`;
        state.append(card('服务器描述符',Object.entries(s.fd).map(([k,v])=>`${k}：${v}`).join('；')||'无'),card('等待 accept 的队列',s.queue.join('、')||'空'),card('客户端状态',Object.entries(s.clients).map(([k,v])=>`${k}：${v}`).join('；')||'尚未发起连接'));
        root.dataset.queue=String(s.queue.length); root.dataset.fds=Object.keys(s.fd).join(',');
        next.disabled=step===plans[select.value].length; dump.textContent='';
      } else {
        const r=parseHttp(received,eof);
        state.append(card('首部',r.length===null?'等待 CRLF CRLF':`已找到空行；正文长度 ${r.length} 字节`),card('正文计数',`${r.body.length} / ${r.length===null?'未知':r.length} 字节`),card('消息状态',r.status));
        const hex=r.body.map(x=>x.toString(16).padStart(2,'0').toUpperCase()).join(' ');
        const visible=new TextDecoder().decode(Uint8Array.from(r.body),{stream:true});
        dump.textContent=`已收到总量：${received.length} 字节（包括首部）\n正文十六进制：${hex||'尚无'}\n已完整解码的正文字符：${visible||'尚无'}${select.value==='utf8'?'\n未完整的 UTF-8 字符暂不显示；长度始终按字节累计。':''}`;
        root.dataset.bodyBytes=String(r.body.length);root.dataset.status=r.status;
        next.disabled=step===chunks.length;
      }
    }
    function restart() {
      step=0;s=socketStart();received=[];eof=false;chunks=root.dataset.demo==='http'?httpPlan(select.value):[];
      event.textContent='第 0 步 · 尚未收到响应。每一步加入一段应用读取结果。'; render();
    }
    next.addEventListener('click',()=>{
      if (root.dataset.demo==='socket') socketStep(s,plans[select.value][step]);
      else {
        const chunk=chunks[step];
        if (chunk===null) {eof=true; event.textContent=`第 ${step+1} 步 · read 返回 0：EOF。核对声明长度后，仍缺少正文。`;}
        else {received.push(...chunk);event.textContent=`第 ${step+1} 步 · 本次读取返回 ${chunk.length} 个字节。把它们接到此前的数据后面再判断。`;}
      }
      step++;render();
    });
    reset.addEventListener('click',restart); select.addEventListener('change',restart); restart();
  });
})();
