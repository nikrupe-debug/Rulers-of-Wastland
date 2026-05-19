import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { BUILDING_LABELS, BUILDING_DESCRIPTIONS } from '../../data/buildings';
import { TECH_TREE } from '../../data/techs';
import type { Gang, GangAction } from '../../types/game';
import { getAdjacentPositions } from '../../utils/grid';

const BRIBE_COST = 150;

function directionLabel(from: [number, number], to: [number, number]): string {
  const dr = to[0] - from[0];
  const dc = to[1] - from[1];
  const v = dr < 0 ? 'North' : dr > 0 ? 'South' : '';
  const h = dc < 0 ? 'West' : dc > 0 ? 'East' : '';
  return `Move ${v}${h}`.trim();
}

function StatBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-1 text-[10px]">
      <span className="w-12 shrink-0" style={{ color: 'var(--text-dim)' }}>{label}</span>
      <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--border)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
      </div>
      <span className="w-5 text-right" style={{ color: 'var(--text-dim)' }}>{value}</span>
    </div>
  );
}

function GangCard({ gang }: { gang: Gang }) {
  return (
    <div className="rounded border p-2 mb-2 text-xs" style={{ borderColor: 'var(--accent)', background: 'var(--surface)' }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{gang.portrait}</span>
        <div>
          <div className="font-bold" style={{ color: 'var(--accent)' }}>{gang.name}</div>
          <div style={{ color: 'var(--text-dim)' }}>{gang.flavor}</div>
        </div>
      </div>
      <div className="flex flex-col gap-1 mb-2">
        <StatBar label="Combat"   value={gang.combat}   max={10} />
        <StatBar label="Ranged"   value={gang.ranged}   max={10} />
        <StatBar label="Stealth"  value={gang.stealth}  max={10} />
        <StatBar label="Control"  value={gang.control}  max={10} />
        <StatBar label="Research" value={gang.research} max={10} />
      </div>
      <div className="flex justify-between" style={{ color: 'var(--text-dim)' }}>
        <span>❤️ {gang.morale}/{gang.maxMorale}</span>
        <span>Pos [{gang.position?.join(',') ?? '–'}]</span>
        {gang.equipment.length > 0 && (
          <span>{gang.equipment.map(e => e.name).join(', ')}</span>
        )}
      </div>
    </div>
  );
}

export default function ActionPanel() {
  const { players, grid, assignAction, resolveOrders } = useGameStore();
  const human = players.find(p => p.isHuman)!;
  const ai = players.find(p => !p.isHuman)!;
  const [selected, setSelected] = useState<string | null>(null);

  const activeGangs = human.gangs.filter(g => g.status !== 'dead');
  const allActionsSet = activeGangs.every(g => g.currentAction !== null);

  function getActions(gang: Gang): { label: string; action: GangAction; category: string }[] {
    const actions: { label: string; action: GangAction; category: string }[] = [];
    if (!gang.position) return actions;

    // ── MOVE ──────────────────────────────────────────────────────────────────
    getAdjacentPositions(gang.position).forEach(pos => {
      actions.push({
        label: directionLabel(gang.position!, pos),
        action: { type: 'move', target: pos },
        category: 'move',
      });
    });

    const sector = grid.sectors[gang.position[0]][gang.position[1]];

    // ── ATTACK ────────────────────────────────────────────────────────────────
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
          category: 'attack',
        });
      });

    // ── CONTROL ───────────────────────────────────────────────────────────────
    sector.buildings
      .filter(b => b.owner !== human.id)
      .forEach(b => {
        const label = BUILDING_LABELS[b.type];
        const desc = BUILDING_DESCRIPTIONS[b.type];
        const burned = b.extortedBy.includes(human.id) ? ' ⚠ burned' : '';
        actions.push({
          label: `Control ${label} — ${desc} (${b.controlProgress}/10)${burned}`,
          action: { type: 'control', targetBuildingId: b.id },
          category: 'control',
        });
      });

    // ── EXTORT ────────────────────────────────────────────────────────────────
    sector.buildings
      .filter(b => b.owner !== human.id)
      .forEach(b => {
        const label = BUILDING_LABELS[b.type];
        const burned = b.extortedBy.includes(human.id) ? ' (already hit)' : '';
        actions.push({
          label: `Extort ${label}${burned} — stealth check · +$100 if clean`,
          action: { type: 'extort', targetBuildingId: b.id },
          category: 'extort',
        });
      });

    // ── RESEARCH ──────────────────────────────────────────────────────────────
    TECH_TREE.filter(t => !human.unlockedTechs.includes(t.id)).forEach(t => {
      const progress = human.researchProgress[t.id] ?? 0;
      actions.push({
        label: `Research ${t.name} (${progress}/${t.cost}) — ${t.description}`,
        action: { type: 'research', techId: t.id },
        category: 'research',
      });
    });

    // ── HEAL / HIDE ────────────────────────────────────────────────────────────
    if (gang.morale < gang.maxMorale) {
      actions.push({ label: 'Heal — recover morale over 1–3 turns', action: { type: 'heal' }, category: 'utility' });
    }
    actions.push({ label: 'Hide — go dark, Alert −1', action: { type: 'hide' }, category: 'utility' });

    // ── BRIBE ─────────────────────────────────────────────────────────────────
    if (human.cash >= BRIBE_COST) {
      actions.push({
        label: `Bribe authorities — $${BRIBE_COST} · Alert −2`,
        action: { type: 'bribe' },
        category: 'bribe',
      });
    }

    return actions;
  }

  const CATEGORY_LABELS: Record<string, string> = {
    move: '↑ Move', attack: '⚔ Attack', control: '🏴 Control',
    extort: '💰 Extort', research: '🔬 Research', utility: '🩹 Utility', bribe: '💸 Bribe',
  };

  function renderActions(gang: Gang) {
    const all = getActions(gang);
    if (all.length === 0) return <p className="text-xs" style={{ color: 'var(--text-dim)' }}>No actions available.</p>;

    const byCategory = all.reduce<Record<string, typeof all>>((acc, item) => {
      (acc[item.category] ??= []).push(item);
      return acc;
    }, {});

    return Object.entries(byCategory).map(([cat, items]) => (
      <div key={cat} className="mb-2">
        <div className="text-[9px] font-bold uppercase mb-1 tracking-wider" style={{ color: 'var(--text-dim)' }}>
          {CATEGORY_LABELS[cat] ?? cat}
        </div>
        <div className="flex flex-col gap-1">
          {items.map((opt, i) => (
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
      </div>
    ));
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

            {selected === gang.id && (
              <div className="mt-1 pl-2">
                <GangCard gang={gang} />
                {renderActions(gang)}
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
