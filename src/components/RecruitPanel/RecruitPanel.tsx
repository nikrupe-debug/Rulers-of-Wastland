import { useGameStore } from '../../store/gameStore';

export default function RecruitPanel() {
  const { availableGangs, players, recruitGang, skipRecruit } = useGameStore();
  const human = players.find(p => p.isHuman)!;

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
          Recruit
        </span>
        <button
          onClick={skipRecruit}
          className="text-xs px-3 py-1 rounded border"
          style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
        >
          Skip →
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {availableGangs.map(gang => {
          const canAfford = human.cash >= gang.hiringCost;
          return (
            <div
              key={gang.id}
              className="flex items-center gap-3 p-2 rounded border"
              style={{ borderColor: 'var(--border)', background: 'var(--surface2)' }}
            >
              <span className="text-2xl">{gang.portrait}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{gang.name}</div>
                <div className="text-[10px] flex gap-2 mt-[2px]" style={{ color: 'var(--text-dim)' }}>
                  <span>⚔️{gang.combat}</span>
                  <span>🎯{gang.ranged}</span>
                  <span>👁️{gang.stealth}</span>
                  <span>🏴{gang.control}</span>
                  <span>❤️{gang.maxMorale}</span>
                </div>
              </div>
              <button
                onClick={() => canAfford && recruitGang(gang.id, human.id)}
                disabled={!canAfford}
                className="text-xs px-3 py-1 rounded font-bold shrink-0"
                style={{
                  background: canAfford ? 'var(--accent)' : 'var(--border)',
                  color: canAfford ? '#000' : 'var(--text-dim)',
                  cursor: canAfford ? 'pointer' : 'not-allowed',
                }}
              >
                ${gang.hiringCost}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
