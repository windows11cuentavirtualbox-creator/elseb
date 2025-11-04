const express = require('express');
const app = express();
const path = require('path');

// Configuración
const ADMIN_IPS = ['127.0.0.1', '::1']; // IPs permitidas para localhost (IPv4 e IPv6)
const ADMIN_USER = 'Admin';
const ADMIN_PASS = 'paneladmin';

// Array para almacenar visitantes (en memoria)
let visitors = [];

// Middleware para parsear JSON
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Middleware para verificar IP del admin
function checkAdminIP(req, res, next) {
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  if (ADMIN_IPS.includes(clientIP)) {
    next();
  } else {
    res.status(403).send('Acceso denegado: IP no autorizada');
  }
}

// Ruta para registrar visitantes
app.post('/register-visit', (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const timestamp = new Date().toISOString();
  visitors.push({ ip: clientIP, timestamp });
  res.json({ message: 'Visitante registrado' });
});

// Ruta para login (solo si IP coincide)
app.post('/login', checkAdminIP, (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
  }
});

// Ruta para obtener visitantes (solo admin)
app.get('/visitors', checkAdminIP, (req, res) => {
  res.json(visitors);
});

// Ruta para obtener estadísticas (solo admin)
app.get('/stats', checkAdminIP, (req, res) => {
  const uniqueIPs = [...new Set(visitors.map(v => v.ip))];
  res.json({
    totalVisits: visitors.length,
    uniqueVisitors: uniqueIPs.length,
    recentVisits: visitors.slice(-10) // Últimas 10
  });
});

// Ruta para limpiar visitantes (solo admin)
app.post('/clear-visitors', checkAdminIP, (req, res) => {
  visitors = [];
  res.json({ message: 'Historial limpiado' });
});

// Ruta para agregar IP permitida (solo admin)
app.post('/add-ip', checkAdminIP, (req, res) => {
  const { ip } = req.body;
  if (ip && !ADMIN_IPS.includes(ip)) {
    ADMIN_IPS.push(ip);
    res.json({ message: 'IP agregada', ips: ADMIN_IPS });
  } else {
    res.status(400).json({ message: 'IP inválida o ya existe' });
  }
});

// Ruta para remover IP permitida (solo admin)
app.post('/remove-ip', checkAdminIP, (req, res) => {
  const { ip } = req.body;
  const index = ADMIN_IPS.indexOf(ip);
  if (index > -1 && ADMIN_IPS.length > 1) { // No remover la última
    ADMIN_IPS.splice(index, 1);
    res.json({ message: 'IP removida', ips: ADMIN_IPS });
  } else {
    res.status(400).json({ message: 'No se puede remover la última IP' });
  }
});

// Servir archivos HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pagina.html'));
});

app.get('/login', checkAdminIP, (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/admin', checkAdminIP, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});
