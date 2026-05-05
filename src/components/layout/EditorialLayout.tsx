/**
 * EditorialLayout
 * Standard scrolling layout for long-form content pages.
 * Children will now be wrapped by global Header/Footer in root layout.
 */
export function EditorialLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content">
      {children}
    </main>
  );
}
