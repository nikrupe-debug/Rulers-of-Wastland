import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { BUILDING_ICONS, BUILDING_LABELS, BUILDING_DESCRIPTIONS } from '../../data/buildings';
import { TECH_TREE } from '../../data/techs';
import type { Gang } from '../../types/game';
import { getGangActions, CATEGORIES, type ActionItem } from '../../utils/gangActions';

const TIER_LABEL = ['I', 'II', 'III'];

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
      <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-dim)' }}>
        <span>❤️ {gang.morale}/{gang.maxMorale}</span>
        <span>[{gang.position?.join(',') ?? '–'}]</span>
        {gang.equipment.length > 0 && <span>{gang.equipment.map(e => e.name).join(', ')}</span>}
      </div>
    </div>
  );
}

function BuildingCard({ item, gangId, onBack }: { item: ActionItem; gangId: string; onBack: () => void }) {
  const { assignAction } = useGameStore();
  const bt = item.buildingType!;
  const isControl = item.action.type === 'control';

  return (
    <div className="rounded border p-3 mb-2" style={{ borderColor: 'var(--accent)', background: 'var(--surface)' }}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-4xl">{BUILDING_ICONS[bt]}</span>
        <div>
          <div className="font-bold text-sm" style={{ color: 'var(--accent)' }}>{BUILDING_LABELS[bt]}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>{BUILDING_DESCRIPTIONS[bt]}</div>
        </div>
      </div>
      {isControl && item.buildingProgress !== undefined && (
        <div className="mb-3">
          <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--text-dim)' }}>
            <span>Control Progress</span><span>{item.buildingProgress}/10</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div className="h-full rounded-full" style={{ width: `${(item.buildingProgress / 10) * 100}%`, background: 'var(--accent)' }} />
          </div>
          {item.isBurned && <div className="text-[10px] mt-1" style={{ color: 'var(--danger)' }}>⚠ Extorted — control gain halved</div>}
        </div>
      )}
      {!isControl && (
        <div className="mb-3 text-[10px] p-2 rounded" style={{ background: 'var(--surface2)', color: 'var(--text-dim)' }}>
          Stealth check: stealth + d6 ≥ 8. Success: +$100. Failure: +2 Alert.
          {item.isBurned ? ' Already hit this turn.' : ''}
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={onBack} className="flex-1 py-2 rounded border text-xs"
          style={{ borderColor: 'var(--border)', color: 'var(--text-dim)', touchAction: 'manipulation' }}>← Back</button>
        <button onClick={() => { assignAction(gangId, item.action); onBack(); }}
          className="flex-1 py-2 rounded font-bold text-xs"
          style={{ background: 'var(--accent)', color: '#000', touchAction: 'manipulation' }}>
          {isControl ? 'Control ✓' : 'Extort ✓'}
        </button>
      </div>
    </div>
  );
}

function TechCard({ item, gangId, onBack }: { item: ActionItem; gangId: string; onBack: () => void }) {
  const { assignAction, players } = useGameStore();
  const human = players.find(p => p.isHuman)!;
  const action = item.action;
  if (action.type !== 'research') return null;
  const tech = TECH_TREE.find(t => t.id === action.techId)!;
  if (!tech) return null;
  const progress = human.researchProgress[tech.id] ?? 0;

  return (
    <div className="rounded border p-3 mb-2" style={{ borderColor: 'var(--accent)', background: 'var(--surface)' }}>
      <div className="flex items-start justify-between mb-2">
        <div className="font-bold text-sm" style={{ color: 'var(--accent)' }}>{tech.name}</div>
        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold ml-2 shrink-0"
          style={{ background: 'var(--border)', color: 'var(--text-dim)' }}>
          Tier {TIER_LABEL[tech.tier - 1]}
        </span>
      </div>
      <div className="text-xs mb-3" style={{ color: 'var(--text-dim)' }}>{tech.description}</div>
      <div className="mb-3">
        <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--text-dim)' }}>
          <span>Research Progress</span><span>{progress}/{tech.cost}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div className="h-full rounded-full"
            style={{ width: `${Math.min(100, (progress / tech.cost) * 100)}%`, background: 'var(--accent)' }} />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onBack} className="flex-1 py-2 rounded border text-xs"
          style={{ borderColor: 'var(--border)', color: 'var(--text-dim)', touchAction: 'manipulation' }}>← Back</button>
        <button onClick={() => { assignAction(gangId, item.action); onBack(); }}
          className="flex-1 py-2 rounded font-bold text-xs"
          style={{ background: 'var(--accent)', color: '#000', touchAction: 'manipulation' }}>
          Research ✓
        </button>
      </div>
    </div>
  );
}

