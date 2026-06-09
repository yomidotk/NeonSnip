import React from 'react';
import { useStore } from '../store/useStore';

export const CodeInput: React.FC = () => {
  const code = useStore(state => state.code);
  const setCode = useStore(state => state.setCode);
  const language = useStore(state => state.language);
  const setLanguage = useStore(state => state.setLanguage);

  const LANGS = ['javascript','typescript','python','java','go','rust','html','css','cpp','bash'];

  return (
    <div className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span className="panel-title" style={{ marginBottom: 0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
          </svg>
          Code Input
        </span>
        <select value={language} onChange={e => setLanguage(e.target.value)}
          style={{ fontSize: '11px', padding: '4px 26px 4px 8px' }}>
          {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {/* Textarea */}
      <textarea
        value={code}
        onChange={e => setCode(e.target.value)}
        spellCheck={false}
        placeholder="// Paste your code here..."
        className="custom-scrollbar"
        style={{
          flex: 1,
          minHeight: 0,
          resize: 'none',
          background: 'rgba(0,0,0,0.35)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '12px',
          color: 'var(--text-primary)',
          fontSize: '12px',
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          lineHeight: '1.7',
          outline: 'none',
          transition: 'border-color 0.15s',
          width: '100%',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--purple)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />

      {/* Footer stats */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '6px' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{code.split('\n').length} lines</span>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{code.length} chars</span>
      </div>
    </div>
  );
};
