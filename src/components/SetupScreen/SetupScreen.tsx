import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { AIDifficulty, VictoryType } from '../../types/game';

const VICTORY_OPTIONS: { type: VictoryType; label: string; desc: string }[] = [
  { type: 'elimination', label: 'Elimination', desc: 'Destroy every rival gang' },
  { type: 'domination',  label: 'Domination',  desc: 'Capture all rival HQ sectors' },
  { type: 'territory',   label: 'Territory',   desc: 'Control 60% of city sectors' },
  { type: 'greed',       label: 'Greed',       desc: 'First to $50,000 cash' },
  { type: 'prestige',    label: 'Prestige',    desc: 'First to 500 prestige points' },
];

const DIFFICULTIES: { value: AIDifficulty; label: string }[] = [
  { value: 'easy',   label: 'Beginner' },
  { value: 'medium', label: 'Overlord' },
  { value: 'hard',   label: 'Warlord' },
];

export default function SetupScreen() {
  const { initGame } = useGameStore();
  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const [victoryMode, setVictoryMode] = useState<VictoryType>('elimination');

  return (
    <div
      className="flex flex-col min-h-dvh items-center justify-center p-6 gap-6"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      <div className="text-center">
        <div className="font-bold text-2xl tracking-widest uppercase mb-1" style={{ color: 'var(--accent)' }}>
          Rulers of Wasteland
        </div>
        <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
          Gang strategy. Wasteland justice.
        </div>
      </div>

      <div className="w-full max-w-xs flex flex-col gap-5">

        {/* Name */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
            Your Name
          </label>
          <input
            className="px-3 py-2 rounded border text-sm outline-none"
            style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text)' }}
            placeholder="Player 1"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        {/* Difficulty */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
            Difficulty
          </label>
          <div className="flex gap-2">
            {DIFFICULTIES.map(d => (
              <button
                key={d.value}
                onClick={() => setDifficulty(d.value)}
                className="flex-1 py-2 rounded border text-xs font-bold"
                style={{
                  borderColor: difficulty === d.value ? 'var(--accent)' : 'var(--border)',
                  background: difficulty === d.value ? 'var(--accent)' : 'var(--surface2)',
                  color: difficulty === d.value ? '#000' : 'var(--text)',
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Victory Condition */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
            Victory Condition
          </label>
          <div className="flex flex-col gap-1">
            {VICTORY_OPTIONS.map(opt => (
              <button
                key={opt.type}
                onClick={() => setVictoryMode(opt.type)}
                className="flex items-center justify-between px-3 py-2 rounded border text-xs text-left"
                style={{
                  borderColor: victoryMode === opt.type ? 'var(--accent)' : 'var(--border)',
                  background: victoryMode === opt.type ? 'var(--surface)' : 'var(--surface2)',
                  color: 'var(--text)',
                }}
              >
                <span className="font-bold w-24 shrink-0" style={{ color: victoryMode === opt.type ? 'var(--accent)' : 'var(--text)' }}>
                  {opt.label}
                </span>
                <span style={{ color: 'var(--text-dim)' }}>{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => initGame(name.trim() || 'Player 1', difficulty, victoryMode)}
          className="py-3 rounded font-bold text-sm tracking-wider"
          style={{ background: 'var(--accent)', color: '#000' }}
        >
          Enter the Wasteland ▶
        </button>
      </div>
    </div>
  );
}
