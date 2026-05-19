import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { Sector, Player, Gang } from '../../types/game';
import { BUILDING_ICONS, BUILDING_LABELS, BUILDING_DESCRIPTIONS } from '../../data/buildings';
import { TECH_TREE } from '../../data/techs';
import { getGangActions, CATEGORIES, type ActionItem } from '../../utils/gangActions';

const TIER_LABEL = ['I', 'II', 'III'];

interface Props {
  sector: Sector;
  players: Player[];
  onClose: () => void;
}

// ── Shared sub-components ────────────────────────────────────────────────────

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

// ── GangCommandView — embedded action panel for one gang ────────────────────

function GangCommandView({ gang, onBack }: { gang: Gang; onBack: () => void }) {
  const { players, grid, assignAction } = useGameStore();
  const human = players.find(p => p.isHuman)!;
  const ai    = players.find(p => !p.isHuman)!;

  const [openCats, setOpenCats]     = useState<Set<string>>(new Set(['move']));
  const [previewItem, setPreviewItem] = useState<ActionItem | null>(null);

  const actions = getGangActions(gang, human, ai, grid);
  const byKey = actions.reduce<Record<string, ActionItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

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
      assignAction(gang.id, item.action);
      onBack();
    }
  }

  function confirmPreview() {
    if (!previewItem) return;
    assignAction(gang.id, previewItem.action);
    onBack();
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <button
          type="button"
          onClick={previewItem ? () => setPreviewItem(null) : onBack}
          className="text-xs px-2 py-1 rounded border shrink-0"
          style={{ borderColor: 'var(--border)', color: 'var(--text-dim)', touchAction: 'manipulation' }}
        >
          ←
        </button>
        <span className="text-xl">{gang.portrait}</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm truncate" style={{ color: 'var(--accent)' }}>{gang.name}</div>
          <div className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
            ❤️ {gang.morale}/{gang.maxMorale}
            {gang.currentAction && (
              <span className="ml-2" style={{ color: 'var(--success)' }}>
                · {gang.currentAction.type.toUpperCase()} set
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1" style={{ touchAction: 'pan-y' }}>

        {/* Stat bars */}
        <div className="rounded border p-2 mb-1" style={{ borderColor: 'var(--border)', background: 'var(--surface2)' }}>
          <div className="flex flex-col gap-1">
            <StatBar label="Combat"   value={gang.combat}   max={10} />
            <StatBar label="Ranged"   value={gang.ranged}   max={10} />
            <StatBar label="Stealth"  value={gang.stealth}  max={10} />
            <StatBar label="Control"  value={gang.control}  max={10} />
            <StatBar label="Research" value={gang.research} max={10} />
          </div>
        </div>

        {/* Action preview card (building or tech) */}
        {previewItem && (
          <div className="rounded border p-3 mb-1" style={{ borderColor: 'var(--accent)', background: 'var(--surface)' }}>
            {/* Building preview */}
            {previewItem.buildingType && (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{BUILDING_ICONS[previewItem.buildingType]}</span>
                  <div>
                    <div className="font-bold text-sm" style={{ color: 'var(--accent)' }}>{BUILDING_LABELS[previewItem.buildingType]}</div>
                    <div className="text-[10px] mt-1" style={{ color: 'var(--text-dim)' }}>{BUILDING_DESCRIPTIONS[previewItem.buildingType]}</div>
                  </div>
                </div>
                {previewItem.action.type === 'control' && previewItem.buildingProgress !== undefined && (
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--text-dim)' }}>
                      <span>Control Progress</span><span>{previewItem.buildingProgress}/10</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                      <div className="h-full rounded-full" style={{ width: `${(previewItem.buildingProgress / 10) * 100}%`, background: 'var(--accent)' }} />
                    </div>
                    {previewItem.isBurned && <div className="text-[10px] mt-1" style={{ color: 'var(--danger)' }}>⚠ Extorted — control gain halved</div>}
                  </div>
                )}
                {previewItem.action.type === 'extort' && (
                  <div className="mb-3 text-[10px] p-2 rounded" style={{ background: 'var(--surface2)', color: 'var(--text-dim)' }}>
                    Stealth check: stealth + d6 ≥ 8. Success: +$100. Failure: +2 Alert.{previewItem.isBurned ? ' Already hit this turn.' : ''}
                  </div>
                )}
              </>
            )}
            {/* Tech preview */}
            {previewItem.action.type === 'research' && (() => {
              const tech = TECH_TREE.find(t => t.id === (previewItem.action as { type: 'research'; techId: string }).techId);
              if (!tech) return null;
              const progress = human.researchProgress[tech.id] ?? 0;
              return (
                <>
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
                </>
              );
            })()}
            <div className="flex gap-2">
              <button type="button" onClick={() => setPreviewItem(null)}
                className="flex-1 py-2 rounded border text-xs"
                style={{ borderColor: 'var(--border)', color: 'var(--text-dim)', touchAction: 'manipulation' }}>← Back</button>
              <button type="button" onClick={confirmPreview}
                className="flex-1 py-2 rounded font-bold text-xs"
                style={{ background: 'var(--accent)', color: '#000', touchAction: 'manipulation' }}>
                {previewItem.action.type === 'control' ? 'Control ✓'
                  : previewItem.action.type === 'extort' ? 'Extort ✓'
                  : 'Research ✓'}
              </button>
            </div>
          </div>
        )}

        {/* Action categories */}
        {!previewItem && (
          <>
            {CATEGORIES.filter(c => byKey[c.key]?.length).map(c => (
              <div key={c.key}>
                <button
                  type="button"
                  onClick={() => toggleCat(c.key)}
                  className="w-full flex justify-between items-center px-2 py-1 rounded text-xs font-bold"
                  style={{
                    background: 'var(--surface)',
                    color: openCats.has(c.key) ? 'var(--accent)' : 'var(--text-dim)',
                    touchAction: 'manipulation',
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
                        type="button"
                        onClick={() => handleItem(item)}
                        className="text-left text-xs px-3 py-1.5 rounded border flex justify-between items-center"
                        style={{
                          borderColor: 'var(--border)',
                          color: 'var(--text)',
                          background: 'var(--surface2)',
                          touchAction: 'manipulation',
                        }}
                      >
                        <span>{item.label}</span>
                        {item.isBurned && <span style={{ color: 'var(--danger)' }}>⚠</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {actions.length === 0 && (
              <p className="text-xs text-center py-4" style={{ color: 'var(--text-dim)' }}>
                No actions available (gang has no position).
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── SectorDetail ─────────────────────────────────────────────────────────────

export default function SectorDetail({ sector, players, onClose }: Props) {
  const human = players.find(p => p.isHuman)!;
  const owner = players.find(p => p.id === sector.owner);
  const claimingPlayer = !owner && sector.controllingPlayerId
    ? players.find(p => p.id === sector.controllingPlayerId)
    : null;

  const [commandGangId, setCommandGangId] = useState<string | null>(null);

  const gangsHere = players.flatMap(p =>
    p.gangs.filter(g =>
      g.status !== 'dead' &&
      g.position?.[0] === sector.position[0] &&
      g.position?.[1] === sector.position[1]
    ).map(g => ({ gang: g, player: p }))
  );

  const commandGang = commandGangId
    ? human.gangs.find(g => g.id === commandGangId) ?? null
    : null;

  // Show command view when a gang is selected
  if (commandGang) {
    return (
      <GangCommandView
        gang={commandGang}
        onBack={() => setCommandGangId(null)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Title bar */}
      <div
        className="flex justify-between items-start px-3 py-2 border-b"
        style={{
          borderColor: owner ? owner.color + '44' : 'var(--border)',
          background: owner ? owner.color + '18' : claimingPlayer ? claimingPlayer.color + '10' : 'transparent',
        }}
      >
        <div>
          <div className="font-bold text-sm" style={{ color: owner?.color ?? 'var(--accent)' }}>
            {sector.name}
          </div>
          <div className="text-[10px] mt-[1px]" style={{ color: 'var(--text-dim)' }}>
            {owner ? (
              <span style={{ color: owner.color }}>● {owner.name}</span>
            ) : claimingPlayer ? (
              <span style={{ color: claimingPlayer.color }}>○ {claimingPlayer.name} claiming ({sector.controlProgress}/10)</span>
            ) : (
              <span>Unclaimed · [{sector.position.join(',')}]</span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs px-2 py-1 rounded border shrink-0"
          style={{ borderColor: 'var(--border)', color: 'var(--text-dim)', touchAction: 'manipulation' }}
        >
          ✕ Back
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-4" style={{ touchAction: 'pan-y' }}>

        {/* Units */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-dim)' }}>
            Units {gangsHere.length === 0 ? '— None' : `(${gangsHere.length})`}
          </div>
          {gangsHere.length > 0 ? (
            <div className="flex flex-col gap-1">
              {gangsHere.map(({ gang, player }) => {
                const isHuman = player.id === human.id;
                return (
                  <button
                    key={gang.id}
                    type="button"
                    onClick={isHuman ? () => setCommandGangId(gang.id) : undefined}
                    className="flex items-center gap-2 p-2 rounded border text-left w-full"
                    style={{
                      borderColor: player.color + '55',
                      background: player.color + '15',
                      cursor: isHuman ? 'pointer' : 'default',
                      touchAction: 'manipulation',
                    }}
                  >
                    <span className="text-xl">{gang.portrait}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate" style={{ color: player.color }}>{gang.name}</div>
                      <div className="flex items-center gap-1 mt-[3px]">
                        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                          <div className="h-full rounded-full" style={{
                            width: `${Math.round((gang.morale / gang.maxMorale) * 100)}%`,
                            background: gang.morale > gang.maxMorale * 0.5 ? player.color : 'var(--danger)',
                          }} />
                        </div>
                        <span className="text-[9px] shrink-0" style={{ color: 'var(--text-dim)' }}>
                          {gang.morale}/{gang.maxMorale}
                        </span>
                      </div>
                      <div className="text-[9px] flex gap-2 mt-[2px]" style={{ color: 'var(--text-dim)' }}>
                        <span>⚔️{gang.combat}</span>
                        <span>🎯{gang.ranged}</span>
                        <span>👁️{gang.stealth}</span>
                        <span>🏴{gang.control}</span>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      {gang.currentAction ? (
                        <span className="text-[8px] font-bold px-1 py-0.5 rounded"
                          style={{ background: 'var(--success)' + '33', color: 'var(--success)' }}>
                          {gang.currentAction.type.toUpperCase()}
                        </span>
                      ) : isHuman ? (
                        <span className="text-[8px] px-1 py-0.5 rounded"
                          style={{ background: 'var(--accent)' + '22', color: 'var(--accent)' }}>
                          TAP TO ORDER
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>No units here.</p>
          )}
        </div>

        {/* Buildings */}
        {sector.buildings.length > 0 && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-dim)' }}>
              Buildings ({sector.buildings.length})
            </div>
            <div className="flex flex-col gap-1">
              {sector.buildings.map(b => {
                const bOwner = players.find(p => p.id === b.owner);
                return (
                  <div key={b.id} className="flex items-center gap-3 p-2 rounded border"
                    style={{
                      borderColor: bOwner ? bOwner.color + '88' : 'var(--border)',
                      background: bOwner ? bOwner.color + '20' : 'var(--surface2)',
                    }}
                  >
                    <span className="text-2xl">{BUILDING_ICONS[b.type]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold" style={{ color: bOwner ? bOwner.color : 'var(--text)' }}>
                        {BUILDING_LABELS[b.type]}
                      </div>
                      <div className="text-[10px] mt-[1px]" style={{ color: 'var(--text-dim)' }}>
                        {BUILDING_DESCRIPTIONS[b.type]}
                      </div>
                      {b.controlProgress > 0 && !bOwner && (
                        <div className="flex items-center gap-1 mt-1">
                          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                            <div className="h-full rounded-full"
                              style={{ width: `${(b.controlProgress / 10) * 100}%`, background: 'var(--accent)' }} />
                          </div>
                          <span className="text-[9px]" style={{ color: 'var(--text-dim)' }}>{b.controlProgress}/10</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {bOwner
                        ? <span className="text-[9px] font-bold" style={{ color: bOwner.color }}>● {bOwner.name}</span>
                        : <span className="text-[9px]" style={{ color: 'var(--text-dim)' }}>Neutral</span>
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
