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
 * Uses the original wordmark SVG file.
 */
export function StagdLogo({ className, width = 110, height = 44 }: StagdLogoProps) {
  return (
    <div 
      className={`${styles.logoContainer} ${className || ''}`}
      style={{ width, height }}
    >
      <Image
        src="/images/stagd-logo.svg"
        alt="Stagd"
        width={width}
        height={height}
        priority
        className={styles.logoImage}
      />
    </div>
  );
}
