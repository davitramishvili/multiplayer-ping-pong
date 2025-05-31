import React, { useState, useEffect } from 'react'
import Lobby from './components/Lobby'
import GameArea from './components/GameArea'
import './App.css'

function App() {
  const [currentScreen, setCurrentScreen] = useState('lobby') // lobby|game|gameOver
  const [gameState, setGameState] = useState({
    lobbyData: { player1: null, player2: null, spectators: 0, gameInProgress: false },
    gameData: { ball: {}, paddles: {}, score: {}, status: "waiting" },
    gameOverData: null,
    availableSlot: null,
    userRole: null,
    userId: null
  })
  const [ws, setWs] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('connecting')

  // WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const websocket = new WebSocket('ws://localhost:3001')
        
        websocket.onopen = () => {
          console.log('🟢 Connected to WebSocket server')
          setWs(websocket)
          setConnectionStatus('connected')
        }
        
        websocket.onmessage = (event) => {
          const data = JSON.parse(event.data)
          console.log('📨 Received:', data.type, data.payload)
          handleWebSocketMessage(data)
        }
        
        websocket.onclose = () => {
          console.log('🔴 WebSocket connection closed')
          setWs(null)
          setConnectionStatus('disconnected')
          
          // Auto-reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000)
        }
        
        websocket.onerror = (error) => {
          console.error('❌ WebSocket error:', error)
          setConnectionStatus('error')
        }
        
      } catch (error) {
        console.error('❌ Failed to connect:', error)
        setConnectionStatus('error')
        setTimeout(connectWebSocket, 3000)
      }
    }

    connectWebSocket()
    
    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [])

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'LOBBY_UPDATE':
        console.log('📊 Lobby update:', data.payload)
        setGameState(prev => ({
          ...prev,
          lobbyData: data.payload
        }))
        
        // Auto-transition to game if game in progress
        if (data.payload.gameInProgress) {
          // If we're a spectator and game is in progress, go to game view
          if (gameState.userRole === 'spectator' && currentScreen === 'lobby') {
            console.log('👥 Spectator auto-transitioning to game (lobby update)')
            setCurrentScreen('game')
          }
          // If we're a player and game is in progress, go to game view  
          else if ((gameState.userRole === 'player1' || gameState.userRole === 'player2') && currentScreen === 'lobby') {
            console.log('🎮 Player auto-transitioning to game (lobby update)')
            setCurrentScreen('game')
          }
        }
        
        // If game is not in progress and we're in game screen, go back to lobby
        if (!data.payload.gameInProgress && currentScreen === 'game') {
          console.log('🏠 Returning to lobby (game ended)')
          setCurrentScreen('lobby')
        }
        break
        
      case 'GAME_STATE':
        console.log('🎮 Game state received:', data.payload.gameStatus)
        setGameState(prev => ({
          ...prev,
          gameData: data.payload
        }))
        
        // If we receive game state while in lobby, we should probably be in game view
        if (data.payload.gameStatus === 'playing' && currentScreen === 'lobby') {
          console.log('🎮 Auto-transitioning to game view on game state')
          setCurrentScreen('game')
        }
        break
        
      case 'GAME_OVER':
        console.log('🏆 Game Over:', data.payload)
        setGameState(prev => ({
          ...prev,
          gameOverData: data.payload
        }))
        setCurrentScreen('gameOver')
        
        // Auto-return to lobby after 3 seconds
        setTimeout(() => {
          console.log('🏠 Returning to lobby after game over')
          setCurrentScreen('lobby')
        }, 3000)
        break
        
      case 'ROLE_ASSIGNED':
        console.log('🎭 Role assigned:', data.payload.role)
        setGameState(prev => ({
          ...prev,
          userRole: data.payload.role
        }))
        
        // Don't auto-transition here - let LOBBY_UPDATE and GAME_STATE handle transitions
        // This prevents conflicts and race conditions
        console.log(`👤 Role set to ${data.payload.role}, staying on current screen until next update`)
        break
        
      case 'SLOT_AVAILABLE':
        console.log('📢 Player slot available for takeover:', data.payload.slot)
        setGameState(prev => ({
          ...prev,
          availableSlot: data.payload.slot
        }))
        
        // Clear after 10 seconds
        setTimeout(() => {
          setGameState(prev => ({
            ...prev,
            availableSlot: null
          }))
        }, 10000)
        break
        
      case 'PLAYER_DISCONNECTED':
        console.log('👤 Player disconnected:', data.payload.slot)
        break
        
      default:
        console.log('❓ Unknown message type:', data.type)
    }
  }

  const sendMessage = (message) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
      console.log('📤 Sent:', message.type, message.payload)
    } else {
      console.warn('⚠️ WebSocket not connected')
    }
  }

  const joinLobby = (role) => {
    sendMessage({
      type: 'JOIN_LOBBY',
      payload: { role }
    })
    console.log(`🎯 Requesting to join as: ${role}`)
  }

  const takePlayerSlot = (slot) => {
    sendMessage({
      type: 'TAKE_PLAYER_SLOT',
      payload: { slot }
    })
  }

  return (
    <div className="App">
      {currentScreen === 'lobby' && (
        <Lobby 
          lobbyData={gameState.lobbyData}
          userRole={gameState.userRole}
          connectionStatus={connectionStatus}
          availableSlot={gameState.availableSlot}
          onJoinLobby={joinLobby}
          onTakePlayerSlot={takePlayerSlot}
        />
      )}
      
      {currentScreen === 'game' && (
        <GameArea 
          gameData={gameState.gameData}
          lobbyData={gameState.lobbyData}
          userRole={gameState.userRole}
          onSendMessage={sendMessage}
          onTakePlayerSlot={takePlayerSlot}
        />
      )}
      
      {currentScreen === 'gameOver' && (
        <div className="game-over">
          <h1>🏆 Game Over!</h1>
          {gameState.gameOverData && (
            <>
              <h2>{gameState.gameOverData.winnerName} Wins!</h2>
              <p className="final-score">
                Final Score: {gameState.gameOverData.finalScore.player1} - {gameState.gameOverData.finalScore.player2}
              </p>
            </>
          )}
          <p>Returning to lobby...</p>
        </div>
      )}
    </div>
  )
}

export default App 