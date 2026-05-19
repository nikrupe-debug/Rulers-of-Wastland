import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { BUILDING_ICONS, BUILDING_LABELS, BUILDING_DESCRIPTIONS } from '../../data/buildings';
import { TECH_TREE } from '../../data/techs';
import type { Gang, GangAction, BuildingType } from '../../types/game';
import { getAdjacentPositions } from '../../utils/grid';

const TERRITORY_THRESHOLD = 10;
const BRIBE_COST = 150;

interface ActionItem {
  label: string;
  action: GangAction;
  category: string;
  buildingType?: BuildingType;
  buildingProgress?: number;
  isBurned?: boolean;
}

const CATEGORIES: { key: string; label: string }[] = [
  { key: 'move',      label: 'Move' },
  { key: 'attack',    label: 'Attack' },
  { key: 'control',   label: 'Control' },
  { key: 'extort',    label: 'Extort' },
  { key: 'research',  label: 'Research' },
  { key: 'utilities', label: 'Utilities' },
];

function directionLabel(from: [number, number], to: [number, number]): string {
  const dr = to[0] - from[0];
  const dc = to[1] - from[1];
  const v = dr < 0 ? 'North' : dr > 0 ? 'South' : '';
  const h = dc < 0 ? 'West' : dc > 0 ? 'East' : '';
  return `${v}${h}`.trim();
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

function BuildingCard({
  item, gangId, onBack,
}: {
  item: ActionItem;
  gangId: string;
  onBack: () => void;
}) {
  const { assignAction } = useGameStore();
  const bt = item.buildingType!;
  const isControl = item.action.type === 'control';

  function confirm() {
    assignAction(gangId, item.action);
    onBack();
  }

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
            <span>Control Progress</span>
            <span>{item.buildingProgress}/10</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${(item.buildingProgress / 10) * 100}%`, background: 'var(--accent)' }}
            />
          </div>
          {item.isBurned && (
            <div className="text-[10px] mt-1" style={{ color: 'var(--danger)' }}>
              ⚠ Extorted — control gain is halved
            </div>
          )}
        </div>
      )}

      {!isControl && (
        <div className="mb-3 text-[10px] p-2 rounded" style={{ background: 'var(--surface2)', color: 'var(--text-dim)' }}>
          Stealth check: stealth + d6 ≥ 8. Success: +$100.
          Failure: +2 Alert.{item.isBurned ? ' This building has already been hit.' : ''}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="flex-1 py-2 rounded border text-xs"
          style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
        >
          ← Back
        </button>
        <button
          onClick={confirm}
          className="flex-1 py-2 rounded font-bold text-xs"
          style={{ background: 'var(--accent)', color: '#000' }}
        >
          {isControl ? 'Control ✓' : 'Extort ✓'}
        </button>
      </div>
    </div>
  );
}

export default function ActionPanel() {
  const { players, grid, assignAction, resolveOrders } = useGameStore();
  const human = players.find(p => p.isHuman)!;
  const ai = players.find(p => !p.isHuman)!;

  const [selected, setSelected] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<ActionItem | null>(null);
  const [openCats, setOpenCats] = useState<Set<string>>(new Set(['move']));

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

  function getActions(gang: Gang): ActionItem[] {
    const items: ActionItem[] = [];
    if (!gang.position) return items;
    const pos = gang.position;
    const sector = grid.sectors[pos[0]][pos[1]];

    // ── MOVE ─────────────────────────────────────────────────────────────────
    getAdjacentPositions(pos).forEach(to => {
      items.push({ label: directionLabel(pos, to), action: { type: 'move', target: to }, category: 'move' });
    });

    // ── ATTACK ────────────────────────────────────────────────────────────────
    ai.gangs
      .filter(g => g.status === 'active' && g.position &&
        Math.max(Math.abs(g.position[0] - pos[0]), Math.abs(g.position[1] - pos[1])) <= 1)
      .forEach(enemy => {
        items.push({ label: enemy.name, action: { type: 'attack', targetGangId: enemy.id }, category: 'attack' });
      });

    // ── CONTROL ───────────────────────────────────────────────────────────────
    if (sector.owner !== human.id) {
      items.push({
        label: `Claim Territory  ${sector.controlProgress}/${TERRITORY_THRESHOLD}`,
        action: { type: 'territory', targetSector: pos },
        category: 'control',
      });
    } else {
      sector.buildings.filter(b => b.owner !== human.id).forEach(b => {
        items.push({
          label: BUILDING_LABELS[b.type],
          action: { type: 'control', targetBuildingId: b.id },
          category: 'control',
          buildingType: b.type,
          buildingProgress: b.controlProgress,
          isBurned: b.extortedBy.includes(human.id),
        });
      });
    }

    // ── EXTORT ────────────────────────────────────────────────────────────────
    sector.buildings.filter(b => b.owner !== human.id).forEach(b => {
      items.push({
        label: BUILDING_LABELS[b.type],
        action: { type: 'extort', targetBuildingId: b.id },
        category: 'extort',
        buildingType: b.type,
        isBurned: b.extortedBy.includes(human.id),
      });
    });

    // ── RESEARCH ──────────────────────────────────────────────────────────────
    TECH_TREE.filter(t => !human.unlockedTechs.includes(t.id)).forEach(t => {
      items.push({
        label: `${t.name}  ${human.researchProgress[t.id] ?? 0}/${t.cost}`,
        action: { type: 'research', techId: t.id },
        category: 'research',
      });
    });

    // ── UTILITIES ─────────────────────────────────────────────────────────────
    if (gang.morale < gang.maxMorale)
      items.push({ label: 'Heal', action: { type: 'heal' }, category: 'utilities' });
    items.push({ label: 'Hide  −1 Alert', action: { type: 'hide' }, category: 'utilities' });
    if (human.cash >= BRIBE_COST)
      items.push({ label: `Bribe  $${BRIBE_COST} · −2 Alert`, action: { type: 'bribe' }, category: 'utilities' });

    return items;
  }

  function handleItem(item: ActionItem, gangId: string) {
    if (item.buildingType) {
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
              onClick={() => selectGang(selected === gang.id ? null : gang.id)}
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
                  <BuildingCard
                    item={previewItem}
                    gangId={gang.id}
                    onBack={() => setPreviewItem(null)}
                  />
                ) : (
                  <div className="flex flex-col gap-[2px]">
                    {(() => {
                      const all = getActions(gang);
                      const byKey = all.reduce<Record<string, ActionItem[]>>((acc, item) => {
                        (acc[item.category] ??= []).push(item);
                        return acc;
                      }, {});
                      return CATEGORIES.filter(c => byKey[c.key]?.length).map(c => (
                        <div key={c.key}>
                          <button
                            onClick={() => toggleCat(c.key)}
                            className="w-full flex justify-between items-center px-2 py-1 rounded text-xs font-bold"
                            style={{
                              background: 'var(--surface)',
                              color: openCats.has(c.key) ? 'var(--accent)' : 'var(--text-dim)',
                            }}
                          >
                            <span>{c.label}</span>
                            <span className="text-[10px]">{openCats.has(c.key) ? '▲' : '▼'}</span>
                          </button>
                          {openCats.has(c.key) && (
                            <div className="flex flex-col gap-[2px] mt-[2px] pl-2 pb-1">
                              {byKey[c.key].map((item, i) => (
                                <button
                                  key={i}
                                  onClick={() => handleItem(item, gang.id)}
                                  className="text-left text-xs px-3 py-1.5 rounded border flex justify-between items-center"
                                  style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface2)' }}
                                >
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
