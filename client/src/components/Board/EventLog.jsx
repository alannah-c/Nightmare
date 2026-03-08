import { useRef, useEffect } from 'react';
import { useGame } from '../../context/GameContext.jsx';
import './EventLog.css';

export function EventLog() {
  const { eventLog } = useGame();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [eventLog.length]);

  return (
    <div className="event-log">
      <h4>Game Log</h4>
      <div className="event-log-entries">
        {eventLog.map((evt, i) => (
          <div key={i} className={`event-entry event-${evt.source}`}>
            {evt.videoTime != null && (
              <span className="event-time">
                {String(Math.floor(evt.videoTime / 60)).padStart(2, '0')}:
                {String(Math.floor(evt.videoTime % 60)).padStart(2, '0')}
              </span>
            )}
            <span className="event-message">{evt.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
