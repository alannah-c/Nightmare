import { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext.jsx';
import { socket } from '../../services/socket.js';
import './ScreamOverlay.css';

export function ScreamOverlay() {
  const game = useGame();
  const [voted, setVoted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const scream = game.screamVote;
  const isInitiator = scream?.initiatorId === game.localPlayerId;

  useEffect(() => {
    if (!scream) {
      setVoted(false);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - scream.startedAt;
      const remaining = Math.max(0, scream.durationMs - elapsed);
      setTimeLeft(Math.ceil(remaining / 1000));
    }, 100);

    return () => clearInterval(interval);
  }, [scream]);

  if (!scream) return null;

  function vote(isScared) {
    socket.emit('game:screamVote', { roomId: game.roomId, isScared });
    setVoted(true);
  }

  return (
    <div className="scream-overlay">
      <div className="scream-content">
        <h2 className="scream-title">SCREAM!</h2>
        <p className="scream-timer">{timeLeft}s</p>

        {isInitiator ? (
          <p>Waiting for responses…</p>
        ) : voted ? (
          <p>Vote submitted!</p>
        ) : (
          <div className="scream-buttons">
            <button className="btn btn-scared" onClick={() => vote(true)}>
              Scared!
            </button>
            <button className="btn btn-not-scared" onClick={() => vote(false)}>
              Not scared!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
