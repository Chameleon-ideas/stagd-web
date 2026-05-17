'use client';

import styles from './DotsLoader.module.css';

interface DotsLoaderProps {
  /** Centres the loader in its parent. Defaults to true. */
  centered?: boolean;
}

/**
 * Three animated dots — the single loading indicator used across the platform.
 * Matches the design reference: staggered fade/scale pulse, monochrome.
 */
export function DotsLoader({ centered = true }: DotsLoaderProps) {
  return (
    <div className={`${styles.wrap} ${centered ? styles.centered : ''}`} aria-label="Loading" role="status">
      <span className={styles.dot} />
      <span className={`${styles.dot} ${styles.dot2}`} />
      <span className={`${styles.dot} ${styles.dot3}`} />
    </div>
  );
}
