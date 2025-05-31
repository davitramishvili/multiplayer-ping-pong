import React from 'react'
import { PADDLE_WIDTH, PADDLE_HEIGHT, COLORS } from '../utils/gameConstants'

function Paddle({ x, y, isHighlighted = false, player = 'player1' }) {
  const getPlayerColor = () => {
    switch (player) {
      case 'player1': return COLORS.PLAYER1
      case 'player2': return COLORS.PLAYER2
      default: return COLORS.FOREGROUND
    }
  }

  return (
    <div 
      className={`paddle ${isHighlighted ? 'highlighted' : ''} ${player}`}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        backgroundColor: isHighlighted ? getPlayerColor() : COLORS.FOREGROUND,
        borderRadius: '3px',
        boxShadow: isHighlighted 
          ? `0 0 15px ${getPlayerColor()}, 0 0 30px ${getPlayerColor()}` 
          : `0 0 5px ${COLORS.FOREGROUND}`,
        transition: 'all 0.1s ease',
        zIndex: 5
      }}
    />
  )
}

export default Paddle 