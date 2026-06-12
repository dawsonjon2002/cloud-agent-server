const WebSocket = require('ws');
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Cloud Agent Server ishlayapti!');
});

const wss = new WebSocket.Server({ server });

let computerSocket = null;
let phoneSocket = null;

wss.on('connection', (ws, req) => {
  const type = req.url;
  console.log(`Yangi ulanish: ${type}`);

  if (type === '/computer') {
    computerSocket = ws;
    console.log('✅ Kompyuter ulandi');

    ws.on('message', (msg) => {
      // Kompyuterdan javob kelsa telefoniga yuborish
      if (phoneSocket) phoneSocket.send(msg);
    });

    ws.on('close', () => {
      console.log('❌ Kompyuter uzildi');
      computerSocket = null;
    });
  }

  if (type === '/phone') {
    phoneSocket = ws;
    console.log('📱 Telefon ulandi');

    ws.on('message', (command) => {
      console.log(`Buyruq: ${command}`);
      // Telefondan kelgan buyruqni kompyuterga yuborish
      if (computerSocket) {
        computerSocket.send(command);
      } else {
        ws.send(JSON.stringify({ error: 'Kompyuter ulanmagan!' }));
      }
    });

    ws.on('close', () => {
      console.log('📱 Telefon uzildi');
      phoneSocket = null;
    });
  }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server port ${PORT} da ishlayapti`);
});
