'use client';

import { useState } from 'react';
import { AboutOverlay } from '@/components/layout/AboutOverlay';
import styles from './page.module.css';

export function ManifestoBtn() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={styles.manifestoBtn} onClick={() => setOpen(true)}>
        WHY WE DO IT →
      </button>
      {open && <AboutOverlay onClose={() => setOpen(false)} />}
    </>
  );
}
