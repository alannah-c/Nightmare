import { useState } from 'react';
import { useGame, useGameDispatch } from '../../context/GameContext.jsx';
import { socket } from '../../services/socket.js';
import './Lobby.css';

export function Lobby() {
  const game = useGame();
  const dispatch = useGameDispatch();
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [fear, setFear] = useState('');
  const [age, setAge] = useState('');
  const [fearSubmitted, setFearSubmitted] = useState(false);
  const [ageSubmitted, setAgeSubmitted] = useState(false);

  const isHost = game.hostId === game.localPlayerId;
  const inRoom = game.roomId !== null;

  function createRoom() {
    if (!playerName.trim()) return;
    socket.emit('lobby:create', { playerName: playerName.trim() }, (res) => {
      if (res.success) {
        dispatch({ type: 'SET_ROOM', roomId: res.roomId });
        dispatch({ type: 'UPDATE_GAME', game: res.game });
      }
    });
  }

  function joinRoom() {
    if (!playerName.trim() || !joinCode.trim()) return;
    socket.emit('lobby:join', { roomId: joinCode.trim().toUpperCase(), playerName: playerName.trim() }, (res) => {
      if (res.success) {
        dispatch({ type: 'SET_ROOM', roomId: res.roomId });
        dispatch({ type: 'UPDATE_GAME', game: res.game });
      } else {
        alert(res.error);
      }
    });
  }

  function submitAge() {
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 1) return;
    socket.emit('lobby:setAge', { roomId: game.roomId, age: ageNum }, (res) => {
      if (res.success) setAgeSubmitted(true);
    });
  }

  function submitFear() {
    if (!fear.trim()) return;
    socket.emit('lobby:submitFear', { roomId: game.roomId, fear: fear.trim() }, (res) => {
      if (res.success) setFearSubmitted(true);
    });
  }

  function startGame() {
    socket.emit('lobby:startGame', { roomId: game.roomId }, (res) => {
      if (!res.success) alert(res.error);
    });
  }

  function startTestMode() {
    socket.emit('lobby:startTestMode', { roomId: game.roomId }, (res) => {
      if (!res.success) alert(res.error);
    });
  }

  // Step 1: Enter name and create/join
  if (!inRoom) {
    return (
      <div className="lobby">
        <h1 className="lobby-title">NIGHTMARE</h1>
        <p className="lobby-subtitle">The Video Board Game — Digital Edition</p>

        <div className="lobby-form">
          <input
            type="text"
            placeholder="Your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={20}
          />

          <button className="btn btn-primary" onClick={createRoom}>
            Create Room
          </button>

          <div className="lobby-divider">— or —</div>

          <input
            type="text"
            placeholder="Room code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            maxLength={5}
          />
          <button className="btn btn-secondary" onClick={joinRoom}>
            Join Room
          </button>
        </div>
      </div>
    );
  }

  // Step 2: In room — submit age, fear, and wait
  return (
    <div className="lobby">
      <h2>Room: {game.roomId}</h2>
      <p className="lobby-code-hint">Share this code with your friends</p>

      <div className="lobby-players">
        <h3>Players ({game.players.length}/6)</h3>
        {game.players.map((p) => (
          <div key={p.id} className="lobby-player">
            <span className="lobby-player-name">
              {p.name} {p.id === game.hostId ? '(Host)' : ''}
            </span>
          </div>
        ))}
      </div>

      {!ageSubmitted && (
        <div className="lobby-form">
          <label>Your age (for "the young one" / "the old one"):</label>
          <input
            type="number"
            placeholder="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            min={1}
            max={120}
          />
          <button className="btn btn-secondary" onClick={submitAge}>Submit Age</button>
        </div>
      )}

      {ageSubmitted && !fearSubmitted && (
        <div className="lobby-form">
          <label>Write your GREATEST FEAR (kept secret until the end):</label>
          <input
            type="text"
            placeholder="Your greatest fear..."
            value={fear}
            onChange={(e) => setFear(e.target.value)}
            maxLength={100}
          />
          <button className="btn btn-secondary" onClick={submitFear}>Submit Fear</button>
        </div>
      )}

      {fearSubmitted && (
        <p className="lobby-waiting">Waiting for all players to submit…</p>
      )}

      {isHost && game.players.length >= 3 && (
        <button className="btn btn-primary btn-start" onClick={startGame}>
          START THE NIGHTMARE
        </button>
      )}

      {isHost && game.players.length < 3 && (
        <p className="lobby-waiting">Need at least 3 players to start</p>
      )}

      {isHost && (
        <div className="lobby-test-mode">
          <p className="lobby-test-label">⚠ DEV ONLY</p>
          <button className="btn btn-test" onClick={startTestMode}>
            Test Mode (Solo)
          </button>
          <p className="lobby-test-hint">Skips player count, age &amp; fear requirements</p>
        </div>
      )}
    </div>
  );
}
