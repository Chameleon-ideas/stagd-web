export default function Loading() {
  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 88px)',
      background: 'var(--bg)',
    }}>
      {/* Left pane skeleton */}
      <div style={{
        width: 380,
        borderRight: '1px solid var(--border-color)',
        background: 'var(--bg)',
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        <div style={bar(48, '60%')} />
        <div style={bar(12, '40%')} />
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={bar(10, '30%')} />
          <div style={bar(10, '80%')} />
          <div style={bar(10, '65%')} />
        </div>
      </div>
      {/* Right pane skeleton */}
      <div style={{ flex: 1, background: '#0a0a0a' }} />
    </div>
  );
}

function bar(height: number, width: string) {
  return {
    height,
    width,
    background: 'var(--bg-raised)',
    borderRadius: 2,
    opacity: 0.5,
  } as React.CSSProperties;
}
