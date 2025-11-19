import * as vscode from 'vscode';
import { DevRoomViewProvider } from './DevRoomViewProvider';
import { ChatPanel } from './ChatPanel';

export function activate(context: vscode.ExtensionContext) {
	console.log('DevRoom extension is now active!');

	// Register the sidebar view provider
	const provider = new DevRoomViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			DevRoomViewProvider.viewType,
			provider
		)
	);

	// Register Create Room command
	const createRoomCommand = vscode.commands.registerCommand('devroom.createRoom', () => {
		const roomId = generateRoomId();
		vscode.window.showInformationMessage(`Room created: ${roomId}`);
		ChatPanel.createOrShow(context.extensionUri, roomId);
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
			ChatPanel.createOrShow(context.extensionUri, roomId);
		}
	});

	context.subscriptions.push(createRoomCommand, joinRoomCommand);
}

export function deactivate() {
	// Clean up all chat panels
	ChatPanel.currentPanels.forEach(panel => panel.dispose());
	ChatPanel.currentPanels.clear();
}

function generateRoomId(): string {
	const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
	const length = 6 + Math.floor(Math.random() * 3); // 6-8 characters
	let result = '';
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return result;
}
