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
const socketClient_1 = require("./socketClient");
class ChatPanel {
    static currentPanels = new Map();
    _panel;
    _extensionUri;
    _disposables = [];
    _socketClient;
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
        this._userId = this._generateUserId();
        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.onDidReceiveMessage(message => {
            switch (message.type) {
                case 'send':
                    this._sendMessage(message.text);
                    break;
                case 'ready':
                    this._connectToRoom();
                    break;
            }
        }, null, this._disposables);
        this._socketClient = new socketClient_1.SocketClient(roomId, this._userId, (msg) => this._handleIncomingMessage(msg), (status) => this._handleConnectionStatus(status));
    }
    _connectToRoom() {
        this._socketClient.connect();
    }
    _generateUserId() {
        return 'user_' + Math.random().toString(36).substring(2, 9);
    }
    _sendMessage(text) {
        if (!text.trim()) {
            return;
        }
        this._socketClient.sendMessage(text);
    }
    _handleIncomingMessage(message) {
        this._panel.webview.postMessage({
            type: 'message',
            message: message
        });
    }
    _handleConnectionStatus(status) {
        this._panel.webview.postMessage({
            type: 'status',
            status: status
        });
    }
    dispose() {
        ChatPanel.currentPanels.delete(this._roomId);
        this._socketClient.disconnect();
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
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <link href="${styleUri}" rel="stylesheet">
    <title>Chat — ${this._roomId}</title>
</head>
<body>
    <div class="chat-container">
        <div class="chat-header">
            <h3>Room: ${this._roomId}</h3>
            <div class="status" id="status">
                <span class="status-dot"></span>
                <span class="status-text">Connecting...</span>
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

        // Notify extension that webview is ready
        vscode.postMessage({ type: 'ready' });

        function sendMessage() {
            const text = messageInput.value.trim();
            if (text) {
                vscode.postMessage({
                    type: 'send',
                    text: text
                });
                messageInput.value = '';
            }
        }

        sendBtn.addEventListener('click', sendMessage);
        
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.type) {
                case 'message':
                    addMessage(message.message);
                    break;
                case 'status':
                    updateStatus(message.status);
                    break;
            }
        });

        function addMessage(msg) {
            const messageEl = document.createElement('div');
            messageEl.className = 'message';
            
            const senderEl = document.createElement('div');
            senderEl.className = 'sender';
            senderEl.textContent = msg.senderId;
            
            const textEl = document.createElement('div');
            textEl.className = 'text';
            textEl.textContent = msg.text;
            
            const timeEl = document.createElement('div');
            timeEl.className = 'time';
            timeEl.textContent = formatTime(msg.time);
            
            messageEl.appendChild(senderEl);
            messageEl.appendChild(textEl);
            messageEl.appendChild(timeEl);
            
            messagesDiv.appendChild(messageEl);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        function updateStatus(status) {
            statusDot.className = 'status-dot ' + status;
            
            const statusTexts = {
                'connected': 'Connected',
                'disconnected': 'Disconnected',
                'reconnecting': 'Reconnecting...',
                'error': 'Connection Error'
            };
            
            statusText.textContent = statusTexts[status] || status;
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