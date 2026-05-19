import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import CityGrid from './components/CityGrid/CityGrid';

export default function App() {
  const { initGame, turn, phase, players, alertSystem } = useGameStore();

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
            <span>💰 ${human.cash} · ⭐ {human.prestige} · 🔫 {human.gangs.length}</span>
          </div>
          <div className="text-center">
            <div className="text-[10px]" style={{ color: 'var(--text-dim)' }}>ALERT</div>
            <div className="font-bold text-sm" style={{ color: alertSystem.level >= 3 ? 'var(--danger)' : 'var(--text-dim)' }}>
              {'▮'.repeat(alertSystem.level)}{'▯'.repeat(5 - alertSystem.level)}
            </div>
          </div>
          <div className="flex flex-col gap-[2px] items-end">
            <span className="font-bold" style={{ color: ai.color }}>{ai.name}</span>
            <span>💰 ${ai.cash} · ⭐ {ai.prestige} · 🔫 {ai.gangs.length}</span>
          </div>
        </div>
      )}

      {/* Grid */}
      <main className="flex flex-1 items-start justify-center pt-4">
        <CityGrid />
      </main>

      {/* Legend */}
      <footer className="flex gap-4 justify-center px-3 py-2 text-[10px]" style={{ color: 'var(--text-dim)' }}>
        {players.map(p => (
          <span key={p.id} className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-sm" style={{ background: p.color }} />
            {p.name}
          </span>
        ))}
        <span>⬜ Neutral</span>
      </footer>
    </div>
  );
}
