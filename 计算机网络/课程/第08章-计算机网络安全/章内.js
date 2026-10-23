'use strict';
(() => {
  const byId = id => document.getElementById(id);
  const bits = n => n.toString(2).padStart(3, '0');
  const encryption = [6, 7, 5, 4, 3, 2, 0, 1];
  const decryption = Array(8);
  encryption.forEach((value, i) => { decryption[value] = i; });
  const cbcForm = byId('cbc-form');
  if (cbcForm) {
    cbcForm.noValidate = true;
    cbcForm.addEventListener('submit', event => {
      event.preventDefault();
      const message = byId('cbc-message').value.trim(), ivText = byId('cbc-iv').value.trim();
      const output = byId('cbc-result');
      if (!/^(?:[01]{3}){1,8}$/.test(message) || !/^[01]{3}$/.test(ivText)) {
        output.textContent = '请输入1–8个完整的3比特明文块，以及恰好3比特的IV；只接受0和1。';
        return;
      }
      const plain = message.match(/.{3}/g).map(value => parseInt(value, 2));
      const iv = parseInt(ivText, 2), cipher = [], steps = [];
      let previous = iv;
      plain.forEach((value, i) => {
        const mixed = value ^ previous, encrypted = encryption[mixed];
        steps.push(`第${i + 1}块：${bits(value)} ⊕ ${bits(previous)} = ${bits(mixed)} → ${bits(encrypted)}`);
        cipher.push(encrypted); previous = encrypted;
      });
      previous = iv ^ Number(byId('cbc-tamper').value);
      const decoded = cipher.map(value => {
        const result = decryption[value] ^ previous; previous = value; return result;
      });
      const format = values => values.map(bits).join(' ');
      output.textContent = `ECB：${format(plain.map(value => encryption[value]))}\nCBC：${format(cipher)}\n解密：${format(decoded)}\n${steps.join('\n')}\n${byId('cbc-tamper').value === '1' ? '接收IV最低位被翻转：只改变第一明文块；本模型没有认证标签。' : 'IV未改动，已恢复全部输入块。'}`;
    });
  }
  const rsaForm = byId('rsa-form');
  if (rsaForm) {
    rsaForm.noValidate = true;
    const modularPower = (base, exponent, modulus) => {
      let result = 1n;
      while (exponent > 0n) {
        if (exponent & 1n) result = result * base % modulus;
        base = base * base % modulus; exponent >>= 1n;
      }
      return result;
    };
    rsaForm.addEventListener('submit', event => {
      event.preventDefault();
      const value = byId('rsa-message').value.trim(), output = byId('rsa-result');
      if (!/^\d+$/.test(value) || Number(value) > 34) {
        output.textContent = '请输入0–34之间的整数消息。'; return;
      }
      const message = BigInt(value), cipher = modularPower(message, 5n, 35n), decoded = modularPower(cipher, 29n, 35n);
      output.textContent = `m = ${message}；c = ${cipher}；恢复 = ${decoded}\n公钥：(n=35, e=5)；私钥指数d=29。${message === cipher ? '\n这是本模型的固定点：明文与密文相同。' : ''}\n重复输入同一消息会得到同一密文；此模型不提供安全加密。`;
    });
  }
  const firewallForm = byId('firewall-form');
  if (firewallForm) {
    const packets = {
      out: {label:'内部发往443的SYN', direction:'out', protocol:'TCP', source:52000, destination:443, ack:false, flags:'SYN'},
      reply: {label:'443返回的SYN+ACK', direction:'in', protocol:'TCP', source:443, destination:52000, ack:true, flags:'SYN+ACK'},
      forged: {label:'入站443 ACK', direction:'in', protocol:'TCP', source:443, destination:52000, ack:true, flags:'ACK'},
      syn: {label:'外部主动SYN', direction:'in', protocol:'TCP', source:52000, destination:443, ack:false, flags:'SYN'},
      wrong: {label:'来自其他端口的ACK', direction:'in', protocol:'TCP', source:8443, destination:52000, ack:true, flags:'ACK'},
      udp: {label:'UDP数据报', direction:'in', protocol:'UDP', source:443, destination:52000, ack:false, flags:'无'}
    };
    firewallForm.addEventListener('submit', event => {
      event.preventDefault();
      const packet = packets[byId('firewall-packet').value], known = byId('firewall-state').value === '1';
      const first = packet.direction === 'out' && packet.protocol === 'TCP' && packet.source > 1023 && packet.destination === 443;
      const second = packet.direction === 'in' && packet.protocol === 'TCP' && packet.source === 443 && packet.destination > 1023 && packet.ack;
      const rule = first ? 'R1' : second ? 'R2' : 'R3';
      const stateless = first || second, stateful = first || second && known;
      const endpoints = packet.direction === 'out' ? `10.0.0.2:${packet.source} → 198.51.100.20:${packet.destination}` : `198.51.100.20:${packet.source} → 10.0.0.2:${packet.destination}`;
      byId('firewall-result').textContent = `案例：${packet.label}\n${packet.protocol} ${endpoints}；标志=${packet.flags}\n命中：${rule}\n无状态：${stateless ? '允许' : '拒绝'}\n有状态：${stateful ? '允许' : '拒绝'}\n${second ? known ? '已有匹配连接标记；此简化模型允许，未检查完整TCP序号与状态。' : '缺少匹配连接；ACK标志本身不能证明曾经建立连接。' : first ? '符合出站策略；此处不自动改变连接标记。' : '不匹配R1或R2，默认拒绝。'}`;
    });
  }
})();
