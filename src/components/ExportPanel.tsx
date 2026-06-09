import React from 'react';
import { useStore } from '../store/useStore';

export const ExportPanel: React.FC<{ onExport: () => void }> = ({ onExport }) => {
  const store = useStore();

  const charPerSec = (store.typingSpeedWpm * 5) / 60;
  const durationSec = charPerSec > 0 ? store.code.length / charPerSec : 0;
  const sizeMB = (durationSec * 1.5).toFixed(1);

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="panel-title">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Export
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--purple)', lineHeight: 1 }}>
            {durationSec < 60 ? Math.round(durationSec) + 's' : Math.round(durationSec / 60) + 'm'}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>Duration</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--cyan)', lineHeight: 1 }}>1080p</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>Resolution</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--pink)', lineHeight: 1 }}>~{sizeMB}MB</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>Est. Size</div>
        </div>
      </div>

      {/* Progress */}
      {store.isExporting && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--purple)' }}>{store.exportStage}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{store.exportProgress}%</span>
          </div>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: store.exportProgress + '%',
              background: 'linear-gradient(90deg, var(--purple), var(--cyan))',
              borderRadius: '4px',
              transition: 'width 0.3s ease',
              boxShadow: '0 0 8px var(--purple)',
            }} />
          </div>
        </div>
      )}

      {/* Export button */}
      <button
        onClick={onExport}
        disabled={store.isExporting}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: '10px',
          border: 'none',
          background: store.isExporting
            ? 'rgba(168,85,247,0.2)'
            : 'linear-gradient(135deg, #7c3aed, #a855f7)',
          color: '#fff',
          fontSize: '13px',
          fontWeight: '600',
          cursor: store.isExporting ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'opacity 0.15s, transform 0.1s',
          boxShadow: store.isExporting ? 'none' : '0 4px 20px rgba(168,85,247,0.35)',
          opacity: store.isExporting ? 0.6 : 1,
        }}
        onMouseEnter={e => { if (!store.isExporting) (e.target as HTMLElement).style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { (e.target as HTMLElement).style.transform = 'translateY(0)'; }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
        </svg>
        {store.isExporting ? 'Exporting...' : 'Export MP4'}
      </button>

      <p style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
        H.264 · 9:16 · 1080×1920 · 30fps<br/>Chrome 94+ required for encoding
      </p>
    </div>
  );
};
