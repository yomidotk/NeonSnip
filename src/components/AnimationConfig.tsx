import React from 'react';
import { useStore } from '../store/useStore';
import type { CursorStyle, RevealMode } from '../store/useStore';

const Row: React.FC<{ label: string; value?: string | number; children: React.ReactNode }> = ({ label, value, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</span>
      {value !== undefined && <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>}
    </div>
    {children}
  </div>
);

export const AnimationConfig: React.FC = () => {
  const store = useStore();

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div className="panel-title">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
          <path d="M4.93 4.93a10 10 0 0 0 0 14.14"/>
        </svg>
        Animation
      </div>

      <Row label="Typing Speed" value={store.typingSpeedWpm + ' WPM'}>
        <input type="range" min="10" max="500" step="10"
          value={store.typingSpeedWpm}
          onChange={e => store.setTypingSpeed(Number(e.target.value))} />
      </Row>

      <Row label="Font Size" value={store.fontSize + 'px'}>
        <input type="range" min="20" max="80"
          value={store.fontSize}
          onChange={e => store.setFontSize(Number(e.target.value))} />
      </Row>

      {/* Cursor + Reveal in a 2-col grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cursor</span>
          <select value={store.cursorStyle} onChange={e => store.setCursorStyle(e.target.value as CursorStyle)}
            style={{ width: '100%' }}>
            <option value="block">Block</option>
            <option value="line">Line</option>
            <option value="underscore">Underscore</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Reveal</span>
          <select value={store.revealMode} onChange={e => store.setRevealMode(e.target.value as RevealMode)}
            style={{ width: '100%' }}>
            <option value="char">By Char</option>
            <option value="line">By Line</option>
          </select>
        </div>
      </div>

      {/* Toggles */}
      <div style={{ display: 'flex', gap: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <input type="checkbox" checked={store.showScanlines} onChange={e => store.setShowScanlines(e.target.checked)} />
          Scanlines
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <input type="checkbox" checked={store.showLineNumbers} onChange={e => store.setShowLineNumbers(e.target.checked)} />
          Line Nos.
        </label>
      </div>
    </div>
  );
};
