import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { Gang } from '../../types/game';

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

type View = 'list' | 'preview' | 'deploy';

export default function RecruitPanel() {
  const { availableGangs, players, grid, recruitGang, skipRecruit } = useGameStore();
  const human = players.find(p => p.isHuman)!;

  const [view, setView] = useState<View>('list');
  const [selected, setSelected] = useState<Gang | null>(null);

  const ownedSectors = grid.sectors.flat().filter(s => s.owner === human.id);

  function openPreview(gang: Gang) {
    setSelected(gang);
    setView('preview');
  }

  function goBack() {
    if (view === 'deploy') setView('preview');
    else { setSelected(null); setView('list'); }
  }

  function confirmHire() {
    if (!selected) return;
    if (ownedSectors.length === 0) {
      // No owned sectors — deploy to HQ
      recruitGang(selected.id, human.id, human.hqSector);
      setSelected(null);
      setView('list');
    } else if (ownedSectors.length === 1) {
      recruitGang(selected.id, human.id, ownedSectors[0].position);
      setSelected(null);
      setView('list');
    } else {
      setView('deploy');
    }
  }

  function deployTo(pos: [number, number]) {
    if (!selected) return;
    recruitGang(selected.id, human.id, pos);
    setSelected(null);
    setView('list');
  }

  const canAfford = selected ? human.cash >= selected.hiringCost : false;

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {view !== 'list' && (
            <button
              onClick={goBack}
              className="text-xs px-2 py-1 rounded border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
            >
              ←
            </button>
          )}
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
            {view === 'list' ? 'Recruit' : view === 'preview' ? 'Gang Info' : 'Deploy To'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
            ${human.cash}
          </span>
          {view === 'list' && (
            <button
              onClick={skipRecruit}
              className="text-xs px-3 py-1 rounded border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
            >
              Skip →
            </button>
          )}
        </div>
      </div>

      {/* LIST VIEW */}
      {view === 'list' && (
        <div className="flex flex-col gap-2">
          {availableGangs.map(gang => {
            const affordable = human.cash >= gang.hiringCost;
            return (
              <button
                key={gang.id}
                onClick={() => openPreview(gang)}
                className="flex items-center gap-3 p-2 rounded border text-left w-full"
                style={{ borderColor: 'var(--border)', background: 'var(--surface2)', touchAction: 'manipulation' }}
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

      {/* PREVIEW VIEW */}
      {view === 'preview' && selected && (
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
              <StatBar label="Combat"   value={selected.combat}   max={10} />
              <StatBar label="Ranged"   value={selected.ranged}   max={10} />
              <StatBar label="Stealth"  value={selected.stealth}  max={10} />
              <StatBar label="Control"  value={selected.control}  max={10} />
              <StatBar label="Research" value={selected.research} max={10} />
            </div>
            <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-dim)' }}>
              <span>❤️ {selected.maxMorale} morale</span>
              <span>Upkeep: ${selected.maintenanceCost}/turn</span>
            </div>
          </div>

          <button
            onClick={confirmHire}
            disabled={!canAfford}
            className="w-full py-2 rounded font-bold text-sm"
            style={{
              background: canAfford ? 'var(--accent)' : 'var(--border)',
              color: canAfford ? '#000' : 'var(--text-dim)',
              cursor: canAfford ? 'pointer' : 'not-allowed',
            }}
          >
            {canAfford ? `Hire for $${selected.hiringCost}` : `Need $${selected.hiringCost - human.cash} more`}
          </button>
        </div>
      )}

      {/* DEPLOY VIEW */}
      {view === 'deploy' && selected && (
        <div className="flex flex-col gap-2">
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            Choose a controlled sector to deploy {selected.name}:
          </p>
          {ownedSectors.map(sector => {
            const [r, c] = sector.position;
            const isHQ = human.hqSector[0] === r && human.hqSector[1] === c;
            const buildingCount = sector.buildings.filter(b => b.owner === human.id).length;
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => deployTo([r, c])}
                className="flex items-center justify-between p-2 rounded border text-xs"
                style={{ borderColor: 'var(--border)', background: 'var(--surface2)' }}
              >
                <span className="font-bold">
                  [{r},{c}]{isHQ ? ' 🏠 HQ' : ''}
                </span>
                <span style={{ color: 'var(--text-dim)' }}>
                  {buildingCount} building{buildingCount !== 1 ? 's' : ''} controlled
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
