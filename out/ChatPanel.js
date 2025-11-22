"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatPanel = void 0;
const vscode = __importStar(require("vscode"));
class ChatPanel {
    static currentPanels = new Map();
    _panel;
    _extensionUri;
    _disposables = [];
    _roomId;
    _userId;
    static createOrShow(extensionUri, roomId) {
        const column = vscode.ViewColumn.Two;
        if (ChatPanel.currentPanels.has(roomId)) {
            ChatPanel.currentPanels.get(roomId)._panel.reveal(column);
            return;
        }
        const panel = vscode.window.createWebviewPanel('devroomChat', `Chat — ${roomId}`, column, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [extensionUri]
        });
        ChatPanel.currentPanels.set(roomId, new ChatPanel(panel, extensionUri, roomId));
    }
    constructor(panel, extensionUri, roomId) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._roomId = roomId;
        this._userId = this._getUserId();
        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.onDidReceiveMessage(message => {
            switch (message.type) {
                case 'send':
                    // Forward to webview to handle WebSocket
                    this._panel.webview.postMessage({
                        type: 'sendMessage',
                        text: message.text
                    });
                    break;
                case 'ready':
                    // Send connection info to webview
                    this._panel.webview.postMessage({
                        type: 'connect',
                        roomId: this._roomId,
                        userId: this._userId,
                        serverUrl: process.env.DEVROOM_SERVER_URL || 'wss://devroom-server.onrender.com'
                    });
                    break;
                case 'updateName':
                    // Update userId when user changes name
                    this._userId = message.newName;
                    break;
            }
        }, null, this._disposables);
    }
    _getUserId() {
        // Try to get VS Code username from environment
        const username = process.env.USER || process.env.USERNAME || process.env.LOGNAME;
        if (username) {
            return username;
        }
        // Fallback to random ID
        return 'user_' + Math.random().toString(36).substring(2, 9);
    }
    dispose() {
        ChatPanel.currentPanels.delete(this._roomId);
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
    _getHtmlForWebview(webview) {
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'chat.css'));
        const nonce = getNonce();
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; connect-src wss://devroom-server.onrender.com ws://localhost:*;">
    <link href="${styleUri}" rel="stylesheet">
    <title>Chat — ${this._roomId}</title>
