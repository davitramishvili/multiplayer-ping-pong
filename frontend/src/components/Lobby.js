import React from 'react';

function Lobby({ lobbyData, userRole, onJoinLobby, onTakePlayerSlot }) {
  return (
    <div className="lobby">
      <h1>Multiplayer Ping Pong</h1>
      <p>Lobby component - to be implemented</p>
      <p>Player 1: {lobbyData.player1 ? lobbyData.player1.name : 'Empty'}</p>
      <p>Player 2: {lobbyData.player2 ? lobbyData.player2.name : 'Empty'}</p>
      <p>Spectators: {lobbyData.spectators}</p>
      <p>Your role: {userRole || 'None'}</p>
      
      <div>
        <button onClick={() => onJoinLobby('player1')}>Join as Player 1</button>
        <button onClick={() => onJoinLobby('player2')}>Join as Player 2</button>
        <button onClick={() => onJoinLobby('spectator')}>Join as Spectator</button>
      </div>
    </div>
  );
}

export default Lobby; 