"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

/**
 * ConditionalFooter
 * Renders the Footer on most pages, but hides it on app-shell pages
 * where the layout is fixed-viewport (no page-level scroll):
 *   - /explore
 *   - /messages
 *   - /:username  (artist portfolio pages)
 */
const NO_FOOTER_ROUTES = ["/explore", "/messages"];

export function ConditionalFooter() {
  const pathname = usePathname();

  // Hide on exact matches
  if (NO_FOOTER_ROUTES.includes(pathname)) return null;

  // Hide on dynamic artist profile pages (single path segment, not a known top-level route)
  const knownTopLevel = new Set([
    "",
    "explore",
    "about",
    "events",
    "login",
    "auth",
    "verify",
    "scanner",
    "inbox",
    "messages",
  ]);
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 1 && !knownTopLevel.has(segments[0])) return null;

  return <Footer />;
}
