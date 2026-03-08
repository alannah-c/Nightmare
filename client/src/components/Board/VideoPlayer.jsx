import { useRef, useEffect, useCallback } from 'react';
import { useGame } from '../../context/GameContext.jsx';
import { socket } from '../../services/socket.js';
import './VideoPlayer.css';

const YOUTUBE_VIDEO_ID = 'uchUe52-j74';

export function VideoPlayer() {
  const game = useGame();
  const iframeRef = useRef(null);
  const playerRef = useRef(null);
  const isHost = game.hostId === game.localPlayerId;

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT) return;

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }, []);

  // Initialize player once API is ready
  useEffect(() => {
    function initPlayer() {
      if (playerRef.current) return;

      playerRef.current = new window.YT.Player('yt-player', {
        videoId: YOUTUBE_VIDEO_ID,
        playerVars: {
          autoplay: 0,
          controls: isHost ? 1 : 0,
          disablekb: isHost ? 0 : 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            if (isHost) startTimestampSync();
          },
        },
      });
    }

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isHost]);

  // Host: broadcast timestamp every second
  const startTimestampSync = useCallback(() => {
    const interval = setInterval(() => {
      if (!playerRef.current?.getCurrentTime) return;
      const time = playerRef.current.getCurrentTime();
      socket.emit('game:videoTimestamp', { roomId: game.roomId, timestamp: time });
    }, 1000);

    return () => clearInterval(interval);
  }, [game.roomId]);

  // Non-host: seek to match host timestamp
  useEffect(() => {
    if (isHost || !playerRef.current?.seekTo) return;

    const currentTime = playerRef.current.getCurrentTime?.() || 0;
    const drift = Math.abs(currentTime - game.videoTimestamp);

    // Only seek if drift > 2 seconds to avoid constant jumping
    if (drift > 2) {
      playerRef.current.seekTo(game.videoTimestamp, true);
    }
  }, [game.videoTimestamp, isHost]);

  function resync() {
    socket.emit('game:videoResync', { roomId: game.roomId }, (res) => {
      if (res.success && playerRef.current?.seekTo) {
        playerRef.current.seekTo(res.timestamp, true);
      }
    });
  }

  function toggleGatekeeper() {
    socket.emit('game:gatekeeperActive', {
      roomId: game.roomId,
      active: !game.gatekeeperActive,
    });
  }

  return (
    <div className="video-player">
      <div className="video-container">
        <div id="yt-player" />
      </div>
      <div className="video-controls">
        {!isHost && (
          <button className="btn btn-secondary btn-small" onClick={resync}>
            Re-sync Video
          </button>
        )}
        {isHost && (
          <button className="btn btn-secondary btn-small" onClick={toggleGatekeeper}>
            {game.gatekeeperActive ? 'Gatekeeper Done' : 'Gatekeeper Appears'}
          </button>
        )}
      </div>
    </div>
  );
}
