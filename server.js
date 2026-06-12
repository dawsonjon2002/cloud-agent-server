const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');

const phoneHTML = `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PC Boshqaruv</title>
  <style>
    body { font-family: Arial; background: #1a1a2e; color: white; padding: 20px; }
    h2 { text-align: center; color: #00d4ff; }
    .status { text-align: center; padding: 8px; border-radius: 8px; margin-bottom: 20px; }
    .connected { background: #1a5c1a; }
    .disconnected { background: #5c1a1a; }
    .btn-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
    button { padding: 15px; border: none; border-radius: 10px; background: #16213e; color: white; font-size: 15px; cursor: pointer; }
    button:active { background: #00d4ff; color: #000; }
    .custom { display: flex; gap: 8px; }
    input { flex: 1; padding: 12px; border-radius: 8px; border: 1px solid #00d4ff; background: #16213e; color: white; font-size: 15px; }
    .send-btn { background: #00d4ff; color: #000; font-weight: bold; padding: 12px 20px; border: none; border-radius: 8px; font-size: 15px; cursor: pointer; }
    .log { background: #16213e; border-radius: 8px; padding: 10px; height: 150px; overflow-y: auto; font-size: 12px; font-family: monospace; }
  </style>
</head>
<body>
  <h2>💻 PC Boshqaruv</h2>
  <div class="status disconnected" id="status">🔴 Ulanmoqda...</div>
  <div class="btn-grid">
    <button onclick="send('start totalcmd.exe')">📁 Total Commander</button>
    <button onclick="send('start notepad.exe')">📝 Notepad</button>
    <button onclick="send('start calc.exe')">🔢 Calculator</button>
    <button onclick="send('start mspaint.exe')">🎨 Paint</button>
    <button onclick="send('start chrome.exe')">🌐 Chrome</button>
    <button onclick="send('shutdown /s /t 0')">⛔ O\\'chirish</button>
  </div>
  <div class="custom">
    <input type="text" id="cmd" placeholder="Buyruq yozing..." />
    <button class="send-btn" onclick="sendCustom()">▶</button>
  </div>
  <br>
  <div class="log" id="log">Loglar...<br></div>
  <script>
    const SERVER = "wss://cloud-agent-server.onrender.com/phone";
    let ws;
    function connect() {
      ws = new WebSocket(SERVER);
      ws.onopen = () => {
        document.getElementById('status').textContent = '🟢 Ulandi!';
        document.getElementById('status').className = 'status connected';
        log('Ulandi!');
      };
      ws.onmessage = (e) => log('Javob: ' + e.data);
      ws.onclose = () => {
        document.getElementById('status').textContent = '🔴 Uzildi...';
        document.getElementById('status').className = 'status disconnected';
        setTimeout(connect, 3000);
      };
    }
    function send(cmd) {
      if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({ command: cmd }));
        log('Yuborildi: ' + cmd);
      }
    }
    function sendCustom() {
      const cmd = document.getElementById('cmd').value;
      if (cmd) { send(cmd); document.getElementById('cmd').value = ''; }
    }
    function log(msg) {
      const el = document.getElementById('log');
      el.innerHTML += new Date().toLocaleTimeString() + ' — ' + msg + '<br>';
      el.scrollTop = el.scrollHeight;
    }
    connect();
  </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/phone.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(phoneHTML);
  } else {
    res.writeHead(200);
    res.end('Cloud Agent Server ishlayapti!');
  }
});

const wss = new WebSocket.Server({ server });

let computerSocket = null;
let phoneSocket = null;

wss.on('connection', (ws, req) => {
  const type = req.url;

  if (type === '/computer') {
    computerSocket = ws;
    console.log('✅ Kompyuter ulandi');
    ws.on('message', (msg) => {
      if (phoneSocket) phoneSocket.send(msg);
    });
    ws.on('close', () => { computerSocket = null; });
  }

  if (type === '/phone') {
    phoneSocket = ws;
    console.log('📱 Telefon ulandi');
    ws.on('message', (command) => {
      if (computerSocket) {
        computerSocket.send(command);
      } else {
        ws.send(JSON.stringify({ error: 'Kompyuter ulanmagan!' }));
      }
    });
    ws.on('close', () => { phoneSocket = null; });
  }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server port ${PORT} da ishlayapti`);
});
