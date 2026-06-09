import React from 'react';
import { Terminal } from 'lucide-react';

export const TopBar: React.FC = () => {
  return (
    <header style={{
      height: '52px',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      borderBottom: '1px solid var(--border)',
      background: 'rgba(8,8,15,0.95)',
      backdropFilter: 'blur(12px)',
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img src="/logo.png" alt="NeonSnip"
          style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }} />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{
            fontSize: '15px', fontWeight: '700', letterSpacing: '-0.01em',
            background: 'linear-gradient(90deg, #22d3ee, #a855f7, #ec4899)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            NeonSnip
          </span>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '2px' }}>
            Code-to-Reel
          </span>
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Badge */}
        <div style={{
          padding: '3px 10px', borderRadius: '20px',
          background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)',
          fontSize: '11px', color: 'var(--purple)',
        }}>
          Browser-native MP4
        </div>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
          <Terminal size={14} />
          <span>GitHub</span>
        </a>
      </div>
    </header>
  );
};
