import { useGameStore } from '../../store/gameStore';
import Sector from './Sector';

interface Props {
  selectedPos: [number, number] | null;
  highlightPos: [number, number] | null;
  onSectorClick: (pos: [number, number]) => void;
  deployMode?: boolean;
  humanId?: string;
}

export default function CityGrid({ selectedPos, highlightPos, onSectorClick, deployMode = false, humanId }: Props) {
  const { grid, players } = useGameStore();

  if (!grid.sectors.length) return null;

  const hqPositions = players.map(p => p.hqSector);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: 'fit-content' }}>
      {grid.sectors.map((row, rowIdx) => (
        <div key={rowIdx} style={{ display: 'flex' }}>
          {row.map((sector, colIdx) => {
            const isHQ = hqPositions.some(([r, c]) => r === rowIdx && c === colIdx);
            const isSelected = selectedPos !== null && selectedPos[0] === rowIdx && selectedPos[1] === colIdx;
            const isDeployTarget = deployMode && humanId !== undefined && sector.owner === humanId;
            const isHighlighted = highlightPos !== null && highlightPos[0] === rowIdx && highlightPos[1] === colIdx;
            return (
              <Sector
                key={`${rowIdx}-${colIdx}`}
                sector={sector}
                players={players}
                isHQ={isHQ}
                selected={isSelected}
                isDeployTarget={isDeployTarget}
                isHighlighted={isHighlighted}
                onClick={() => onSectorClick([rowIdx, colIdx])}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
