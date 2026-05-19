import type { Sector, Player } from '../../types/game';
import { BUILDING_ICONS, BUILDING_LABELS, BUILDING_DESCRIPTIONS } from '../../data/buildings';

interface Props {
  sector: Sector;
  players: Player[];
  onClose: () => void;
}

export default function SectorDetail({ sector, players, onClose }: Props) {
  const owner = players.find(p => p.id === sector.owner);
  const claimingPlayer = !owner && sector.controllingPlayerId
    ? players.find(p => p.id === sector.controllingPlayerId)
    : null;

  const gangsHere = players.flatMap(p =>
    p.gangs.filter(g =>
      g.status !== 'dead' &&
      g.position?.[0] === sector.position[0] &&
      g.position?.[1] === sector.position[1]
    ).map(g => ({ gang: g, player: p }))
  );

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
              {gangsHere.map(({ gang, player }) => (
                <div
                  key={gang.id}
                  className="flex items-center gap-2 p-2 rounded border"
                  style={{ borderColor: player.color + '55', background: player.color + '15' }}
                >
                  <span className="text-xl">{gang.portrait}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate" style={{ color: player.color }}>{gang.name}</div>
                    <div className="flex items-center gap-1 mt-[3px]">
                      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.round((gang.morale / gang.maxMorale) * 100)}%`,
                            background: gang.morale > gang.maxMorale * 0.5 ? player.color : 'var(--danger)',
                          }}
                        />
                      </div>
                      <span className="text-[9px]" style={{ color: 'var(--text-dim)' }}>{gang.morale}/{gang.maxMorale}</span>
                    </div>
                    <div className="text-[9px] flex gap-2 mt-[2px]" style={{ color: 'var(--text-dim)' }}>
                      <span>⚔️{gang.combat}</span>
                      <span>🎯{gang.ranged}</span>
                      <span>👁️{gang.stealth}</span>
                      <span>🏴{gang.control}</span>
                    </div>
                  </div>
                  {gang.currentAction && (
                    <span className="text-[8px] font-bold px-1 py-0.5 rounded shrink-0"
                      style={{ background: 'var(--border)', color: 'var(--text-dim)' }}>
                      {gang.currentAction.type.toUpperCase()}
                    </span>
                  )}
                </div>
              ))}
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
                  <div
                    key={b.id}
                    className="flex items-center gap-3 p-2 rounded border"
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
                            <div className="h-full rounded-full" style={{ width: `${(b.controlProgress / 10) * 100}%`, background: 'var(--accent)' }} />
                          </div>
                          <span className="text-[9px]" style={{ color: 'var(--text-dim)' }}>{b.controlProgress}/10</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {bOwner ? (
                        <span className="text-[9px] font-bold" style={{ color: bOwner.color }}>● {bOwner.name}</span>
                      ) : (
                        <span className="text-[9px]" style={{ color: 'var(--text-dim)' }}>Neutral</span>
                      )}
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
