const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const GameRoom = require('./src/GameRoom');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Store connected clients and game room
const clients = new Map();
const gameRoom = new GameRoom();
const disconnectedPlayerSlots = new Map(); // Track disconnected players with timers

// Set broadcast function for GameRoom
gameRoom.setBroadcastFunction(broadcastToAll);

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('🟢 New client connected');
  
  // Generate unique client ID
  const clientId = Math.random().toString(36).substr(2, 9);
  clients.set(clientId, { 
    ws, 
    role: null, 
    name: `Player${clientId.slice(-3)}` 
  });
  
  // Check if game is in progress and auto-assign as spectator
  if (gameRoom.gameInProgress && gameRoom.gameState.gameStatus === 'playing') {
    const client = clients.get(clientId);
    gameRoom.addSpectator(clientId);
    client.role = 'spectator';
    
    console.log(`👥 ${client.name} auto-assigned as spectator (game playing)`);
    
    // Send role assignment
    sendToClient(clientId, {
      type: 'ROLE_ASSIGNED',
      payload: { role: 'spectator' }
    });
    
    // Send complete game info for spectators
    sendToClient(clientId, {
      type: 'LOBBY_UPDATE',
      payload: gameRoom.getLobbyData()
    });
    
    sendToClient(clientId, {
      type: 'GAME_STATE',
      payload: gameRoom.getGameData()
    });
    
    console.log(`🎮 Sent complete game info to new spectator ${client.name}`);
  } else {
    // Game not actively playing (waiting, paused, or ended) - send initial lobby state
    console.log(`🏠 ${clients.get(clientId).name} sent to lobby (game status: ${gameRoom.gameState.gameStatus})`);
    sendToClient(clientId, {
      type: 'LOBBY_UPDATE',
      payload: gameRoom.getLobbyData()
    });
  }
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log(`📨 Received from ${clientId}:`, data.type, data.payload);
      handleWebSocketMessage(clientId, data);
    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log(`🔴 Client ${clientId} disconnected`);
    handleClientDisconnect(clientId);
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
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
      console.log('❓ Unknown message type:', data.type);
  }
}

// Handle lobby join
function handleJoinLobby(clientId, payload) {
  const client = clients.get(clientId);
  if (!client) return;
  
  const { role } = payload;
  let assignedRole = role;
  
  try {
    // Remove client from previous role
    gameRoom.removePlayer(clientId);
    
    // If game is actively playing, force spectator role for everyone except current players
    if (gameRoom.gameInProgress && gameRoom.gameState.gameStatus === 'playing') {
      gameRoom.addSpectator(clientId);
      client.role = 'spectator';
      assignedRole = 'spectator';
      console.log(`👥 ${client.name} auto-assigned as spectator (game actively playing)`);
    } else {
      // Game not actively playing (waiting, paused, ended) - assign requested role if available
      console.log(`🎮 Game status: ${gameRoom.gameState.gameStatus}, allowing role selection`);
      if (role === 'player1' && !gameRoom.players.player1) {
        gameRoom.addPlayer(clientId, 'player1', client.name);
        client.role = 'player1';
        assignedRole = 'player1';
        console.log(`🎮 ${client.name} assigned as PLAYER1`);
      } else if (role === 'player2' && !gameRoom.players.player2) {
        gameRoom.addPlayer(clientId, 'player2', client.name);
        client.role = 'player2';
        assignedRole = 'player2';
        console.log(`🎮 ${client.name} assigned as PLAYER2`);
      } else {
        // Default to spectator (if player slots are full or explicitly requested)
        gameRoom.addSpectator(clientId);
        client.role = 'spectator';
        assignedRole = 'spectator';
        console.log(`👥 ${client.name} assigned as SPECTATOR (slots full or requested)`);
      }
    }
    
    console.log(`👤 ${client.name} joined as ${assignedRole} (requested: ${role})`);
    
    // Send role confirmation to the specific client
    sendToClient(clientId, {
      type: 'ROLE_ASSIGNED',
      payload: { role: assignedRole }
    });
    
    // If assigned as spectator during ongoing game, send complete game info
    if (assignedRole === 'spectator' && gameRoom.gameInProgress && gameRoom.gameState.gameStatus === 'playing') {
      // Send lobby update first so frontend knows game is in progress
      sendToClient(clientId, {
        type: 'LOBBY_UPDATE',
        payload: gameRoom.getLobbyData()
      });
      
      // Then send game state
      sendToClient(clientId, {
        type: 'GAME_STATE',
        payload: gameRoom.getGameData()
      });
      
      console.log(`🎮 Sent complete game info to spectator ${client.name}`);
    }
    
    broadcastLobbyUpdate();
    
    // Handle game resumption for paused games or starting new games
    if (!gameRoom.gameInProgress && gameRoom.players.player1 && gameRoom.players.player2) {
      // Start new game
      gameRoom.startGame();
      broadcastGameState();
    } else if (gameRoom.gameInProgress && gameRoom.gameState.gameStatus === 'paused' && 
               gameRoom.players.player1 && gameRoom.players.player2) {
      // Resume paused game
      gameRoom.gameState.gameStatus = 'playing';
      console.log('▶️ Game resumed - both players present');
      
      // Send role confirmations to both players to ensure they transition to game view
      if (gameRoom.players.player1) {
        const p1Client = clients.get(gameRoom.players.player1.id);
        if (p1Client) {
          sendToClient(gameRoom.players.player1.id, {
            type: 'ROLE_ASSIGNED',
            payload: { role: 'player1' }
          });
        }
      }
      
      if (gameRoom.players.player2) {
        const p2Client = clients.get(gameRoom.players.player2.id);
        if (p2Client) {
          sendToClient(gameRoom.players.player2.id, {
            type: 'ROLE_ASSIGNED',
            payload: { role: 'player2' }
          });
        }
      }
      
      broadcastGameState();
    }
    
  } catch (error) {
    console.error('❌ Error joining lobby:', error.message);
    sendToClient(clientId, {
      type: 'ERROR',
      payload: { message: error.message }
    });
  }
}

