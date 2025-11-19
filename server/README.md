# DevRoom Server

WebSocket server for DevRoom chat extension.

## Installation

```bash
npm install
```

## Running

```bash
npm start
```

Server will start on port 3000 by default.

## Environment Variables

- `PORT` - Server port (default: 3000)

## Deployment

This server can be deployed to:

- Heroku
- Render
- Fly.io
- Railway
- AWS/GCP/Azure

Make sure to set the `DEVROOM_SERVER_URL` environment variable in the VS Code extension to point to your deployed server URL.
