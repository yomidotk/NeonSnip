import React, { useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { AUDIO_TRACKS } from '../config/audioTracks';

export const AudioLibrary: React.FC = () => {
  const audioTrackId = useStore(state => state.audioTrackId);
  const setAudioTrackId = useStore(state => state.setAudioTrackId);
  const audioVolume = useStore(state => state.audioVolume);
  const setAudioVolume = useStore(state => state.setAudioVolume);

  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopCurrent = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; audioRef.current = null; }
    setPlayingId(null);
  };

  const togglePlay = async (trackId: string, url: string) => {
    if (playingId === trackId) { stopCurrent(); return; }
    stopCurrent();
    setLoading(trackId);
    try {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.loop = true;
      audio.volume = audioVolume;
      audio.src = url;
      audioRef.current = audio;
      await audio.play();
      setPlayingId(trackId);
    } catch (e) { console.error('Audio play failed:', e); }
    finally { setLoading(null); }
  };

  const handleVolume = (val: number) => {
    setAudioVolume(val);
    if (audioRef.current) audioRef.current.volume = val;
  };

  React.useEffect(() => () => { if (audioRef.current) audioRef.current.pause(); }, []);

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div className="panel-title">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
        </svg>
        Audio
      </div>

      {/* Track list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* No audio option */}
        <button
          onClick={() => { stopCurrent(); setAudioTrackId(null); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px',
            borderRadius: '8px', border: `1px solid ${audioTrackId === null ? 'var(--purple)' : 'var(--border)'}`,
            background: audioTrackId === null ? 'rgba(168,85,247,0.1)' : 'transparent',
            cursor: 'pointer', transition: 'all 0.12s', textAlign: 'left', width: '100%',
          }}
        >
          <span style={{ fontSize: '12px' }}>🔇</span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No Audio</span>
        </button>

        {AUDIO_TRACKS.map(track => (
          <div key={track.id} style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px',
            borderRadius: '8px', border: `1px solid ${audioTrackId === track.id ? 'var(--purple)' : 'var(--border)'}`,
            background: audioTrackId === track.id ? 'rgba(168,85,247,0.1)' : 'transparent',
            transition: 'all 0.12s',
          }}>
            <span style={{ fontSize: '12px' }}>{track.icon}</span>
            <button
              onClick={() => setAudioTrackId(track.id)}
              style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer',
                textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', padding: 0 }}>
              {track.name}
            </button>
            {/* Play/stop button */}
            <button
              onClick={() => togglePlay(track.id, track.url)}
              disabled={loading === track.id}
              style={{
                width: '24px', height: '24px', borderRadius: '50%', border: 'none',
                background: playingId === track.id ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.06)',
                color: 'var(--purple)', cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s',
              }}>
              {loading === track.id
                ? <span style={{ width: '10px', height: '10px', border: '2px solid var(--purple)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />
                : playingId === track.id
                  ? <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  : <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              }
            </button>
          </div>
        ))}
      </div>

      {/* Volume slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '2px' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
        <input type="range" min="0" max="1" step="0.05" value={audioVolume}
          onChange={e => handleVolume(Number(e.target.value))} style={{ flex: 1 }} />
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '30px', textAlign: 'right' }}>
          {Math.round(audioVolume * 100)}%
        </span>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
