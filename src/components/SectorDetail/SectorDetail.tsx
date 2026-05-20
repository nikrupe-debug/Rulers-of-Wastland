import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { Sector, Player, Gang } from '../../types/game';
import { BUILDING_ICONS, BUILDING_LABELS, BUILDING_DESCRIPTIONS } from '../../data/buildings';
import { TECH_TREE } from '../../data/techs';
import { getGangActions, CATEGORIES, type ActionItem } from '../../utils/gangActions';
import { getSectorVisibility } from '../../utils/visibility';

const TIER_LABEL = ['I', 'II', 'III'];

interface Props {
  sector: Sector;
  players: Player[];
  onClose: () => void;
  onMoveRequest?: (gangId: string, from: [number, number]) => void;
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

function GangCommandView({
  gang, onBack, onMoveRequest,
}: {
  gang: Gang;
  onBack: () => void;
  onMoveRequest?: (gangId: string, from: [number, number]) => void;
}) {
  const { players, grid, assignAction } = useGameStore();
  const human = players.find(p => p.isHuman)!;
  const ai    = players.find(p => !p.isHuman)!;

  const [openCats, setOpenCats]     = useState<Set<string>>(new Set());
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
            {/* Move — tap map */}
            {gang.position && (
              <button
                type="button"
                onClick={() => { onMoveRequest?.(gang.id, gang.position!); onBack(); }}
                className="w-full flex justify-between items-center px-2 py-1 rounded text-xs font-bold"
                style={{ background: 'var(--surface)', color: 'var(--success)', touchAction: 'manipulation' }}
              >
                <span>Move</span>
                <span className="text-[10px]">tap map ▶</span>
              </button>
            )}
            {CATEGORIES.filter(c => c.key !== 'move' && byKey[c.key]?.length).map(c => (
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

// ── BuildingInteractionView ──────────────────────────────────────────────────

function BuildingInteractionView({
  building, sector, human, players, onBack,
}: {
  building: import('../../types/game').Building;
  sector: Sector;
  human: Player;
  players: Player[];
  onBack: () => void;
}) {
  const { assignAction } = useGameStore();
  const [chosenAction, setChosenAction] = useState<'control' | 'extort' | 'use' | null>(null);

  const bOwner = players.find(p => p.id === building.owner);
  const canControl = sector.owner === human.id && building.owner !== human.id;
  const canExtort  = building.owner !== human.id;
  const canUse     = building.type === 'hospital' && building.owner === human.id;

  const humanGangsHere = human.gangs.filter(g =>
    g.status !== 'dead' &&
    g.position?.[0] === sector.position[0] &&
    g.position?.[1] === sector.position[1]
  );

  function buildAction(): import('../../types/game').GangAction | null {
    if (chosenAction === 'control') return { type: 'control', targetBuildingId: building.id };
    if (chosenAction === 'extort')  return { type: 'extort',  targetBuildingId: building.id };
    if (chosenAction === 'use')     return { type: 'heal' };
    return null;
  }

  function assignToGang(gang: import('../../types/game').Gang) {
    const action = buildAction();
    if (action) { assignAction(gang.id, action); onBack(); }
  }

  // ── Gang picker ──
  if (chosenAction) {
    const verb = chosenAction === 'control' ? 'Control' : chosenAction === 'extort' ? 'Extort' : 'Use';
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
          <button type="button" onClick={() => setChosenAction(null)}
            className="text-xs px-2 py-1 rounded border shrink-0"
            style={{ borderColor: 'var(--border)', color: 'var(--text-dim)', touchAction: 'manipulation' }}>←</button>
          <div>
            <div className="font-bold text-sm" style={{ color: 'var(--accent)' }}>
              {verb}: {BUILDING_LABELS[building.type]}
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text-dim)' }}>Select a unit to send</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1" style={{ touchAction: 'pan-y' }}>
          {humanGangsHere.length === 0 && (
            <p className="text-xs text-center py-4" style={{ color: 'var(--text-dim)' }}>No units at this location.</p>
          )}
          {humanGangsHere.map(gang => (
            <button key={gang.id} type="button" onClick={() => assignToGang(gang)}
              className="flex items-center gap-2 p-2 rounded border text-left w-full"
              style={{ borderColor: human.color + '55', background: human.color + '15', touchAction: 'manipulation' }}>
              <span className="text-xl">{gang.portrait}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate" style={{ color: human.color }}>{gang.name}</div>
                <div className="text-[9px] flex gap-2 mt-[2px]" style={{ color: 'var(--text-dim)' }}>
                  <span>⚔️{gang.combat}</span><span>🎯{gang.ranged}</span>
                  <span>👁️{gang.stealth}</span><span>🏴{gang.control}</span>
                </div>
              </div>
              {gang.currentAction && (
                <span className="text-[8px] px-1 py-0.5 rounded shrink-0"
                  style={{ background: 'var(--success)33', color: 'var(--success)' }}>
                  {gang.currentAction.type.toUpperCase()}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Action picker ──
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <button type="button" onClick={onBack}
          className="text-xs px-2 py-1 rounded border shrink-0"
          style={{ borderColor: 'var(--border)', color: 'var(--text-dim)', touchAction: 'manipulation' }}>←</button>
        <span className="text-2xl">{BUILDING_ICONS[building.type]}</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm truncate" style={{ color: bOwner ? bOwner.color : 'var(--accent)' }}>
            {BUILDING_LABELS[building.type]}
          </div>
          <div className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{BUILDING_DESCRIPTIONS[building.type]}</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3" style={{ touchAction: 'pan-y' }}>

        {/* Ownership + progress */}
        <div className="rounded p-2 text-xs" style={{ background: 'var(--surface2)' }}>
          {bOwner ? (
            <span style={{ color: bOwner.color }}>● Controlled by {bOwner.name}</span>
          ) : building.controlProgress > 0 ? (
            <div>
              <div className="flex justify-between mb-1" style={{ color: 'var(--text-dim)' }}>
                <span>Control progress</span><span>{building.controlProgress}/10</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div className="h-full rounded-full" style={{ width: `${(building.controlProgress / 10) * 100}%`, background: 'var(--accent)' }} />
              </div>
            </div>
          ) : (
            <span style={{ color: 'var(--text-dim)' }}>Uncontrolled</span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          {canControl && (
            <button type="button" onClick={() => setChosenAction('control')}
              className="w-full py-2.5 rounded font-bold text-sm"
              style={{ background: 'var(--accent)', color: '#000', touchAction: 'manipulation' }}>
              Control
            </button>
          )}
          {!canControl && !bOwner && sector.owner !== human.id && (
            <div className="text-[10px] px-2 py-1 rounded" style={{ background: 'var(--surface2)', color: 'var(--text-dim)' }}>
              ⚠ Claim territory first to control buildings
            </div>
          )}
          {canExtort && (
            <button type="button" onClick={() => setChosenAction('extort')}
              className="w-full py-2.5 rounded font-bold text-sm border"
              style={{ borderColor: 'var(--accent)', color: 'var(--accent)', background: 'transparent', touchAction: 'manipulation' }}>
              Extort
            </button>
          )}
          {canUse && (
            <button type="button" onClick={() => setChosenAction('use')}
              className="w-full py-2.5 rounded font-bold text-sm border"
              style={{ borderColor: 'var(--success)', color: 'var(--success)', background: 'transparent', touchAction: 'manipulation' }}>
              Use — Heal
            </button>
          )}
          {!canControl && !canExtort && !canUse && (
            <p className="text-xs text-center" style={{ color: 'var(--text-dim)' }}>No actions available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── SectorDetail ─────────────────────────────────────────────────────────────

export default function SectorDetail({ sector, players, onClose, onMoveRequest }: Props) {
  const { grid } = useGameStore();
  const human = players.find(p => p.isHuman)!;
  const owner = players.find(p => p.id === sector.owner);
  const visibility = getSectorVisibility(sector.position, human, grid);
  const claimingPlayer = !owner && sector.controllingPlayerId
    ? players.find(p => p.id === sector.controllingPlayerId)
    : null;

  const [commandGangId, setCommandGangId] = useState<string | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);

  const allGangsHere = players.flatMap(p =>
    p.gangs.filter(g =>
      g.status !== 'dead' &&
      g.position?.[0] === sector.position[0] &&
      g.position?.[1] === sector.position[1]
    ).map(g => ({ gang: g, player: p }))
  );
  const humanGangsHere = allGangsHere.filter(({ player }) => player.isHuman);
  const enemyGangsHere = allGangsHere.filter(({ player }) => !player.isHuman);

  const commandGang = commandGangId ? human.gangs.find(g => g.id === commandGangId) ?? null : null;
  const selectedBuilding = selectedBuildingId ? sector.buildings.find(b => b.id === selectedBuildingId) ?? null : null;

  if (commandGang) {
    return (
      <GangCommandView
        gang={commandGang}
        onBack={() => setCommandGangId(null)}
        onMoveRequest={onMoveRequest}
      />
    );
  }

  if (selectedBuilding) {
    return (
      <BuildingInteractionView
        building={selectedBuilding}
        sector={sector}
        human={human}
        players={players}
        onBack={() => setSelectedBuildingId(null)}
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
          {(() => {
            const visibleCount = humanGangsHere.length + (visibility !== 'none' ? enemyGangsHere.length : 0);
            return (
              <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-dim)' }}>
                Units {visibleCount === 0 ? '— None' : `(${visibleCount})`}
              </div>
            );
          })()}
          {humanGangsHere.length === 0 && (visibility === 'none' || enemyGangsHere.length === 0) && (
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>No units here.</p>
          )}

          {/* Your gangs — full detail + command */}
          {humanGangsHere.length > 0 && (
            <div className="flex flex-col gap-1 mb-1">
              {humanGangsHere.map(({ gang, player }) => (
                <button
                  key={gang.id}
                  type="button"
                  onClick={() => setCommandGangId(gang.id)}
                  className="flex items-center gap-2 p-2 rounded border text-left w-full"
                  style={{
                    borderColor: player.color + '55',
                    background: player.color + '15',
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
                    ) : (
                      <span className="text-[8px] px-1 py-0.5 rounded"
                        style={{ background: 'var(--accent)' + '22', color: 'var(--accent)' }}>
                        TAP TO ORDER
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Enemy gangs — visibility-gated */}
          {enemyGangsHere.length > 0 && visibility === 'none' && null}
          {enemyGangsHere.length > 0 && visibility === 'presence' && (
            <div className="flex items-center gap-2 p-2 rounded border"
              style={{ borderColor: '#cc333355', background: '#cc333310' }}>
              <span className="text-xl">❓</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold" style={{ color: 'var(--danger)' }}>
                  Unknown Forces ({enemyGangsHere.length})
                </div>
                <div className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                  Intel required to identify
                </div>
              </div>
            </div>
          )}
          {enemyGangsHere.length > 0 && visibility === 'full' && (
            <div className="flex flex-col gap-1">
              {enemyGangsHere.map(({ gang, player }) => (
                <div key={gang.id} className="flex items-center gap-2 p-2 rounded border"
                  style={{ borderColor: player.color + '55', background: player.color + '15' }}>
                  <span className="text-xl">{gang.portrait}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate" style={{ color: player.color }}>{gang.name}</div>
                    <div className="flex items-center gap-1 mt-[3px]">
                      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                        <div className="h-full rounded-full" style={{
                          width: `${Math.round((gang.morale / gang.maxMorale) * 100)}%`,
                          background: 'var(--danger)',
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
                  <span className="text-[8px] px-1 py-0.5 rounded shrink-0"
                    style={{ background: 'var(--danger)' + '22', color: 'var(--danger)' }}>
                    HOSTILE
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buildings — tappable to interact */}
        {sector.buildings.length > 0 && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-dim)' }}>
              Infrastructure ({sector.buildings.length}) · tap to act
            </div>
            <div className="flex flex-col gap-1">
              {sector.buildings.map(b => {
                const bOwner = players.find(p => p.id === b.owner);
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBuildingId(b.id)}
                    className="flex items-center gap-3 p-2 rounded border text-left w-full"
                    style={{
                      borderColor: bOwner ? bOwner.color + '88' : 'var(--border)',
                      background: bOwner ? bOwner.color + '20' : 'var(--surface2)',
                      touchAction: 'manipulation',
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
                        : <span className="text-[9px]" style={{ color: 'var(--text-dim)' }}>Neutral ›</span>
                      }
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
