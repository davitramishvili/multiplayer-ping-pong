import React from 'react'
import './Lobby.css'

function Lobby({ lobbyData, userRole, connectionStatus, onJoinLobby, onTakePlayerSlot }) {
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#0f0'
      case 'connecting': return '#ff0'
      case 'disconnected': return '#f00'
      case 'error': return '#f00'
      default: return '#fff'
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return '🟢 Connected'
      case 'connecting': return '🟡 Connecting...'
      case 'disconnected': return '🔴 Disconnected'
      case 'error': return '❌ Connection Error'
      default: return '⚪ Unknown'
    }
  }

  const canJoinAsPlayer1 = !lobbyData.player1 && userRole !== 'player1'
  const canJoinAsPlayer2 = !lobbyData.player2 && userRole !== 'player2'
  const canJoinAsSpectator = userRole !== 'spectator'

  return (
    <div className="lobby">
      <div className="lobby-container">
        {/* Header */}
        <div className="lobby-header">
          <h1 className="lobby-title">
            <span className="ping-pong-emoji">🏓</span>
            Multiplayer Ping Pong
          </h1>
          <div className="connection-status" style={{ color: getConnectionStatusColor() }}>
            {getConnectionStatusText()}
          </div>
        </div>

        {/* Game Status */}
        <div className="game-status">
          <h2>Game Status</h2>
          <div className="status-info">
            {lobbyData.gameInProgress ? (
              <div className="status-playing">🎮 Game in Progress</div>
            ) : (
              <div className="status-waiting">⏳ Waiting for Players</div>
            )}
          </div>
        </div>

        {/* Players Section */}
        <div className="players-section">
          <h2>Players</h2>
          <div className="players-grid">
            {/* Player 1 Slot */}
            <div className={`player-slot ${lobbyData.player1 ? 'occupied' : 'empty'}`}>
              <div className="player-header">
                <span className="player-icon">👤</span>
                <span className="player-label">Player 1</span>
              </div>
              <div className="player-info">
                {lobbyData.player1 ? (
                  <div className="player-name">{lobbyData.player1.name}</div>
                ) : (
                  <div className="empty-slot">Empty</div>
                )}
              </div>
              {canJoinAsPlayer1 && connectionStatus === 'connected' && (
                <button 
                  className="join-button player1-button"
                  onClick={() => onJoinLobby('player1')}
                >
                  Join as Player 1
                </button>
              )}
            </div>

            {/* VS Divider */}
            <div className="vs-divider">
              <span className="vs-text">VS</span>
            </div>

            {/* Player 2 Slot */}
            <div className={`player-slot ${lobbyData.player2 ? 'occupied' : 'empty'}`}>
              <div className="player-header">
                <span className="player-icon">👤</span>
                <span className="player-label">Player 2</span>
              </div>
              <div className="player-info">
                {lobbyData.player2 ? (
                  <div className="player-name">{lobbyData.player2.name}</div>
                ) : (
                  <div className="empty-slot">Empty</div>
                )}
              </div>
              {canJoinAsPlayer2 && connectionStatus === 'connected' && (
                <button 
                  className="join-button player2-button"
                  onClick={() => onJoinLobby('player2')}
                >
                  Join as Player 2
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Spectators Section */}
        <div className="spectators-section">
          <h2>Spectators</h2>
          <div className="spectators-info">
            <span className="spectator-icon">👥</span>
            <span className="spectator-count">{lobbyData.spectators} watching</span>
          </div>
          {canJoinAsSpectator && connectionStatus === 'connected' && (
            <button 
              className="join-button spectator-button"
              onClick={() => onJoinLobby('spectator')}
            >
              Join as Spectator
            </button>
          )}
        </div>

        {/* Current Role */}
        {userRole && (
          <div className="current-role">
            <h3>Your Role</h3>
            <div className={`role-badge ${userRole}`}>
              {userRole === 'player1' && '👤 Player 1'}
              {userRole === 'player2' && '👤 Player 2'}
              {userRole === 'spectator' && '👥 Spectator'}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="instructions">
          <h3>How to Play</h3>
          <div className="instruction-list">
            <div className="instruction-item">
              <span className="instruction-icon">🎮</span>
              <span>Join as Player 1 or Player 2 to play</span>
            </div>
            <div className="instruction-item">
              <span className="instruction-icon">👥</span>
              <span>Join as Spectator to watch</span>
            </div>
            <div className="instruction-item">
              <span className="instruction-icon">⚡</span>
              <span>Game starts when both players join</span>
            </div>
          </div>
        </div>

        {/* Connection Error Message */}
        {connectionStatus !== 'connected' && (
          <div className="connection-error">
            {connectionStatus === 'connecting' && (
              <p>🔄 Connecting to server...</p>
            )}
            {(connectionStatus === 'disconnected' || connectionStatus === 'error') && (
              <p>⚠️ Unable to connect to server. Make sure the backend is running on port 3001.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Lobby 