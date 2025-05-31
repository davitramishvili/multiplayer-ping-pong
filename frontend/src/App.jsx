import React, { useState } from 'react'

function App() {
  const [message, setMessage] = useState('Hello from React!')

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      textAlign: 'center'
    }}>
      <h1>🏓 Multiplayer Ping Pong</h1>
      <p>{message}</p>
      <button 
        onClick={() => setMessage('React is working!')}
        style={{
          background: '#000',
          color: '#fff',
          border: '2px solid #fff',
          padding: '10px 20px',
          cursor: 'pointer',
          fontFamily: 'inherit'
        }}
      >
        Click me to test React!
      </button>
    </div>
  )
}

export default App 