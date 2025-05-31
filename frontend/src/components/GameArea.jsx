import React, { useState, useEffect, useCallback } from 'react'
import Ball from './Ball'
import Paddle from './Paddle'
import { GAME_WIDTH, GAME_HEIGHT, PADDLE_OFFSET, PADDLE_HEIGHT, CONTROLS, COLORS } from '../utils/gameConstants'
import './GameArea.css'

function GameArea({ gameData, lobbyData, userRole, onSendMessage, onTakePlayerSlot }) {
  const [keyPressed, setKeyPressed] = useState(new Set())
  const [gameAreaRef, setGameAreaRef] = useState(null)

  // Default game state
  const defaultGameState = {
    ball: { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 },
    paddle1: { y: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2, moving: false },
    paddle2: { y: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2, moving: false },
    score: { player1: 0, player2: 0 },
    gameStatus: 'waiting'
  }

  const currentGameState = { ...defaultGameState, ...gameData }

  // Keyboard event handlers
  const handleKeyDown = useCallback((event) => {
    const code = event.code
    if (Object.values(CONTROLS.PLAYER1).includes(code) || Object.values(CONTROLS.PLAYER2).includes(code)) {
      event.preventDefault()
      
      if (!keyPressed.has(code)) {
        setKeyPressed(prev => new Set([...prev, code]))
        
        // Send paddle movement to server
        let direction = null
        let playerId = null
        
        if (code === CONTROLS.PLAYER1.UP || code === CONTROLS.PLAYER1.DOWN) {
          playerId = 'player1'
          direction = code === CONTROLS.PLAYER1.UP ? 'up' : 'down'
        } else if (code === CONTROLS.PLAYER2.UP || code === CONTROLS.PLAYER2.DOWN) {
          playerId = 'player2'
          direction = code === CONTROLS.PLAYER2.UP ? 'up' : 'down'
        }
        
        if (direction && playerId && userRole === playerId) {
          onSendMessage({
            type: 'PADDLE_MOVE',
            payload: { direction, playerId }
          })
        }
      }
    }
  }, [keyPressed, userRole, onSendMessage])

  const handleKeyUp = useCallback((event) => {
    const code = event.code
    if (Object.values(CONTROLS.PLAYER1).includes(code) || Object.values(CONTROLS.PLAYER2).includes(code)) {
      event.preventDefault()
      
      setKeyPressed(prev => {
        const newSet = new Set(prev)
        newSet.delete(code)
        return newSet
      })
      
      // Send stop movement to server
      let playerId = null
      
      if (code === CONTROLS.PLAYER1.UP || code === CONTROLS.PLAYER1.DOWN) {
        playerId = 'player1'
      } else if (code === CONTROLS.PLAYER2.UP || code === CONTROLS.PLAYER2.DOWN) {
        playerId = 'player2'
      }
      
      if (playerId && userRole === playerId) {
        onSendMessage({
          type: 'PADDLE_MOVE',
          payload: { direction: 'stop', playerId }
        })
      }
    }
  }, [userRole, onSendMessage])

  // Set up keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  // Calculate paddle positions
  const paddle1X = PADDLE_OFFSET
  const paddle2X = GAME_WIDTH - PADDLE_OFFSET - 16 // 16 is PADDLE_WIDTH

  // Check if paddles are highlighted (keys pressed)
  const isPaddle1Highlighted = keyPressed.has(CONTROLS.PLAYER1.UP) || keyPressed.has(CONTROLS.PLAYER1.DOWN)
  const isPaddle2Highlighted = keyPressed.has(CONTROLS.PLAYER2.UP) || keyPressed.has(CONTROLS.PLAYER2.DOWN)

  // Generate center line dots
  const centerLineDots = []
  const dotCount = 20
  const dotSpacing = GAME_HEIGHT / dotCount
  
  for (let i = 0; i < dotCount; i++) {
    if (i % 2 === 0) { // Only show every other dot for dashed effect
      centerLineDots.push(
        <div
          key={i}
          className="center-line-dot"
          style={{
            position: 'absolute',
            left: GAME_WIDTH / 2 - 1,
            top: i * dotSpacing,
            width: 2,
            height: dotSpacing * 0.6,
            backgroundColor: COLORS.CENTER_LINE,
            borderRadius: '1px'
          }}
        />
      )
    }
  }

  return (
    <div className="game-area">
      <div className="game-container">
        {/* Game Header */}
        <div className="game-header">
          <h2 className="game-title">🏓 Ping Pong Game</h2>
          
          {/* Score Display */}
          <div className="score-display">
            <div className="player-score">
              <span className="player-name">{lobbyData.player1?.name || 'Player 1'}</span>
              <span className="score">{currentGameState.score.player1}</span>
            </div>
            <div className="score-divider">-</div>
            <div className="player-score">
              <span className="score">{currentGameState.score.player2}</span>
              <span className="player-name">{lobbyData.player2?.name || 'Player 2'}</span>
            </div>
          </div>

          {/* Game Status */}
          <div className="game-status-info">
            <span className={`status ${currentGameState.gameStatus}`}>
              {currentGameState.gameStatus === 'playing' && '🎮 Playing'}
              {currentGameState.gameStatus === 'waiting' && '⏳ Waiting for Players'}
              {currentGameState.gameStatus === 'paused' && '⏸️ Paused'}
              {currentGameState.gameStatus === 'ended' && '🏆 Game Over'}
            </span>
          </div>
        </div>

        {/* Game Area */}
        <div 
          className="game-field"
          ref={setGameAreaRef}
          style={{
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            position: 'relative',
            backgroundColor: COLORS.BACKGROUND,
            border: `2px solid ${COLORS.FOREGROUND}`,
            borderRadius: '5px',
            margin: '0 auto',
            overflow: 'hidden'
          }}
        >
          {/* Center Line */}
          {centerLineDots}

          {/* Player 1 Paddle */}
          <Paddle
            x={paddle1X}
            y={currentGameState.paddle1.y}
            isHighlighted={isPaddle1Highlighted && userRole === 'player1'}
            player="player1"
          />

          {/* Player 2 Paddle */}
          <Paddle
            x={paddle2X}
            y={currentGameState.paddle2.y}
            isHighlighted={isPaddle2Highlighted && userRole === 'player2'}
            player="player2"
          />

          {/* Ball */}
          <Ball
            x={currentGameState.ball.x}
            y={currentGameState.ball.y}
          />
        </div>

        {/* Controls Display */}
        <div className="controls-display">
          <div className="control-section">
            <h4>Player 1 Controls</h4>
            <div className="control-keys">
              <span className={`key ${keyPressed.has('KeyW') ? 'pressed' : ''}`}>W</span>
              <span className="key-label">Up</span>
              <span className={`key ${keyPressed.has('KeyS') ? 'pressed' : ''}`}>S</span>
              <span className="key-label">Down</span>
            </div>
          </div>

          <div className="control-section">
            <h4>Player 2 Controls</h4>
            <div className="control-keys">
              <span className={`key ${keyPressed.has('ArrowUp') ? 'pressed' : ''}`}>↑</span>
              <span className="key-label">Up</span>
              <span className={`key ${keyPressed.has('ArrowDown') ? 'pressed' : ''}`}>↓</span>
              <span className="key-label">Down</span>
            </div>
          </div>
        </div>

        {/* Player Info */}
        <div className="player-info">
          <div className="info-item">
            <strong>Your Role:</strong> 
            <span className={`role-badge ${userRole}`}>
              {userRole === 'player1' && '👤 Player 1'}
              {userRole === 'player2' && '👤 Player 2'}
              {userRole === 'spectator' && '👥 Spectator'}
            </span>
          </div>
          <div className="info-item">
            <strong>Spectators:</strong> {lobbyData.spectators}
          </div>
        </div>

        {/* Spectator takeover buttons */}
        {userRole === 'spectator' && (
          <div className="spectator-controls">
            <h4>Take Control</h4>
            <div className="takeover-buttons">
              {!lobbyData.player1 && (
                <button 
                  className="takeover-button player1"
                  onClick={() => onTakePlayerSlot('player1')}
                >
                  Take Player 1 Slot
                </button>
              )}
              {!lobbyData.player2 && (
                <button 
                  className="takeover-button player2"
                  onClick={() => onTakePlayerSlot('player2')}
                >
                  Take Player 2 Slot
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GameArea 