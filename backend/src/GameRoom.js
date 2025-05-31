const { GAME_WIDTH, GAME_HEIGHT, PADDLE_HEIGHT, PADDLE_SPEED, PADDLE_OFFSET, INITIAL_BALL_SPEED, GAME_LOOP_FPS } = require('../utils/constants');

class GameRoom {
  constructor() {
    this.players = {
      player1: null,
      player2: null
    };
    this.spectators = new Set();
    this.gameInProgress = false;
    this.gameStartTime = null;
    
    // Calculate per-frame speeds
    this.paddleSpeedPerFrame = PADDLE_SPEED / GAME_LOOP_FPS; // Convert from pixels/second to pixels/frame
    this.ballSpeedPerFrame = INITIAL_BALL_SPEED / GAME_LOOP_FPS;
    
    // Game state
    this.gameState = {
      ball: {
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT / 2,
        velocityX: 0,
        velocityY: 0
      },
      paddle1: {
        y: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2,
        moving: false,
        direction: null
      },
      paddle2: {
        y: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2,
        moving: false,
        direction: null
      },
      score: {
        player1: 0,
        player2: 0
      },
      gameStatus: 'waiting' // waiting, playing, paused, ended
    };

    // Start game update loop
    this.startGameLoop();
  }

  addPlayer(clientId, playerSlot, playerName) {
    if (this.players[playerSlot] !== null) {
      throw new Error(`${playerSlot} slot is already occupied`);
    }

    // Remove from spectators if they were spectating
    this.spectators.delete(clientId);

    this.players[playerSlot] = {
      id: clientId,
      name: playerName || `Player ${playerSlot === 'player1' ? '1' : '2'}`,
      connected: true,
      lastSeen: Date.now()
    };

    // Check if game should start
    this.checkGameStart();

    console.log(`🎮 ${playerName || playerSlot} joined as ${playerSlot}`);
    return this.getLobbyData();
  }

  addSpectator(clientId) {
    // Remove from players if they were playing
    this.removePlayer(clientId);
    
    this.spectators.add(clientId);
    console.log(`👥 Client ${clientId} joined as spectator`);
    return this.getLobbyData();
  }

  removePlayer(clientId) {
    let removed = false;
    
    // Check if client was a player
    Object.keys(this.players).forEach(slot => {
      if (this.players[slot] && this.players[slot].id === clientId) {
        console.log(`👤 ${this.players[slot].name} (${slot}) disconnected`);
        this.players[slot] = null;
        removed = true;
        
        // Pause game if it was in progress
        if (this.gameInProgress) {
          this.gameState.gameStatus = 'paused';
          console.log('⏸️ Game paused due to player disconnect');
        }
      }
    });

    // Remove from spectators
    this.spectators.delete(clientId);
    
    return removed;
  }

  handlePaddleMove(playerId, direction) {
    if (!this.players[playerId] || this.gameState.gameStatus !== 'playing') {
      return;
    }

    const paddle = playerId === 'player1' ? this.gameState.paddle1 : this.gameState.paddle2;
    
    if (direction === 'up' || direction === 'down') {
      paddle.moving = true;
      paddle.direction = direction;
    } else if (direction === 'stop') {
      paddle.moving = false;
      paddle.direction = null;
    }

    console.log(`🎮 ${playerId} paddle: ${direction}`);
  }

  updatePaddles() {
    // Update paddle1
    if (this.gameState.paddle1.moving && this.gameState.paddle1.direction) {
      const direction = this.gameState.paddle1.direction;
      if (direction === 'up') {
        this.gameState.paddle1.y = Math.max(0, this.gameState.paddle1.y - this.paddleSpeedPerFrame);
      } else if (direction === 'down') {
        this.gameState.paddle1.y = Math.min(GAME_HEIGHT - PADDLE_HEIGHT, this.gameState.paddle1.y + this.paddleSpeedPerFrame);
      }
    }

    // Update paddle2
    if (this.gameState.paddle2.moving && this.gameState.paddle2.direction) {
      const direction = this.gameState.paddle2.direction;
      if (direction === 'up') {
        this.gameState.paddle2.y = Math.max(0, this.gameState.paddle2.y - this.paddleSpeedPerFrame);
      } else if (direction === 'down') {
        this.gameState.paddle2.y = Math.min(GAME_HEIGHT - PADDLE_HEIGHT, this.gameState.paddle2.y + this.paddleSpeedPerFrame);
      }
    }
  }

