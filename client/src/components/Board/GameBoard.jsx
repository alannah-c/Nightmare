import { useMemo } from 'react';
import { useGame } from '../../context/GameContext.jsx';
import {
  OUTER_RING,
  CHARACTER_COLORS,
  SQUARE_COLORS,
  SQUARE_BORDER_COLORS,
  LABEL_COLORS,
  INNER_PATHS,
  getOuterRingPosition,
  getInnerPathPosition,
  CENTER,
  BOARD_SIZE,
} from './boardData.js';
import './GameBoard.css';

const STONE_W = 38;
const STONE_H = 44;
const INNER_STONE = 30;
const PIECE_R = 7;

// Gravestone SVG path (tombstone shape) centered at 0,0
function gravestonePath(w, h) {
  const hw = w / 2;
  const r = hw; // semicircle radius = half width
  const bodyH = h - r;
  return `M ${-hw} ${bodyH / 2} L ${-hw} ${-bodyH / 2} A ${r} ${r} 0 0 1 ${hw} ${-bodyH / 2} L ${hw} ${bodyH / 2} Z`;
}

function GravestoneSquare({ sq, x, y, angle, players }) {
  const color = SQUARE_COLORS[sq.type];
  const border = SQUARE_BORDER_COLORS[sq.type];
  const labelColor = LABEL_COLORS[sq.type];
  const isCharGrave = sq.type === 'gravestone' && sq.character;
  const charColor = isCharGrave ? CHARACTER_COLORS[sq.character] : null;

  // Determine display label
  let displayLabel = sq.shortLabel;
  if (sq.type === 'black_hole') displayLabel = '⬤';
  if (sq.type === 'x') displayLabel = '✕';

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Gravestone shape */}
      <path
        d={gravestonePath(STONE_W, STONE_H)}
        fill={color}
        stroke={isCharGrave ? charColor : border}
        strokeWidth={isCharGrave ? 2.5 : 1.5}
        opacity={0.9}
      />

      {/* Character color pip on named gravestones */}
      {isCharGrave && (
        <circle cx={0} cy={-STONE_H / 2 + 6} r={4} fill={charColor} opacity={0.9} />
      )}

      {/* Square label */}
      <text
        x={0}
        y={isCharGrave ? 4 : 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={isCharGrave ? charColor : labelColor}
        fontSize={isCharGrave ? 7 : sq.type === 'black_hole' ? 10 : 8}
        fontFamily="Georgia, serif"
        fontWeight={isCharGrave ? 'bold' : 'normal'}
      >
        {displayLabel}
      </text>

      {/* Character name on named gravestones */}
      {isCharGrave && (
        <text
          x={0}
          y={14}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={charColor}
          fontSize={5}
          fontFamily="Georgia, serif"
          opacity={0.7}
        >
          {sq.label.length > 10 ? sq.label.split(' ')[0] : sq.label}
        </text>
      )}

      {/* Player pieces on this square */}
      {players.length > 0 && (
        <g>
          {players.map((p, i) => {
            const offsetX = (i - (players.length - 1) / 2) * (PIECE_R * 2.2);
            return (
              <g key={p.id} transform={`translate(${offsetX}, ${STONE_H / 2 + PIECE_R + 3})`}>
                <circle
                  r={PIECE_R}
                  fill={p.character?.color || '#666'}
                  stroke="#000"
                  strokeWidth={1.5}
                  opacity={0.95}
                />
                <circle
                  r={PIECE_R - 2}
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth={0.5}
                />
                <text
                  x={0}
                  y={0.5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#000"
                  fontSize={7}
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {p.numberToken}
                </text>
              </g>
            );
          })}
        </g>
      )}
    </g>
  );
}

function InnerPathSquare({ x, y, players, step }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        x={-INNER_STONE / 2}
        y={-INNER_STONE / 2}
        width={INNER_STONE}
        height={INNER_STONE}
        rx={4}
        fill="#1a1230"
        stroke="#554488"
        strokeWidth={1.2}
        opacity={0.85}
      />
      <text
        x={0}
        y={1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#665599"
        fontSize={8}
        fontFamily="Georgia, serif"
      >
        {step}
      </text>
      {players.map((p, i) => {
        const ox = (i - (players.length - 1) / 2) * (PIECE_R * 2.2);
        return (
          <circle
            key={p.id}
            cx={ox}
            cy={INNER_STONE / 2 + PIECE_R + 2}
            r={PIECE_R}
            fill={p.character?.color || '#666'}
            stroke="#000"
            strokeWidth={1.5}
          />
        );
      })}
    </g>
  );
}

