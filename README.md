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
├── frontend/         # React frontend
└── backend/          # Node.js backend
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

### Running the Application

Start both frontend and backend simultaneously:
```bash
npm start
```

This will start:
- Frontend on http://localhost:3000
- Backend on http://localhost:3001

### Individual Services

Run frontend only:
```bash
npm run start:frontend
```

Run backend only:
```bash
npm run start:backend
```

### Testing

Run all tests:
```bash
npm test
```

## Game Controls

- **Player 1**: W (up) / S (down)
- **Player 2**: Up Arrow (up) / Down Arrow (down)

## How to Play

1. Open the application in your browser
2. Choose your role: Player 1, Player 2, or Spectator
3. Wait for another player to join (if needed)
4. Play! First to 5 points wins (must win by 2)
5. Spectators can take over if a player disconnects

## Technology Stack

- **Frontend**: React (JavaScript)
- **Backend**: Node.js with Express
- **Real-time Communication**: Native WebSockets
- **Package Management**: npm with concurrently
