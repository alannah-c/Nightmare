import { useGame } from '../../context/GameContext.jsx';
import { socket } from '../../services/socket.js';
import './PlayerPanel.css';

export function PlayerPanel() {
  const game = useGame();
  const localPlayer = game.players.find((p) => p.id === game.localPlayerId);
  const isMyTurn = game.currentTurnPlayerId === game.localPlayerId;

  if (!localPlayer) return null;

  function rollDice() {
    socket.emit('game:rollDice', { roomId: game.roomId }, (res) => {
      if (res.success) {
        // After rolling, move the piece
        socket.emit('game:movePiece', { roomId: game.roomId, steps: res.roll });
      }
    });
  }

  function endTurn() {
    socket.emit('game:endTurn', { roomId: game.roomId });
  }

  function flipCoin() {
    socket.emit('game:flipCoin', { roomId: game.roomId });
  }

  function attemptNightmare() {
    socket.emit('game:attemptNightmare', { roomId: game.roomId });
  }

  function playCard(cardId) {
    socket.emit('game:playCard', { roomId: game.roomId, cardId });
  }

  return (
    <div className="player-panel">
      <div className="player-info">
        <div
          className="player-color-dot"
          style={{ background: localPlayer.character?.color || '#666' }}
        />
        <div>
          <div className="player-name">{localPlayer.name}</div>
          <div className="player-character">
            {localPlayer.character?.name} — {localPlayer.character?.description}
          </div>
          <div className="player-number">#{localPlayer.numberToken}</div>
        </div>
      </div>

      <div className="player-keys">
        {[...Array(6)].map((_, i) => (
          <span key={i} className={`key ${i < localPlayer.keyCount ? 'key-held' : ''}`}>
            🗝
          </span>
        ))}
        <span className="key-count">{localPlayer.keyCount}/6</span>
      </div>

      {localPlayer.inBlackHole && (
        <div className="player-status banished">BANISHED TO THE BLACK HOLE</div>
      )}

      <div className="player-actions">
        {isMyTurn && !localPlayer.inBlackHole && !localPlayer.onNightmareSquare && (
          <button className="btn btn-primary" onClick={rollDice}>Roll Dice</button>
        )}
        {isMyTurn && localPlayer.onNightmareSquare && (
          <button className="btn btn-primary" onClick={attemptNightmare}>
            Attempt NIGHTMARE
          </button>
        )}
        {isMyTurn && (
          <button className="btn btn-secondary" onClick={endTurn}>End Turn</button>
        )}
        <button className="btn btn-secondary" onClick={flipCoin}>Flip Coin</button>
      </div>

      <div className="player-hand">
        <h4>Your Cards</h4>
        <div className="card-groups">
          {game.hand.time.length > 0 && (
            <div className="card-group">
              <div className="card-group-label">Time ({game.hand.time.length})</div>
              {game.hand.time.map((card) => (
                <div key={`t${card.id}`} className="card card-time" onClick={() => playCard(card.id)}>
                  <span className="card-text">{card.text}</span>
                </div>
              ))}
            </div>
          )}
          {game.hand.fate.length > 0 && (
            <div className="card-group">
              <div className="card-group-label">Fate ({game.hand.fate.length})</div>
              {game.hand.fate.map((card) => (
                <div key={`f${card.id}`} className="card card-fate" onClick={() => playCard(card.id)}>
                  <span className="card-text">{card.text}</span>
                </div>
              ))}
            </div>
          )}
          {game.hand.chance.length > 0 && (
            <div className="card-group">
              <div className="card-group-label">Chance ({game.hand.chance.length})</div>
              {game.hand.chance.map((card) => (
                <div key={`c${card.id}`} className="card card-chance" onClick={() => playCard(card.id)}>
                  <span className="card-text">{card.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {game.hand.keyHalves.front > 0 && <div className="key-half">Key Half: FRONT END x{game.hand.keyHalves.front}</div>}
        {game.hand.keyHalves.back > 0 && <div className="key-half">Key Half: BACK END x{game.hand.keyHalves.back}</div>}
      </div>
    </div>
  );
}
