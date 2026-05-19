import { useGameStore } from '../../store/gameStore';
import type { LogEntry } from '../../types/game';

const TYPE_COLOR: Record<LogEntry['type'], string> = {
  combat:   '#cc3333',
  control:  '#3399cc',
  event:    '#c8c8d8',
  research: '#aa55cc',
  economy:  '#33aa55',
  system:   '#e8a020',
};

export default function EventLog() {
  const { eventLog, resolveOrders, phase } = useGameStore();

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
          Event Log
        </span>
        {phase === 'resolution' && (
          <button
            onClick={resolveOrders}
            className="text-xs px-3 py-1 rounded font-bold"
            style={{ background: 'var(--accent)', color: '#000' }}
          >
            Next Turn ▶
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
        {eventLog.slice(0, 30).map((entry, i) => (
          <div key={i} className="flex gap-2 text-xs">
            <span className="shrink-0 font-mono" style={{ color: 'var(--text-dim)' }}>
              T{entry.turn}
            </span>
            <span style={{ color: TYPE_COLOR[entry.type] }}>
              {entry.message}
            </span>
          </div>
        ))}
        {eventLog.length === 0 && (
          <span className="text-xs" style={{ color: 'var(--text-dim)' }}>No events yet.</span>
        )}
      </div>
    </div>
  );
}
