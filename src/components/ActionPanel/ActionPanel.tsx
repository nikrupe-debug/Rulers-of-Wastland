import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { BUILDING_ICONS, BUILDING_LABELS, BUILDING_DESCRIPTIONS } from '../../data/buildings';
import { TECH_TREE } from '../../data/techs';
import { getGangActions, CATEGORIES, type ActionItem } from '../../utils/gangActions';

const TIER_LABEL = ['I', 'II', 'III'];

// ── Preview cards ─────────────────────────────────────────────────────────────

function BuildingCard({ item, gangIds, onBack, onConfirm }: { item: ActionItem; gangIds: string[]; onBack: () => void; onConfirm: () => void }) {
  const { assignAction } = useGameStore();
  const bt = item.buildingType!;
  const isControl = item.action.type === 'control';

  function confirm() {
    for (const id of gangIds) assignAction(id, item.action);
    onConfirm();
  }

  return (
    <div className="rounded border p-3" style={{ borderColor: 'var(--accent)', background: 'var(--surface)' }}>
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
        <button type="button" onClick={onBack} className="flex-1 py-2 rounded border text-xs"
          style={{ borderColor: 'var(--border)', color: 'var(--text-dim)', touchAction: 'manipulation' }}>← Back</button>
        <button type="button" onClick={confirm} className="flex-1 py-2 rounded font-bold text-xs"
          style={{ background: 'var(--accent)', color: '#000', touchAction: 'manipulation' }}>
          {isControl ? 'Control ✓' : 'Extort ✓'}{gangIds.length > 1 ? ` (${gangIds.length})` : ''}
        </button>
      </div>
    </div>
  );
}