// Handle client disconnect
function handleClientDisconnect(clientId) {
  const client = clients.get(clientId);
  if (!client) return;
  
  const wasPlayer = gameRoom.removePlayer(clientId);
  
  if (wasPlayer && (client.role === 'player1' || client.role === 'player2')) {
    console.log(`👤 Player ${client.role} disconnected`);
    broadcastPlayerDisconnected(client.role);
    
    // Start 3-second timer for delayed takeover
    const slotTimer = setTimeout(() => {
      // After 3 seconds, allow spectators to take the slot
      broadcastSlotAvailable(client.role);
      disconnectedPlayerSlots.delete(client.role);
    }, 3000);
    
    disconnectedPlayerSlots.set(client.role, slotTimer);
  }
  
  clients.delete(clientId);
  broadcastLobbyUpdate();
}

// Handle paddle movement
function handlePaddleMove(clientId, payload) {
  const client = clients.get(clientId);
  if (!client || (client.role !== 'player1' && client.role !== 'player2')) {
    return;
  }
  
  const { direction } = payload;
  gameRoom.handlePaddleMove(client.role, direction);
}

// Handle taking player slot
function handleTakePlayerSlot(clientId, payload) {
  const client = clients.get(clientId);
  if (!client || client.role !== 'spectator') return;
  
  const { slot } = payload;
  
  try {
    if ((slot === 'player1' && !gameRoom.players.player1) || 
        (slot === 'player2' && !gameRoom.players.player2)) {
      
      // Remove from spectators and add as player
      gameRoom.spectators.delete(clientId);
      gameRoom.addPlayer(clientId, slot, client.name);
      client.role = slot;
      
      // Send role assignment confirmation to the client
      sendToClient(clientId, {
        type: 'ROLE_ASSIGNED',
        payload: { role: slot }
      });
      
      console.log(`🎮 ${client.name} took ${slot} slot`);
      broadcastLobbyUpdate();
      
      // Resume or start game if both players exist
      if (gameRoom.players.player1 && gameRoom.players.player2) {
        if (gameRoom.gameState.gameStatus === 'paused') {
          gameRoom.gameState.gameStatus = 'playing';
          console.log('▶️ Game resumed');
        } else {
          gameRoom.startGame();
        }
        broadcastGameState();
      }
    }
  } catch (error) {
    console.error('❌ Error taking player slot:', error.message);
  }
}

// Broadcast functions
function broadcastLobbyUpdate() {
  const message = {
    type: 'LOBBY_UPDATE',
    payload: gameRoom.getLobbyData()
  };
  
  broadcastToAll(message);
}

function broadcastGameState() {
  const message = {
    type: 'GAME_STATE',
    payload: gameRoom.getGameData()
  };
  
  broadcastToAll(message);
}

