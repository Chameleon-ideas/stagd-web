import styles from './MarqueeTicker.module.css';

interface MarqueeTickerProps {
  items?: string[];
  speed?: 'slow' | 'normal' | 'fast';
  theme?: 'yellow' | 'ink' | 'cream';
  size?: 'sm' | 'lg';
  reverse?: boolean;
}

const DEFAULT_ITEMS = [
  'DISCOVER',
  'HIRE',
  'SHOW UP',
  'KHI',
  'LHR',
  'ISB',
];

export function MarqueeTicker({
  items = DEFAULT_ITEMS,
  speed = 'normal',
  theme = 'yellow',
  size = 'sm',
  reverse = false,
}: MarqueeTickerProps) {
  const track = [...items, ...items, ...items, ...items];
  const trackClass = `${styles.track}${reverse ? ` ${styles.trackReverse}` : ''}`;

  return (
    <div
      className={`${styles.ticker} ${styles[`theme-${theme}`]} ${styles[`speed-${speed}`]} ${styles[`size-${size}`]}`}
      aria-hidden="true"
    >
      <div className={trackClass}>
        {track.map((item, i) => (
          <span key={i} className={styles.item}>
            {item}
            <span className={styles.dot}>·</span>
          </span>
        ))}
      </div>
      <div className={`${trackClass} ${styles.trackDupe}`} aria-hidden="true">
        {track.map((item, i) => (
          <span key={i} className={styles.item}>
            {item}
            <span className={styles.dot}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
