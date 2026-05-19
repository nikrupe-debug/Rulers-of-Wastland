import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import CityGrid from './components/CityGrid/CityGrid';
import RecruitPanel from './components/RecruitPanel/RecruitPanel';
import ActionPanel from './components/ActionPanel/ActionPanel';
import EventLog from './components/EventLog/EventLog';

export default function App() {
  const { initGame, turn, phase, players, alertSystem, winner } = useGameStore();

  useEffect(() => {
    initGame('Player 1', 'medium');
  }, [initGame]);

  const human = players.find(p => p.isHuman);
  const ai = players.find(p => !p.isHuman);

  return (
    <div className="flex flex-col min-h-dvh" style={{ background: 'var(--bg)', color: 'var(--text)' }}>

      {/* Header */}
      <header className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="font-bold text-sm tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
          Rulers of Wasteland
        </span>
        <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
          Turn {turn} · {phase.toUpperCase()}
        </span>
      </header>

      {/* HUD */}
      {human && ai && (
        <div className="flex justify-between px-3 py-2 text-xs border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex flex-col gap-[2px]">
            <span className="font-bold" style={{ color: human.color }}>{human.name}</span>
            <span>${human.cash} · {human.prestige}★ · {human.gangs.filter(g=>g.status!=='dead').length} gangs</span>
          </div>
          <div className="text-center">
            <div className="text-[10px]" style={{ color: 'var(--text-dim)' }}>ALERT</div>
            <div className="font-bold text-sm" style={{ color: alertSystem.level >= 3 ? 'var(--danger)' : 'var(--text-dim)' }}>
              {'▮'.repeat(alertSystem.level)}{'▯'.repeat(5 - alertSystem.level)}
            </div>
          </div>
          <div className="flex flex-col gap-[2px] items-end">
            <span className="font-bold" style={{ color: ai.color }}>{ai.name}</span>
            <span>${ai.cash} · {ai.prestige}★ · {ai.gangs.filter(g=>g.status!=='dead').length} gangs</span>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="flex justify-center pt-2">
        <CityGrid />
      </div>

      {/* Bottom panel — phase-dependent */}
      <div className="flex-1 border-t overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
        {winner ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
            <div className="text-4xl">{winner.isHuman ? '🏆' : '💀'}</div>
            <div className="font-bold text-lg" style={{ color: winner.isHuman ? 'var(--accent)' : 'var(--danger)' }}>
              {winner.isHuman ? 'Victory!' : 'Defeat.'}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-dim)' }}>{winner.name} rules the wasteland.</div>
            <button
              onClick={() => initGame('Player 1', 'medium')}
              className="mt-2 px-4 py-2 rounded font-bold text-sm"
              style={{ background: 'var(--accent)', color: '#000' }}
            >
              Play Again
            </button>
          </div>
        ) : phase === 'recruit' ? (
          <RecruitPanel />
        ) : phase === 'orders' ? (
          <ActionPanel />
        ) : (
          <EventLog />
        )}
      </div>
    </div>
  );
}