  updateBall() {
    if (this.gameState.gameStatus !== 'playing') return;

    // Update ball position
    this.gameState.ball.x += this.gameState.ball.velocityX;
    this.gameState.ball.y += this.gameState.ball.velocityY;

    // Ball collision with top and bottom walls
    if (this.gameState.ball.y <= 0 || this.gameState.ball.y >= GAME_HEIGHT) {
      this.gameState.ball.velocityY = -this.gameState.ball.velocityY;
      this.gameState.ball.y = Math.max(0, Math.min(GAME_HEIGHT, this.gameState.ball.y));
    }

    // Ball-Paddle collision detection
    const ballSize = 10; // BALL_SIZE from constants
    const paddleWidth = 16; // PADDLE_WIDTH from constants
    
    // Left paddle (Player 1) collision
    const paddle1X = PADDLE_OFFSET;
    const paddle1Y = this.gameState.paddle1.y;
    
    if (this.gameState.ball.x - ballSize/2 <= paddle1X + paddleWidth && 
        this.gameState.ball.x + ballSize/2 >= paddle1X &&
        this.gameState.ball.y + ballSize/2 >= paddle1Y &&
        this.gameState.ball.y - ballSize/2 <= paddle1Y + PADDLE_HEIGHT &&
        this.gameState.ball.velocityX < 0) { // Only if ball is moving left
      
      // Reverse X velocity
      this.gameState.ball.velocityX = -this.gameState.ball.velocityX;
      
      // Adjust Y velocity based on where ball hit the paddle (adds spin effect)
      const hitPos = (this.gameState.ball.y - (paddle1Y + PADDLE_HEIGHT/2)) / (PADDLE_HEIGHT/2);
      this.gameState.ball.velocityY += hitPos * this.ballSpeedPerFrame * 0.3;
      
      // Keep ball outside paddle to prevent sticking
      this.gameState.ball.x = paddle1X + paddleWidth + ballSize/2;
      
      console.log('🏓 Ball hit Player 1 paddle!');
    }
    
    // Right paddle (Player 2) collision
    const paddle2X = GAME_WIDTH - PADDLE_OFFSET - paddleWidth;
    const paddle2Y = this.gameState.paddle2.y;
    
    if (this.gameState.ball.x + ballSize/2 >= paddle2X && 
        this.gameState.ball.x - ballSize/2 <= paddle2X + paddleWidth &&
        this.gameState.ball.y + ballSize/2 >= paddle2Y &&
        this.gameState.ball.y - ballSize/2 <= paddle2Y + PADDLE_HEIGHT &&
        this.gameState.ball.velocityX > 0) { // Only if ball is moving right
      
      // Reverse X velocity
      this.gameState.ball.velocityX = -this.gameState.ball.velocityX;
      
      // Adjust Y velocity based on where ball hit the paddle (adds spin effect)
      const hitPos = (this.gameState.ball.y - (paddle2Y + PADDLE_HEIGHT/2)) / (PADDLE_HEIGHT/2);
      this.gameState.ball.velocityY += hitPos * this.ballSpeedPerFrame * 0.3;
      
      // Keep ball outside paddle to prevent sticking
      this.gameState.ball.x = paddle2X - ballSize/2;
      
      console.log('🏓 Ball hit Player 2 paddle!');
    }

    // Ball goes off left or right side (scoring)
    if (this.gameState.ball.x <= 0) {
      // Player 2 scores
      this.gameState.score.player2++;
      this.resetBallPosition();
      console.log(`🎯 Player 2 scores! Score: ${this.gameState.score.player1} - ${this.gameState.score.player2}`);
    } else if (this.gameState.ball.x >= GAME_WIDTH) {
      // Player 1 scores
      this.gameState.score.player1++;
      this.resetBallPosition();
      console.log(`🎯 Player 1 scores! Score: ${this.gameState.score.player1} - ${this.gameState.score.player2}`);
    }

    // Check for win condition
    this.checkWinCondition();
  }

  resetBallPosition() {
    // Reset ball to center
    this.gameState.ball.x = GAME_WIDTH / 2;
    this.gameState.ball.y = GAME_HEIGHT / 2;
    
    // Start ball moving at 45-degree angle (randomly left or right)
    const direction = Math.random() > 0.5 ? 1 : -1; // Random direction
    this.gameState.ball.velocityX = direction * this.ballSpeedPerFrame * Math.cos(Math.PI / 4); // 45 degrees
    this.gameState.ball.velocityY = (Math.random() > 0.5 ? 1 : -1) * this.ballSpeedPerFrame * Math.sin(Math.PI / 4);
  }

