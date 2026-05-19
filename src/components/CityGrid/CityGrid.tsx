import { useGameStore } from '../../store/gameStore';
import Sector from './Sector';

export default function CityGrid() {
  const { grid, players } = useGameStore();

  if (!grid.sectors.length) return null;

  const hqPositions = players.map(p => p.hqSector);

  return (
    <div className="flex flex-col" style={{ width: 'fit-content' }}>
      {grid.sectors.map((row, rowIdx) => (
        <div key={rowIdx} className="flex">
          {row.map((sector, colIdx) => {
            const isHQ = hqPositions.some(
              ([r, c]) => r === rowIdx && c === colIdx
            );
            return (
              <Sector
                key={`${rowIdx}-${colIdx}`}
                sector={sector}
                players={players}
                isHQ={isHQ}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
