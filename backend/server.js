const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Store connected clients and game state
const clients = new Map();
let gameRoom = {
  players: { player1: null, player2: null },
  spectators: new Set(),
  gameState: {
    status: 'waiting' // waiting, playing, paused, ended
  }
};

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New client connected');
  
  // Generate unique client ID
  const clientId = Math.random().toString(36).substr(2, 9);
  clients.set(clientId, { ws, role: null, name: `Player${clientId.slice(-3)}` });
  
  // Send initial lobby state
  broadcastLobbyUpdate();
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleWebSocketMessage(clientId, data);
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
    handleClientDisconnect(clientId);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Handle WebSocket messages
function handleWebSocketMessage(clientId, data) {
  const client = clients.get(clientId);
  if (!client) return;
  
  switch (data.type) {
    case 'JOIN_LOBBY':
      handleJoinLobby(clientId, data.payload);
      break;
    case 'PADDLE_MOVE':
      handlePaddleMove(clientId, data.payload);
      break;
    case 'TAKE_PLAYER_SLOT':
      handleTakePlayerSlot(clientId, data.payload);
      break;
    default:
      console.log('Unknown message type:', data.type);
  }
}

// Handle lobby join
function handleJoinLobby(clientId, payload) {
  const client = clients.get(clientId);
  if (!client) return;
  
  const { role } = payload;
  
  // Remove client from previous role
  if (client.role === 'player1') gameRoom.players.player1 = null;
  if (client.role === 'player2') gameRoom.players.player2 = null;
  if (client.role === 'spectator') gameRoom.spectators.delete(clientId);
  
  // Assign new role
  if (role === 'player1' && !gameRoom.players.player1) {
    gameRoom.players.player1 = { id: clientId, name: client.name };
    client.role = 'player1';
  } else if (role === 'player2' && !gameRoom.players.player2) {
    gameRoom.players.player2 = { id: clientId, name: client.name };
    client.role = 'player2';
  } else {
    // Default to spectator
    gameRoom.spectators.add(clientId);
    client.role = 'spectator';
  }
  
  broadcastLobbyUpdate();
}

// Handle client disconnect
function handleClientDisconnect(clientId) {
  const client = clients.get(clientId);
  if (!client) return;
  
  if (client.role === 'player1') {
    gameRoom.players.player1 = null;
    if (gameRoom.gameState.status === 'playing') {
      gameRoom.gameState.status = 'paused';
      broadcastPlayerDisconnected('player1');
    }
  } else if (client.role === 'player2') {
    gameRoom.players.player2 = null;
    if (gameRoom.gameState.status === 'playing') {
      gameRoom.gameState.status = 'paused';
      broadcastPlayerDisconnected('player2');
    }
  } else if (client.role === 'spectator') {
    gameRoom.spectators.delete(clientId);
  }
  
  clients.delete(clientId);
  
  // Check if both players disconnected
  if (!gameRoom.players.player1 && !gameRoom.players.player2) {
    gameRoom.gameState.status = 'waiting';
  }
  
  broadcastLobbyUpdate();
}

// Handle paddle movement (placeholder for now)
function handlePaddleMove(clientId, payload) {
  // Will be implemented in later commits
  console.log(`Paddle move from ${clientId}:`, payload);
}

// Handle taking player slot
function handleTakePlayerSlot(clientId, payload) {
  const client = clients.get(clientId);
  if (!client || client.role !== 'spectator') return;
  
  const { slot } = payload;
  
  if (slot === 'player1' && !gameRoom.players.player1) {
    // Remove from spectators
    gameRoom.spectators.delete(clientId);
    // Assign as player1
    gameRoom.players.player1 = { id: clientId, name: client.name };
    client.role = 'player1';
    
    // Resume game if other player exists
    if (gameRoom.players.player2 && gameRoom.gameState.status === 'paused') {
      gameRoom.gameState.status = 'playing';
    }
  } else if (slot === 'player2' && !gameRoom.players.player2) {
    // Remove from spectators
    gameRoom.spectators.delete(clientId);
    // Assign as player2
    gameRoom.players.player2 = { id: clientId, name: client.name };
    client.role = 'player2';
    
    // Resume game if other player exists
    if (gameRoom.players.player1 && gameRoom.gameState.status === 'paused') {
      gameRoom.gameState.status = 'playing';
    }
  }
  
  broadcastLobbyUpdate();
}

// Broadcast functions
function broadcastLobbyUpdate() {
  const lobbyData = {
    type: 'LOBBY_UPDATE',
    payload: {
      player1: gameRoom.players.player1,
      player2: gameRoom.players.player2,
      spectators: gameRoom.spectators.size,
      gameInProgress: gameRoom.gameState.status === 'playing' || gameRoom.gameState.status === 'paused'
    }
  };
  
  broadcastToAll(lobbyData);
}

function broadcastPlayerDisconnected(slot) {
  const message = {
    type: 'PLAYER_DISCONNECTED',
    payload: { slot }
  };
  
  broadcastToAll(message);
}

function broadcastToAll(message) {
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  });
}

// Basic routes
app.get('/', (req, res) => {
  res.json({ message: 'Ping Pong Game Server Running' });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    players: Object.keys(gameRoom.players).filter(key => gameRoom.players[key] !== null),
    spectators: gameRoom.spectators.size,
    gameStatus: gameRoom.gameState.status
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
}); 