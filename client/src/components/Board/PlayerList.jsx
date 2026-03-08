import { useGame } from '../../context/GameContext.jsx';
import './PlayerList.css';

export function PlayerList() {
  const game = useGame();

  return (
    <div className="player-list">
      {game.players.map((p) => {
        const isCurrent = p.id === game.currentTurnPlayerId;
        const isLocal = p.id === game.localPlayerId;
        const isChosenOne = p.id === game.chosenOneId;

        return (
          <div
            key={p.id}
            className={`player-list-item ${isCurrent ? 'active-turn' : ''} ${p.inBlackHole ? 'in-black-hole' : ''} ${p.isEliminated ? 'eliminated' : ''}`}
          >
            <div
              className="player-list-dot"
              style={{ background: p.character?.color || '#444' }}
            />
            <div className="player-list-info">
              <div className="player-list-name">
                {p.name}
                {isLocal && ' (You)'}
                {isChosenOne && ' [Chosen One]'}
              </div>
              <div className="player-list-meta">
                {p.character?.name} #{p.numberToken} — {p.keyCount}/6 keys
                {p.inBlackHole && ' — BLACK HOLE'}
                {p.isEliminated && ' — ELIMINATED'}
              </div>
            </div>
            {isCurrent && <div className="turn-indicator">▶</div>}
          </div>
        );
      })}
    </div>
  );
}
