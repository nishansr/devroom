"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketClient = void 0;
const ws_1 = __importDefault(require("ws"));
class SocketClient {
    roomId;
    userId;
    onMessage;
    onStatusChange;
    ws = null;
    reconnectTimer = null;
    serverUrl;
    isIntentionalDisconnect = false;
    constructor(roomId, userId, onMessage, onStatusChange) {
        this.roomId = roomId;
        this.userId = userId;
        this.onMessage = onMessage;
        this.onStatusChange = onStatusChange;
        // Default to localhost for development
        // In production, set via environment variable or configuration
        this.serverUrl = process.env.DEVROOM_SERVER_URL || 'wss://devroom-server.onrender.com';
    }
    connect() {
        this.isIntentionalDisconnect = false;
        try {
            this.ws = new ws_1.default(`${this.serverUrl}/room/${this.roomId}`);
            this.ws.on('open', () => {
                this.onStatusChange('connected');
                // Send join message
                this.send({
                    type: 'join',
                    roomId: this.roomId,
                    senderId: this.userId
                });
            });
            this.ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    if (message.type === 'message') {
                        this.onMessage(message.data);
                    }
                }
                catch (error) {
                    console.error('Error parsing message:', error);
                }
            });
            this.ws.on('close', () => {
                this.onStatusChange('disconnected');
                this.scheduleReconnect();
            });
            this.ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.onStatusChange('error');
            });
        }
        catch (error) {
            console.error('Failed to connect:', error);
            this.onStatusChange('error');
            this.scheduleReconnect();
        }
    }
    sendMessage(text) {
        const message = {
            roomId: this.roomId,
            senderId: this.userId,
            text: text,
            time: Date.now()
        };
        this.send({
            type: 'message',
            data: message
        });
    }
    disconnect() {
        this.isIntentionalDisconnect = true;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
    send(data) {
        if (this.ws && this.ws.readyState === ws_1.default.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }
    scheduleReconnect() {
        if (this.isIntentionalDisconnect) {
            return;
        }
        if (this.reconnectTimer) {
            return;
        }
        this.onStatusChange('reconnecting');
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
        }, 5000); // Reconnect after 5 seconds as per PRD
    }
}
exports.SocketClient = SocketClient;
//# sourceMappingURL=socketClient.js.map