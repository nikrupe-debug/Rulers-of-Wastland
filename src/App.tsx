import { useState } from 'react';
import { useGameStore } from './store/gameStore';
import CityGrid from './components/CityGrid/CityGrid';
import RecruitPanel from './components/RecruitPanel/RecruitPanel';
import ActionPanel from './components/ActionPanel/ActionPanel';
import EventLog from './components/EventLog/EventLog';
import SetupScreen from './components/SetupScreen/SetupScreen';
import SectorDetail from './components/SectorDetail/SectorDetail';
import PlayerCard from './components/PlayerCard/PlayerCard';
import type { Gang, VictoryType } from './types/game';
import { getAdjacentPositions } from './utils/grid';

const VICTORY_LABELS: Record<VictoryType, string> = {
  elimination: 'Elimination',
  domination:  'Domination',
  territory:   'Territory 60%',
  greed:       'Greed $50k',
  prestige:    'Prestige 500★',
};

const ALERT_LABELS = ['Clear', 'Quiet', 'Patrols', 'Patrols+', 'Squad', 'Crackdown'];

export default function App() {
  const { turn, phase, players, grid, alertSystem, winner, victoryCondition, resetGame, recruitGang, assignAction } = useGameStore();

  const [sectorView, setSectorView]       = useState<[number, number] | null>(null);
  const [pendingDeploy, setPendingDeploy] = useState<Gang | null>(null);
  const [moveReady, setMoveReady]         = useState<{ gangIds: string[]; from: [number, number] } | null>(null);
  const [gangHighlight, setGangHighlight] = useState<[number, number] | null>(null);
  const [showPlayerCard, setShowPlayerCard] = useState(false);

  if (players.length === 0) return <SetupScreen />;

  const human = players.find(p => p.isHuman)!;

  const ownedSectors = grid.sectors.flat().filter(s => s.owner === human.id);

  function handleHireRequest(gang: Gang) {
    if (ownedSectors.length <= 1) {
      const pos = ownedSectors.length === 1 ? ownedSectors[0].position : human.hqSector;
      recruitGang(gang.id, human.id, pos);
    } else {
      setPendingDeploy(gang);
    }
  }

  function handleMoveReady(gangIds: string[], from: [number, number]) {
    setMoveReady({ gangIds, from });
  }

  function handleMoveClear() {
    setMoveReady(null);
  }

  function handleSectorClick(pos: [number, number]) {
    const sector = grid.sectors[pos[0]]?.[pos[1]];
    if (!sector) return;

    if (pendingDeploy) {
      if (sector.owner === human.id) {
        recruitGang(pendingDeploy.id, human.id, pos);
        setPendingDeploy(null);
      }
      return;
    }

    if (moveReady) {
      const targets = getAdjacentPositions(moveReady.from);
      if (targets.some(t => t[0] === pos[0] && t[1] === pos[1])) {
        for (const gangId of moveReady.gangIds) {
          assignAction(gangId, { type: 'move', target: pos });
        }
        setMoveReady(null);
        setSectorView(null);
        return;
      }
    }

    setShowPlayerCard(false);
    setSectorView(pos);
  }

  const moveTargets = moveReady ? getAdjacentPositions(moveReady.from) : [];

  const viewedSector = sectorView ? grid.sectors[sectorView[0]]?.[sectorView[1]] : null;

  return (
    <div className="flex flex-col min-h-dvh" style={{ background: 'var(--bg)', color: 'var(--text)' }}>

      {/* Header */}
      <header className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="font-bold text-sm tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
          Rulers of Wasteland
        </span>
        <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
          T{turn} · {phase.toUpperCase()} · {VICTORY_LABELS[victoryCondition.type]}
        </span>
      </header>

      {/* HUD */}
      <div className="px-3 py-2 border-b text-xs" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-1">
          <button type="button" onClick={() => setShowPlayerCard(v => !v)}
            className="font-bold text-left"
            style={{ color: human.color, touchAction: 'manipulation' }}>
            {human.name} ›
          </button>
          <span style={{ color: alertSystem.level >= 3 ? 'var(--danger)' : 'var(--text-dim)', letterSpacing: '-1px' }}>
            {ALERT_LABELS[alertSystem.level]} {'▮'.repeat(alertSystem.level)}{'▯'.repeat(5 - alertSystem.level)}
          </span>
        </div>
        <div className="flex items-center gap-3 flex-wrap" style={{ color: 'var(--text)' }}>
          <span><span style={{ color: 'var(--text-dim)' }}>$ </span>{human.cash}</span>
          <span><span style={{ color: 'var(--text-dim)' }}>⚔ </span>{human.gangs.filter(g => g.status !== 'dead').length}</span>
          <span><span style={{ color: 'var(--text-dim)' }}>★ </span>{human.prestige}</span>
          <span><span style={{ color: 'var(--text-dim)' }}>✝ </span>{human.religion}</span>
          <span style={{ color: human.wanted > 0 ? 'var(--danger)' : undefined }}>
            <span style={{ color: 'var(--text-dim)' }}>⚠ </span>{human.wanted}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="flex justify-center pt-2 pb-1">
        <CityGrid
          selectedPos={sectorView}
          highlightPos={gangHighlight}
          onSectorClick={handleSectorClick}
          deployMode={!!pendingDeploy}
          humanId={human.id}
          moveTargets={moveTargets}
        />
      </div>

      {/* Bottom panel */}
      <div className="flex-1 border-t overflow-y-auto" style={{ borderColor: 'var(--border)', touchAction: 'pan-y' }}>

        {/* Deploy mode instruction */}
        {pendingDeploy && (
          <div className="flex items-center justify-between px-3 py-3 border-b"
            style={{ borderColor: 'var(--accent)44', background: 'var(--accent)18' }}>
            <div>
              <div className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
                Deploy {pendingDeploy.portrait} {pendingDeploy.name}
              </div>
              <div className="text-[10px] mt-[2px]" style={{ color: 'var(--text-dim)' }}>
                Tap a glowing sector on the map
              </div>
            </div>
            <button type="button" onClick={() => setPendingDeploy(null)}
              className="text-xs px-2 py-1 rounded border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-dim)', touchAction: 'manipulation' }}>
              Cancel
            </button>
          </div>
        )}

        {showPlayerCard ? (
          <PlayerCard onClose={() => setShowPlayerCard(false)} />
        ) : !pendingDeploy && viewedSector ? (
          <SectorDetail
            sector={viewedSector}
            players={players}
            onClose={() => setSectorView(null)}
            onMoveReady={handleMoveReady}
            onMoveClear={handleMoveClear}
          />
        ) : !pendingDeploy && winner ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
            <div className="text-4xl">{winner.isHuman ? '🏆' : '💀'}</div>
            <div className="font-bold text-lg" style={{ color: winner.isHuman ? 'var(--accent)' : 'var(--danger)' }}>
              {winner.isHuman ? 'Victory!' : 'Defeat.'}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-dim)' }}>{winner.name} rules the wasteland.</div>
            <button
              type="button"
              onClick={resetGame}
              className="mt-2 px-4 py-2 rounded font-bold text-sm"
              style={{ background: 'var(--accent)', color: '#000' }}
            >
              Play Again
            </button>
          </div>
        ) : !pendingDeploy && phase === 'recruit' ? (
          <RecruitPanel onHireRequest={handleHireRequest} />
        ) : !pendingDeploy && phase === 'orders' ? (
          <ActionPanel
            onGangSelect={pos => setGangHighlight(pos)}
            onMoveReady={handleMoveReady}
            onMoveClear={handleMoveClear}
          />
        ) : !pendingDeploy ? (
          <EventLog />
        ) : null}
      </div>
    </div>
  );
}
