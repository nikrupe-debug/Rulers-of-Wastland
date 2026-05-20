import { useGameStore } from '../../store/gameStore';
import { TECH_TREE } from '../../data/techs';
import { BUILDING_ICONS, BUILDING_LABELS } from '../../data/buildings';
import type { BuildingType } from '../../types/game';

const BASE_INCOME = 100;
const TIER_LABEL = ['I', 'II', 'III'];
const EQUIP_ICONS: Record<string, string> = { weapon: '⚔', armor: '🛡', gadget: '🔧' };

interface Props { onClose: () => void }

export default function PlayerCard({ onClose }: Props) {
  const { players, grid } = useGameStore();
  const human = players.find(p => p.isHuman)!;

  const activeGangs = human.gangs.filter(g => g.status !== 'dead');

  // Income
  const ownedBuildings = grid.sectors.flat().flatMap(s => s.buildings).filter(b => b.owner === human.id);
  const buildingIncome = ownedBuildings.reduce((sum, b) => sum + (b.bonus.incomeBonus ?? 0), 0);
  const totalIncome = BASE_INCOME + buildingIncome;
  const maintenance = activeGangs.reduce((sum, g) => sum + g.maintenanceCost, 0);
  const net = totalIncome - maintenance;
  const divinePower = activeGangs.reduce((sum, g) => sum + g.divine, 0);

  const incomeByType = ownedBuildings
    .filter(b => b.bonus.incomeBonus)
    .reduce<Record<string, number>>((acc, b) => {
      acc[b.type] = (acc[b.type] ?? 0) + (b.bonus.incomeBonus ?? 0);
      return acc;
    }, {});

  const researchedTechs = TECH_TREE.filter(t => human.unlockedTechs.includes(t.id));
  const equippedGangs = activeGangs.filter(g => g.equipment.length > 0);

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <button type="button" onClick={onClose}
          className="text-xs px-2 py-1 rounded border shrink-0"
          style={{ borderColor: 'var(--border)', color: 'var(--text-dim)', touchAction: 'manipulation' }}>
          ✕
        </button>
        <span className="font-bold text-sm" style={{ color: human.color }}>Profile</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-4" style={{ touchAction: 'pan-y' }}>

        {/* Avatar + name */}
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-4xl shrink-0"
            style={{ background: human.color + '22', border: `2px solid ${human.color}` }}>
            👤
          </div>
          <div>
            <div className="font-bold text-base" style={{ color: human.color }}>{human.name}</div>
            <div className="text-[10px] mt-[2px]" style={{ color: 'var(--text-dim)' }}>Wasteland Overlord</div>
          </div>
        </div>

        {/* Stats */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-dim)' }}>Status</div>
          <div className="grid grid-cols-2 gap-1">
            {([
              { icon: '$',  label: 'Cash',         value: human.cash,        danger: false },
              { icon: '⚔',  label: 'Gangs',        value: activeGangs.length,danger: false },
              { icon: '★',  label: 'Reputation',   value: human.prestige,    danger: false },
              { icon: '✝',  label: 'Faith',        value: human.religion,    danger: false },
              { icon: '✴',  label: 'Divine Power', value: divinePower,       danger: false },
              { icon: '⚠',  label: 'Wanted',       value: human.wanted,      danger: human.wanted > 0 },
            ] as const).map(({ icon, label, value, danger }) => (
              <div key={label} className="flex items-center gap-2 px-2 py-1.5 rounded"
                style={{ background: 'var(--surface2)' }}>
                <span className="text-base w-5 text-center shrink-0"
                  style={{ color: danger ? 'var(--danger)' : 'var(--accent)' }}>
                  {icon}
                </span>
                <div className="min-w-0">
                  <div className="text-[9px]" style={{ color: 'var(--text-dim)' }}>{label}</div>
                  <div className="text-sm font-bold leading-tight"
                    style={{ color: danger ? 'var(--danger)' : 'var(--text)' }}>
                    {value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Economy */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-dim)' }}>Economy / Turn</div>
          <div className="rounded border p-2 flex flex-col gap-1"
            style={{ borderColor: 'var(--border)', background: 'var(--surface2)' }}>
            <div className="flex justify-between text-xs">
              <span style={{ color: 'var(--text-dim)' }}>Base income</span>
              <span style={{ color: 'var(--success)' }}>+${BASE_INCOME}</span>
            </div>
            {Object.entries(incomeByType).map(([type, amount]) => (
              <div key={type} className="flex justify-between text-xs">
                <span style={{ color: 'var(--text-dim)' }}>
                  {BUILDING_ICONS[type as BuildingType]} {BUILDING_LABELS[type as BuildingType]}
                </span>
                <span style={{ color: 'var(--success)' }}>+${amount}</span>
              </div>
            ))}
            <div className="flex justify-between text-xs">
              <span style={{ color: 'var(--text-dim)' }}>
                Gang upkeep ({activeGangs.length})
              </span>
              <span style={{ color: maintenance > 0 ? 'var(--danger)' : 'var(--text-dim)' }}>
                -${maintenance}
              </span>
            </div>
            <div className="border-t pt-1 mt-0.5 flex justify-between text-xs font-bold"
              style={{ borderColor: 'var(--border)' }}>
              <span>Net per turn</span>
              <span style={{ color: net >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {net >= 0 ? '+' : ''}${net}
              </span>
            </div>
          </div>
        </div>

        {/* Research */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-dim)' }}>
            Research {researchedTechs.length === 0 ? '— None' : `(${researchedTechs.length})`}
          </div>
          {researchedTechs.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>No techs researched yet.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {researchedTechs.map(t => (
                <div key={t.id} className="flex items-start gap-2 px-2 py-1.5 rounded"
                  style={{ background: 'var(--surface2)' }}>
                  <span className="text-[9px] px-1 py-0.5 rounded font-bold mt-0.5 shrink-0"
                    style={{ background: 'var(--accent)33', color: 'var(--accent)' }}>
                    T{TIER_LABEL[t.tier - 1]}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold" style={{ color: 'var(--accent)' }}>{t.name}</div>
                    <div className="text-[10px] mt-[1px]" style={{ color: 'var(--text-dim)' }}>{t.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Equipment */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-dim)' }}>
            Equipment {equippedGangs.length === 0 ? '— None' : ''}
          </div>
          {equippedGangs.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>No equipment carried.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {equippedGangs.map(gang => (
                <div key={gang.id}>
                  <div className="text-[10px] mb-1" style={{ color: 'var(--text-dim)' }}>
                    {gang.portrait} {gang.name}
                  </div>
                  <div className="flex flex-col gap-[2px]">
                    {gang.equipment.map(e => (
                      <div key={e.id} className="flex items-center gap-2 px-2 py-1 rounded"
                        style={{ background: 'var(--surface2)' }}>
                        <span className="shrink-0">{EQUIP_ICONS[e.type] ?? '🔩'}</span>
                        <span className="text-xs font-bold flex-1">{e.name}</span>
                        <span className="text-[10px] shrink-0" style={{ color: 'var(--text-dim)' }}>
                          {e.uses === 'unlimited' ? '∞' : `${e.uses}×`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
