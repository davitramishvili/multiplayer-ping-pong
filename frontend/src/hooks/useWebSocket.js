import { useState, useEffect, useCallback, useRef } from 'react'

function useWebSocket(url, onMessage) {
  const [ws, setWs] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  const connectWebSocket = useCallback(() => {
    try {
      console.log('🔄 Attempting to connect to WebSocket...')
      const websocket = new WebSocket(url)
      
      websocket.onopen = () => {
        console.log('🟢 Connected to WebSocket server')
        setWs(websocket)
        setConnectionStatus('connected')
        reconnectAttemptsRef.current = 0 // Reset reconnect attempts on successful connection
      }
      
      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📨 Received:', data.type, data.payload)
          if (onMessage) {
            onMessage(data)
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error)
        }
      }
      
      websocket.onclose = (event) => {
        console.log('🔴 WebSocket connection closed', event.code, event.reason)
        setWs(null)
        setConnectionStatus('disconnected')
        
        // Auto-reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000) // Max 30 seconds
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1
            connectWebSocket()
          }, delay)
        } else {
          console.error('❌ Max reconnection attempts reached')
          setConnectionStatus('error')
        }
      }
      
      websocket.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        setConnectionStatus('error')
      }
      
    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error)
      setConnectionStatus('error')
      
      // Retry connection
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = Math.min(3000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current += 1
          connectWebSocket()
        }, delay)
      }
    }
  }, [url, onMessage])

  const sendMessage = useCallback((message) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
      console.log('📤 Sent:', message.type, message.payload)
      return true
    } else {
      console.warn('⚠️ WebSocket not connected, message not sent:', message.type)
      return false
    }
  }, [ws])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (ws) {
      ws.close()
      setWs(null)
    }
    
    setConnectionStatus('disconnected')
  }, [ws])

  const reconnect = useCallback(() => {
    disconnect()
    reconnectAttemptsRef.current = 0
    setConnectionStatus('connecting')
    connectWebSocket()
  }, [disconnect, connectWebSocket])

  // Initialize connection
  useEffect(() => {
    connectWebSocket()
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (ws) {
        ws.close()
      }
    }
  }, [connectWebSocket])

  return {
    ws,
    connectionStatus,
    sendMessage,
    disconnect,
    reconnect,
    isConnected: connectionStatus === 'connected'
  }
}

export default useWebSocket 