export default function ActionPanel() {
  const { players, grid, assignAction, resolveOrders } = useGameStore();
  const human = players.find(p => p.isHuman)!;
  const ai = players.find(p => !p.isHuman)!;

  const [selected, setSelected]     = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<ActionItem | null>(null);
  const [openCats, setOpenCats]     = useState<Set<string>>(new Set(['move']));

  const activeGangs = human.gangs.filter(g => g.status !== 'dead');
  const allActionsSet = activeGangs.every(g => g.currentAction !== null);

  function selectGang(id: string | null) {
    setSelected(id);
    setPreviewItem(null);
    setOpenCats(new Set(['move']));
  }

  function toggleCat(key: string) {
    setOpenCats(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function handleItem(item: ActionItem, gangId: string) {
    if (item.buildingType || item.action.type === 'research') {
      setPreviewItem(item);
    } else {
      assignAction(gangId, item.action);
      selectGang(null);
    }
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent)' }}>Orders</span>
        <button onClick={resolveOrders} className="text-xs px-3 py-1 rounded font-bold"
          style={{ background: 'var(--accent)', color: '#000', touchAction: 'manipulation' }}>
          {allActionsSet ? 'Resolve ▶' : 'Resolve anyway ▶'}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {activeGangs.map(gang => (
          <div key={gang.id}>
            <button
              onClick={() => selectGang(selected === gang.id ? null : gang.id)}
              className="w-full flex items-center gap-2 p-2 rounded border text-left"
              style={{ borderColor: selected === gang.id ? 'var(--accent)' : 'var(--border)', background: 'var(--surface2)' }}
            >
              <span className="text-lg">{gang.portrait}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{gang.name}</div>
                <div className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                  ❤️ {gang.morale}/{gang.maxMorale} · [{gang.position?.join(',') ?? '–'}]
                </div>
              </div>
              <div className="text-[10px] text-right shrink-0"
                style={{ color: gang.currentAction ? 'var(--success)' : 'var(--text-dim)' }}>
                {gang.currentAction ? gang.currentAction.type.toUpperCase() : 'NO ORDER'}
              </div>
            </button>

            {selected === gang.id && (
              <div className="mt-1 pl-2">
                <GangCard gang={gang} />
                {previewItem ? (
                  previewItem.action.type === 'research' ? (
                    <TechCard item={previewItem} gangId={gang.id} onBack={() => setPreviewItem(null)} />
                  ) : (
                    <BuildingCard item={previewItem} gangId={gang.id} onBack={() => setPreviewItem(null)} />
                  )
                ) : (
                  <div className="flex flex-col gap-[2px]">
                    {(() => {
                      const all = getGangActions(gang, human, ai, grid);
                      const byKey = all.reduce<Record<string, ActionItem[]>>((acc, item) => {
                        (acc[item.category] ??= []).push(item);
                        return acc;
                      }, {});
                      return CATEGORIES.filter(c => byKey[c.key]?.length).map(c => (
                        <div key={c.key}>
                          <button onClick={() => toggleCat(c.key)}
                            className="w-full flex justify-between items-center px-2 py-1 rounded text-xs font-bold"
                            style={{ background: 'var(--surface)', color: openCats.has(c.key) ? 'var(--accent)' : 'var(--text-dim)', touchAction: 'manipulation' }}>
                            <span>{c.label}</span>
                            <span className="text-[10px]">{openCats.has(c.key) ? '▲' : '▼'}</span>
                          </button>
                          {openCats.has(c.key) && (
                            <div className="flex flex-col gap-[2px] mt-[2px] pl-2 pb-1">
                              {byKey[c.key].map((item, i) => (
                                <button key={i} onClick={() => handleItem(item, gang.id)}
                                  className="text-left text-xs px-3 py-1.5 rounded border flex justify-between items-center"
                                  style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface2)', touchAction: 'manipulation' }}>
                                  <span>{item.label}</span>
                                  {item.isBurned && <span style={{ color: 'var(--danger)' }}>⚠</span>}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {activeGangs.length === 0 && (
        <p className="text-xs text-center" style={{ color: 'var(--text-dim)' }}>No active gangs. Recruit first.</p>
      )}
    </div>
  );
}
