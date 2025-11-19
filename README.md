# DevRoom - Real-time Chat for Developers

DevRoom is a Visual Studio Code extension that enables real-time chat rooms directly inside your editor. Create or join chat rooms to collaborate with other developers instantly, without leaving VS Code.

## Features

- 🚀 **Create Rooms Instantly** - Generate a unique room ID with one click
- 🚪 **Easy Room Joining** - Join existing rooms using a simple room ID
- 💬 **Real-time Messaging** - Chat with multiple developers simultaneously
- 🔄 **Auto Reconnect** - Automatic reconnection on network issues
- 🎨 **VS Code Theme Support** - Seamlessly integrates with your editor theme
- ⚡ **Lightweight** - Minimal performance impact on your editor

## Installation

### From Source

1. Clone this repository
2. Run `npm install` in the root directory
3. Run `npm run build` to build the extension
4. Press F5 to open a new VS Code window with the extension loaded

### From VSIX Package

1. Download the latest `.vsix` file
2. In VS Code, go to Extensions view
3. Click "..." menu → "Install from VSIX..."
4. Select the downloaded `.vsix` file

## Usage

### Opening DevRoom

Click the DevRoom icon (💬) in the Activity Bar on the left side of VS Code.

### Creating a Room

1. Click the **"Create Room"** button in the DevRoom sidebar
2. A unique room ID will be generated (6-8 characters)
3. Share this room ID with others to invite them
4. The chat panel will open automatically

### Joining a Room

1. Click the **"Join Room"** button in the DevRoom sidebar
2. Enter the room ID shared by another developer
3. The chat panel will open and connect you to the room

### Sending Messages

1. Type your message in the input field at the bottom of the chat panel
2. Press **Enter** or click **"Send"**
3. Your message will be broadcast to all participants in real-time

### Connection Status

The top-right corner of the chat panel shows the connection status:

- 🟢 **Connected** - Active connection to the server
- 🟠 **Reconnecting** - Attempting to reconnect
- 🔴 **Disconnected** - Connection lost
- 🔴 **Error** - Connection error

## Setup

### Prerequisites

- Node.js 18.x or higher
- VS Code 1.70.0 or higher

### Building the Extension

```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Watch mode for development
npm run watch
```

### Running the WebSocket Server

The extension requires a WebSocket server to handle real-time communication.

#### Local Development

```bash
# Install server dependencies
cd server
npm install

# Start the server
npm start
```

The server will start on `http://localhost:3000` by default.

#### Production Deployment

Deploy the server to any Node.js hosting platform:

- **Heroku**: `git push heroku main`
- **Render**: Connect your GitHub repo
- **Fly.io**: `fly deploy`
- **Railway**: Connect your GitHub repo

After deployment, set the server URL as an environment variable or modify `src/socketClient.ts` line 21 with your production server URL.

## Development

### Project Structure

```
devroom/
├── src/
│   ├── extension.ts           # Extension entry point
│   ├── DevRoomViewProvider.ts # Sidebar view
│   ├── ChatPanel.ts           # Chat webview panel
│   └── socketClient.ts        # WebSocket client
├── media/
│   ├── chat.css               # Chat panel styles
│   ├── view.css               # Sidebar styles
│   └── chat-icon.svg          # Activity bar icon
├── server/
│   ├── index.js               # WebSocket server
│   └── package.json           # Server dependencies
├── package.json               # Extension manifest
├── tsconfig.json              # TypeScript config
└── esbuild.js                 # Build configuration
```

### Debug Mode

1. Open the project in VS Code
2. Press **F5** to start debugging
3. A new VS Code window will open with the extension loaded
4. Make sure the WebSocket server is running (`cd server && npm start`)

### Testing

**Important**: VS Code only allows one Extension Development Host at a time.

**Method 1: Extension + Test Client (Recommended)**

1. Start server: `cd server && npm start`
2. Press F5 to launch extension in debug mode
3. Create a room in the extension and note the room ID
4. Open `test-client.html` in a web browser
5. Enter the room ID in the test client and click Connect
6. Send messages from both the extension and browser to verify real-time sync

**Method 2: Two Browser Test Clients**

1. Start server: `cd server && npm start`
2. Open `test-client.html` in two different browser tabs
3. Enter the same room ID in both tabs
4. Test messaging between the tabs

**Method 3: Extension + Command Line (Advanced)**

1. Start server and launch extension (F5)
2. Install wscat: `npm install -g wscat`
3. Connect via CLI: `wscat -c ws://localhost:3000/room/yourRoomId`
4. Send JSON messages manually

## Configuration

### Server URL

By default, the extension connects to `ws://localhost:3000`. To change this:

1. Edit `src/socketClient.ts`
2. Modify line 21 with your production server URL
3. Rebuild the extension

## Packaging

To create a `.vsix` package for distribution:

```bash
# Install vsce if not already installed
npm install -g @vscode/vsce

# Package the extension
npm run package
```

This creates `devroom-1.0.0.vsix` in the root directory.

## Publishing

To publish to the VS Code Marketplace:

1. Create a publisher account at https://marketplace.visualstudio.com/
2. Get a Personal Access Token from Azure DevOps
3. Login with vsce: `vsce login <publisher-name>`
4. Publish: `vsce publish`

## Requirements

- VS Code 1.70.0 or higher
- Node.js 18.x or higher
- Active internet connection for real-time chat

## Known Issues

- Messages are not persisted (cleared on disconnect)
- No user authentication in v1.0
- Room history not available
- Maximum 50 users per room recommended

## Roadmap

Future enhancements planned:

- User identity (usernames, avatars)
- Message persistence and history
- File sharing capabilities
- Code snippet formatting
- Slash commands
- Voice chat integration

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

## Credits

Created by Nishan Bishwokarma

---

**Enjoy collaborating with DevRoom! 🚀**
