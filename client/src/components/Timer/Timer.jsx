import { useGame } from '../../context/GameContext.jsx';
import './Timer.css';

// The Gatekeeper video is 1:05:05 total (3905 seconds).
// The game timer starts counting at 03:37 into the video (217 seconds).
const VIDEO_TIMER_START = 217; // seconds into video when countdown begins
const VIDEO_END = 3905;        // total video length in seconds
const GAME_DURATION = VIDEO_END - VIDEO_TIMER_START; // 3688 seconds ≈ 61:28

export function Timer() {
  const { videoTimestamp } = useGame();

  const ts = Math.floor(videoTimestamp);

  // Elapsed game time (0 until the timer starts at 03:37)
  const gameElapsed = Math.max(0, ts - VIDEO_TIMER_START);

  // Remaining game time
  const remaining = Math.max(0, GAME_DURATION - gameElapsed);

  // Progress bar percentage
  const pct = Math.min(100, (gameElapsed / GAME_DURATION) * 100);

  const elapsedMin = Math.floor(gameElapsed / 60);
  const elapsedSec = gameElapsed % 60;
  const remMin = Math.floor(remaining / 60);
  const remSec = remaining % 60;

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
          -{String(remMin).padStart(2, '0')}:{String(remSec).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}
