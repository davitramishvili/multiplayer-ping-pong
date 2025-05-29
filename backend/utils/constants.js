// Game area dimensions
const GAME_WIDTH = 800;
const GAME_HEIGHT = 450; // 16:9 aspect ratio

// Paddle configuration
const PADDLE_WIDTH = GAME_WIDTH * 0.02; // 2% of game area width
const PADDLE_HEIGHT = GAME_HEIGHT * 0.15; // 15% of game area height
const PADDLE_SPEED = 300; // pixels per second
const PADDLE_OFFSET = GAME_WIDTH * 0.05; // 5% from edges

// Ball configuration
const INITIAL_BALL_SPEED = 200; // pixels per second
const MAX_BALL_SPEED = 400; // maximum ball speed
const BALL_SPEED_INCREASE = 0.05; // 5% increase per paddle hit
const BALL_SIZE = 10;

// Game rules
const WINNING_SCORE = 5;
const WIN_BY_MARGIN = 2;

// Server configuration
const GAME_LOOP_FPS = 60;
const GAME_LOOP_INTERVAL = 1000 / GAME_LOOP_FPS; // 16.67ms for 60 FPS

// WebSocket message rate limiting
const MAX_MESSAGES_PER_SECOND = 120;

module.exports = {
  GAME_WIDTH,
  GAME_HEIGHT,
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_SPEED,
  PADDLE_OFFSET,
  INITIAL_BALL_SPEED,
  MAX_BALL_SPEED,
  BALL_SPEED_INCREASE,
  BALL_SIZE,
  WINNING_SCORE,
  WIN_BY_MARGIN,
  GAME_LOOP_FPS,
  GAME_LOOP_INTERVAL,
  MAX_MESSAGES_PER_SECOND
}; 