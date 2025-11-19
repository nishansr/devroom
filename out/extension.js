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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const DevRoomViewProvider_1 = require("./DevRoomViewProvider");
const ChatPanel_1 = require("./ChatPanel");
function activate(context) {
    console.log('DevRoom extension is now active!');
    // Register the sidebar view provider
    const provider = new DevRoomViewProvider_1.DevRoomViewProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(DevRoomViewProvider_1.DevRoomViewProvider.viewType, provider));
    // Register Create Room command
    const createRoomCommand = vscode.commands.registerCommand('devroom.createRoom', () => {
        const roomId = generateRoomId();
        vscode.window.showInformationMessage(`Room created: ${roomId}`);
        ChatPanel_1.ChatPanel.createOrShow(context.extensionUri, roomId);
    });
    // Register Join Room command
    const joinRoomCommand = vscode.commands.registerCommand('devroom.joinRoom', async () => {
        const roomId = await vscode.window.showInputBox({
            prompt: 'Enter Room ID',
            placeHolder: 'e.g., abc123',
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Room ID cannot be empty';
                }
                if (value.length < 6 || value.length > 8) {
                    return 'Room ID must be 6-8 characters';
                }
                return null;
            }
        });
        if (roomId) {
            ChatPanel_1.ChatPanel.createOrShow(context.extensionUri, roomId);
        }
    });
    context.subscriptions.push(createRoomCommand, joinRoomCommand);
}
function deactivate() {
    // Clean up all chat panels
    ChatPanel_1.ChatPanel.currentPanels.forEach(panel => panel.dispose());
    ChatPanel_1.ChatPanel.currentPanels.clear();
}
function generateRoomId() {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const length = 6 + Math.floor(Math.random() * 3); // 6-8 characters
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}
//# sourceMappingURL=extension.js.map