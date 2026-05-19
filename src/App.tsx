import { useState } from 'react';
import { useGameStore } from './store/gameStore';
import CityGrid from './components/CityGrid/CityGrid';
import RecruitPanel from './components/RecruitPanel/RecruitPanel';
import ActionPanel from './components/ActionPanel/ActionPanel';
import EventLog from './components/EventLog/EventLog';
import SetupScreen from './components/SetupScreen/SetupScreen';
import SectorDetail from './components/SectorDetail/SectorDetail';
import type { Gang, VictoryType } from './types/game';

const VICTORY_LABELS: Record<VictoryType, string> = {
  elimination: 'Elimination',
  domination:  'Domination',
  territory:   'Territory 60%',
  greed:       'Greed $50k',
  prestige:    'Prestige 500★',
};

const ALERT_LABELS = ['Clear', 'Quiet', 'Patrols', 'Patrols+', 'Squad', 'Crackdown'];

export default function App() {
  const { turn, phase, players, grid, alertSystem, winner, victoryCondition, resetGame, recruitGang } = useGameStore();

  const [sectorView, setSectorView]       = useState<[number, number] | null>(null);
  const [pendingDeploy, setPendingDeploy] = useState<Gang | null>(null);
  const [gangHighlight, setGangHighlight] = useState<[number, number] | null>(null);

  if (players.length === 0) return <SetupScreen />;

  const human = players.find(p => p.isHuman)!;
  const ai    = players.find(p => !p.isHuman)!;

  const ownedSectors = grid.sectors.flat().filter(s => s.owner === human.id);

  function handleHireRequest(gang: Gang) {
    if (ownedSectors.length <= 1) {
      const pos = ownedSectors.length === 1 ? ownedSectors[0].position : human.hqSector;
      recruitGang(gang.id, human.id, pos);
    } else {
      setPendingDeploy(gang);
    }
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

    setSectorView(pos);
  }

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
      <div className="flex justify-between px-3 py-2 text-xs border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex flex-col gap-[2px]">
          <span className="font-bold" style={{ color: human.color }}>{human.name}</span>
          <span>${human.cash} · {human.prestige}★ · {human.gangs.filter(g => g.status !== 'dead').length} gangs</span>
        </div>
        <div className="text-center">
          <div className="text-[9px] font-bold" style={{ color: alertSystem.level >= 4 ? 'var(--danger)' : 'var(--text-dim)' }}>
            {ALERT_LABELS[alertSystem.level]}
          </div>
          <div className="font-bold text-sm" style={{ color: alertSystem.level >= 3 ? 'var(--danger)' : 'var(--text-dim)' }}>
            {'▮'.repeat(alertSystem.level)}{'▯'.repeat(5 - alertSystem.level)}
          </div>
        </div>
        <div className="flex flex-col gap-[2px] items-end">
          <span className="font-bold" style={{ color: ai.color }}>{ai.name}</span>
          <span>${ai.cash} · {ai.prestige}★ · {ai.gangs.filter(g => g.status !== 'dead').length} gangs</span>
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
        />
      </div>

      {/* Bottom panel */}
      <div className="flex-1 border-t overflow-y-auto" style={{ borderColor: 'var(--border)', touchAction: 'pan-y' }}>

        {/* Deploy mode instruction */}
        {pendingDeploy && (
          <div className="flex items-center justify-between px-3 py-3 border-b"
            style={{ borderColor: 'var(--accent) + "44"', background: 'var(--accent)18' }}>
            <div>
              <div className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
                Deploy {pendingDeploy.portrait} {pendingDeploy.name}
              </div>
              <div className="text-[10px] mt-[2px]" style={{ color: 'var(--text-dim)' }}>
                Tap a glowing sector on the map
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPendingDeploy(null)}
              className="text-xs px-2 py-1 rounded border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-dim)', touchAction: 'manipulation' }}
            >
              Cancel
            </button>
          </div>
        )}

        {!pendingDeploy && viewedSector ? (
          <SectorDetail
            sector={viewedSector}
            players={players}
            onClose={() => setSectorView(null)}
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
          <ActionPanel onGangSelect={pos => setGangHighlight(pos)} />
        ) : !pendingDeploy ? (
          <EventLog />
        ) : null}
      </div>
    </div>
  );
}