function NightmareCenter({ players }) {
  return (
    <g transform={`translate(${CENTER.x}, ${CENTER.y})`}>
      {/* Glow effect */}
      <circle r={42} fill="url(#centerGlow)" opacity={0.6} />

      {/* Center plaque */}
      <rect
        x={-38}
        y={-18}
        width={76}
        height={36}
        rx={6}
        fill="#0d0818"
        stroke="#8b0000"
        strokeWidth={2.5}
      />
      <rect
        x={-35}
        y={-15}
        width={70}
        height={30}
        rx={4}
        fill="none"
        stroke="#5a0020"
        strokeWidth={0.8}
      />
      <text
        x={0}
        y={-2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#cc0033"
        fontSize={9}
        fontFamily="Georgia, serif"
        fontWeight="bold"
        letterSpacing="1.5"
      >
        NIGHTMARE
      </text>
      <text
        x={0}
        y={10}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#660022"
        fontSize={5.5}
        fontFamily="Georgia, serif"
      >
        Roll a 6 to draw
      </text>

      {/* Players on the nightmare square */}
      {players.map((p, i) => {
        const angle = (i / Math.max(players.length, 1)) * Math.PI * 2;
        const px = Math.cos(angle) * 30;
        const py = Math.sin(angle) * 30;
        return (
          <circle
            key={p.id}
            cx={px}
            cy={py}
            r={PIECE_R}
            fill={p.character?.color || '#666'}
            stroke="#cc0033"
            strokeWidth={2}
          />
        );
      })}
    </g>
  );
}

function BlackHoleSide({ players }) {
  if (players.length === 0) return null;

  return (
    <g transform={`translate(${CENTER.x}, ${CENTER.y + 140})`}>
      <text
        x={0}
        y={-18}
        textAnchor="middle"
        fill="#ff3344"
        fontSize={7}
        fontFamily="Georgia, serif"
        letterSpacing="2"
      >
        BLACK HOLE
      </text>
      <rect
        x={-50}
        y={-12}
        width={100}
        height={28}
        rx={4}
        fill="#0a0008"
        stroke="#440011"
        strokeWidth={1.5}
      />
      {players.map((p, i) => {
        const ox = (i - (players.length - 1) / 2) * (PIECE_R * 2.5);
        return (
          <g key={p.id}>
            <circle
              cx={ox}
              cy={2}
              r={PIECE_R}
              fill={p.character?.color || '#666'}
              stroke="#440011"
              strokeWidth={1.5}
              opacity={0.7}
            />
            <text
              x={ox}
              y={2.5}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#000"
              fontSize={7}
              fontWeight="bold"
              fontFamily="monospace"
            >
              {p.numberToken}
            </text>
          </g>
        );
      })}
    </g>
  );
}

// Decorative bat SVG (simplified)
function Bat({ x, y, scale = 1, flip = false }) {
  const s = flip ? -scale : scale;
  return (
    <g transform={`translate(${x}, ${y}) scale(${s}, ${scale})`}>
      <path
        d="M0 0 C-3 -5 -12 -8 -18 -4 C-14 -6 -10 -3 -8 0 C-10 -1 -15 2 -20 1 C-15 4 -10 3 -7 2 C-9 5 -8 8 -6 4 L0 2 L6 4 C8 8 9 5 7 2 C10 3 15 4 20 1 C15 2 10 -1 8 0 C10 -3 14 -6 18 -4 C12 -8 3 -5 0 0Z"
        fill="#2a1540"
        opacity={0.5}
      />
    </g>
  );
}

export function GameBoard() {
  const game = useGame();

  // Build a map of where each player is
  const playerPositions = useMemo(() => {
    const outerMap = {}; // index -> [players]
    const innerMap = {}; // `pathId_step` -> [players]
    const nightmarePlayers = [];
    const blackHolePlayers = [];

    for (const p of game.players) {
      if (p.inBlackHole) {
        blackHolePlayers.push(p);
      } else if (p.onNightmareSquare) {
        nightmarePlayers.push(p);
      } else if (p.onInnerPath) {
        const key = `${p.onInnerPath.pathId}_${p.onInnerPath.pathPosition}`;
        if (!innerMap[key]) innerMap[key] = [];
        innerMap[key].push(p);
      } else {
        if (!outerMap[p.position]) outerMap[p.position] = [];
        outerMap[p.position].push(p);
      }
    }

    return { outerMap, innerMap, nightmarePlayers, blackHolePlayers };
  }, [game.players]);

  return (
    <div className="game-board">
      <svg
        viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}
        xmlns="http://www.w3.org/2000/svg"
        className="board-svg"
      >
        <defs>
          {/* Background radial gradient — dark blue/purple like the original */}
          <radialGradient id="boardBg" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#1a2a4a" />
            <stop offset="40%" stopColor="#14203a" />
            <stop offset="75%" stopColor="#0e1528" />
            <stop offset="100%" stopColor="#080c18" />
          </radialGradient>

          {/* Center glow */}
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8b0000" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8b0000" stopOpacity="0" />
          </radialGradient>

          {/* Vignette overlay */}
          <radialGradient id="vignette" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="transparent" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.6)" />
          </radialGradient>

          {/* Stone texture filter */}
          <filter id="stoneNoise" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
            <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
            <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" />
          </filter>
        </defs>

        {/* Board background */}
        <rect width={BOARD_SIZE} height={BOARD_SIZE} fill="url(#boardBg)" rx={12} />

        {/* Subtle cobblestone ring path */}
        <circle
          cx={CENTER.x}
          cy={CENTER.y}
          r={275}
          fill="none"
          stroke="#1a1530"
          strokeWidth={52}
          opacity={0.5}
        />

        {/* Decorative bats in corners */}
        <Bat x={60} y={55} scale={1.2} />
        <Bat x={640} y={55} scale={1.2} flip />
        <Bat x={60} y={645} scale={1} />
        <Bat x={640} y={645} scale={1} flip />

        {/* Inner path lines (connecting outer ring entries to center) */}
        {INNER_PATHS.map((path, pi) => {
          const outerPos = getOuterRingPosition(path.entryIndex);
          return (
            <line
              key={path.id}
              x1={outerPos.x}
              y1={outerPos.y}
              x2={CENTER.x}
              y2={CENTER.y}
              stroke="#2a1a40"
              strokeWidth={22}
              strokeLinecap="round"
              opacity={0.5}
            />
          );
        })}

        {/* Inner path trail lines (thinner, on top) */}
        {INNER_PATHS.map((path) => {
          const outerPos = getOuterRingPosition(path.entryIndex);
          return (
            <line
              key={`trail_${path.id}`}
              x1={outerPos.x}
              y1={outerPos.y}
              x2={CENTER.x}
              y2={CENTER.y}
              stroke="#3a2a55"
              strokeWidth={2}
              strokeDasharray="6 4"
              opacity={0.6}
            />
          );
        })}

        {/* Inner path squares */}
        {INNER_PATHS.map((path, pi) =>
          [1, 2, 3, 4].map((step) => {
            const pos = getInnerPathPosition(pi, step);
            const serverPathId = ['path_north', 'path_east', 'path_south', 'path_west'][pi];
            const key = `${serverPathId}_${step}`;
            return (
              <InnerPathSquare
                key={key}
                x={pos.x}
                y={pos.y}
                step={step}
                players={playerPositions.innerMap[key] || []}
              />
            );
          })
        )}

        {/* Outer ring squares */}
        {OUTER_RING.map((sq) => {
          const pos = getOuterRingPosition(sq.index);
          return (
            <GravestoneSquare
              key={sq.index}
              sq={sq}
              x={pos.x}
              y={pos.y}
              angle={pos.angle}
              players={playerPositions.outerMap[sq.index] || []}
            />
          );
        })}

        {/* Clockwise direction indicator */}
        <g transform={`translate(${CENTER.x}, ${CENTER.y - 215})`} opacity={0.25}>
          <text
            x={0}
            y={0}
            textAnchor="middle"
            fill="#8866aa"
            fontSize={7}
            fontFamily="Georgia, serif"
          >
            ↻ clockwise
          </text>
        </g>

        {/* Center NIGHTMARE square */}
        <NightmareCenter players={playerPositions.nightmarePlayers} />

        {/* Black Hole holding area */}
        <BlackHoleSide players={playerPositions.blackHolePlayers} />

        {/* Vignette overlay */}
        <rect width={BOARD_SIZE} height={BOARD_SIZE} fill="url(#vignette)" rx={12} pointerEvents="none" />
      </svg>
    </div>
  );
}
