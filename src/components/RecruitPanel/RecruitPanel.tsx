import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { Gang } from '../../types/game';

interface Props {
  onHireRequest: (gang: Gang) => void;
}

function StatBar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="flex items-center gap-1 text-[10px]">
      <span className="w-14 shrink-0" style={{ color: 'var(--text-dim)' }}>{label}</span>
      <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--border)' }}>
        <div className="h-full rounded-full" style={{ width: `${Math.round((value / max) * 100)}%`, background: 'var(--accent)' }} />
      </div>
      <span className="w-4 text-right" style={{ color: 'var(--text-dim)' }}>{value}</span>
    </div>
  );
}

export default function RecruitPanel({ onHireRequest }: Props) {
  const { availableGangs, players, skipRecruit } = useGameStore();
  const human = players.find(p => p.isHuman)!;

  const [selected, setSelected] = useState<Gang | null>(null);

  const canAfford = selected ? human.cash >= selected.hiringCost : false;

  function openPreview(gang: Gang) {
    setSelected(gang);
  }

  function confirmHire() {
    if (!selected || !canAfford) return;
    onHireRequest(selected);
    setSelected(null);
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {selected && (
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-xs px-2 py-1 rounded border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-dim)', touchAction: 'manipulation' }}
            >
              ←
            </button>
          )}
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
            {selected ? 'Gang Info' : 'Recruit'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>${human.cash}</span>
          {!selected && (
            <button
              type="button"
              onClick={skipRecruit}
              className="text-xs px-3 py-1 rounded border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-dim)', touchAction: 'manipulation' }}
            >
              Skip →
            </button>
          )}
        </div>
      </div>

      {/* LIST */}
      {!selected && (
        <div className="flex flex-col gap-2">
          {availableGangs.map(gang => {
            const affordable = human.cash >= gang.hiringCost;
            return (
              <button
                key={gang.id}
                type="button"
                onClick={() => openPreview(gang)}
                className="flex items-center gap-3 p-2 rounded border text-left w-full"
                style={{ borderColor: 'var(--border)', background: 'var(--surface2)', touchAction: 'manipulation' }}
              >
                <span className="text-2xl">{gang.portrait}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{gang.name}</div>
                  <div className="text-[10px] flex gap-2 mt-[2px]" style={{ color: 'var(--text-dim)' }}>
                    <span>⚔{gang.attack}</span>
                    <span>🛡{gang.defense}</span>
                    <span>👁️{gang.stealth}</span>
                    <span>🏴{gang.control}</span>
                    <span>❤️{gang.maxHp}</span>
                    {gang.divine > 0 && <span>✝{gang.divine}</span>}
                  </div>
                </div>
                <span
                  className="text-xs px-3 py-1 rounded font-bold shrink-0"
                  style={{
                    background: affordable ? 'var(--accent)' : 'var(--border)',
                    color: affordable ? '#000' : 'var(--text-dim)',
                  }}
                >
                  ${gang.hiringCost}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* PREVIEW */}
      {selected && (
        <div className="flex flex-col gap-3">
          <div className="rounded border p-3" style={{ borderColor: 'var(--accent)', background: 'var(--surface)' }}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">{selected.portrait}</span>
              <div>
                <div className="font-bold text-sm" style={{ color: 'var(--accent)' }}>{selected.name}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>{selected.flavor}</div>
              </div>
            </div>
            <div className="flex flex-col gap-1 mb-3">
              <StatBar label="Attack"   value={selected.attack}   max={10} />
              <StatBar label="Defense"  value={selected.defense}  max={10} />
              <StatBar label="Stealth"  value={selected.stealth}  max={10} />
              <StatBar label="Control"  value={selected.control}  max={10} />
              <StatBar label="Research" value={selected.research} max={10} />
              {selected.divine > 0 && <StatBar label="Divine" value={selected.divine} max={10} />}
            </div>
            <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-dim)' }}>
              <span>❤️ {selected.maxHp} HP · ★{selected.maxMorale} morale</span>
              <span>Upkeep: ${selected.maintenanceCost}/turn</span>
            </div>
          </div>

          <button
            type="button"
            onClick={confirmHire}
            disabled={!canAfford}
            className="w-full py-2 rounded font-bold text-sm"
            style={{
              background: canAfford ? 'var(--accent)' : 'var(--border)',
              color: canAfford ? '#000' : 'var(--text-dim)',
              cursor: canAfford ? 'pointer' : 'not-allowed',
              touchAction: 'manipulation',
            }}
          >
            {canAfford ? `Hire for $${selected.hiringCost}` : `Need $${selected.hiringCost - human.cash} more`}
          </button>
        </div>
      )}
    </div>
  );
}
