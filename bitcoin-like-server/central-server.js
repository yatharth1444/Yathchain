const WebSocket = require('ws');

// Create a WebSocket server on port 8080
const wss = new WebSocket.Server({ port: 8080 });

// Store connected miners
let miners = [];

// Broadcast function to send messages to all miners
function broadcast(data) {
    miners.forEach(miner => {
        miner.send(JSON.stringify(data));
    });
}

// Event handler when a miner connects
wss.on('connection', (ws) => {
    console.log('A new miner connected.');
    miners.push(ws);

    // When the central server receives a message from a miner
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        console.log('Received data from miner:', data);
        
        // Broadcast the message to all other miners
        broadcast(data);
    });

    // Remove miner when disconnected
    ws.on('close', () => {
        miners = miners.filter(miner => miner !== ws);
        console.log('A miner disconnected.');
    });
});

console.log('Central WebSocket server is running on ws://localhost:8080');

