import React from 'react'
import './GameArea.css'

function GameArea({ gameData, lobbyData, userRole, onSendMessage, onTakePlayerSlot }) {
  return (
    <div className="game-area">
      <div className="game-container">
        <h2>🎮 Game Area</h2>
        <p>Game component - to be implemented in next phases</p>
        <div className="game-info">
          <p><strong>Game Status:</strong> {gameData.gameStatus || 'Loading...'}</p>
          <p><strong>Your Role:</strong> {userRole}</p>
          <p><strong>Players:</strong> {lobbyData.player1?.name || 'Empty'} vs {lobbyData.player2?.name || 'Empty'}</p>
          <p><strong>Spectators:</strong> {lobbyData.spectators}</p>
        </div>
        
        <div className="placeholder-game-area">
          <div className="placeholder-text">
            🏓 Game rendering will be implemented in the next phase
          </div>
        </div>
      </div>
    </div>
  )
}

export default GameArea 