function TechCard({ item, gangIds, onBack, onConfirm }: { item: ActionItem; gangIds: string[]; onBack: () => void; onConfirm: () => void }) {
  const { assignAction, players } = useGameStore();
  const human = players.find(p => p.isHuman)!;
  const action = item.action;
  if (action.type !== 'research') return null;
  const tech = TECH_TREE.find(t => t.id === action.techId)!;
  if (!tech) return null;
  const progress = human.researchProgress[tech.id] ?? 0;

  function confirm() {
    for (const id of gangIds) assignAction(id, item.action);
    onConfirm();
  }

  return (
    <div className="rounded border p-3" style={{ borderColor: 'var(--accent)', background: 'var(--surface)' }}>
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
        <button type="button" onClick={onBack} className="flex-1 py-2 rounded border text-xs"
          style={{ borderColor: 'var(--border)', color: 'var(--text-dim)', touchAction: 'manipulation' }}>← Back</button>
        <button type="button" onClick={confirm} className="flex-1 py-2 rounded font-bold text-xs"
          style={{ background: 'var(--accent)', color: '#000', touchAction: 'manipulation' }}>
          Research ✓{gangIds.length > 1 ? ` (${gangIds.length})` : ''}
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  onGangSelect?: (pos: [number, number] | null) => void;
  onMoveReady?: (gangIds: string[], from: [number, number]) => void;
  onMoveClear?: () => void;
}

export default function ActionPanel({ onGangSelect, onMoveReady, onMoveClear }: Props) {
  const { players, grid, assignAction, resolveOrders } = useGameStore();
  const human = players.find(p => p.isHuman)!;
  const ai    = players.find(p => !p.isHuman)!;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewItem, setPreviewItem] = useState<ActionItem | null>(null);
  const [openCats, setOpenCats]       = useState<Set<string>>(new Set());

  const activeGangs = human.gangs.filter(g => g.status !== 'dead');
  const allActionsSet = activeGangs.every(g => g.currentAction !== null);

  // Derive shared position (only meaningful when all selected gangs are on same tile)
  const selectedGangs = activeGangs.filter(g => selectedIds.has(g.id));
  const positions = selectedGangs.map(g => g.position).filter(Boolean) as [number, number][];
  const allSameTile = positions.length > 0 &&
    positions.every(p => p[0] === positions[0][0] && p[1] === positions[0][1]);
  const sharedPos = allSameTile ? positions[0] : null;
  const refGang = sharedPos ? selectedGangs.find(g => g.position != null) ?? null : selectedGangs[0] ?? null;

  // Sync map highlight + passive move targets to selection
  useEffect(() => {
    if (selectedIds.size === 0) {
      onGangSelect?.(null);
      onMoveClear?.();
      return;
    }
    const g = activeGangs.find(g => selectedIds.has(g.id));
    onGangSelect?.(g?.position ?? null);
    if (sharedPos) {
      onMoveReady?.(Array.from(selectedIds), sharedPos);
    } else {
      onMoveClear?.();
    }
  }, [selectedIds]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleGang(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setPreviewItem(null);
  }

  function toggleCat(key: string) {
    setOpenCats(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function handleItem(item: ActionItem) {
    if (item.buildingType || item.action.type === 'research') {
      setPreviewItem(item);
    } else {
      for (const id of selectedIds) assignAction(id, item.action);
      setSelectedIds(new Set());
      setPreviewItem(null);
    }
  }

  const selectedIdsArr = Array.from(selectedIds);

  return (
    <div className="flex flex-col gap-3 p-3">

      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent)' }}>Orders</span>
        <button type="button" onClick={resolveOrders} className="text-xs px-3 py-1 rounded font-bold"
          style={{ background: 'var(--accent)', color: '#000', touchAction: 'manipulation' }}>
          {allActionsSet ? 'Resolve ▶' : 'Resolve anyway ▶'}
        </button>
      </div>

      {/* Gang list — tap to toggle selection */}
      <div className="flex flex-col gap-1">
        {activeGangs.map(gang => {
          const isSelected = selectedIds.has(gang.id);
          return (
            <button
              key={gang.id}
              type="button"
              onClick={() => toggleGang(gang.id)}
              className="w-full flex items-center gap-2 p-2 rounded border text-left"
              style={{
                borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                background: isSelected ? 'var(--accent)18' : 'var(--surface2)',
                touchAction: 'manipulation',
              }}
            >
              <span className="text-base shrink-0" style={{ opacity: isSelected ? 1 : 0.45 }}>
                {isSelected ? '☑' : '☐'}
              </span>
              <span className="text-lg">{gang.portrait}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{gang.name}</div>
                <div className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                  ❤️ {gang.hp}/{gang.maxHp} · ★{gang.morale} · [{gang.position?.join(',') ?? '–'}]
                </div>
              </div>
              <div className="text-[10px] text-right shrink-0"
                style={{ color: gang.currentAction ? 'var(--success)' : 'var(--text-dim)' }}>
                {gang.currentAction ? gang.currentAction.type.toUpperCase() : 'NO ORDER'}
              </div>
            </button>
          );
        })}
        {activeGangs.length === 0 && (
          <p className="text-xs text-center" style={{ color: 'var(--text-dim)' }}>No active gangs. Recruit first.</p>
        )}
      </div>

      {/* Action assignment — shown when any gangs are selected */}
      {selectedIds.size > 0 && (
        <div className="border-t pt-3 flex flex-col gap-[2px]" style={{ borderColor: 'var(--border)' }}>

          {/* Selection summary */}
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[10px] font-bold" style={{ color: 'var(--accent)' }}>
              {selectedIds.size} unit{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            {!allSameTile && selectedIds.size > 1 && (
              <span className="text-[9px]" style={{ color: 'var(--text-dim)' }}>· different tiles</span>
            )}
            <button type="button" onClick={() => { setSelectedIds(new Set()); setPreviewItem(null); }}
              className="ml-auto text-[9px] px-1.5 py-0.5 rounded border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-dim)', touchAction: 'manipulation' }}>
              Clear
            </button>
          </div>

          {previewItem ? (
            previewItem.action.type === 'research' ? (
              <TechCard item={previewItem} gangIds={selectedIdsArr} onBack={() => setPreviewItem(null)}
                onConfirm={() => { setSelectedIds(new Set()); setPreviewItem(null); }} />
            ) : (
              <BuildingCard item={previewItem} gangIds={selectedIdsArr} onBack={() => setPreviewItem(null)}
                onConfirm={() => { setSelectedIds(new Set()); setPreviewItem(null); }} />
            )
          ) : (
            <>
              {/* Action categories — based on reference gang's position */}
              {refGang && (() => {
                const all = getGangActions(refGang, human, ai, grid);
                const byKey = all.reduce<Record<string, ActionItem[]>>((acc, item) => {
                  (acc[item.category] ??= []).push(item);
                  return acc;
                }, {});
                return CATEGORIES.filter(c => c.key !== 'move' && byKey[c.key]?.length).map(c => (
                  <div key={c.key}>
                    <button type="button" onClick={() => toggleCat(c.key)}
                      className="w-full flex justify-between items-center px-2 py-1 rounded text-xs font-bold"
                      style={{ background: 'var(--surface)', color: openCats.has(c.key) ? 'var(--accent)' : 'var(--text-dim)', touchAction: 'manipulation' }}>
                      <span>{c.label}</span>
                      <span className="text-[10px]">{openCats.has(c.key) ? '▲' : '▼'}</span>
                    </button>
                    {openCats.has(c.key) && (
                      <div className="flex flex-col gap-[2px] mt-[2px] pl-2 pb-1">
                        {byKey[c.key].map((item, i) => (
                          <button key={i} type="button" onClick={() => handleItem(item)}
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
