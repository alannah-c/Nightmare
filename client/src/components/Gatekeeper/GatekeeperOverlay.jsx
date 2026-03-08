import { useGame } from '../../context/GameContext.jsx';
import { socket } from '../../services/socket.js';
import './GatekeeperOverlay.css';

export function GatekeeperOverlay() {
  const game = useGame();
  const isHost = game.hostId === game.localPlayerId;

  if (!game.gatekeeperActive) return null;

  function dismiss() {
    socket.emit('game:gatekeeperActive', { roomId: game.roomId, active: false });
  }

  return (
    <div className="gatekeeper-overlay">
      <div className="gatekeeper-content">
        <h2>THE GATEKEEPER</h2>
        <p>All players must stop! Answer when spoken to…</p>
        <p className="gatekeeper-instruction">YES, MY GATEKEEPER</p>
        {isHost && (
          <button className="btn btn-primary" onClick={dismiss}>
            Gatekeeper has finished
          </button>
        )}
      </div>
    </div>
  );
}
