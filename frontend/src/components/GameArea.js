import React from 'react';

function GameArea({ gameData, lobbyData, userRole, onSendMessage, onTakePlayerSlot }) {
  return (
    <div className="game-area">
      <h2>Game Area</h2>
      <p>Game component - to be implemented</p>
      <p>Game Status: {gameData.gameStatus}</p>
      <p>Your role: {userRole}</p>
      <p>Players: {lobbyData.player1?.name || 'Empty'} vs {lobbyData.player2?.name || 'Empty'}</p>
      <p>Spectators: {lobbyData.spectators}</p>
    </div>
  );
}

export default GameArea; 