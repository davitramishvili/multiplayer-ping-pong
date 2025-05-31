import React from 'react'
import { BALL_SIZE, COLORS } from '../utils/gameConstants'

function Ball({ x = 400, y = 225 }) {
  return (
    <div 
      className="ball"
      style={{
        position: 'absolute',
        left: x - BALL_SIZE / 2,
        top: y - BALL_SIZE / 2,
        width: BALL_SIZE,
        height: BALL_SIZE,
        backgroundColor: COLORS.FOREGROUND,
        borderRadius: '50%',
        boxShadow: `0 0 10px ${COLORS.FOREGROUND}`,
        transition: 'all 0.016s linear', // Smooth movement
        zIndex: 10
      }}
    />
  )
}

export default Ball 