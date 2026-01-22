const io = require('socket.io-client');

// Obtén un token JWT primero desde el endpoint de login
const TOKEN = process.argv[2] || 'your-jwt-token-here';
const WS_URL = process.env.WS_URL || 'http://localhost:3001';

if (TOKEN === 'your-jwt-token-here') {
  console.error('❌ Error: Please provide a JWT token as argument');
  console.error('Usage: node test-websocket.js <JWT_TOKEN>');
  console.error('Or set WS_URL environment variable for different server');
  process.exit(1);
}

console.log('🔌 Connecting to WebSocket server:', WS_URL);
console.log('🔑 Using token:', TOKEN.substring(0, 20) + '...');

const socket = io(WS_URL, {
  // Primary method: send JWT in Authorization header
  extraHeaders: {
    Authorization: `Bearer ${TOKEN}`,
  },
  // Fallback method: send JWT in auth.token
  auth: {
    token: TOKEN,
  },
  // Use websocket transport
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server');
  console.log('📡 Socket ID:', socket.id);
  console.log('⏳ Waiting for events...\n');
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected from WebSocket server');
  console.log('Reason:', reason);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  if (error.data) {
    console.error('Error data:', error.data);
  }
  if (error.message.includes('Invalid token') || error.message.includes('No token')) {
    console.error('💡 Tip: Make sure your JWT token is valid and not expired');
  }
  console.error('Full error:', error);
  process.exit(1);
});

// Listen for order events
socket.on('order.new', (data) => {
  console.log('📦 [order.new]');
  console.log(JSON.stringify(data, null, 2));
  console.log('');
});

socket.on('order.status.changed', (data) => {
  console.log('🔄 [order.status.changed]');
  console.log(JSON.stringify(data, null, 2));
  console.log('');
});

socket.on('order.item.status.changed', (data) => {
  console.log('🍽️  [order.item.status.changed]');
  console.log(JSON.stringify(data, null, 2));
  console.log('');
});

// Keep connection alive
let heartbeatCount = 0;
setInterval(() => {
  heartbeatCount++;
  if (socket.connected) {
    console.log(`💓 Heartbeat #${heartbeatCount} - still connected`);
  }
}, 30000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Disconnecting...');
  socket.disconnect();
  process.exit(0);
});

console.log('Press Ctrl+C to exit\n');
