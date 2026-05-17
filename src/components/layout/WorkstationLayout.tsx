/**
 * WorkstationLayout
 * Application-style layout with a fixed viewport.
 * Occupies space between global Header and Footer.
 */
export function WorkstationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div 
      id="workstation-container" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        flex: 1, 
        minHeight: 0, // Critical for nested flex scrolling
        position: 'relative',
        width: '100%',
        height: '100%'
      }}
    >
      {children}
    </div>
  );
}
