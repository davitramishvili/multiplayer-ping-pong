import React, { useState, useEffect } from 'react'
import Lobby from './components/Lobby'
import GameArea from './components/GameArea'
import './App.css'

function App() {
  const [currentScreen, setCurrentScreen] = useState('lobby') // lobby|game|gameOver
  const [gameState, setGameState] = useState({
    lobbyData: { player1: null, player2: null, spectators: 0, gameInProgress: false },
    gameData: { ball: {}, paddles: {}, score: {}, status: "waiting" },
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
        setGameState(prev => ({
          ...prev,
          lobbyData: data.payload
        }))
        
        // Auto-transition to game if both players are ready and game in progress
        if (data.payload.gameInProgress && currentScreen === 'lobby') {
          setCurrentScreen('game')
        }
        break
        
      case 'GAME_STATE':
        setGameState(prev => ({
          ...prev,
          gameData: data.payload
        }))
        break
        
      case 'GAME_OVER':
        setCurrentScreen('gameOver')
        setTimeout(() => {
          setCurrentScreen('lobby')
        }, 3000)
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
    setGameState(prev => ({ ...prev, userRole: role }))
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
          <p>Returning to lobby...</p>
        </div>
      )}
    </div>
  )
}

export default App 