# Multiplayer Ping Pong Game

A real-time multiplayer Ping Pong game built with React frontend and Node.js backend using native WebSockets for real-time communication.

## Features

- Real-time multiplayer gameplay
- Spectator mode with ability to take over disconnected players
- Lobby system with role selection
- Classic ping pong physics and scoring (first to 5, win by 2)
- Responsive design with 16:9 aspect ratio

## Project Structure

```
ping-pong-game/
├── package.json (root - manages both frontend/backend)
├── README.md
├── frontend/         # React frontend (Vite + React)
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom React hooks
│   │   └── utils/        # Game constants and utilities
└── backend/          # Node.js backend
    ├── src/              # GameRoom class and constants
    ├── utils/            # Backend utilities and constants
    └── server.js         # Express server with WebSocket
```

## Setup and Installation

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ping-pong-game
```

2. Install all dependencies (frontend and backend):
```bash
npm run install-all
```

## Running the Application

### Option 1: Start Both Services (Recommended)
```bash
npm start
```

This will start:
- Frontend on http://localhost:3000
- Backend on http://localhost:3001

### Option 2: PowerShell Users (Windows)
If you're using PowerShell and the above doesn't work:

**Start both services separately:**
```powershell
# Terminal 1 - Start Backend
cd backend ; npm start

# Terminal 2 - Start Frontend  
cd frontend ; npm start
```

**Or use PowerShell syntax:**
```powershell
# Start both in sequence
cd backend ; npm start ; cd .. ; cd frontend ; npm start
```

### Option 3: Individual Services

Run frontend only:
```bash
npm run start:frontend
```

Run backend only:
```bash
npm run start:backend
```

## Accessing the Application

1. **Frontend**: Open http://localhost:3000 in your browser
2. **Backend API**: http://localhost:3001/health (for health checks)
3. **WebSocket**: ws://localhost:3001 (automatically connected by frontend)

## Game Controls

- **Player 1**: W (up) / S (down)
- **Player 2**: Up Arrow (up) / Down Arrow (down)

## How to Play

1. Open the application in your browser
2. Choose your role: Player 1, Player 2, or Spectator
3. Wait for another player to join (if needed)
4. Play! First to 5 points wins (must win by 2)
5. Spectators can take over if a player disconnects

## Troubleshooting

### Port Already in Use
If you get "EADDRINUSE" errors:

**Windows PowerShell:**
```powershell
# Find processes using the ports
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Kill process by PID (replace <PID> with actual process ID)
Stop-Process -Id <PID> -Force
```

**Alternative ports:**
If ports 3000/3001 are busy, the servers will automatically try the next available ports (3002, 3003, etc.). Check the terminal output to see which ports are being used.

### WebSocket Connection Issues
- Make sure the backend is running before opening the frontend
- Check browser console for connection errors
- Verify the backend health endpoint: http://localhost:3001/health

### Dependencies Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json  
rm -rf backend/node_modules backend/package-lock.json
npm run install-all
```

## Technology Stack

- **Frontend**: React 18 + Vite (development server)
- **Backend**: Node.js with Express
- **Real-time Communication**: Native WebSockets (ws library)
- **Package Management**: npm with concurrently
<<<<<<< HEAD
- **Styling**: CSS with responsive design

## Development

This project follows a structured commit history with 10-15 commits demonstrating full-stack development progression:

1. Project setup and structure
2. Backend WebSocket server
3. Frontend React components
4. Lobby implementation
5. Game area and controls
6. Real-time communication
7. Game physics and mechanics
8. Error handling and cleanup

## API Endpoints

- `GET /health` - Server health check
- WebSocket events documented in `PING_PONG_SPECIFICATION.txt`

## License

MIT License 
=======
>>>>>>> ccf80deea76318219148caf28024c4cc3a6bce6a