function broadcastPlayerDisconnected(slot) {
  const message = {
    type: 'PLAYER_DISCONNECTED',
    payload: { slot }
  };
  
  broadcastToAll(message);
}

function broadcastSlotAvailable(slot) {
  const message = {
    type: 'SLOT_AVAILABLE',
    payload: { slot }
  };
  
  broadcastToAll(message);
  console.log(`📢 Slot ${slot} is now available for takeover`);
}

function broadcastToAll(message) {
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  });
  
  console.log(`📤 Broadcasted ${message.type} to ${clients.size} clients`);
}

function sendToClient(clientId, message) {
  const client = clients.get(clientId);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(message));
    console.log(`📤 Sent ${message.type} to ${clientId}`);
  }
}

// Game loop for broadcasting game state
setInterval(() => {
  if (gameRoom.gameState.gameStatus === 'playing') {
    broadcastGameState();
  }
}, 1000 / 60); // 60 FPS

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    players: gameRoom.getPlayerCount(),
    spectators: gameRoom.getSpectatorCount(),
    gameStatus: gameRoom.gameState.gameStatus
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🎮 Game server ready for connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Server shutting down...');
  server.close(() => {
    console.log('✅ Server closed');
  });
});

// Handle game reset - update client roles
function handleGameReset() {
  console.log('🔄 Game reset - moving all players to spectators');
  
  // Find clients that were players and update their roles to spectator
  clients.forEach((client, clientId) => {
    if (client.role === 'player1' || client.role === 'player2') {
      const oldRole = client.role;
      client.role = 'spectator';
      sendToClient(clientId, {
        type: 'ROLE_ASSIGNED',
        payload: { role: 'spectator' }
      });
      console.log(`👥 Updated ${client.name} from ${oldRole} to spectator (game reset)`);
    }
  });
}

// Override the GameRoom's reset method to also update client roles
const originalReset = gameRoom.resetGame.bind(gameRoom);
gameRoom.resetGame = function() {
  originalReset();
  handleGameReset();
};

// Handle game start - move non-players to spectators
function handleGameStart() {
  console.log('🎮 Game starting - checking who should be spectators');
  
  const player1Id = gameRoom.players.player1?.id;
  const player2Id = gameRoom.players.player2?.id;
  
  console.log(`🔍 Confirmed players: P1=${player1Id}, P2=${player2Id}`);
  console.log(`🔍 Total clients: ${clients.size}`);
  
  let movedCount = 0;
  
  // Move all clients who aren't the current players to spectators
  clients.forEach((client, clientId) => {
    console.log(`🔍 Checking client ${clientId} (${client.name}) - role: ${client.role}`);
    
    // Skip if already a spectator or has no role
    if (client.role === 'spectator' || !client.role) {
      console.log(`⏭️ Skipping ${client.name} - already spectator or no role`);
      return;
    }
    
    // Check if this client is one of the actual players
    const isPlayer1 = clientId === player1Id;
    const isPlayer2 = clientId === player2Id;
    
    console.log(`🔍 ${client.name}: isP1=${isPlayer1}, isP2=${isPlayer2}`);
    
    if (!isPlayer1 && !isPlayer2) {
      const oldRole = client.role;
      
      // Add to spectators in game room
      gameRoom.addSpectator(clientId);
      client.role = 'spectator';
      
      // Send role update to client
      sendToClient(clientId, {
        type: 'ROLE_ASSIGNED',
        payload: { role: 'spectator' }
      });
      
      movedCount++;
      console.log(`👥 Moved ${client.name} from ${oldRole} to spectator`);
    } else {
      console.log(`✅ ${client.name} keeps role ${client.role} (is a player)`);
    }
  });
  
  console.log(`🎮 Game start complete - moved ${movedCount} clients to spectator`);
}

// Override the GameRoom's startGame method to also move non-players to spectators
const originalStartGame = gameRoom.startGame.bind(gameRoom);
gameRoom.startGame = function() {
  console.log('🎮 Game starting - maintaining player roles');
  
  // Log current state before starting
  const player1Id = this.players.player1?.id;
  const player2Id = this.players.player2?.id;
  console.log(`🔍 Game start - P1: ${player1Id}, P2: ${player2Id}`);
  
  // Start the game first
  originalStartGame();
  
  // Now move non-players to spectators
  handleGameStart();
  
  console.log('✅ Game started - roles updated');
}; 