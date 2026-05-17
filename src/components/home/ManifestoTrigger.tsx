'use client';

import { useState } from 'react';
import { ManifestoOverlay } from './ManifestoOverlay';
import styles from './ManifestoTrigger.module.css';

export function ManifestoTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className={styles.btn}
        onClick={() => setOpen(true)}
        aria-label="Read our manifesto"
      >
        OUR STORY →
      </button>
      {open && <ManifestoOverlay onClose={() => setOpen(false)} />}
    </>
  );
}
