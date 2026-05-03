"use client";

import React from 'react';
import Image from 'next/image';
import styles from './StagdLogo.module.css';

interface StagdLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

/**
 * StagdLogo
 * Uses the user-provided SVG "as is" but applies a clever CSS filter 
 * in Light Mode to flip the white text to black while preserving the yellow 'e'.
 */
export function StagdLogo({ className, width = 110, height = 44 }: StagdLogoProps) {
  return (
    <div 
      className={`${styles.logoContainer} ${className || ''}`}
      style={{ width, height }}
    >
      <Image
        src="/stagd-wordmark.svg"
        alt="Stagd"
        width={width}
        height={height}
        priority
        className={styles.logoImage}
      />
    </div>
  );
}
