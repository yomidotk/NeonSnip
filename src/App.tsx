import { useRef } from 'react';
import { TopBar } from './components/TopBar';
import { CodeInput } from './components/CodeInput';
import { ThemeSelector } from './components/ThemeSelector';
import { AnimationConfig } from './components/AnimationConfig';
import { AudioLibrary } from './components/AudioLibrary';
import { CanvasPreview } from './components/CanvasPreview';
import { ExportPanel } from './components/ExportPanel';
import { useExport } from './hooks/useExport';
import { Toaster, toast } from 'react-hot-toast';

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { handleExport } = useExport(canvasRef);

  const onExport = async () => {
    toast('Export started — please wait...', { icon: '🎬', duration: 4000 });
    try {
      await handleExport();
      toast.success('Export complete! Check your downloads.');
    } catch (e: any) {
      toast.error('Export failed: ' + (e?.message || 'Unknown error'));
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', overflow: 'hidden' }}>
      <TopBar />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '13px' },
        }}
      />

      {/* Main 3-column workspace */}
      <div style={{
        flex: 1,
        minHeight: 0,
        display: 'grid',
        gridTemplateColumns: '280px 1fr 280px',
        gap: '12px',
        padding: '12px 16px 16px',
        overflow: 'hidden',
      }}>

        {/* ── LEFT SIDEBAR ───────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: 0, overflow: 'hidden' }}>
          {/* Code Input — takes remaining height */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <CodeInput />
          </div>
          {/* Theme selector — fixed height */}
          <div>
            <ThemeSelector />
          </div>
        </div>

        {/* ── CENTRE: Canvas ─────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 0,
          position: 'relative',
          background: 'var(--bg-panel)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          padding: '12px',
          boxShadow: '0 0 60px rgba(168,85,247,0.05)',
        }}>
          <CanvasPreview ref={canvasRef} />
        </div>

        {/* ── RIGHT SIDEBAR ──────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}
          className="custom-scrollbar">
          <AnimationConfig />
          <AudioLibrary />
          <ExportPanel onExport={onExport} />
        </div>

      </div>
    </div>
  );
}

export default App;
