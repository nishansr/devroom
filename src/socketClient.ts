import WebSocket from 'ws';

export interface ChatMessage {
    roomId: string;
    senderId: string;
    text: string;
    time: number;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'error';

export class SocketClient {
    private ws: WebSocket | null = null;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private readonly serverUrl: string;
    private isIntentionalDisconnect: boolean = false;

    constructor(
        private roomId: string,
        private userId: string,
        private onMessage: (message: ChatMessage) => void,
        private onStatusChange: (status: ConnectionStatus) => void
    ) {
        // Default to localhost for development
        // In production, set via environment variable or configuration
        this.serverUrl = process.env.DEVROOM_SERVER_URL || 'wss://devroom-server.onrender.com';
    }

    public connect() {
        this.isIntentionalDisconnect = false;
        
        try {
            this.ws = new WebSocket(`${this.serverUrl}/room/${this.roomId}`);

            this.ws.on('open', () => {
                this.onStatusChange('connected');
                
                // Send join message
                this.send({
                    type: 'join',
                    roomId: this.roomId,
                    senderId: this.userId
                });
            });

            this.ws.on('message', (data: WebSocket.Data) => {
                try {
                    const message = JSON.parse(data.toString());
                    if (message.type === 'message') {
                        this.onMessage(message.data);
                    }
                } catch (error) {
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
        } catch (error) {
            console.error('Failed to connect:', error);
            this.onStatusChange('error');
            this.scheduleReconnect();
        }
    }

    public sendMessage(text: string) {
        const message: ChatMessage = {
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

    public disconnect() {
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

    private send(data: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    private scheduleReconnect() {
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
