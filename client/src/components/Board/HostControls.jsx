import { useState } from 'react';
import { useGame } from '../../context/GameContext.jsx';
import { socket } from '../../services/socket.js';
import './HostControls.css';

export function HostControls() {
  const game = useGame();
  const [expanded, setExpanded] = useState(false);

  if (game.hostId !== game.localPlayerId) return null;

  function assignChosenOne(playerId) {
    socket.emit('game:assignChosenOne', { roomId: game.roomId, playerId });
  }

  function releaseAll() {
    socket.emit('game:releaseAllFromBlackHole', { roomId: game.roomId });
  }

  function giveKeyTo(playerId) {
    socket.emit('game:giveKey', { roomId: game.roomId, playerId, count: 1 });
  }

  function banishPlayer(playerId) {
    socket.emit('game:banishPlayer', { roomId: game.roomId, playerId });
  }

  function releasePlayer(playerId) {
    socket.emit('game:releasePlayer', { roomId: game.roomId, playerId });
  }

  function returnToGravestone(playerId) {
    socket.emit('game:returnToGravestone', { roomId: game.roomId, playerId });
  }

  return (
    <div className="host-controls">
      <button
        className="btn btn-secondary btn-small"
        onClick={() => setExpanded(!expanded)}
      >
        Host Controls {expanded ? '▲' : '▼'}
      </button>

      {expanded && (
        <div className="host-panel">
          <button className="btn btn-secondary btn-small" onClick={releaseAll}>
            Release All from Black Hole
          </button>

          <div className="host-player-actions">
            {game.players.filter(p => !p.isEliminated).map((p) => (
              <div key={p.id} className="host-player-row">
                <span className="host-player-name">{p.name}</span>
                <div className="host-btns">
                  <button onClick={() => assignChosenOne(p.id)} title="Assign Chosen One">C</button>
                  <button onClick={() => giveKeyTo(p.id)} title="Give Key">+K</button>
                  <button onClick={() => banishPlayer(p.id)} title="Banish">BH</button>
                  {p.inBlackHole && (
                    <button onClick={() => releasePlayer(p.id)} title="Release">R</button>
                  )}
                  <button onClick={() => returnToGravestone(p.id)} title="Return to Gravestone">GS</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
