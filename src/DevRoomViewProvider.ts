import * as vscode from 'vscode';

export class DevRoomViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'devroom.mainView';
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'createRoom':
                    vscode.commands.executeCommand('devroom.createRoom');
                    break;
                case 'joinRoom':
                    vscode.commands.executeCommand('devroom.joinRoom');
                    break;
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'view.css')
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
            <span class="icon">➕</span>
            Create Room
        </button>
        <button class="btn btn-secondary" id="joinRoomBtn">
            <span class="icon">🚪</span>
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
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
