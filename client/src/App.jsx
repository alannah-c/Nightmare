import { GameProvider, useGame } from './context/GameContext.jsx';
import { useSocket } from './hooks/useSocket.js';
import { Lobby } from './components/Lobby/Lobby.jsx';
import { GameScreen } from './components/Board/GameScreen.jsx';
import './App.css';

function GameRouter() {
  const game = useGame();
  useSocket();

  switch (game.phase) {
    case 'lobby':
    case 'setup':
      return <Lobby />;
    case 'playing':
    case 'gatekeeper_active':
    case 'nightmare_attempt':
    case 'game_over':
      return <GameScreen />;
    default:
      return <Lobby />;
  }
}

function App() {
  return (
    <GameProvider>
      <div className="app">
        <GameRouter />
      </div>
    </GameProvider>
  );
}

export default App;
