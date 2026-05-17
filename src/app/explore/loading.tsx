export default function Loading() {
  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 88px)',
      background: 'var(--bg)',
    }}>
      {/* Sidebar skeleton */}
      <div style={{
        width: 280,
        borderRight: '1px solid var(--border-color)',
        background: 'var(--bg)',
        padding: '32px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        <div style={bar(32, '70%')} />
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[80, 60, 60, 50].map((w, i) => <div key={i} style={bar(36, `${w}%`)} />)}
        </div>
      </div>
      {/* Results grid skeleton */}
      <div style={{
        flex: 1,
        padding: '32px 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
        alignContent: 'start',
      }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} style={{ aspectRatio: '3/4', background: 'var(--bg-raised)', opacity: 0.4 }} />
        ))}
      </div>
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
