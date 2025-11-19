"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode3 = __toESM(require("vscode"));

// src/DevRoomViewProvider.ts
var vscode = __toESM(require("vscode"));
var DevRoomViewProvider = class {
  constructor(_extensionUri) {
    this._extensionUri = _extensionUri;
  }
  static viewType = "devroom.mainView";
  _view;
  resolveWebviewView(webviewView, context, _token) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    webviewView.webview.onDidReceiveMessage((data) => {
      switch (data.type) {
        case "createRoom":
          vscode.commands.executeCommand("devroom.createRoom");
          break;
        case "joinRoom":
          vscode.commands.executeCommand("devroom.joinRoom");
          break;
      }
    });
  }
  _getHtmlForWebview(webview) {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "view.css")
    );
    const nonce = getNonce();
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <link href="${styleUri}" rel="stylesheet">
    <title>DevRoom</title>
</head>
<body>
    <div class="container">
        <h2>DevRoom</h2>
        <p class="description">Create or join a chat room to collaborate with other developers in real-time.</p>
        <button class="btn btn-primary" id="createRoomBtn">
            <span class="icon">\u2795</span>
            Create Room
        </button>
        <button class="btn btn-secondary" id="joinRoomBtn">
            <span class="icon">\u{1F6AA}</span>
            Join Room
        </button>
    </div>
    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        
        document.getElementById('createRoomBtn').addEventListener('click', () => {
            vscode.postMessage({ type: 'createRoom' });
        });
        
        document.getElementById('joinRoomBtn').addEventListener('click', () => {
            vscode.postMessage({ type: 'joinRoom' });
        });
    </script>
</body>
</html>`;
  }
};
function getNonce() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// src/ChatPanel.ts
var vscode2 = __toESM(require("vscode"));
var ChatPanel = class _ChatPanel {
  static currentPanels = /* @__PURE__ */ new Map();
  _panel;
  _extensionUri;
  _disposables = [];
  _roomId;
  _userId;
  static createOrShow(extensionUri, roomId) {
    const column = vscode2.ViewColumn.Two;
    if (_ChatPanel.currentPanels.has(roomId)) {
      _ChatPanel.currentPanels.get(roomId)._panel.reveal(column);
      return;
    }
    const panel = vscode2.window.createWebviewPanel(
      "devroomChat",
      `Chat \u2014 ${roomId}`,
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri]
      }
    );
    _ChatPanel.currentPanels.set(roomId, new _ChatPanel(panel, extensionUri, roomId));
  }
  constructor(panel, extensionUri, roomId) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._roomId = roomId;
    this._userId = this._getUserId();
    this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.type) {
          case "send":
            this._panel.webview.postMessage({
              type: "sendMessage",
              text: message.text
            });
            break;
          case "ready":
            this._panel.webview.postMessage({
              type: "connect",
              roomId: this._roomId,
              userId: this._userId,
              serverUrl: process.env.DEVROOM_SERVER_URL || "wss://devroom-server.onrender.com"
            });
            break;
          case "updateName":
            this._userId = message.newName;
            break;
        }
      },
      null,
      this._disposables
    );
  }
  _getUserId() {
    const username = process.env.USER || process.env.USERNAME || process.env.LOGNAME;
    if (username) {
      return username;
    }
    return "user_" + Math.random().toString(36).substring(2, 9);
  }
  dispose() {
    _ChatPanel.currentPanels.delete(this._roomId);
    this._panel.dispose();
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
  _getHtmlForWebview(webview) {
    const styleUri = webview.asWebviewUri(
      vscode2.Uri.joinPath(this._extensionUri, "media", "chat.css")
    );
    const nonce = getNonce2();
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <link href="${styleUri}" rel="stylesheet">
    <title>Chat \u2014 ${this._roomId}</title>
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
                <button class="settings-btn" id="settingsBtn" title="Settings">\u2699\uFE0F</button>
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
};
function getNonce2() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// src/extension.ts
function activate(context) {
  console.log("DevRoom extension is now active!");
  const provider = new DevRoomViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode3.window.registerWebviewViewProvider(
      DevRoomViewProvider.viewType,
      provider
    )
  );
  const createRoomCommand = vscode3.commands.registerCommand("devroom.createRoom", () => {
    const roomId = generateRoomId();
    vscode3.window.showInformationMessage(`Room created: ${roomId}`);
    ChatPanel.createOrShow(context.extensionUri, roomId);
  });
  const joinRoomCommand = vscode3.commands.registerCommand("devroom.joinRoom", async () => {
    const roomId = await vscode3.window.showInputBox({
      prompt: "Enter Room ID",
      placeHolder: "e.g., abc123",
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return "Room ID cannot be empty";
        }
        if (value.length < 6 || value.length > 8) {
          return "Room ID must be 6-8 characters";
        }
        return null;
      }
    });
    if (roomId) {
      ChatPanel.createOrShow(context.extensionUri, roomId);
    }
  });
  context.subscriptions.push(createRoomCommand, joinRoomCommand);
}
function deactivate() {
  ChatPanel.currentPanels.forEach((panel) => panel.dispose());
  ChatPanel.currentPanels.clear();
}
function generateRoomId() {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  const length = 6 + Math.floor(Math.random() * 3);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
