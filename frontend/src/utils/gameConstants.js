// Game area dimensions
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 450; // 16:9 aspect ratio

// Paddle configuration
export const PADDLE_WIDTH = GAME_WIDTH * 0.02; // 2% of game area width
export const PADDLE_HEIGHT = GAME_HEIGHT * 0.15; // 15% of game area height
export const PADDLE_OFFSET = GAME_WIDTH * 0.05; // 5% from edges

// Ball configuration
export const BALL_SIZE = 10;

// Game rules
export const WINNING_SCORE = 5;
export const WIN_BY_MARGIN = 2;

// Controls
export const CONTROLS = {
  PLAYER1: {
    UP: 'KeyW',
    DOWN: 'KeyS'
  },
  PLAYER2: {
    UP: 'ArrowUp',
    DOWN: 'ArrowDown'
  }
};

// Visual styling
export const COLORS = {
  BACKGROUND: '#000',
  FOREGROUND: '#fff',
  PLAYER1: '#0f0',
  PLAYER2: '#00f',
  SPECTATOR: '#ff0',
  CENTER_LINE: '#666'
};

// Animation settings
export const GAME_FPS = 60;
export const ANIMATION_SPEED = 1000 / GAME_FPS; // 16.67ms 