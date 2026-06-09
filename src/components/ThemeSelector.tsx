import React from 'react';
import { useStore } from '../store/useStore';
import { themes } from '../themes/themes';

export const ThemeSelector: React.FC = () => {
  const themeId = useStore(state => state.themeId);
  const setThemeId = useStore(state => state.setThemeId);
  const accentHue = useStore(state => state.accentHue);
  const setAccentHue = useStore(state => state.setAccentHue);

  return (
    <div className="panel">
      <div className="panel-title">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
        </svg>
        Theme
      </div>

      {/* Theme grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' }}>
        {themes.map(t => (
          <button
            key={t.id}
            onClick={() => setThemeId(t.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '7px 10px',
              borderRadius: '8px',
              border: `1px solid ${themeId === t.id ? 'var(--purple)' : 'var(--border)'}`,
              background: themeId === t.id ? 'rgba(168,85,247,0.12)' : 'rgba(0,0,0,0.2)',
              cursor: 'pointer',
              transition: 'all 0.15s',
              textAlign: 'left',
            }}
          >
            <div style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: t.backgroundColor, border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0,
            }} />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
          </button>
        ))}
      </div>

      {/* Accent hue */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Accent Hue</span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{accentHue}°</span>
        </div>
        <input
          type="range" min="0" max="360" value={accentHue}
          onChange={e => setAccentHue(Number(e.target.value))}
          style={{
            width: '100%',
            background: `linear-gradient(to right, hsl(0,80%,55%), hsl(60,80%,55%), hsl(120,80%,55%), hsl(180,80%,55%), hsl(240,80%,55%), hsl(300,80%,55%), hsl(360,80%,55%))`,
          }}
        />
      </div>
    </div>
  );
};