  checkWinCondition() {
    const { player1, player2 } = this.gameState.score;
    const winningScore = 5;
    const minMargin = 2;
    
    if ((player1 >= winningScore || player2 >= winningScore) && Math.abs(player1 - player2) >= minMargin) {
      const winner = player1 > player2 ? 'player1' : 'player2';
      this.endGame(winner);
    }
  }

  endGame(winner) {
    this.gameState.gameStatus = 'ended';
    this.gameInProgress = false;
    console.log(`🏆 Game ended! Winner: ${winner}`);
    
    // Broadcast game over message to all clients
    const gameOverMessage = {
      type: 'GAME_OVER',
      payload: { 
        winner,
        finalScore: {
          player1: this.gameState.score.player1,
          player2: this.gameState.score.player2
        },
        winnerName: this.players[winner]?.name || winner
      }
    };
    
    // Send to all clients immediately
    this.broadcastToAllClients(gameOverMessage);
    
    // Reset game after 3 seconds
    setTimeout(() => {
      this.resetGame();
      // Broadcast lobby update after reset
      const lobbyMessage = {
        type: 'LOBBY_UPDATE',
        payload: this.getLobbyData()
      };
      this.broadcastToAllClients(lobbyMessage);
    }, 3000);
  }

  resetGame() {
    this.gameState.score = { player1: 0, player2: 0 };
    this.gameState.ball.x = GAME_WIDTH / 2;
    this.gameState.ball.y = GAME_HEIGHT / 2;
    this.gameState.ball.velocityX = 0;
    this.gameState.ball.velocityY = 0;
    this.gameState.paddle1.y = GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    this.gameState.paddle2.y = GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    this.gameState.gameStatus = 'waiting';
    this.gameInProgress = false;
    console.log('🔄 Game reset');
  }

  startGame() {
    this.gameInProgress = true;
    this.gameStartTime = Date.now();
    this.gameState.gameStatus = 'playing';
    
    // Reset game state
    this.gameState.ball.x = GAME_WIDTH / 2;
    this.gameState.ball.y = GAME_HEIGHT / 2;
    this.gameState.paddle1.y = GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    this.gameState.paddle2.y = GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    this.gameState.score = { player1: 0, player2: 0 };

    // Start ball moving at 45-degree angle to the left
    this.gameState.ball.velocityX = -this.ballSpeedPerFrame * Math.cos(Math.PI / 4); // 45 degrees to the left
    this.gameState.ball.velocityY = this.ballSpeedPerFrame * Math.sin(Math.PI / 4);

    console.log('🎮 Game started! Ball moving at 45-degree angle to the left');
  }

  checkGameStart() {
    if (this.players.player1 && this.players.player2 && !this.gameInProgress) {
      this.startGame();
    }
  }

  stopGame() {
    this.gameInProgress = false;
    this.gameState.gameStatus = 'ended';
    this.gameStartTime = null;
    console.log('🏁 Game ended');
  }

  startGameLoop() {
    setInterval(() => {
      if (this.gameState.gameStatus === 'playing') {
        this.updatePaddles();
        this.updateBall();
      }
    }, 1000 / 60); // 60 FPS
  }

  getLobbyData() {
    return {
      player1: this.players.player1,
      player2: this.players.player2,
      spectators: this.spectators.size,
      gameInProgress: this.gameInProgress
    };
  }

  getGameData() {
    return {
      ...this.gameState,
      lobbyData: this.getLobbyData()
    };
  }

  getPlayerCount() {
    let count = 0;
    if (this.players.player1) count++;
    if (this.players.player2) count++;
    return count;
  }

  getSpectatorCount() {
    return this.spectators.size;
  }

  getAllClients() {
    const clients = new Set();
    
    if (this.players.player1) clients.add(this.players.player1.id);
    if (this.players.player2) clients.add(this.players.player2.id);
    
    this.spectators.forEach(id => clients.add(id));
    
    return Array.from(clients);
  }

  // Add method to broadcast to all clients (will be called from server)
  setBroadcastFunction(broadcastFunction) {
    this.broadcastToAllClients = broadcastFunction;
  }
}

module.exports = GameRoom; 