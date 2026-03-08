import { useGame } from '../../context/GameContext.jsx';
import { VideoPlayer } from './VideoPlayer.jsx';
import { GameBoard } from './GameBoard.jsx';
import { PlayerList } from './PlayerList.jsx';
import { EventLog } from './EventLog.jsx';
import { Timer } from '../Timer/Timer.jsx';
import { PlayerPanel } from '../Player/PlayerPanel.jsx';
import { GatekeeperOverlay } from '../Gatekeeper/GatekeeperOverlay.jsx';
import { ScreamOverlay } from './ScreamOverlay.jsx';
import { HostControls } from './HostControls.jsx';
import './GameScreen.css';

export function GameScreen() {
  const game = useGame();
  const isHost = game.hostId === game.localPlayerId;

  return (
    <div className="game-screen">
      <GatekeeperOverlay />
      <ScreamOverlay />

      <div className="game-top">
        <Timer />
      </div>

      <div className="game-main">
        <div className="game-left">
          <PlayerList />
          {isHost && <HostControls />}
          <EventLog />
        </div>

        <div className="game-center">
          <VideoPlayer />
          <GameBoard />
        </div>

        <div className="game-right">
          <PlayerPanel />
        </div>
      </div>

      {game.phase === 'game_over' && (
        <div className="game-over-overlay">
          <h1>GAME OVER</h1>
        </div>
      )}
    </div>
  );
}
