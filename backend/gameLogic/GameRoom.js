class GameRoom {
  constructor() {
    this.players = { player1: null, player2: null };
    this.spectators = new Set();
    this.gameState = {
      ball: { x: 400, y: 300, velocityX: 200, velocityY: 200, speed: 200 },
      paddles: {
        player1: { y: 250, moving: false, direction: null },
        player2: { y: 250, moving: false, direction: null }
      },
      score: { player1: 0, player2: 0 },
      status: "waiting" // waiting|playing|paused|ended
    };
    this.gameLoop = null;
  }

  // Add player to room
  addPlayer(playerId, playerName, role) {
    if (role === 'player1' && !this.players.player1) {
      this.players.player1 = { id: playerId, name: playerName };
      return true;
    } else if (role === 'player2' && !this.players.player2) {
      this.players.player2 = { id: playerId, name: playerName };
      return true;
    }
    return false;
  }

  // Add spectator to room
  addSpectator(playerId) {
    this.spectators.add(playerId);
  }

  // Remove player from room
  removePlayer(playerId) {
    if (this.players.player1 && this.players.player1.id === playerId) {
      this.players.player1 = null;
      return 'player1';
    } else if (this.players.player2 && this.players.player2.id === playerId) {
      this.players.player2 = null;
      return 'player2';
    }
    return null;
  }

  // Remove spectator from room
  removeSpectator(playerId) {
    this.spectators.delete(playerId);
  }

  // Check if game can start
  canStartGame() {
    return this.players.player1 && this.players.player2;
  }

  // Start game
  startGame() {
    if (this.canStartGame()) {
      this.gameState.status = 'playing';
      this.resetBall();
      return true;
    }
    return false;
  }

  // Pause game
  pauseGame() {
    this.gameState.status = 'paused';
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
  }

  // Resume game
  resumeGame() {
    if (this.canStartGame()) {
      this.gameState.status = 'playing';
      return true;
    }
    return false;
  }

  // End game
  endGame() {
    this.gameState.status = 'ended';
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
  }

  // Reset ball to center
  resetBall() {
    this.gameState.ball = {
      x: 400,
      y: 300,
      velocityX: Math.random() > 0.5 ? 200 : -200,
      velocityY: (Math.random() - 0.5) * 200,
      speed: 200
    };
  }

  // Reset game state
  resetGame() {
    this.gameState.score = { player1: 0, player2: 0 };
    this.gameState.paddles = {
      player1: { y: 250, moving: false, direction: null },
      player2: { y: 250, moving: false, direction: null }
    };
    this.resetBall();
    this.gameState.status = 'waiting';
  }

  // Get current game state
  getGameState() {
    return {
      ball: this.gameState.ball,
      paddle1: this.gameState.paddles.player1,
      paddle2: this.gameState.paddles.player2,
      score: this.gameState.score,
      gameStatus: this.gameState.status
    };
  }
}

module.exports = GameRoom; 