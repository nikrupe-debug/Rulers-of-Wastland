import type { Sector as SectorType, Player } from '../../types/game';
import { BUILDING_ICONS } from '../../data/buildings';

interface Props {
  sector: SectorType;
  players: Player[];
  isHQ: boolean;
}

export default function Sector({ sector, players, isHQ }: Props) {
  const owner = players.find(p => p.id === sector.owner);
  const bgColor = owner ? owner.color : '#1a1a24';
  const borderColor = isHQ ? '#ffffff' : owner ? owner.color : '#2a2a3a';

  const gangsHere = players.flatMap(p =>
    p.gangs.filter(g =>
      g.position?.[0] === sector.position[0] &&
      g.position?.[1] === sector.position[1]
    )
  );

  return (
    <div
      className="relative flex flex-col items-center justify-center select-none"
      style={{
        width: 'calc(100vw / 8)',
        height: 'calc(100vw / 8)',
        maxWidth: 64,
        maxHeight: 64,
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        opacity: owner ? 0.85 : 1,
        boxSizing: 'border-box',
      }}
    >
      {/* HQ indicator */}
      {isHQ && (
        <span className="absolute top-0 left-0 text-[8px] leading-none p-[1px] font-bold text-white">
          HQ
        </span>
      )}

      {/* Building icons — max 3, tiny */}
      <div className="flex flex-wrap justify-center gap-[1px]">
        {sector.buildings.slice(0, 3).map(b => (
          <span key={b.id} className="text-[8px] leading-none">
            {BUILDING_ICONS[b.type]}
          </span>
        ))}
      </div>

      {/* Gang dot indicators */}
      {gangsHere.length > 0 && (
        <div className="absolute bottom-[2px] right-[2px] flex gap-[1px]">
          {gangsHere.slice(0, 3).map(g => {
            const gOwner = players.find(p => p.gangs.some(pg => pg.id === g.id));
            return (
              <div
                key={g.id}
                className="w-[6px] h-[6px] rounded-full"
                style={{ backgroundColor: gOwner?.color ?? '#fff' }}
              />
            );
          })}
          {gangsHere.length > 3 && (
            <span className="text-[6px] text-white">+{gangsHere.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
}
