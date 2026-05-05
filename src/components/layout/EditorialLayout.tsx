/**
 * EditorialLayout
 * Standard scrolling layout for long-form content pages.
 * Simplified to be a passive wrapper to avoid flexbox conflicts with page-level grids.
 */
export function EditorialLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="editorial-layout">
      {children}
    </div>
  );
}
