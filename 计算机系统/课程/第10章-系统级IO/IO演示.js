/* 伴读状态模型：使用内存中的字节串与引用表，不调用操作系统。 */
(() => {
  'use strict';
  const visible = s => s.replaceAll('\n', '\\n');
  const card = (title, value) => {
    const el = document.createElement('article'); el.className = 'card';
    const h = document.createElement('h3'), p = document.createElement('p');
    h.textContent = title; p.textContent = value; el.append(h,p); return el;
  };
  for (const box of document.querySelectorAll('[data-demo]')) {
    const select = box.querySelector('select'), state = box.querySelector('[data-state]');
    const trace = box.querySelector('[data-trace]'), next = box.querySelector('[data-next]');
    const all = box.querySelector('[data-all]'), event = box.querySelector('[data-event]');
    let step, actions, model;
    const reset = () => {
      step = 0; trace.replaceChildren();
      if (box.dataset.demo === 'buffer') {
        model = {file:select.value === 'long' ? 'abcdef\n' : 'ab\nCD\nXY', kernel:0, buffer:'', cursor:0, output:'尚未返回', event:'缓冲区为空；下一步请求补充。'};
        actions = select.value === 'raw' ? ['fill','line','raw'] : ['fill','line','line','line','line'];
      } else {
        model = {file:'foobar', fds:{}, ofds:{}, output:[], event:'尚未打开文件。'};
        actions = {opens:['open-a','open-b','read-a','read-b'],dup:['open-a','dup','read-a','read-b'],fork:['open-a','fork','read-child','read-a'],close:['open-a','dup','close-a','read-b']}[select.value];
      }
      draw();
    };
    const draw = () => {
      box.dataset.step = String(step); state.replaceChildren();
      if (box.dataset.demo === 'buffer') {
        state.append(card('内核偏移',String(model.kernel)),card('缓冲区剩余',String(model.buffer.length-model.cursor)+' B'),card('本次返回',model.output));
        const strip = document.createElement('div'); strip.className = 'byte-strip'; strip.setAttribute('aria-label','缓冲区各字节，淡色为已消费');
        [...model.buffer].forEach((c,i) => {const span=document.createElement('span');span.className='byte-cell'+(i<model.cursor?' used':'')+(i===model.cursor?' cursor':'');span.textContent=visible(c);strip.append(span);});
        state.append(strip);
      } else {
        const refs = Object.entries(model.fds).map(([fd,id])=>fd+' → '+id).join('；') || '无';
        const offsets = Object.entries(model.ofds).map(([id,o])=>id+': 偏移 '+o.offset+'，引用 '+Object.values(model.fds).filter(v=>v===id).length).join('；') || '无';
        state.append(card('描述符引用',refs),card('打开文件描述',offsets),card('已经读到',model.output.join('；') || '无'));
      }
      event.textContent = model.event; next.disabled = all.disabled = step === actions.length;
    };
    const advance = () => {
      if (step === actions.length) return;
      const action = actions[step];
      if (box.dataset.demo === 'buffer') {
        if (action === 'fill') {
          model.buffer=model.file.slice(model.kernel,model.kernel+8);model.cursor=0;model.kernel+=model.buffer.length;
          model.event='read 补入 '+model.buffer.length+' B；内核偏移推进，调用者尚未取走一行。';
        } else if (action === 'raw') {
          const bytes=model.file.slice(model.kernel); model.kernel+=bytes.length;
          model.output=bytes.length ? visible(bytes) : 'raw read: 0（EOF）';
          model.event='直接 read 从内核偏移开始；缓冲区仍有 '+(model.buffer.length-model.cursor)+' B 未被取走。';
        } else {
          const limit=select.value==='long'?3:31;let bytes='';
          while (bytes.length<limit && model.cursor<model.buffer.length) {
            const c=model.buffer[model.cursor++];bytes+=c;if(c==='\n')break;
          }
          model.output=bytes.length ? visible(bytes)+' · '+bytes.length+' B' : '0（EOF）';
          const eof=model.cursor===model.buffer.length && !bytes.endsWith('\n') && bytes.length<limit;
          model.event=bytes.length ? '从缓冲区复制 '+bytes.length+' B，追加 NUL（不计入返回值）。'+(eof?'继续补充时 read 返回 0，本次仍返回已有字节。':'') : '缓冲区已空，补充 read 返回 0；本次没有字符。';
        }
      } else {
        if(action.startsWith('open-')) {
          const fd=action.slice(5),id=fd==='a'?'X':'Y';model.fds[fd]=id;model.ofds[id]={offset:0};model.event='open 建立独立对象 '+id+'，'+fd+' 引用它。';
        } else if(action==='dup'||action==='fork') {
          const fd=action==='fork'?'child':'b';model.fds[fd]=model.fds.a;model.event=fd+' 增加对 X 的引用；没有复制出独立偏移。';
        } else if(action==='close-a') {
          delete model.fds.a;model.event='移除 a 的引用；b 仍引用 X，文件偏移保持 0。';
        } else {
          const fd=action.slice(5),o=model.ofds[model.fds[fd]],byte=model.file[o.offset];
          if(byte!==undefined)o.offset++;
          model.output.push(fd+'='+ (byte===undefined?'EOF':byte));
          model.event=(select.value==='fork'&&fd==='a'?'父进程等待子进程完成后，':'')+fd+' 从 '+model.fds[fd]+' 读取 '+(byte===undefined?'EOF':byte)+'。';
        }
      }
      step++; const li=document.createElement('li');li.textContent=model.event;trace.append(li);draw();
    };
    next.addEventListener('click',advance); all.addEventListener('click',()=>{while(step<actions.length)advance();});
    box.querySelector('[data-reset]').addEventListener('click',reset);select.addEventListener('change',reset);reset();
  }
})();
