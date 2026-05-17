"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import styles from './HeroMarquee.module.css';

interface MarqueeItem {
  id: string;
  type: 'EVENT' | 'ARTIST';
  title: string;
  meta: string;
  image: string;
  color: string;
}

const ITEMS: MarqueeItem[] = [
  { id: '1', type: 'EVENT', title: 'SOUNDS OF LYARI', meta: '// CONCERT · T2F', image: '/images/lyari.webp', color: '#E63946' },
  { id: '2', type: 'ARTIST', title: 'ZOYA KHAN', meta: '// 3D GENERALIST', image: '/images/zoya_portrait.webp', color: '#111111' },
  { id: '3', type: 'EVENT', title: 'OPEN STUDIO', meta: '// WORKSHOP · OKA', image: '/images/workshop.webp', color: '#1CAEE5' },
  { id: '4', type: 'ARTIST', title: 'ALI HASAN', meta: '// SOUND DESIGN', image: '/images/hamza_portrait.webp', color: '#111111' },
  { id: '5', type: 'EVENT', title: 'FOLD FOLIO', meta: '// MARKET · HINDU GYM', image: '/images/festival.webp', color: '#FF5A1F' },
  { id: '6', type: 'ARTIST', title: 'SARA AHMED', meta: '// TEXTILE ARTIST', image: '/images/sara_portrait.webp', color: '#111111' },
  { id: '7', type: 'EVENT', title: 'MURAL TOUR', meta: '// OUTDOOR · CLIFTON', image: '/images/mural_tour.webp', color: '#D6F23B' },
  { id: '8', type: 'ARTIST', title: 'OSMAN K', meta: '// PHOTOGRAPHER', image: '/images/osman_portrait.webp', color: '#111111' },
];

const firstColumn = ITEMS.slice(0, 4);
const secondColumn = ITEMS.slice(4, 8);

const HeroMarqueeColumn = ({ items, duration }: { items: MarqueeItem[]; duration: number }) => {
  return (
    <div className={styles.columnWrapper}>
      <motion.div
        animate={{ translateY: "-50%" }}
        transition={{
          duration: duration,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className={styles.columnList}
        style={{ willChange: "transform" }}
      >
        {[...new Array(2)].fill(0).map((_, index) => (
          <React.Fragment key={index}>
            {items.map((item, i) => (
              <motion.div
                key={`${index}-${i}`}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className={`${styles.marqueeCard} ${item.type === 'EVENT' ? styles.cardEvent : styles.cardArtist}`}
              >
                <div className={styles.cardImageContainer}>
                  <Image src={item.image} alt={item.title} fill className={styles.cardImage} />
                  <div 
                    className={`${styles.cardBadge} ${item.color === '#D6F23B' || item.color === '#FFDE0D' ? styles.darkText : ''}`}
                    style={{ backgroundColor: item.color }}
                  >
                    {item.type}
                  </div>
                </div>
                <div className={styles.cardContent}>
                  <span className={styles.cardMeta}>{item.meta}</span>
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                </div>
              </motion.div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};

export const HeroMarquee = () => {
  return (
    <div className={styles.marqueeContainer}>
      <HeroMarqueeColumn items={firstColumn} duration={35} />
      <HeroMarqueeColumn items={secondColumn} duration={45} />
    </div>
  );
};