</head>
<body>
    <div class="chat-container">
        <div class="chat-header">
            <h3>Room: ${this._roomId}</h3>
            <div class="header-actions">
                <div class="status" id="status">
                    <span class="status-dot"></span>
                    <span class="status-text">Connecting...</span>
                </div>
                <button class="settings-btn" id="settingsBtn" title="Settings">⚙️</button>
                <div class="settings-menu" id="settingsMenu">
                    <div class="settings-item">
                        <label>Your Name:</label>
                        <input type="text" id="usernameInput" placeholder="Enter your name" />
                    </div>
                    <button class="save-btn" id="saveNameBtn">Save</button>
                </div>
            </div>
        </div>
        <div class="messages" id="messages"></div>
        <div class="input-container">
            <input type="text" id="messageInput" placeholder="Type a message..." />
            <button id="sendBtn">Send</button>
        </div>
    </div>
    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        const messagesDiv = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const statusDiv = document.getElementById('status');
        const statusDot = statusDiv.querySelector('.status-dot');
        const statusText = statusDiv.querySelector('.status-text');

        let ws = null;
        let roomId = null;
        let userId = null;
        let serverUrl = null;
        let reconnectTimer = null;
        let isIntentionalDisconnect = false;

        const settingsBtn = document.getElementById('settingsBtn');
        const settingsMenu = document.getElementById('settingsMenu');
        const usernameInput = document.getElementById('usernameInput');
        const saveNameBtn = document.getElementById('saveNameBtn');

        // Toggle settings menu
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsMenu.classList.toggle('show');
            if (settingsMenu.classList.contains('show')) {
                usernameInput.value = userId;
                usernameInput.focus();
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!settingsMenu.contains(e.target) && e.target !== settingsBtn) {
                settingsMenu.classList.remove('show');
            }
        });

        // Save name
        saveNameBtn.addEventListener('click', () => {
            const newName = usernameInput.value.trim();
            if (newName && newName !== userId) {
                const oldUserId = userId;
                userId = newName;
                settingsMenu.classList.remove('show');
                
                // Notify extension about name change
                vscode.postMessage({ type: 'updateName', newName: userId });
                
                // Show notification
                const statusText = document.querySelector('.status-text');
                const oldText = statusText.textContent;
                statusText.textContent = 'Name updated to ' + userId + '!';
                setTimeout(() => {
                    statusText.textContent = oldText;
                }, 2000);

                // Rejoin with new name if connected
                if (ws && ws.readyState === WebSocket.OPEN) {
                    send({
                        type: 'join',
                        roomId: roomId,
                        senderId: userId
                    });
                }
                
                // Update existing messages to reflect new name
                document.querySelectorAll('.message.own .sender').forEach(el => {
                    el.textContent = 'You';
                });
            }
        });

        // Save on Enter key
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveNameBtn.click();
            }
        });

        // Notify extension that webview is ready
        vscode.postMessage({ type: 'ready' });

        function connectWebSocket() {
            if (!roomId || !serverUrl) {
                return;
            }

            isIntentionalDisconnect = false;
            updateStatus('reconnecting', 'Connecting...');

            try {
                ws = new WebSocket(serverUrl + '/room/' + roomId);

                ws.onopen = () => {
                    updateStatus('connected', 'Connected');
                    messageInput.disabled = false;
                    sendBtn.disabled = false;

                    // Send join message
                    send({
                        type: 'join',
                        roomId: roomId,
                        senderId: userId
                    });
                };

                ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        if (message.type === 'message') {
                            addMessage(message.data);
                        }
                    } catch (error) {
                        console.error('Error parsing message:', error);
                    }
                };

                ws.onclose = () => {
                    updateStatus('disconnected', 'Disconnected');
                    messageInput.disabled = true;
                    sendBtn.disabled = true;
                    scheduleReconnect();
                };

                ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    updateStatus('error', 'Connection Error');
                };
            } catch (error) {
                console.error('Failed to connect:', error);
                updateStatus('error', 'Connection Failed');
                scheduleReconnect();
            }
        }

        function send(data) {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(data));
            }
        }

        function sendMessage() {
            const text = messageInput.value.trim();
            if (!text || !ws || ws.readyState !== WebSocket.OPEN) {
                return;
            }

            send({
                type: 'message',
                data: {
                    roomId: roomId,
                    senderId: userId,
                    text: text,
                    time: Date.now()
                }
            });

            messageInput.value = '';
        }

        function scheduleReconnect() {
            if (isIntentionalDisconnect || reconnectTimer) {
                return;
            }

            updateStatus('reconnecting', 'Reconnecting in 5s...');

            reconnectTimer = setTimeout(() => {
                reconnectTimer = null;
                connectWebSocket();
            }, 5000);
        }

        sendBtn.addEventListener('click', sendMessage);
        
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        // Cleanup on unload
        window.addEventListener('beforeunload', () => {
            isIntentionalDisconnect = true;
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
            }
            if (ws) {
                ws.close();
            }
        });

        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.type) {
                case 'connect':
                    roomId = message.roomId;
                    userId = message.userId;
                    serverUrl = message.serverUrl;
                    connectWebSocket();
                    break;
                case 'sendMessage':
                    // This is for compatibility if needed
                    break;
            }
        });

        function addMessage(msg) {
            const messageEl = document.createElement('div');
            const isOwn = msg.senderId === userId;
            messageEl.className = 'message ' + (isOwn ? 'own' : 'other');
            
            const senderEl = document.createElement('div');
            senderEl.className = 'sender';
            senderEl.textContent = isOwn ? 'You' : msg.senderId;
            
            const bubbleEl = document.createElement('div');
            bubbleEl.className = 'message-bubble';
            
            const textEl = document.createElement('div');
            textEl.className = 'text';
            textEl.textContent = msg.text;
            
            const timeEl = document.createElement('div');
            timeEl.className = 'time';
            timeEl.textContent = formatTime(msg.time);
            
            messageEl.appendChild(senderEl);
            bubbleEl.appendChild(textEl);
            messageEl.appendChild(bubbleEl);
            messageEl.appendChild(timeEl);
            
            messagesDiv.appendChild(messageEl);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        function updateStatus(status, text) {
            statusDot.className = 'status-dot ' + status;
            statusText.textContent = text || status;
        }

        function formatTime(timestamp) {
            const date = new Date(timestamp);
            return date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
    </script>
</body>
</html>`;
    }
}
exports.ChatPanel = ChatPanel;
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=ChatPanel.js.map