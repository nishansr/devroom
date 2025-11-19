# Change Log

All notable changes to the DevRoom extension will be documented in this file.

## [1.0.0] - 2025-11-19

### Added

- ✨ Activity bar icon for DevRoom
- ✨ Sidebar view with Create Room and Join Room buttons
- ✨ Real-time chat panel in editor column
- ✨ WebSocket-based communication
- ✨ Automatic room ID generation (6-8 characters)
- ✨ Room joining with validation
- ✨ Message broadcasting to all room participants
- ✨ Connection status indicators (Connected, Disconnected, Reconnecting, Error)
- ✨ Automatic reconnection every 5 seconds
- ✨ VS Code theme integration
- ✨ Multiple room support
- ✨ WebSocket server implementation
- ✨ Complete documentation and build system

### Features

- Real-time messaging with < 200ms latency
- Support for up to 50 users per room
- Clean, intuitive UI matching VS Code design
- Persistent chat sessions during editor lifecycle
- Cross-platform support (macOS, Linux, Windows)

### Technical

- TypeScript implementation
- esbuild for bundling
- WebSocket (ws) for real-time communication
- Webview API for UI
- Extension API for VS Code integration

## [Unreleased]

### Planned Features

- User identity (usernames, avatars)
- Message history and persistence
- File sharing
- Code snippet formatting
- Slash commands
- Voice chat integration
