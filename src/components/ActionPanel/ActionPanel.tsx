import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { Gang, GangAction } from '../../types/game';
import { getAdjacentPositions } from '../../utils/grid';

export default function ActionPanel() {
  const { players, grid, assignAction, resolveOrders } = useGameStore();
  const human = players.find(p => p.isHuman)!;
  const ai = players.find(p => !p.isHuman)!;
  const [selected, setSelected] = useState<string | null>(null);

  const activeGangs = human.gangs.filter(g => g.status !== 'dead');
  const allActionsSet = activeGangs.every(g => g.currentAction !== null);

  const selectedGang = activeGangs.find(g => g.id === selected) ?? null;

  function getActions(gang: Gang): { label: string; action: GangAction }[] {
    const actions: { label: string; action: GangAction }[] = [];
    if (!gang.position) return actions;

    // Move — adjacent sectors
    getAdjacentPositions(gang.position).forEach(pos => {
      actions.push({ label: `Move → [${pos[0]},${pos[1]}]`, action: { type: 'move', target: pos } });
    });

    // Control — buildings in current sector
    const sector = grid.sectors[gang.position[0]][gang.position[1]];
    sector.buildings
      .filter(b => b.owner !== human.id)
      .forEach(b => {
        actions.push({
          label: `Control ${b.type.replace('_', ' ')} (${b.controlProgress}/10)`,
          action: { type: 'control', targetBuildingId: b.id },
        });
      });

    // Attack — enemy gangs in same or adjacent sector
    ai.gangs
      .filter(g => g.status === 'active' && g.position &&
        Math.max(
          Math.abs(g.position[0] - gang.position![0]),
          Math.abs(g.position[1] - gang.position![1])
        ) <= 1)
      .forEach(enemy => {
        actions.push({
          label: `Attack ${enemy.name}`,
          action: { type: 'attack', targetGangId: enemy.id },
        });
      });

    // Heal / Hide
    if (gang.morale < gang.maxMorale) {
      actions.push({ label: 'Heal', action: { type: 'heal' } });
    }
    actions.push({ label: 'Hide', action: { type: 'hide' } });

    return actions;
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
          Orders
        </span>
        <button
          onClick={resolveOrders}
          className="text-xs px-3 py-1 rounded font-bold"
          style={{ background: 'var(--accent)', color: '#000' }}
        >
          {allActionsSet ? 'Resolve ▶' : 'Resolve anyway ▶'}
        </button>
      </div>

      {/* Gang list */}
      <div className="flex flex-col gap-2">
        {activeGangs.map(gang => (
          <div key={gang.id}>
            <button
              onClick={() => setSelected(selected === gang.id ? null : gang.id)}
              className="w-full flex items-center gap-2 p-2 rounded border text-left"
              style={{
                borderColor: selected === gang.id ? 'var(--accent)' : 'var(--border)',
                background: 'var(--surface2)',
              }}
            >
              <span className="text-lg">{gang.portrait}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{gang.name}</div>
                <div className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                  ❤️ {gang.morale}/{gang.maxMorale} · pos [{gang.position?.join(',') ?? '–'}]
                </div>
              </div>
              <div className="text-[10px] text-right shrink-0" style={{ color: gang.currentAction ? 'var(--success)' : 'var(--text-dim)' }}>
                {gang.currentAction ? gang.currentAction.type.toUpperCase() : 'NO ORDER'}
              </div>
            </button>

            {/* Action picker */}
            {selected === gang.id && (
              <div className="mt-1 flex flex-col gap-1 pl-2">
                {getActions(gang).map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => { assignAction(gang.id, opt.action); setSelected(null); }}
                    className="text-left text-xs px-3 py-1 rounded border"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface)' }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {activeGangs.length === 0 && (
        <p className="text-xs text-center" style={{ color: 'var(--text-dim)' }}>
          No active gangs. Recruit first.
        </p>
      )}
    </div>
  );
}
