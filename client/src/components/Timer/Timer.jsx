import { useGame } from '../../context/GameContext.jsx';
import './Timer.css';

export function Timer() {
  const { videoTimestamp } = useGame();

  const totalSeconds = 3600; // 60 minutes
  const remaining = Math.max(0, totalSeconds - Math.floor(videoTimestamp));
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const elapsed = Math.floor(videoTimestamp);
  const elapsedMin = Math.floor(elapsed / 60);
  const elapsedSec = elapsed % 60;

  const pct = (videoTimestamp / totalSeconds) * 100;

  return (
    <div className="timer">
      <div className="timer-bar">
        <div className="timer-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="timer-labels">
        <span className="timer-elapsed">
          {String(elapsedMin).padStart(2, '0')}:{String(elapsedSec).padStart(2, '0')}
        </span>
        <span className="timer-remaining">
          -{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}
