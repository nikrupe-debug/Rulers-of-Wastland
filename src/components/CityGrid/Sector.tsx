import type { Sector as SectorType, Player } from '../../types/game';
import { BUILDING_ICONS } from '../../data/buildings';

const TERRITORY_THRESHOLD = 10;

interface Props {
  sector: SectorType;
  players: Player[];
  isHQ: boolean;
  selected: boolean;
  isDeployTarget: boolean;
  isHighlighted: boolean;
  onClick: () => void;
}

export default function Sector({ sector, players, isHQ, selected, isDeployTarget, isHighlighted, onClick }: Props) {
  const owner = players.find(p => p.id === sector.owner);

  const claimingPlayer = !owner && sector.controllingPlayerId
    ? players.find(p => p.id === sector.controllingPlayerId)
    : null;
  const claimPct = claimingPlayer
    ? Math.round((sector.controlProgress / TERRITORY_THRESHOLD) * 100)
    : 0;

  const bgColor = owner ? owner.color + '55' : '#1a1a24';
  const borderColor = selected
    ? '#ffffff'
    : isHQ
      ? '#ffffffaa'
      : claimingPlayer
        ? claimingPlayer.color
        : owner
          ? owner.color
          : '#2a2a3a';
  const borderStyle = !selected && claimingPlayer ? 'dashed' : 'solid';
  const borderWidth = selected || isHQ || claimingPlayer ? 2 : 1;

  const gangsHere = players.flatMap(p =>
    p.gangs.filter(g =>
      g.status !== 'dead' &&
      g.position?.[0] === sector.position[0] &&
      g.position?.[1] === sector.position[1]
    )
  );

  const shortName = sector.name.split(' ')[0].slice(0, 6);

  function handleTouch(e: React.TouchEvent) {
    e.preventDefault(); // blocks scroll detection AND suppresses the synthetic click
    onClick();
  }

  return (
    <button
      type="button"
      onTouchEnd={handleTouch}
      onClick={onClick}
      className={isDeployTarget ? 'deploy-target' : isHighlighted ? 'gang-highlight' : ''}
      style={{
        cursor: 'pointer',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        width: 'calc(100vw / 8)',
        height: 'calc(100vw / 8)',
        maxWidth: '64px',
        maxHeight: '64px',
        backgroundColor: bgColor,
        border: `${borderWidth}px ${borderStyle} ${borderColor}`,
        boxSizing: 'border-box',
        padding: 0,
        outline: 'none',
        background: bgColor,
      }}
    >
      {/* Neighborhood name */}
      <span style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: '5px',
        lineHeight: 1,
        paddingTop: '2px',
        color: owner ? '#fff' : '#6b6b8a',
        fontWeight: 600,
        pointerEvents: 'none',
        textShadow: owner ? '0 0 3px rgba(0,0,0,0.9)' : 'none',
      }}>
        {shortName}
      </span>

      {/* HQ label */}
      {isHQ && (
        <span style={{
          position: 'absolute',
          top: '7px',
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: '7px',
          lineHeight: 1,
          fontWeight: 700,
          color: '#fff',
          pointerEvents: 'none',
          textShadow: '0 0 4px #000',
        }}>HQ</span>
      )}

      {/* Building icons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1px', marginTop: '6px', pointerEvents: 'none' }}>
        {sector.buildings.slice(0, 3).map(b => (
          <span key={b.id} style={{ fontSize: '8px', lineHeight: 1 }}>
            {BUILDING_ICONS[b.type]}
          </span>
        ))}
      </div>

      {/* Gang dots */}
      {gangsHere.length > 0 && (
        <div style={{ position: 'absolute', bottom: '4px', right: '2px', display: 'flex', gap: '1px', pointerEvents: 'none' }}>
          {gangsHere.slice(0, 3).map(g => {
            const gOwner = players.find(p => p.gangs.some(pg => pg.id === g.id));
            return (
              <div key={g.id} style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: gOwner?.color ?? '#fff' }} />
            );
          })}
          {gangsHere.length > 3 && (
            <span style={{ fontSize: '5px', color: '#fff' }}>+{gangsHere.length - 3}</span>
          )}
        </div>
      )}

      {/* Claim progress bar */}
      {claimingPlayer && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: '#1a1a24' }}>
          <div style={{ height: '100%', width: `${claimPct}%`, background: claimingPlayer.color }} />
        </div>
      )}
    </button>
  );
}
