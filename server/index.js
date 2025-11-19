const WebSocket = require('ws');
const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 3000;

// In-memory storage for rooms
const rooms = new Map();

class Room {
    constructor(roomId) {
        this.roomId = roomId;
        this.clients = new Set();
    }

    addClient(client) {
        this.clients.add(client);
        console.log(`Client joined room ${this.roomId}. Total clients: ${this.clients.size}`);
    }

    removeClient(client) {
        this.clients.delete(client);
        console.log(`Client left room ${this.roomId}. Total clients: ${this.clients.size}`);
        
        // Clean up empty rooms
        if (this.clients.size === 0) {
            rooms.delete(this.roomId);
            console.log(`Room ${this.roomId} deleted (empty)`);
        }
    }

    broadcast(message, sender) {
        const messageStr = JSON.stringify(message);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageStr);
            }
        });
    }
}

// Create HTTP server
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('DevRoom WebSocket Server\n');
});

// Create WebSocket server
const wss = new WebSocket.Server({ 
    server,
    verifyClient: (info) => {
        const pathname = url.parse(info.req.url).pathname;
        return pathname.startsWith('/room/');
    }
});

wss.on('connection', (ws, req) => {
    const pathname = url.parse(req.url).pathname;
    const roomId = pathname.split('/room/')[1];

    if (!roomId) {
        ws.close(1008, 'Invalid room ID');
        return;
    }

    // Get or create room
    let room = rooms.get(roomId);
    if (!room) {
        room = new Room(roomId);
        rooms.set(roomId, room);
        console.log(`Room ${roomId} created`);
    }

    // Add client to room
    room.addClient(ws);

    // Store room reference on the WebSocket instance
    ws.roomId = roomId;

    console.log(`WebSocket connection established for room: ${roomId}`);

    // Handle incoming messages
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            
            switch (message.type) {
                case 'join':
                    console.log(`User ${message.senderId} joined room ${roomId}`);
                    // Optionally broadcast join notification
                    room.broadcast({
                        type: 'system',
                        text: `${message.senderId} joined the room`,
                        time: Date.now()
                    });
                    break;

                case 'message':
                    console.log(`Message in room ${roomId} from ${message.data.senderId}: ${message.data.text}`);
                    // Broadcast message to all clients in the room
                    room.broadcast({
                        type: 'message',
                        data: message.data
                    });
                    break;

                default:
                    console.log(`Unknown message type: ${message.type}`);
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    // Handle client disconnect
    ws.on('close', () => {
        const room = rooms.get(ws.roomId);
        if (room) {
            room.removeClient(ws);
        }
        console.log(`WebSocket connection closed for room: ${ws.roomId}`);
    });

    // Handle errors
    ws.on('error', (error) => {
        console.error(`WebSocket error in room ${ws.roomId}:`, error);
    });

    // Send welcome message
    ws.send(JSON.stringify({
        type: 'system',
        text: 'Connected to DevRoom server',
        time: Date.now()
    }));
});

// Start server
server.listen(PORT, () => {
    console.log(`DevRoom WebSocket server is running on port ${PORT}`);
    console.log(`WebSocket endpoint: ws://localhost:${PORT}/room/{roomId}`);
});

// Handle server errors
server.on('error', (error) => {
    console.error('Server error:', error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});
